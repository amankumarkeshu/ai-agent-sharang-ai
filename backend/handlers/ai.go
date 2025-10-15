package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"

	"intelliops-ai-copilot/database"
	"intelliops-ai-copilot/models"
)

type AIHandler struct {
	db           *database.MongoDB
	openAIAPIKey string
	openAIModel  string
}

type OpenAIRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type OpenAIResponse struct {
	Choices []Choice `json:"choices"`
}

type Choice struct {
	Message Message `json:"message"`
}

func NewAIHandler(db *database.MongoDB, openAIAPIKey, openAIModel string) *AIHandler {
	return &AIHandler{
		db:           db,
		openAIAPIKey: openAIAPIKey,
		openAIModel:  openAIModel,
	}
}

func (h *AIHandler) TriageTicket(c *gin.Context) {
	var req models.TriageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// If no OpenAI API key, return mock response
	if h.openAIAPIKey == "" {
		mockResponse := h.generateMockTriageResponse(req)
		c.JSON(http.StatusOK, mockResponse)
		return
	}

	// Call OpenAI API
	response, err := h.callOpenAI(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process AI triage"})
		return
	}

	c.JSON(http.StatusOK, response)
}

func (h *AIHandler) callOpenAI(req models.TriageRequest) (*models.TriageResponse, error) {
	prompt := fmt.Sprintf(`
Analyze the following IT support ticket and provide triage information:

Title: %s
Description: %s

Please respond with a JSON object containing:
- category: One of "Network Issue", "Hardware Issue", "Software Issue", "Security Issue", "Performance Issue", or "Other"
- summary: A brief 1-2 sentence summary of the issue
- priority: One of "low", "medium", "high", or "critical"
- suggestedTechnician: A suggested technician name (use Indian names like "Ravi Kumar", "Priya Sharma", "Amit Patel", "Sneha Singh")
- confidence: A number between 0.0 and 1.0 indicating confidence in the analysis
- reasoning: Brief explanation of the categorization

Respond only with valid JSON, no additional text.
`, req.Title, req.Description)

	openAIReq := OpenAIRequest{
		Model: h.openAIModel,
		Messages: []Message{
			{
				Role:    "system",
				Content: "You are an expert IT support triage specialist. Analyze tickets and provide structured triage information.",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
		Temperature: 0.3,
		MaxTokens:   500,
	}

	jsonData, err := json.Marshal(openAIReq)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+h.openAIAPIKey)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var openAIResp OpenAIResponse
	if err := json.NewDecoder(resp.Body).Decode(&openAIResp); err != nil {
		return nil, err
	}

	if len(openAIResp.Choices) == 0 {
		return nil, fmt.Errorf("no response from OpenAI")
	}

	// Parse the JSON response from OpenAI
	var triageResp models.TriageResponse
	if err := json.Unmarshal([]byte(openAIResp.Choices[0].Message.Content), &triageResp); err != nil {
		// If parsing fails, return mock response
		return h.generateMockTriageResponse(req), nil
	}

	return &triageResp, nil
}

func (h *AIHandler) generateMockTriageResponse(req models.TriageRequest) *models.TriageResponse {
	// Simple keyword-based mock triage
	title := req.Title
	description := req.Description
	combined := title + " " + description

	var category models.TicketCategory
	var priority models.TicketPriority
	var suggestedTechnician string

	// Determine category based on keywords
	if contains(combined, []string{"network", "wifi", "internet", "connection", "router", "switch"}) {
		category = models.CategoryNetwork
		suggestedTechnician = "Ravi Kumar"
	} else if contains(combined, []string{"hardware", "computer", "laptop", "desktop", "printer", "monitor"}) {
		category = models.CategoryHardware
		suggestedTechnician = "Amit Patel"
	} else if contains(combined, []string{"software", "application", "program", "install", "update"}) {
		category = models.CategorySoftware
		suggestedTechnician = "Priya Sharma"
	} else if contains(combined, []string{"security", "virus", "malware", "breach", "access"}) {
		category = models.CategorySecurity
		suggestedTechnician = "Sneha Singh"
	} else if contains(combined, []string{"slow", "performance", "lag", "freeze", "crash"}) {
		category = models.CategoryPerformance
		suggestedTechnician = "Rajesh Kumar"
	} else {
		category = models.CategoryOther
		suggestedTechnician = "General Support"
	}

	// Determine priority based on keywords
	if contains(combined, []string{"urgent", "critical", "down", "emergency", "outage"}) {
		priority = models.PriorityCritical
	} else if contains(combined, []string{"high", "important", "asap", "immediately"}) {
		priority = models.PriorityHigh
	} else if contains(combined, []string{"low", "minor", "when possible"}) {
		priority = models.PriorityLow
	} else {
		priority = models.PriorityMedium
	}

	return &models.TriageResponse{
		Category:            category,
		Summary:             fmt.Sprintf("Issue categorized as %s based on ticket content analysis", category),
		Priority:            priority,
		SuggestedTechnician: suggestedTechnician,
		Confidence:          0.75,
		Reasoning:           "Analysis based on keyword matching and ticket content patterns",
	}
}

func contains(text string, keywords []string) bool {
	text = strings.ToLower(text)
	for _, keyword := range keywords {
		if strings.Contains(text, strings.ToLower(keyword)) {
			return true
		}
	}
	return false
}

func (h *AIHandler) GetTechnicians(c *gin.Context) {
	// Get all technicians
	cursor, err := h.db.GetCollection("users").Find(context.Background(), bson.M{"role": models.RoleTechnician})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch technicians"})
		return
	}
	defer cursor.Close(context.Background())

	var technicians []models.User
	if err := cursor.All(context.Background(), &technicians); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode technicians"})
		return
	}

	// Remove passwords from response
	for i := range technicians {
		technicians[i].Password = ""
	}

	c.JSON(http.StatusOK, gin.H{"technicians": technicians})
}
