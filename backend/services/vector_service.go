package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"math"
	"net/http"

	"intelliops-ai-copilot/models"
)

type VectorService struct {
	openAIAPIKey string
	localLLMURL  string
	provider     string
	// In-memory storage for demo (replace with actual vector DB)
	documents []models.Document
}

func NewVectorService(openAIAPIKey, localLLMURL, provider string) *VectorService {
	return &VectorService{
		openAIAPIKey: openAIAPIKey,
		localLLMURL:  localLLMURL,
		provider:     provider,
		documents:    []models.Document{},
	}
}

// GenerateEmbedding generates vector embedding for text
func (v *VectorService) GenerateEmbedding(text string) ([]float32, error) {
	apiKeyPreview := "empty"
	if len(v.openAIAPIKey) > 10 {
		apiKeyPreview = v.openAIAPIKey[:10] + "..."
	} else if v.openAIAPIKey != "" {
		apiKeyPreview = "short"
	}
	fmt.Printf("GenerateEmbedding called with provider: %s, apiKey: %s\n", v.provider, apiKeyPreview)
	
	if v.provider == "openai" && v.openAIAPIKey != "" {
		fmt.Printf("Trying OpenAI embedding...\n")
		embedding, err := v.generateOpenAIEmbedding(text)
		if err != nil {
			fmt.Printf("OpenAI embedding failed, falling back to simple embedding: %v\n", err)
			// Fallback to simple hash-based embedding if OpenAI fails
			return v.generateSimpleEmbedding(text), nil
		}
		return embedding, nil
	} else if v.provider == "local" && v.localLLMURL != "" {
		fmt.Printf("Trying local embedding...\n")
		embedding, err := v.generateLocalEmbedding(text)
		if err != nil {
			fmt.Printf("Local embedding failed, falling back to simple embedding: %v\n", err)
			// Fallback to simple hash-based embedding if local fails
			return v.generateSimpleEmbedding(text), nil
		}
		return embedding, nil
	}

	fmt.Printf("Using simple embedding fallback\n")
	// Fallback to simple hash-based embedding (for testing)
	return v.generateSimpleEmbedding(text), nil
}

func (v *VectorService) generateOpenAIEmbedding(text string) ([]float32, error) {
	url := "https://api.openai.com/v1/embeddings"

	payload := map[string]interface{}{
		"input": text,
		"model": "text-embedding-3-small",
	}

	jsonData, _ := json.Marshal(payload)

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+v.openAIAPIKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Error making request to OpenAI: %v\n", err)
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Printf("OpenAI response status: %d, body: %s\n", resp.StatusCode, string(body))

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("OpenAI API error: status %d, body: %s", resp.StatusCode, string(body))
	}

	var result struct {
		Data []struct {
			Embedding []float32 `json:"embedding"`
		} `json:"data"`
		Error struct {
			Message string `json:"message"`
		} `json:"error"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		fmt.Printf("Error unmarshaling response: %v\n", err)
		return nil, err
	}

	if result.Error.Message != "" {
		return nil, fmt.Errorf("OpenAI API error: %s", result.Error.Message)
	}

	if len(result.Data) == 0 {
		return nil, fmt.Errorf("no embedding generated")
	}

	return result.Data[0].Embedding, nil
}

func (v *VectorService) generateLocalEmbedding(text string) ([]float32, error) {
	// Call local embedding model (e.g., sentence-transformers via API)
	url := v.localLLMURL + "/embeddings"

	payload := map[string]interface{}{
		"input": text,
	}

	jsonData, _ := json.Marshal(payload)

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := ioutil.ReadAll(resp.Body)

	var result struct {
		Embedding []float32 `json:"embedding"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}

	return result.Embedding, nil
}

func (v *VectorService) generateSimpleEmbedding(text string) []float32 {
	// Simple hash-based embedding for testing (384 dimensions)
	embedding := make([]float32, 384)
	
	// Create a simple hash from the text
	hash := 0
	for _, char := range text {
		hash = (hash*31 + int(char)) % 1000000
	}
	
	for i := range embedding {
		// Create variation based on position and hash
		embedding[i] = float32(math.Sin(float64(i+hash))) * 0.1
	}
	
	return embedding
}

// StoreDocument stores document for later retrieval
func (v *VectorService) StoreDocument(doc models.Document) {
	v.documents = append(v.documents, doc)
}

// Search finds similar documents using cosine similarity
func (v *VectorService) Search(queryEmbedding []float32, topK int, minScore float32) ([]models.DocumentSearchResult, error) {
	var results []models.DocumentSearchResult

	// Search through all stored documents
	for _, doc := range v.documents {
		for _, chunk := range doc.Chunks {
			if len(chunk.Embedding) == 0 {
				continue
			}

			score := CosineSimilarity(queryEmbedding, chunk.Embedding)
			
			if score >= minScore {
				relevance := "High"
				if score < 0.8 {
					relevance = "Medium"
				}
				if score < 0.6 {
					relevance = "Low"
				}

				results = append(results, models.DocumentSearchResult{
					Document:  doc,
					Chunk:     chunk,
					Score:     score,
					Relevance: relevance,
				})
			}
		}
	}

	// Sort results by score (bubble sort for simplicity)
	for i := 0; i < len(results); i++ {
		for j := i + 1; j < len(results); j++ {
			if results[j].Score > results[i].Score {
				results[i], results[j] = results[j], results[i]
			}
		}
	}

	// Return top K results
	if len(results) > topK {
		results = results[:topK]
	}

	return results, nil
}

// CosineSimilarity calculates similarity between two vectors
func CosineSimilarity(a, b []float32) float32 {
	if len(a) != len(b) {
		return 0
	}

	var dotProduct, normA, normB float32

	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}

	if normA == 0 || normB == 0 {
		return 0
	}

	return dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
}

// GetDocumentCount returns the number of indexed documents
func (v *VectorService) GetDocumentCount() int {
	return len(v.documents)
}

