package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"

	"intelliops-ai-copilot/models"
)

type LLMService struct {
	openAIAPIKey string
	openAIModel  string
	localLLMURL  string
	provider     string
}

func NewLLMService(openAIAPIKey, openAIModel, localLLMURL, provider string) *LLMService {
	return &LLMService{
		openAIAPIKey: openAIAPIKey,
		openAIModel:  openAIModel,
		localLLMURL:  localLLMURL,
		provider:     provider,
	}
}

// GenerateSolutions generates solution suggestions based on ticket and documents
func (l *LLMService) GenerateSolutions(ticket models.Ticket, docResults []models.DocumentSearchResult) ([]models.SuggestedSolution, error) {
	fmt.Printf("DEBUG: GenerateSolutions called with provider: %s\n", l.provider)
	// Build context from document results
	var contextBuilder strings.Builder
	contextBuilder.WriteString("Relevant Documentation:\n\n")

	for i, result := range docResults {
		contextBuilder.WriteString(fmt.Sprintf("Document %d: %s\n", i+1, result.Document.Title))
		contextBuilder.WriteString(fmt.Sprintf("Content: %s\n", result.Chunk.Content))
		contextBuilder.WriteString(fmt.Sprintf("Relevance Score: %.2f\n\n", result.Score))
	}

	prompt := fmt.Sprintf(`You are an IT support expert. Based on the following ticket and relevant documentation, provide detailed solution suggestions.

Ticket Information:
- Title: %s
- Description: %s
- Category: %s
- Priority: %s

%s

Please provide 2-3 specific solution suggestions with:
1. A clear title
2. Detailed description
3. Step-by-step instructions
4. References to the documentation used

Format your response as JSON with the following structure:
{
    "solutions": [
        {
            "title": "Solution Title",
            "description": "Brief description",
            "steps": ["Step 1", "Step 2", "Step 3"],
            "references": ["Document 1", "Document 2"],
            "confidence": 0.9
        }
    ]
}`, ticket.Title, ticket.Description, ticket.Category, ticket.Priority, contextBuilder.String())

	if l.provider == "openai" && l.openAIAPIKey != "" {
		fmt.Printf("DEBUG: Calling OpenAI with API key present\n")
		solutions, err := l.callOpenAI(prompt)
		if err != nil {
			fmt.Printf("OpenAI LLM failed, falling back to mock solutions: %v\n", err)
			mockSolutions := l.generateMockSolutions(ticket, docResults)
			fmt.Printf("DEBUG: Generated %d mock solutions\n", len(mockSolutions))
			return mockSolutions, nil
		}
		fmt.Printf("DEBUG: OpenAI returned %d solutions\n", len(solutions))
		return solutions, nil
	} else if l.provider == "local" && l.localLLMURL != "" {
		fmt.Printf("DEBUG: Calling local LLM\n")
		solutions, err := l.callLocalLLM(prompt)
		if err != nil {
			fmt.Printf("Local LLM failed, falling back to mock solutions: %v\n", err)
			mockSolutions := l.generateMockSolutions(ticket, docResults)
			fmt.Printf("DEBUG: Generated %d mock solutions\n", len(mockSolutions))
			return mockSolutions, nil
		}
		fmt.Printf("DEBUG: Local LLM returned %d solutions\n", len(solutions))
		return solutions, nil
	}

	// Fallback to mock solutions
	fmt.Printf("DEBUG: Using fallback mock solutions\n")
	mockSolutions := l.generateMockSolutions(ticket, docResults)
	fmt.Printf("DEBUG: Generated %d fallback mock solutions\n", len(mockSolutions))
	return mockSolutions, nil
}

func (l *LLMService) callOpenAI(prompt string) ([]models.SuggestedSolution, error) {
	url := "https://api.openai.com/v1/chat/completions"

	payload := map[string]interface{}{
		"model": l.openAIModel,
		"messages": []map[string]string{
			{"role": "system", "content": "You are an IT support expert that provides detailed technical solutions. Always respond with valid JSON."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}

	jsonData, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return []models.SuggestedSolution{}, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+l.openAIAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return []models.SuggestedSolution{}, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return []models.SuggestedSolution{}, err
	}

	if len(result.Choices) == 0 {
		return []models.SuggestedSolution{}, fmt.Errorf("no response from OpenAI")
	}

	// Parse the JSON response
	content := result.Choices[0].Message.Content
	
	// Try to extract JSON from markdown code blocks if present
	if strings.Contains(content, "```json") {
		start := strings.Index(content, "```json") + 7
		end := strings.Index(content[start:], "```")
		if end > 0 {
			content = content[start : start+end]
		}
	} else if strings.Contains(content, "```") {
		start := strings.Index(content, "```") + 3
		end := strings.Index(content[start:], "```")
		if end > 0 {
			content = content[start : start+end]
		}
	}

	var solutionResponse struct {
		Solutions []models.SuggestedSolution `json:"solutions"`
	}

	if err := json.Unmarshal([]byte(strings.TrimSpace(content)), &solutionResponse); err != nil {
		// If parsing fails, return empty slice
		return []models.SuggestedSolution{}, fmt.Errorf("failed to parse OpenAI response: %v", err)
	}

	return solutionResponse.Solutions, nil
}

func (l *LLMService) callLocalLLM(prompt string) ([]models.SuggestedSolution, error) {
	url := l.localLLMURL + "/v1/chat/completions"

	payload := map[string]interface{}{
		"model": "local-model",
		"messages": []map[string]string{
			{"role": "system", "content": "You are an IT support expert. Always respond with valid JSON."},
			{"role": "user", "content": prompt},
		},
		"temperature": 0.7,
	}

	jsonData, _ := json.Marshal(payload)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return []models.SuggestedSolution{}, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	var result struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return []models.SuggestedSolution{}, err
	}

	if len(result.Choices) == 0 {
		return []models.SuggestedSolution{}, fmt.Errorf("no response from local LLM")
	}

	var solutionResponse struct {
		Solutions []models.SuggestedSolution `json:"solutions"`
	}

	if err := json.Unmarshal([]byte(result.Choices[0].Message.Content), &solutionResponse); err != nil {
		return []models.SuggestedSolution{}, err
	}

	return solutionResponse.Solutions, nil
}

func (l *LLMService) generateMockSolutions(ticket models.Ticket, docResults []models.DocumentSearchResult) []models.SuggestedSolution {
	// Generate contextual solutions based on ticket category and available documents
	solutions := []models.SuggestedSolution{}

	// Get document references
	docRefs := []string{}
	for _, result := range docResults {
		if len(docRefs) < 3 {
			docRefs = append(docRefs, result.Document.Title)
		}
	}

	// Generate solutions based on ticket category
	category := strings.ToLower(string(ticket.Category))

	if strings.Contains(category, "network") {
		solutions = append(solutions, models.SuggestedSolution{
			Title:       "Check Network Configuration and Connectivity",
			Description: "Verify network settings and test connectivity to diagnose the issue",
			Steps: []string{
				"Open Network Settings or Control Panel > Network and Sharing Center",
				"Check IP configuration using 'ipconfig /all' (Windows) or 'ifconfig' (Linux/Mac)",
				"Verify DNS settings - should point to valid DNS servers",
				"Test connectivity with 'ping 8.8.8.8' to check internet access",
				"Test name resolution with 'nslookup google.com'",
				"If issues persist, restart the network adapter or router",
			},
			References: docRefs,
			Confidence: 0.85,
		})

		solutions = append(solutions, models.SuggestedSolution{
			Title:       "Update Network Drivers",
			Description: "Ensure network drivers are up to date",
			Steps: []string{
				"Open Device Manager (Windows) or System Settings (Mac/Linux)",
				"Locate Network Adapters section",
				"Right-click on your network adapter and select 'Update Driver'",
				"Choose 'Search automatically for updated driver software'",
				"Restart the computer after driver update",
			},
			References: docRefs,
			Confidence: 0.78,
		})
	} else if strings.Contains(category, "hardware") {
		solutions = append(solutions, models.SuggestedSolution{
			Title:       "Hardware Diagnostics and Troubleshooting",
			Description: "Perform hardware diagnostics to identify the faulty component",
			Steps: []string{
				"Check all physical connections (power cables, data cables, peripherals)",
				"Run built-in hardware diagnostics (F12 on boot for most systems)",
				"Check Device Manager for any hardware with warning symbols",
				"Monitor system temperatures and fan speeds",
				"Test with known-good replacement parts if available",
				"Document error codes or beep patterns for further diagnosis",
			},
			References: docRefs,
			Confidence: 0.80,
		})
	} else if strings.Contains(category, "software") {
		solutions = append(solutions, models.SuggestedSolution{
			Title:       "Software Installation and Configuration",
			Description: "Troubleshoot software installation or configuration issues",
			Steps: []string{
				"Verify system meets minimum software requirements",
				"Run installer as Administrator (Windows) or with sudo (Linux)",
				"Disable antivirus temporarily during installation",
				"Check for conflicting software or previous versions",
				"Review installation logs for specific error messages",
				"Try clean installation after removing previous version completely",
			},
			References: docRefs,
			Confidence: 0.82,
		})

		solutions = append(solutions, models.SuggestedSolution{
			Title:       "Application Troubleshooting",
			Description: "Resolve application crashes or performance issues",
			Steps: []string{
				"Clear application cache and temporary files",
				"Reset application settings to default",
				"Update application to the latest version",
				"Check Event Viewer (Windows) or system logs for error details",
				"Reinstall the application if issues persist",
				"Contact vendor support with error logs if needed",
			},
			References: docRefs,
			Confidence: 0.75,
		})
	} else {
		// Generic solutions
		solutions = append(solutions, models.SuggestedSolution{
			Title:       "General Troubleshooting Steps",
			Description: "Standard troubleshooting approach for IT issues",
			Steps: []string{
				"Restart the affected device or application",
				"Check for recent system or software updates",
				"Review system logs and error messages",
				"Verify user permissions and access rights",
				"Test in a different user account or safe mode",
				"Document all symptoms and steps taken",
				"Escalate to specialized support if issue persists",
			},
			References: docRefs,
			Confidence: 0.70,
		})
	}

	// Limit to 3 solutions
	if len(solutions) > 3 {
		solutions = solutions[:3]
	}

	return solutions
}

