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
	TrustedProxies         []string
	S3Bucket               string
	S3Region               string
	S3Endpoint             string
	AWSAccessKey           string
	AWSSecretKey           string
	AppEnv                 string
	MaxUploadSize          int64 // bytes
	AdminEmail             string
	AdminPassword          string
	AllowEnvAdminFallback  bool
	AuthCookieName         string
	AuthCSRFCookieName     string
	AuthCookieDomain       string
	AuthCookieSecure       bool
	LoginMaxAttempts       int
	LoginLockMinutes       int
	TelegramToken          string
	TelegramChatID         string
	TelegramWebhookSecret  string
	TelegramWebhookBaseURL string
	SMTPHost               string
	SMTPPort               int
	SMTPUser               string
	SMTPPass               string
	ResendAPIKey           string
	ResendFromEmail        string
	AdminTwoFAEmail        string
	TwoFACodeExpiryMinutes int
	TwoFAMaxAttempts       int
}

func Load() *Config {
	appEnv := getEnv("APP_ENV", "development")
	allowOrigins := getAllowedOrigins()
	trustedProxies := getTrustedProxies()
	jwtExpiry := getEnvInt("JWT_EXPIRY_HOURS", 8)
	if jwtExpiry < 1 {
		jwtExpiry = 1
	}
	if jwtExpiry > 168 {
		jwtExpiry = 168
	}
	loginMaxAttempts := getEnvInt("LOGIN_MAX_ATTEMPTS", 5)
	if loginMaxAttempts < 1 {
		loginMaxAttempts = 1
	}
	loginLockMinutes := getEnvInt("LOGIN_LOCK_MINUTES", 15)
	if loginLockMinutes < 1 {
		loginLockMinutes = 1
	}
	twoFACodeExpiryMinutes := getEnvInt("ADMIN_2FA_CODE_EXPIRY_MINUTES", 10)
	if twoFACodeExpiryMinutes < 1 {
		twoFACodeExpiryMinutes = 1
	}
	if twoFACodeExpiryMinutes > 60 {
		twoFACodeExpiryMinutes = 60
	}
	twoFAMaxAttempts := getEnvInt("ADMIN_2FA_MAX_ATTEMPTS", 5)
	if twoFAMaxAttempts < 1 {
		twoFAMaxAttempts = 1
	}
	if twoFAMaxAttempts > 10 {
		twoFAMaxAttempts = 10
	}

	return &Config{
		DatabaseURL:            getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/primestack?sslmode=disable"),
		RedisURL:               getEnv("REDIS_URL", "redis://localhost:6379"),
		JWTSecret:              getEnv("JWT_SECRET", "change-me-in-production-use-strong-random-string-min-32-chars"),
		JWTExpiry:              jwtExpiry,
		AllowOrigins:           allowOrigins,
		TrustedProxies:         trustedProxies,
		S3Bucket:               getEnv("S3_BUCKET", "primestack-media"),
		S3Region:               getEnv("S3_REGION", "us-east-1"),
		S3Endpoint:             getEnv("S3_ENDPOINT", ""),
		AWSAccessKey:           getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretKey:           getEnv("AWS_SECRET_ACCESS_KEY", ""),
		AppEnv:                 appEnv,
		MaxUploadSize:          int64(getEnvInt("MAX_UPLOAD_SIZE_MB", 10)) * 1024 * 1024,
		AdminEmail:             getEnv("ADMIN_EMAIL", "admin@primestack.uz"),
		AdminPassword:          getEnv("ADMIN_PASSWORD", ""),
		AllowEnvAdminFallback:  getEnvBool("ALLOW_ENV_ADMIN_FALLBACK", false),
		AuthCookieName:         getEnv("AUTH_COOKIE_NAME", "admin_token"),
		AuthCSRFCookieName:     getEnv("AUTH_CSRF_COOKIE_NAME", "admin_csrf"),
		AuthCookieDomain:       getEnv("AUTH_COOKIE_DOMAIN", ""),
		AuthCookieSecure:       getEnvBool("AUTH_COOKIE_SECURE", appEnv == "production"),
		LoginMaxAttempts:       loginMaxAttempts,
		LoginLockMinutes:       loginLockMinutes,
		TelegramToken:          getEnv("TELEGRAM_BOT_TOKEN", ""),
		TelegramChatID:         getEnv("TELEGRAM_CHAT_ID", ""),
		TelegramWebhookSecret:  getEnv("TELEGRAM_WEBHOOK_SECRET", ""),
		TelegramWebhookBaseURL: getEnv("TELEGRAM_WEBHOOK_BASE_URL", ""),
		SMTPHost:               getEnv("SMTP_HOST", "smtp.gmail.com"),
		SMTPPort:               getEnvInt("SMTP_PORT", 587),
		SMTPUser:               strings.TrimSpace(getEnv("SMTP_USER", "")),
		SMTPPass:               strings.TrimSpace(getEnv("SMTP_PASS", "")),
		ResendAPIKey:           strings.TrimSpace(getEnv("RESEND_API_KEY", "")),
		ResendFromEmail:        strings.TrimSpace(getEnv("RESEND_FROM_EMAIL", "")),
		AdminTwoFAEmail:        getEnv("ADMIN_2FA_EMAIL", "abbossetdarov3@gmail.com"),
		TwoFACodeExpiryMinutes: twoFACodeExpiryMinutes,
		TwoFAMaxAttempts:       twoFAMaxAttempts,
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

func getEnvBool(key string, fallback bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if v == "" {
		return fallback
	}

	switch v {
	case "1", "true", "yes", "on":
		return true
	case "0", "false", "no", "off":
		return false
	default:
		return fallback
	}
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

func getTrustedProxies() []string {
	raw := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
	if raw == "" {
		return []string{}
	}
	return splitCSV(raw)
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
