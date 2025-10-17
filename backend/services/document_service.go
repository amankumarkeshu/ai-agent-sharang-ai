package services

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
	"time"

	"intelliops-ai-copilot/models"
)

type DocumentService struct {
	vectorService *VectorService
}

func NewDocumentService(vectorService *VectorService) *DocumentService {
	return &DocumentService{
		vectorService: vectorService,
	}
}

// ProcessDocument processes a single document file
func (s *DocumentService) ProcessDocument(filePath string) (models.Document, error) {
	ext := strings.ToLower(filepath.Ext(filePath))

	var content string
	var err error

	switch ext {
	case ".pdf":
		content, err = s.extractPDFContent(filePath)
	case ".md", ".txt":
		content, err = s.extractTextContent(filePath)
	default:
		return models.Document{}, fmt.Errorf("unsupported file type: %s", ext)
	}

	if err != nil {
		return models.Document{}, err
	}

	// Chunk the content
	chunks := s.chunkContent(content, 500) // 500 tokens per chunk

	// Generate embeddings for each chunk
	documentChunks := make([]models.DocumentChunk, 0, len(chunks))
	for i, chunkText := range chunks {
		embedding, err := s.vectorService.GenerateEmbedding(chunkText)
		if err != nil {
			// Continue without embedding if it fails
			embedding = []float32{}
		}

		documentChunks = append(documentChunks, models.DocumentChunk{
			ID:        fmt.Sprintf("%s_chunk_%d", filepath.Base(filePath), i),
			Content:   chunkText,
			Embedding: embedding,
			StartPage: i / 2,     // Approximate page calculation
			EndPage:   (i / 2) + 1,
		})
	}

	// Generate summary
	summary := s.generateSummary(content)

	doc := models.Document{
		Title:     filepath.Base(filePath),
		FilePath:  filePath,
		FileType:  ext,
		Content:   content,
		Summary:   summary,
		Tags:      s.extractTags(content),
		Chunks:    documentChunks,
		IndexedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	return doc, nil
}

// extractPDFContent extracts text from PDF files
// For now, returns a placeholder - will need PDF library
func (s *DocumentService) extractPDFContent(filePath string) (string, error) {
	// TODO: Implement proper PDF parsing with github.com/ledongthuc/pdf
	// For now, return a message
	return fmt.Sprintf("[PDF Document: %s]\n\nThis is a placeholder for PDF content extraction. Install a PDF library to enable full functionality.", filepath.Base(filePath)), nil
}

// extractTextContent extracts text from markdown/text files
func (s *DocumentService) extractTextContent(filePath string) (string, error) {
	data, err := ioutil.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	return string(data), nil
}

// chunkContent splits content into semantic chunks
func (s *DocumentService) chunkContent(content string, maxTokens int) []string {
	// Simple chunking by paragraphs with overlap
	paragraphs := strings.Split(content, "\n\n")
	var chunks []string
	var currentChunk strings.Builder
	currentTokens := 0

	for _, para := range paragraphs {
		para = strings.TrimSpace(para)
		if para == "" {
			continue
		}

		paraTokens := len(strings.Fields(para))

		if currentTokens+paraTokens > maxTokens && currentChunk.Len() > 0 {
			chunks = append(chunks, currentChunk.String())
			currentChunk.Reset()
			currentTokens = 0
		}

		currentChunk.WriteString(para)
		currentChunk.WriteString("\n\n")
		currentTokens += paraTokens
	}

	if currentChunk.Len() > 0 {
		chunks = append(chunks, currentChunk.String())
	}

	// Ensure at least one chunk exists
	if len(chunks) == 0 && content != "" {
		chunks = append(chunks, content)
	}

	return chunks
}

// generateSummary generates a brief summary of the document
func (s *DocumentService) generateSummary(content string) string {
	// Take first 500 characters as summary
	if len(content) > 500 {
		return content[:500] + "..."
	}
	return content
}

// extractTags extracts relevant tags from content
func (s *DocumentService) extractTags(content string) []string {
	// Simple keyword extraction
	keywords := []string{
		"network", "hardware", "software", "security", "performance",
		"database", "server", "email", "printer", "wifi", "vpn",
		"windows", "linux", "troubleshooting", "installation",
	}
	var tags []string

	lowerContent := strings.ToLower(content)
	for _, keyword := range keywords {
		if strings.Contains(lowerContent, keyword) {
			tags = append(tags, keyword)
		}
	}

	return tags
}

