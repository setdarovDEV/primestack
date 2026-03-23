package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	DatabaseURL            string
	RedisURL               string
	JWTSecret              string
	JWTExpiry              int // hours
	AllowOrigins           []string
	S3Bucket               string
	S3Region               string
	S3Endpoint             string
	AWSAccessKey           string
	AWSSecretKey           string
	AppEnv                 string
	MaxUploadSize          int64 // bytes
	AdminEmail             string
	AdminPassword          string
	TelegramToken          string
	TelegramChatID         string
	TelegramWebhookSecret  string
	TelegramWebhookBaseURL string
	SMTPHost               string
	SMTPPort               int
	SMTPUser               string
	SMTPPass               string
}

func Load() *Config {
	allowOrigins := getAllowedOrigins()

	return &Config{
		DatabaseURL:            getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/primestack?sslmode=disable"),
		RedisURL:               getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:              getEnv("JWT_SECRET", "primestack-super-secret-key-change-in-production"),
		JWTExpiry:              getEnvInt("JWT_EXPIRY_HOURS", 24),
		AllowOrigins:           allowOrigins,
		S3Bucket:               getEnv("S3_BUCKET", "primestack-media"),
		S3Region:               getEnv("S3_REGION", "us-east-1"),
		S3Endpoint:             getEnv("S3_ENDPOINT", ""),
		AWSAccessKey:           getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:           getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AppEnv:                 getEnv("APP_ENV", "development"),
		MaxUploadSize:          int64(getEnvInt("MAX_UPLOAD_SIZE_MB", 10)) * 1024 * 1024,
		AdminEmail:             getEnv("ADMIN_EMAIL", "admin@primestack.uz"),
		AdminPassword:          getEnv("ADMIN_PASSWORD", "admin123"),
		TelegramToken:          getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramChatID:         getEnv("TELEGRAM_CHAT_ID", ""),
		TelegramWebhookSecret:  getEnv("TELEGRAM_WEBHOOK_SECRET", ""),
		TelegramWebhookBaseURL: getEnv("TELEGRAM_WEBHOOK_BASE_URL", ""),
		SMTPHost:               getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:               getEnvInt("SMTP_PORT", 587),
		SMTPUser:               getEnv("SMTP_USER", ""),
		SMTPPass:               getEnv("SMTP_PASS", ""),
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if v := os.Getenv(key); v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			return n
		}
	}
	return fallback
}

func getAllowedOrigins() []string {
	defaults := []string{
		getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		"http://localhost",
		"https://primestack.uz",
		"https://www.primestack.uz",
	}

	if raw := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS")); raw != "" {
		return uniqueNonEmpty(append(splitCSV(raw), defaults...))
	}

	return uniqueNonEmpty(defaults)
}

func splitCSV(raw string) []string {
	parts := strings.Split(raw, ",")
	return uniqueNonEmpty(parts)
}

func uniqueNonEmpty(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))

	for _, value := range values {
		v := strings.TrimSpace(value)
		if v == "" {
			continue
		}
		if _, ok := seen[v]; ok {
			continue
		}
		seen[v] = struct{}{}
		result = append(result, v)
	}

	return result
}
