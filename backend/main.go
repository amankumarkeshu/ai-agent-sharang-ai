package main

import (
	"log"

	"github.com/gin-gonic/gin"

	"intelliops-ai-copilot/config"
	"intelliops-ai-copilot/database"
	"intelliops-ai-copilot/handlers"
	"intelliops-ai-copilot/middleware"
	"intelliops-ai-copilot/models"
)

func main() {
	// Load configuration
	cfg := config.Load()

	// Set Gin mode
	gin.SetMode(cfg.GinMode)

	// Connect to MongoDB
	db, err := database.NewMongoDB(cfg.MongoDBURI, cfg.DatabaseName)
	if err != nil {
		log.Fatal("Failed to connect to MongoDB:", err)
	}
	defer db.Close()

	// Create default admin user if it doesn't exist
	createDefaultAdmin(db)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(db, cfg.JWTSecret, cfg.JWTExpiresIn)
	ticketHandler := handlers.NewTicketHandler(db)
	aiHandler := handlers.NewAIHandler(db, cfg.OpenAIAPIKey, cfg.OpenAIModel, cfg.LocalLLMURL, cfg.AIProvider)

	// Setup routes
	r := setupRoutes(authHandler, ticketHandler, aiHandler, db, cfg.JWTSecret)

	// Start server
	port := cfg.Port
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func setupRoutes(authHandler *handlers.AuthHandler, ticketHandler *handlers.TicketHandler, aiHandler *handlers.AIHandler, db *database.MongoDB, jwtSecret string) *gin.Engine {
	r := gin.Default()

	// Middleware
	r.Use(middleware.CORSMiddleware())

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/profile", middleware.AuthMiddleware(db, jwtSecret), authHandler.GetProfile)
		}

		// Ticket routes
		tickets := api.Group("/tickets")
		tickets.Use(middleware.AuthMiddleware(db, jwtSecret))
		{
			tickets.GET("", ticketHandler.GetTickets)
			tickets.GET("/:id", ticketHandler.GetTicket)
			tickets.POST("", ticketHandler.CreateTicket)
			tickets.PUT("/:id", ticketHandler.UpdateTicket)
			tickets.DELETE("/:id", ticketHandler.DeleteTicket)
		}

		// AI routes
		ai := api.Group("/ai")
		ai.Use(middleware.AuthMiddleware(db, jwtSecret))
		{
			ai.POST("/triage", aiHandler.TriageTicket)
			ai.GET("/technicians", aiHandler.GetTechnicians)
		}
	}

	return r
}

func createDefaultAdmin(db *database.MongoDB) {
	// Check if admin user exists
	var admin models.User
	err := db.GetCollection("users").FindOne(nil, map[string]interface{}{"email": "admin@intelliops.com"}).Decode(&admin)
	if err == nil {
		return // Admin already exists
	}

	// Create default admin user
	admin = models.User{
		Name:      "System Administrator",
		Email:     "admin@intelliops.com",
		Password:  "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password: "password"
		Role:      models.RoleAdmin,
	}

	_, err = db.GetCollection("users").InsertOne(nil, admin)
	if err != nil {
		log.Printf("Failed to create default admin user: %v", err)
	} else {
		log.Println("Default admin user created: admin@intelliops.com / password")
	}
}
