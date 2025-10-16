package config

import (
	"log"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	MongoDBURI    string
	DatabaseName  string
	JWTSecret     string
	JWTExpiresIn  time.Duration
	Port          string
	GinMode       string
	OpenAIAPIKey  string
	OpenAIModel   string
	LocalLLMURL   string
	AIProvider    string // "openai" or "local"
	CORSOrigin    string
}

func Load() *Config {
	// Load .env file if it exists
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	config := &Config{
		MongoDBURI:   getEnv("MONGODB_URI", "mongodb://localhost:27017"),
		DatabaseName: getEnv("DATABASE_NAME", "intelliops"),
		JWTSecret:    getEnv("JWT_SECRET", "your-super-secret-jwt-key-here"),
		Port:         getEnv("PORT", "8080"),
		GinMode:      getEnv("GIN_MODE", "debug"),
		OpenAIAPIKey: getEnv("OPENAI_API_KEY", ""),
		OpenAIModel:  getEnv("OPENAI_MODEL", "gpt-3.5-turbo"),
		LocalLLMURL:  getEnv("LOCAL_LLM_URL", ""),
		AIProvider:   getEnv("AI_PROVIDER", "openai"),
		CORSOrigin:   getEnv("CORS_ORIGIN", "http://localhost:3000"),
	}

	// Parse JWT expiration duration
	expiresInStr := getEnv("JWT_EXPIRES_IN", "24h")
	duration, err := time.ParseDuration(expiresInStr)
	if err != nil {
		log.Printf("Invalid JWT_EXPIRES_IN format, using default 24h: %v", err)
		duration = 24 * time.Hour
	}
	config.JWTExpiresIn = duration

	return config
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvAsInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvAsBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}
	return defaultValue
}
