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
    // Monitoring / AIOps
    MonitoringEnabled    bool
    MonitorPollInterval  time.Duration
    MonitorDefaultZScore float64
    MonitorMinConsecutive int
    AWSRegion            string
    AnomalyCreateTickets bool
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
        MonitoringEnabled:    getEnvAsBool("MONITORING_ENABLED", false),
        MonitorDefaultZScore: getEnvAsFloat("MONITOR_DEFAULT_ZSCORE", 3.0),
        MonitorMinConsecutive: getEnvAsInt("MONITOR_MIN_CONSECUTIVE", 3),
        AWSRegion:            getEnv("AWS_REGION", "us-west-2"),
        AnomalyCreateTickets: getEnvAsBool("ANOMALY_CREATE_TICKETS", true),
	}

	// Parse JWT expiration duration
	expiresInStr := getEnv("JWT_EXPIRES_IN", "24h")
	duration, err := time.ParseDuration(expiresInStr)
	if err != nil {
		log.Printf("Invalid JWT_EXPIRES_IN format, using default 24h: %v", err)
		duration = 24 * time.Hour
	}
	config.JWTExpiresIn = duration

    // Parse monitoring poll interval
    pollStr := getEnv("MONITOR_POLL_INTERVAL", "60s")
    pollDur, err := time.ParseDuration(pollStr)
    if err != nil {
        log.Printf("Invalid MONITOR_POLL_INTERVAL, using 60s: %v", err)
        pollDur = 60 * time.Second
    }
    config.MonitorPollInterval = pollDur

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

func getEnvAsFloat(key string, defaultValue float64) float64 {
    if value := os.Getenv(key); value != "" {
        if f, err := strconv.ParseFloat(value, 64); err == nil {
            return f
        }
    }
    return defaultValue
}
