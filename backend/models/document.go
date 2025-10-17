package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Document struct {
	ID        primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Title     string             `json:"title" bson:"title"`
	FilePath  string             `json:"filePath" bson:"filePath"`
	FileType  string             `json:"fileType" bson:"fileType"` // pdf, md, txt
	Content   string             `json:"content" bson:"content"`
	Summary   string             `json:"summary" bson:"summary"`
	Tags      []string           `json:"tags" bson:"tags"`
	Chunks    []DocumentChunk    `json:"chunks" bson:"chunks"`
	IndexedAt time.Time          `json:"indexedAt" bson:"indexedAt"`
	UpdatedAt time.Time          `json:"updatedAt" bson:"updatedAt"`
}

type DocumentChunk struct {
	ID        string    `json:"id" bson:"id"`
	Content   string    `json:"content" bson:"content"`
	Embedding []float32 `json:"embedding,omitempty" bson:"embedding,omitempty"`
	StartPage int       `json:"startPage" bson:"startPage"`
	EndPage   int       `json:"endPage" bson:"endPage"`
}

type DocumentSearchRequest struct {
	Query     string   `json:"query" binding:"required"`
	TopK      int      `json:"topK"`
	FileTypes []string `json:"fileTypes"`
	MinScore  float32  `json:"minScore"`
}

type DocumentSearchResult struct {
	Document  Document      `json:"document"`
	Chunk     DocumentChunk `json:"chunk"`
	Score     float32       `json:"score"`
	Relevance string        `json:"relevance"`
}

type TicketSolution struct {
	TicketID        string                  `json:"ticketId"`
	Solutions       []SuggestedSolution     `json:"solutions"`
	DocumentSources []DocumentSearchResult  `json:"documentSources"`
	Confidence      float32                 `json:"confidence"`
	GeneratedAt     time.Time               `json:"generatedAt"`
}

type SuggestedSolution struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Steps       []string `json:"steps"`
	References  []string `json:"references"`
	Confidence  float32  `json:"confidence"`
}

type IndexRequest struct {
	Path string `json:"path"`
}

type IndexResponse struct {
	Message   string     `json:"message"`
	Count     int        `json:"count"`
	Documents []Document `json:"documents"`
}

type UploadResponse struct {
	Message  string   `json:"message"`
	Document Document `json:"document"`
}

