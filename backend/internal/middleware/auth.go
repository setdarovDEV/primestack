package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/primestack/backend/internal/models"
)

const tokenAudience = "primestack-admin"

type Claims struct {
	UserID int64  `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func GenerateToken(user models.User, secret string, expiryHours int) (string, error) {
	now := time.Now().UTC()
	jti, err := randomToken(16)
	if err != nil {
		return "", err
	}

	claims := Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Duration(expiryHours) * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(now),
			NotBefore: jwt.NewNumericDate(now.Add(-30 * time.Second)),
			Issuer:    "primestack",
			Subject:   strconv.FormatInt(user.ID, 10),
			Audience:  jwt.ClaimStrings{tokenAudience},
			ID:        jti,
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func AuthMiddleware(jwtSecret, cookieName string) gin.HandlerFunc {
	if cookieName == "" {
		cookieName = "admin_token"
	}

	return func(c *gin.Context) {
		tokenStr, authViaCookie := tokenFromRequest(c, cookieName)
		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResp("Authentication required"))
			c.Abort()
			return
		}

		claims := &Claims{}
		parser := jwt.NewParser(
			jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
			jwt.WithIssuer("primestack"),
			jwt.WithAudience(tokenAudience),
			jwt.WithLeeway(30*time.Second),
		)

		token, err := parser.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(jwtSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid or expired token"))
			c.Abort()
			return
		}
		if claims.UserID == 0 || strings.TrimSpace(claims.Email) == "" || strings.TrimSpace(claims.Role) == "" {
			c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid token claims"))
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("user_email", claims.Email)
		c.Set("user_role", claims.Role)
		c.Set("auth_via_cookie", authViaCookie)
		c.Next()
	}
}

func RoleMiddleware(allowedRoles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("user_role")
		if !exists {
			c.JSON(http.StatusForbidden, models.ErrorResp("Role not found"))
			c.Abort()
			return
		}
		userRole, ok := role.(string)
		if !ok || strings.TrimSpace(userRole) == "" {
			c.JSON(http.StatusForbidden, models.ErrorResp("Role not found"))
			c.Abort()
			return
		}
		for _, r := range allowedRoles {
			if r == userRole || userRole == "super_admin" {
				c.Next()
				return
			}
		}
		c.JSON(http.StatusForbidden, models.ErrorResp("Access denied"))
		c.Abort()
	}
}

func CSRFMiddleware(csrfCookieName string) gin.HandlerFunc {
	if csrfCookieName == "" {
		csrfCookieName = "admin_csrf"
	}

	return func(c *gin.Context) {
		switch c.Request.Method {
		case http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodTrace:
			c.Next()
			return
		}

		if hasBearerAuth(c.GetHeader("Authorization")) {
			c.Next()
			return
		}

		if authViaCookie, exists := c.Get("auth_via_cookie"); exists {
			if b, ok := authViaCookie.(bool); ok && !b {
				c.Next()
				return
			}
		}

		csrfCookie, err := c.Cookie(csrfCookieName)
		csrfHeader := strings.TrimSpace(c.GetHeader("X-CSRF-Token"))
		if err != nil || csrfCookie == "" || csrfHeader == "" {
			c.JSON(http.StatusForbidden, models.ErrorResp("CSRF token required"))
			c.Abort()
			return
		}

		if subtle.ConstantTimeCompare([]byte(csrfCookie), []byte(csrfHeader)) != 1 {
			c.JSON(http.StatusForbidden, models.ErrorResp("Invalid CSRF token"))
			c.Abort()
			return
		}

		c.Next()
	}
}

func RateLimitMiddleware() gin.HandlerFunc {
	var mu sync.Mutex
	requests := make(map[string][]time.Time)

	return func(c *gin.Context) {
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}

		limit := 120
		window := time.Minute
		switch {
		case path == "/api/v1/auth/login":
			limit = 8
		case path == "/api/v1/contact":
			limit = 10
		case strings.HasPrefix(path, "/api/v1/admin"):
			limit = 180
		}

		ip := c.ClientIP()
		key := ip + ":" + path
		now := time.Now()
		windowStart := now.Add(-window)

		mu.Lock()
		var recent []time.Time
		for _, t := range requests[key] {
			if t.After(windowStart) {
				recent = append(recent, t)
			}
		}
		requests[key] = recent

		if len(recent) >= limit {
			mu.Unlock()
			c.JSON(http.StatusTooManyRequests, models.ErrorResp("Too many requests"))
			c.Abort()
			return
		}

		requests[key] = append(requests[key], now)

		cutoff := now.Add(-2 * window)
		for k, values := range requests {
			keep := values[:0]
			for _, ts := range values {
				if ts.After(cutoff) {
					keep = append(keep, ts)
				}
			}
			if len(keep) == 0 {
				delete(requests, k)
				continue
			}
			requests[k] = keep
		}
		mu.Unlock()

		c.Next()
	}
}

func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "0")
		c.Header("Referrer-Policy", "no-referrer")
		c.Header("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Header("Cross-Origin-Opener-Policy", "same-origin")
		c.Header("Cross-Origin-Resource-Policy", "same-origin")
		c.Header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'")
		if c.Request.TLS != nil || strings.EqualFold(c.GetHeader("X-Forwarded-Proto"), "https") {
			c.Header("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload")
		}
		c.Next()
	}
}

func BodySizeLimitMiddleware(maxBytes int64) gin.HandlerFunc {
	if maxBytes <= 0 {
		maxBytes = 10 * 1024 * 1024
	}

	return func(c *gin.Context) {
		if c.Request.Body != nil {
			c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxBytes)
		}
		c.Next()
	}
}

func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		_ = time.Since(start)
		// In production, use structured logging (zerolog, zap)
	}
}

func tokenFromRequest(c *gin.Context, cookieName string) (token string, fromCookie bool) {
	authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
	if hasBearerAuth(authHeader) {
		parts := strings.SplitN(authHeader, " ", 2)
		return strings.TrimSpace(parts[1]), false
	}

	if cookieName != "" {
		if cookieToken, err := c.Cookie(cookieName); err == nil && strings.TrimSpace(cookieToken) != "" {
			return strings.TrimSpace(cookieToken), true
		}
	}

	return "", false
}

func hasBearerAuth(header string) bool {
	parts := strings.SplitN(strings.TrimSpace(header), " ", 2)
	if len(parts) != 2 {
		return false
	}
	if !strings.EqualFold(parts[0], "Bearer") {
		return false
	}
	return strings.TrimSpace(parts[1]) != ""
}

func randomToken(size int) (string, error) {
	if size <= 0 {
		size = 16
	}

	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}
