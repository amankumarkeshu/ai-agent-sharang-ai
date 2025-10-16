package handlers

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"intelliops-ai-copilot/database"
	"intelliops-ai-copilot/models"
)

type TicketHandler struct {
	db *database.MongoDB
}

func NewTicketHandler(db *database.MongoDB) *TicketHandler {
	return &TicketHandler{db: db}
}

func (h *TicketHandler) GetTickets(c *gin.Context) {
	// Get query parameters
	status := c.Query("status")
	priority := c.Query("priority")
	assignedTo := c.Query("assignedTo")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "10")

	// Build filter
	filter := bson.M{}
	if status != "" {
		filter["status"] = status
	}
	if priority != "" {
		filter["priority"] = priority
	}
	if assignedTo != "" {
		assignedToID, err := primitive.ObjectIDFromHex(assignedTo)
		if err == nil {
			filter["assignedTo"] = assignedToID
		}
	}

	// Pagination
	pageInt := 1
	limitInt := 10
	if p, err := strconv.Atoi(page); err == nil && p > 0 {
		pageInt = p
	}
	if l, err := strconv.Atoi(limit); err == nil && l > 0 {
		limitInt = l
	}

	skip := (pageInt - 1) * limitInt

	// Find tickets with pagination
	opts := options.Find().
		SetSkip(int64(skip)).
		SetLimit(int64(limitInt)).
		SetSort(bson.D{{"createdAt", -1}})

	cursor, err := h.db.GetCollection("tickets").Find(context.Background(), filter, opts)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tickets"})
		return
	}
	defer cursor.Close(context.Background())

	var tickets []models.Ticket
	if err := cursor.All(context.Background(), &tickets); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to decode tickets"})
		return
	}

	// Get total count
	total, err := h.db.GetCollection("tickets").CountDocuments(context.Background(), filter)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to count tickets"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"tickets": tickets,
		"total":   total,
		"page":    pageInt,
		"limit":   limitInt,
	})
}

func (h *TicketHandler) GetTicket(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
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

	c.JSON(http.StatusOK, ticket)
}

func (h *TicketHandler) CreateTicket(c *gin.Context) {
	var req models.CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	userObj := user.(models.User)

	// Set default values
	if req.Category == "" {
		req.Category = models.CategoryOther
	}
	if req.Priority == "" {
		req.Priority = models.PriorityMedium
	}

	ticket := models.Ticket{
		ID:          primitive.NewObjectID(),
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Priority:    req.Priority,
		Status:      models.StatusOpen,
		CreatedBy:   userObj.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	_, err := h.db.GetCollection("tickets").InsertOne(context.Background(), ticket)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ticket"})
		return
	}

	c.JSON(http.StatusCreated, ticket)
}

func (h *TicketHandler) UpdateTicket(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	// Get authenticated user
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userObj := user.(models.User)

	// Check if ticket exists and get current ticket
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

	// Check if user can update this ticket (creator or admin)
	if userObj.Role != models.RoleAdmin && ticket.CreatedBy != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own tickets"})
		return
	}

	var req models.UpdateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build update document
	update := bson.M{"$set": bson.M{"updatedAt": time.Now()}}
	if req.Title != "" {
		update["$set"].(bson.M)["title"] = req.Title
	}
	if req.Description != "" {
		update["$set"].(bson.M)["description"] = req.Description
	}
	if req.Category != "" {
		update["$set"].(bson.M)["category"] = req.Category
	}
	if req.Priority != "" {
		update["$set"].(bson.M)["priority"] = req.Priority
	}
	if req.Status != "" {
		update["$set"].(bson.M)["status"] = req.Status
		if req.Status == models.StatusResolved || req.Status == models.StatusClosed {
			now := time.Now()
			update["$set"].(bson.M)["resolvedAt"] = &now
		}
	}
	if req.AssignedTo != nil {
		update["$set"].(bson.M)["assignedTo"] = req.AssignedTo
	}

	result, err := h.db.GetCollection("tickets").UpdateOne(
		context.Background(),
		bson.M{"_id": objectID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ticket"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket updated successfully"})
}

func (h *TicketHandler) DeleteTicket(c *gin.Context) {
	id := c.Param("id")
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ticket ID"})
		return
	}

	// Get authenticated user
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	userObj := user.(models.User)

	// Check if ticket exists and get current ticket
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

	// Check if user can delete this ticket (creator or admin)
	if userObj.Role != models.RoleAdmin && ticket.CreatedBy != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own tickets"})
		return
	}

	result, err := h.db.GetCollection("tickets").DeleteOne(context.Background(), bson.M{"_id": objectID})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ticket"})
		return
	}

	if result.DeletedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ticket deleted successfully"})
}
