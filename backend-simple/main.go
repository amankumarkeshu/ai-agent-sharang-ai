package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Simple in-memory storage
var users = make(map[string]User)
var tickets = make(map[string]Ticket)
var documents = make(map[string]Document)
var nextTicketID = 1
var nextDocumentID = 1

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

	// Admin routes
	admin := r.Group("/api/admin")
	admin.Use(authMiddleware(), adminMiddleware())
	{
		admin.GET("/users", getAllUsers)
		admin.POST("/users", createUser)
		admin.PUT("/users/:id", updateUser)
		admin.DELETE("/users/:id", deleteUser)
		admin.GET("/stats", getSystemStats)
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

func adminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			c.Abort()
			return
		}

		userObj := user.(User)
		if userObj.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
			c.Abort()
			return
		}

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

	// Enhanced AI-like triage with detailed analysis
	response := generateEnhancedTriageResponse(req)

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

func generateEnhancedTriageResponse(req TriageRequest) TriageResponse {
	// Enhanced keyword-based triage with detailed analysis
	title := strings.ToLower(req.Title)
	description := strings.ToLower(req.Description)
	combined := title + " " + description

	var category string
	var priority string
	var suggestedTechnician string
	var summary string
	var reasoning string
	var confidence float64

	// Enhanced categorization with comprehensive keyword analysis - ordered by specificity
	if contains(combined, []string{"security", "virus", "malware", "breach", "access", "password", "login", "authentication", "unauthorized", "hack", "phishing", "spam", "antivirus", "firewall", "encryption", "ransomware", "trojan"}) {
		category = "Security Issue"
		suggestedTechnician = "Sneha Singh"
		if contains(combined, []string{"virus", "malware", "infected", "antivirus", "ransomware", "trojan"}) {
			summary = "Malware infection requiring immediate security remediation and system cleaning"
			reasoning = "Malware keywords indicate active security threat requiring urgent antivirus scanning, quarantine, and system restoration"
		} else if contains(combined, []string{"password", "login", "access", "authentication", "locked out", "forgot"}) {
			summary = "Authentication issue requiring access control review and credential management"
			reasoning = "Authentication keywords suggest access management problems requiring password reset or account unlock procedures"
		} else if contains(combined, []string{"breach", "unauthorized", "hack", "phishing", "suspicious", "compromise"}) {
			summary = "Security breach requiring immediate investigation and incident response"
			reasoning = "Security breach keywords indicate potential system compromise requiring urgent security assessment and remediation"
		} else if contains(combined, []string{"firewall", "blocked", "port", "access denied"}) {
			summary = "Firewall or access control issue requiring security policy review"
			reasoning = "Firewall keywords suggest network security configuration problems requiring policy adjustment"
		} else {
			summary = "Security concern requiring comprehensive assessment and protective measures"
			reasoning = "Security-related keywords suggest potential threats or vulnerabilities requiring security evaluation"
		}
		confidence = 0.90
	} else if contains(combined, []string{"slow", "performance", "lag", "freeze", "hang", "timeout", "response", "speed", "optimization", "cpu", "disk space", "storage", "capacity", "bottleneck", "sluggish"}) {
		category = "Performance Issue"
		suggestedTechnician = "Rajesh Kumar"
		if contains(combined, []string{"slow", "lag", "performance", "sluggish", "taking long"}) {
			summary = "System performance degradation requiring optimization analysis and resource tuning"
			reasoning = "Performance keywords indicate system slowdown requiring resource analysis and performance optimization"
		} else if contains(combined, []string{"cpu", "processor", "high usage", "100%"}) {
			summary = "CPU utilization issue requiring process analysis and resource management"
			reasoning = "CPU keywords suggest processor utilization problems requiring process monitoring and optimization"
		} else if contains(combined, []string{"disk", "storage", "space", "capacity", "full", "low space"}) {
			summary = "Storage capacity issue requiring disk space management and cleanup procedures"
			reasoning = "Storage keywords indicate disk space problems requiring cleanup, archival, or storage expansion"
		} else if contains(combined, []string{"memory", "ram", "usage", "leak"}) {
			summary = "Memory utilization issue requiring RAM analysis and optimization"
			reasoning = "Memory keywords suggest RAM utilization problems requiring memory leak detection and optimization"
		} else {
			summary = "System performance issue requiring comprehensive resource analysis and optimization"
			reasoning = "Performance-related keywords suggest system optimization needed across multiple resource categories"
		}
		confidence = 0.80
	} else if contains(combined, []string{"network", "wifi", "internet", "connection", "router", "switch", "ethernet", "dns", "ip", "vpn", "firewall", "bandwidth", "ping", "connectivity", "lan", "wan"}) {
		category = "Network Issue"
		suggestedTechnician = "Ravi Kumar"
		if contains(combined, []string{"wifi", "wireless", "signal", "access point"}) {
			summary = "Wireless network connectivity issue requiring WiFi infrastructure review"
			reasoning = "WiFi-related keywords detected, indicating wireless network problems that may require access point configuration or signal strength analysis"
		} else if contains(combined, []string{"internet", "dns", "external", "website", "browsing"}) {
			summary = "Internet connectivity issue affecting external access and web browsing"
			reasoning = "Internet/DNS keywords suggest external connectivity problems that may require ISP coordination or DNS configuration"
		} else if contains(combined, []string{"vpn", "remote", "tunnel"}) {
			summary = "VPN connectivity issue affecting remote access capabilities"
			reasoning = "VPN-related keywords indicate remote access problems requiring VPN server or client configuration"
		} else {
			summary = "Network infrastructure issue requiring connectivity analysis and troubleshooting"
			reasoning = "Network-related keywords indicate infrastructure or configuration problems affecting local or wide area connectivity"
		}
		confidence = 0.88
	} else if contains(combined, []string{"hardware", "computer", "laptop", "desktop", "printer", "monitor", "keyboard", "mouse", "screen", "display", "power", "boot", "startup", "fan", "overheating", "memory", "ram", "disk", "hard drive", "ssd", "motherboard", "cpu", "graphics"}) {
		category = "Hardware Issue"
		suggestedTechnician = "Amit Patel"
		if contains(combined, []string{"printer", "print", "paper", "ink", "toner", "cartridge", "jam"}) {
			summary = "Printer hardware malfunction requiring physical inspection and maintenance"
			reasoning = "Printer-specific keywords indicate hardware maintenance needed, possibly involving paper jams, ink/toner replacement, or mechanical repairs"
		} else if contains(combined, []string{"screen", "display", "monitor", "resolution", "flickering", "blank", "no display"}) {
			summary = "Display hardware issue affecting visual output and user interface"
			reasoning = "Display-related keywords suggest monitor, graphics card, or cable problems requiring hardware diagnostics"
		} else if contains(combined, []string{"boot", "startup", "power", "won't start", "won't turn on", "dead"}) {
			summary = "System startup failure requiring comprehensive hardware diagnostics"
			reasoning = "Boot/power keywords indicate fundamental hardware problems with power supply, motherboard, or core components"
		} else if contains(combined, []string{"overheating", "fan", "temperature", "hot", "thermal"}) {
			summary = "System overheating issue requiring cooling system inspection and maintenance"
			reasoning = "Thermal keywords suggest cooling system problems that could lead to hardware damage if not addressed promptly"
		} else if contains(combined, []string{"memory", "ram", "blue screen", "bsod", "crash"}) {
			summary = "Memory hardware issue causing system instability and crashes"
			reasoning = "Memory-related keywords indicate RAM problems requiring memory testing and potential replacement"
		} else {
			summary = "Hardware component malfunction requiring physical inspection and diagnostic testing"
			reasoning = "Hardware-related keywords suggest physical component failure requiring hands-on troubleshooting and potential replacement"
		}
		confidence = 0.85
	} else if contains(combined, []string{"software", "application", "program", "install", "update", "crash", "error", "bug", "license", "version", "compatibility", "driver", "patch", "upgrade", "uninstall", "exe", "dll", "registry"}) {
		category = "Software Issue"
		suggestedTechnician = "Priya Sharma"
		if contains(combined, []string{"install", "installation", "setup", "deployment", "configure"}) {
			summary = "Software installation issue requiring configuration assistance and deployment support"
			reasoning = "Installation keywords suggest setup or deployment problems that may require administrator privileges or compatibility adjustments"
		} else if contains(combined, []string{"crash", "error", "bug", "freeze", "hang", "not responding"}) {
			summary = "Software stability issue requiring troubleshooting and debugging procedures"
			reasoning = "Crash/error keywords indicate software malfunction or compatibility issues requiring log analysis and troubleshooting"
		} else if contains(combined, []string{"update", "upgrade", "patch", "version", "compatibility"}) {
			summary = "Software update issue requiring version management and compatibility testing"
			reasoning = "Update-related keywords suggest version compatibility or upgrade problems requiring careful version control"
		} else if contains(combined, []string{"driver", "device", "hardware driver"}) {
			summary = "Device driver issue affecting hardware functionality and system integration"
			reasoning = "Driver keywords indicate hardware-software interface problems requiring driver updates or reinstallation"
		} else if contains(combined, []string{"license", "activation", "key", "expired"}) {
			summary = "Software licensing issue requiring activation or license management"
			reasoning = "License keywords suggest software activation or compliance issues requiring license key management"
		} else {
			summary = "Software functionality issue requiring application troubleshooting and configuration"
			reasoning = "Software-related keywords indicate application or system software problems requiring technical support"
		}
		confidence = 0.83
	} else if contains(combined, []string{"email", "outlook", "exchange", "calendar", "meeting", "appointment", "contact", "address book", "sync", "mail", "smtp", "pop", "imap"}) {
		category = "Software Issue"
		suggestedTechnician = "Priya Sharma"
		summary = "Email system issue requiring communication software configuration and troubleshooting"
		reasoning = "Email-related keywords suggest communication software problems requiring email client or server configuration"
		confidence = 0.78
	} else if contains(combined, []string{"mobile", "phone", "tablet", "android", "ios", "iphone", "ipad", "sync", "app", "mobile device"}) {
		category = "Software Issue"
		suggestedTechnician = "Mobile Support Specialist"
		summary = "Mobile device integration issue requiring mobile device management and synchronization"
		reasoning = "Mobile device keywords suggest smartphone or tablet integration problems requiring MDM configuration"
		confidence = 0.75
	} else if contains(combined, []string{"backup", "restore", "data", "file", "document", "recovery", "lost", "deleted", "missing", "corrupt", "archive"}) {
		category = "Other"
		suggestedTechnician = "Data Recovery Specialist"
		summary = "Data management issue requiring backup and recovery procedures"
		reasoning = "Data-related keywords suggest file management, backup, or recovery needs requiring data protection services"
		confidence = 0.72
	} else if contains(combined, []string{"database", "sql", "server", "connection", "query", "table", "record"}) {
		category = "Software Issue"
		suggestedTechnician = "Database Administrator"
		summary = "Database connectivity or functionality issue requiring database administration"
		reasoning = "Database keywords suggest database server or application problems requiring DBA expertise"
		confidence = 0.85
	} else {
		category = "Other"
		suggestedTechnician = "General Support"
		summary = "General IT issue requiring initial assessment and proper categorization"
		reasoning = "No specific category keywords detected, requires manual review and assessment for proper classification and routing"
		confidence = 0.50
	}

	// Enhanced priority determination with business impact analysis
	if contains(combined, []string{"urgent", "critical", "emergency", "down", "outage", "can't work", "production", "business critical", "all users", "entire system", "server down", "system down"}) {
		priority = "critical"
		confidence += 0.10
		if !strings.Contains(summary, "requiring immediate") {
			summary = strings.Replace(summary, "requiring", "requiring immediate", 1)
		}
	} else if contains(combined, []string{"high", "important", "asap", "immediately", "blocking", "multiple users", "department", "deadline", "affecting many"}) {
		priority = "high"
		confidence += 0.05
	} else if contains(combined, []string{"low", "minor", "when possible", "convenience", "enhancement", "nice to have", "cosmetic", "suggestion"}) {
		priority = "low"
		confidence -= 0.05
	} else if contains(combined, []string{"medium", "normal", "standard", "single user", "individual", "one person"}) {
		priority = "medium"
	} else {
		// Smart priority assignment based on category and context
		if category == "Security Issue" {
			priority = "high"
			reasoning += " Security issues are automatically prioritized as high risk."
		} else if category == "Network Issue" && contains(combined, []string{"internet", "all users", "wifi"}) {
			priority = "high"
			reasoning += " Network issues affecting multiple users are prioritized."
		} else if category == "Hardware Issue" && contains(combined, []string{"server", "critical", "production"}) {
			priority = "high"
			reasoning += " Hardware issues on critical systems are prioritized."
		} else {
			priority = "medium"
		}
	}

	// Ensure confidence is within bounds
	if confidence > 1.0 {
		confidence = 1.0
	} else if confidence < 0.0 {
		confidence = 0.0
	}

	return TriageResponse{
		Category:            category,
		Summary:             summary,
		Priority:            priority,
		SuggestedTechnician: suggestedTechnician,
		Confidence:          confidence,
		Reasoning:           reasoning,
	}
}

// Admin handlers
func getAllUsers(c *gin.Context) {
	var userList []User
	for _, user := range users {
		// Remove password from response
		userCopy := user
		userCopy.Password = ""
		userList = append(userList, userCopy)
	}

	c.JSON(http.StatusOK, gin.H{
		"users": userList,
		"total": len(userList),
	})
}

func createUser(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	if _, exists := users[req.Email]; exists {
		c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		return
	}

	// Validate role
	if req.Role != "admin" && req.Role != "technician" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'admin' or 'technician'"})
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

	// Remove password from response
	user.Password = ""
	c.JSON(http.StatusCreated, gin.H{
		"message": "User created successfully",
		"user":    user,
	})
}

func updateUser(c *gin.Context) {
	id := c.Param("id")
	
	// Find user by ID
	var targetUser User
	var targetEmail string
	found := false
	for email, user := range users {
		if user.ID == id {
			targetUser = user
			targetEmail = email
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	var req map[string]interface{}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields
	if name, ok := req["name"].(string); ok && name != "" {
		targetUser.Name = name
	}
	if role, ok := req["role"].(string); ok && role != "" {
		if role != "admin" && role != "technician" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'admin' or 'technician'"})
			return
		}
		targetUser.Role = role
	}
	if password, ok := req["password"].(string); ok && password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		targetUser.Password = string(hashedPassword)
	}

	users[targetEmail] = targetUser

	// Remove password from response
	targetUser.Password = ""
	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    targetUser,
	})
}

func deleteUser(c *gin.Context) {
	id := c.Param("id")
	
	// Get current user to prevent self-deletion
	currentUser, _ := c.Get("user")
	currentUserObj := currentUser.(User)
	
	if currentUserObj.ID == id {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete your own account"})
		return
	}

	// Find and delete user by ID
	var targetEmail string
	found := false
	for email, user := range users {
		if user.ID == id {
			targetEmail = email
			found = true
			break
		}
	}

	if !found {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	delete(users, targetEmail)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

func getSystemStats(c *gin.Context) {
	// Calculate stats
	totalUsers := len(users)
	totalTickets := len(tickets)
	
	adminCount := 0
	technicianCount := 0
	for _, user := range users {
		if user.Role == "admin" {
			adminCount++
		} else if user.Role == "technician" {
			technicianCount++
		}
	}

	openTickets := 0
	inProgressTickets := 0
	resolvedTickets := 0
	criticalTickets := 0
	
	for _, ticket := range tickets {
		switch ticket.Status {
		case "open":
			openTickets++
		case "in_progress":
			inProgressTickets++
		case "resolved":
			resolvedTickets++
		}
		
		if ticket.Priority == "critical" {
			criticalTickets++
		}
	}

	stats := gin.H{
		"users": gin.H{
			"total":       totalUsers,
			"admins":      adminCount,
			"technicians": technicianCount,
		},
		"tickets": gin.H{
			"total":      totalTickets,
			"open":       openTickets,
			"inProgress": inProgressTickets,
			"resolved":   resolvedTickets,
			"critical":   criticalTickets,
		},
	}

	c.JSON(http.StatusOK, stats)
}
