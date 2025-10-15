package main

import (
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Simple in-memory storage
var users = make(map[string]User)
var tickets = make(map[string]Ticket)
var nextTicketID = 1

type User struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"-"`
	Role     string `json:"role"`
}

type Ticket struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Priority    string    `json:"priority"`
	Status      string    `json:"status"`
	AssignedTo  string    `json:"assignedTo,omitempty"`
	CreatedBy   string    `json:"createdBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Role     string `json:"role" binding:"required"`
}

type CreateTicketRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
	Category    string `json:"category,omitempty"`
	Priority    string `json:"priority,omitempty"`
}

type TriageRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description" binding:"required"`
}

type TriageResponse struct {
	Category            string  `json:"category"`
	Summary             string  `json:"summary"`
	Priority            string  `json:"priority"`
	SuggestedTechnician string  `json:"suggestedTechnician"`
	Confidence          float64 `json:"confidence"`
	Reasoning           string  `json:"reasoning"`
}

func main() {
	// Initialize with default admin user
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	users["admin@intelliops.com"] = User{
		ID:       "1",
		Name:     "System Administrator",
		Email:    "admin@intelliops.com",
		Password: string(hashedPassword),
		Role:     "admin",
	}

	r := gin.Default()
	r.Use(corsMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Auth routes
	auth := r.Group("/api/auth")
	{
		auth.POST("/register", register)
		auth.POST("/login", login)
		auth.GET("/profile", authMiddleware(), getProfile)
	}

	// Ticket routes
	ticketRoutes := r.Group("/api/tickets")
	ticketRoutes.Use(authMiddleware())
	{
		ticketRoutes.GET("", getTickets)
		ticketRoutes.GET("/:id", getTicket)
		ticketRoutes.POST("", createTicket)
		ticketRoutes.PUT("/:id", updateTicket)
		ticketRoutes.DELETE("/:id", deleteTicket)
	}

	// AI routes
	ai := r.Group("/api/ai")
	ai.Use(authMiddleware())
	{
		ai.POST("/triage", triageTicket)
		ai.GET("/technicians", getTechnicians)
	}

	log.Println("Server starting on port 8080")
	r.Run(":8080")
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenString := c.GetHeader("Authorization")
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		tokenString = tokenString[7:]
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return []byte("your-secret-key"), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			c.Abort()
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		email, ok := claims["email"].(string)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
			c.Abort()
			return
		}

		user, exists := users[email]
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
			c.Abort()
			return
		}

		c.Set("user", user)
		c.Next()
	}
}

func register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if _, exists := users[req.Email]; exists {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := User{
		ID:       generateID(),
		Name:     req.Name,
		Email:    req.Email,
		Password: string(hashedPassword),
		Role:     req.Role,
	}

	users[req.Email] = user
	token := generateToken(user)

	c.JSON(http.StatusCreated, gin.H{
		"token": token,
		"user":  user,
	})
}

func login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, exists := users[req.Email]
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	token := generateToken(user)
	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user":  user,
	})
}

func getProfile(c *gin.Context) {
	user, _ := c.Get("user")
	c.JSON(http.StatusOK, gin.H{"user": user})
}

func getTickets(c *gin.Context) {
	var ticketList []Ticket
	for _, ticket := range tickets {
		ticketList = append(ticketList, ticket)
	}

	c.JSON(http.StatusOK, gin.H{
		"tickets": ticketList,
		"total":   len(ticketList),
		"page":    1,
		"limit":   10,
	})
}

func getTicket(c *gin.Context) {
	id := c.Param("id")
	ticket, exists := tickets[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	c.JSON(http.StatusOK, ticket)
}

func createTicket(c *gin.Context) {
	var req CreateTicketRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get authenticated user from context
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	userObj, ok := user.(User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user context"})
		return
	}

	if req.Category == "" {
		req.Category = "Other"
	}
	if req.Priority == "" {
		req.Priority = "medium"
	}

	ticket := Ticket{
		ID:          generateID(),
		Title:       req.Title,
		Description: req.Description,
		Category:    req.Category,
		Priority:    req.Priority,
		Status:      "open",
		CreatedBy:   userObj.ID,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	tickets[ticket.ID] = ticket
	c.JSON(http.StatusCreated, ticket)
}

func updateTicket(c *gin.Context) {
	id := c.Param("id")
	ticket, exists := tickets[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	// Get authenticated user
	user, _ := c.Get("user")
	userObj := user.(User)

	// Check if user can update this ticket (creator or admin)
	if userObj.Role != "admin" && ticket.CreatedBy != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own tickets"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if title, ok := req["title"].(string); ok {
		ticket.Title = title
	}
	if description, ok := req["description"].(string); ok {
		ticket.Description = description
	}
	if category, ok := req["category"].(string); ok {
		ticket.Category = category
	}
	if priority, ok := req["priority"].(string); ok {
		ticket.Priority = priority
	}
	if status, ok := req["status"].(string); ok {
		ticket.Status = status
	}
	if assignedTo, ok := req["assignedTo"].(string); ok {
		ticket.AssignedTo = assignedTo
	}

	ticket.UpdatedAt = time.Now()
	tickets[id] = ticket

	c.JSON(http.StatusOK, gin.H{"message": "Ticket updated successfully"})
}

func deleteTicket(c *gin.Context) {
	id := c.Param("id")
	ticket, exists := tickets[id]
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ticket not found"})
		return
	}

	// Get authenticated user
	user, _ := c.Get("user")
	userObj := user.(User)

	// Check if user can delete this ticket (creator or admin)
	if userObj.Role != "admin" && ticket.CreatedBy != userObj.ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own tickets"})
		return
	}

	delete(tickets, id)
	c.JSON(http.StatusOK, gin.H{"message": "Ticket deleted successfully"})
}

func triageTicket(c *gin.Context) {
	var req TriageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Simple mock AI triage
	response := TriageResponse{
		Category:            "Network Issue",
		Summary:             "Issue categorized based on content analysis",
		Priority:            "medium",
		SuggestedTechnician: "Ravi Kumar",
		Confidence:          0.75,
		Reasoning:           "Analysis based on keyword matching",
	}

	// Simple keyword-based categorization
	content := req.Title + " " + req.Description
	if contains(content, []string{"network", "wifi", "internet", "connection"}) {
		response.Category = "Network Issue"
		response.Priority = "high"
	} else if contains(content, []string{"hardware", "computer", "laptop"}) {
		response.Category = "Hardware Issue"
		response.Priority = "medium"
	} else if contains(content, []string{"software", "application", "program"}) {
		response.Category = "Software Issue"
		response.Priority = "low"
	}

	c.JSON(http.StatusOK, response)
}

func getTechnicians(c *gin.Context) {
	var techs []User
	for _, user := range users {
		if user.Role == "technician" {
			techs = append(techs, user)
		}
	}

	c.JSON(http.StatusOK, gin.H{"technicians": techs})
}

func generateToken(user User) string {
	claims := jwt.MapClaims{
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte("your-secret-key"))
	return tokenString
}

func generateID() string {
	return time.Now().Format("20060102150405")
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
