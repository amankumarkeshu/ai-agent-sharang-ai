package models

type TriageRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type TriageResponse struct {
	Category           TicketCategory `json:"category"`
	Summary            string         `json:"summary"`
	Priority           TicketPriority `json:"priority"`
	SuggestedTechnician string        `json:"suggestedTechnician"`
	Confidence         float64        `json:"confidence"`
	Reasoning          string         `json:"reasoning"`
}

type AITriageConfig struct {
	Model       string  `json:"model"`
	Temperature float64 `json:"temperature"`
	MaxTokens   int     `json:"maxTokens"`
}
