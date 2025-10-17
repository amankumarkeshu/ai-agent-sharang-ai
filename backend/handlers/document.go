package handlers

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"intelliops-ai-copilot/database"
	"intelliops-ai-copilot/models"
	"intelliops-ai-copilot/services"
)

type DocumentHandler struct {
	db            *database.MongoDB
	docService    *services.DocumentService
	vectorService *services.VectorService
	llmService    *services.LLMService
}

func NewDocumentHandler(db *database.MongoDB, docService *services.DocumentService,
	vectorService *services.VectorService, llmService *services.LLMService) *DocumentHandler {
	return &DocumentHandler{
		db:            db,
		docService:    docService,
		vectorService: vectorService,
		llmService:    llmService,
	}
}

// IndexDocuments indexes all documents in a folder
func (h *DocumentHandler) IndexDocuments(c *gin.Context) {
	var req models.IndexRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		req.Path = "./docs" // Default path
	}

	folderPath := req.Path
	if folderPath == "" {
		folderPath = "./docs"
	}

	// Check if folder exists
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": fmt.Sprintf("Folder does not exist: %s", folderPath),
		})
		return
	}

	// Walk through directory
	var documents []models.Document
	var errors []string

	err := filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() {
			return nil
		}

		// Process supported file types
		ext := strings.ToLower(filepath.Ext(path))
		if ext == ".pdf" || ext == ".md" || ext == ".txt" {
			doc, err := h.docService.ProcessDocument(path)
			if err != nil {
				errors = append(errors, fmt.Sprintf("Error processing %s: %v", path, err))
				return nil // Continue with other files
			}

			// Store in vector service
			h.vectorService.StoreDocument(doc)

			documents = append(documents, doc)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	response := models.IndexResponse{
		Message:   fmt.Sprintf("Successfully indexed %d documents", len(documents)),
		Count:     len(documents),
		Documents: documents,
	}

	if len(errors) > 0 {
		c.JSON(http.StatusOK, gin.H{
			"message":   response.Message,
			"count":     response.Count,
			"documents": response.Documents,
			"warnings":  errors,
		})
		return
	}

	c.JSON(http.StatusOK, response)
}

// SearchDocuments searches for relevant documents
func (h *DocumentHandler) SearchDocuments(c *gin.Context) {
	var req models.DocumentSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.TopK == 0 {
		req.TopK = 5
	}
	if req.MinScore == 0 {
		req.MinScore = 0.3 // Lower threshold for better results
	}

	// Generate query embedding
	queryEmbedding, err := h.vectorService.GenerateEmbedding(req.Query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate embedding"})
		return
	}

	// Search vector store
	results, err := h.vectorService.Search(queryEmbedding, req.TopK, req.MinScore)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search documents"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"query":   req.Query,
		"results": results,
		"count":   len(results),
	})
}

// GetTicketSolutions finds solutions for a specific ticket
func (h *DocumentHandler) GetTicketSolutions(c *gin.Context) {
	ticketID := c.Param("id")

	// Get ticket from database
	objectID, err := primitive.ObjectIDFromHex(ticketID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	var ticket models.Ticket
	err = h.db.GetCollection("tickets").FindOne(context.Background(), bson.M{"_id": objectID}).Decode(&ticket)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ticket"})
		return
	}

	// Build search query from ticket
	query := fmt.Sprintf("%s %s %s", ticket.Title, ticket.Description, string(ticket.Category))

	// Search relevant documents
	queryEmbedding, err := h.vectorService.GenerateEmbedding(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate embedding"})
		return
	}

	docResults, err := h.vectorService.Search(queryEmbedding, 5, 0.3)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search documents"})
		return
	}

	// Generate solutions using LLM
	solutions, err := h.llmService.GenerateSolutions(ticket, docResults)
	if err != nil {
		// Log error but don't fail - return mock solutions
		fmt.Printf("LLM generation failed: %v\n", err)
	}

	// Calculate confidence based on document relevance
	confidence := calculateConfidence(docResults)

	ticketSolution := models.TicketSolution{
		TicketID:        ticketID,
		Solutions:       solutions,
		DocumentSources: docResults,
		Confidence:      confidence,
		GeneratedAt:     ticket.UpdatedAt,
	}

	c.JSON(http.StatusOK, ticketSolution)
}

// UploadDocument uploads and indexes a single document
func (h *DocumentHandler) UploadDocument(c *gin.Context) {
	file, err := c.FormFile("document")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	// Validate file type
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext != ".pdf" && ext != ".md" && ext != ".txt" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Unsupported file type. Supported types: .pdf, .md, .txt",
		})
		return
	}

	// Save file
	uploadPath := "./docs/uploads"
	os.MkdirAll(uploadPath, os.ModePerm)

	filePath := filepath.Join(uploadPath, file.Filename)
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Process and index document
	doc, err := h.docService.ProcessDocument(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process document"})
		return
	}

	// Store in vector service
	h.vectorService.StoreDocument(doc)

	response := models.UploadResponse{
		Message:  "Document uploaded and indexed successfully",
		Document: doc,
	}

	c.JSON(http.StatusOK, response)
}

// GetIndexStats returns statistics about indexed documents
func (h *DocumentHandler) GetIndexStats(c *gin.Context) {
	count := h.vectorService.GetDocumentCount()

	c.JSON(http.StatusOK, gin.H{
		"indexedDocuments": count,
		"status":           "active",
	})
}

func calculateConfidence(results []models.DocumentSearchResult) float32 {
	if len(results) == 0 {
		return 0.0
	}

	var total float32
	for _, result := range results {
		total += result.Score
	}

	return total / float32(len(results))
}

