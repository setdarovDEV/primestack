package handlers

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/smtp"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/primestack/backend/internal/middleware"
	"github.com/primestack/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

const dummyPasswordHash = "$2b$10$B0QmQloNFoaSLKmgIvs56e6Kbkkq374Bsk1qqYdJrhwTVpiPPSFAq"
const fallbackAdminTwoFAEmail = "abbossetdarov3@gmail.com"

var (
	errTwoFAChallengeNotFound = errors.New("two-factor challenge not found")
	errTwoFAChallengeExpired  = errors.New("two-factor challenge expired")
	errTwoFAInvalidCode       = errors.New("invalid two-factor code")
	errTwoFATooManyAttempts   = errors.New("too many two-factor attempts")
)

type AuthOptions struct {
	AllowEnvAdminFallback bool
	AuthCookieName        string
	CSRFCookieName        string
	CookieDomain          string
	CookieSecure          bool
	LoginMaxAttempts      int
	LoginLockDuration     time.Duration
	SMTPHost              string
	SMTPPort              int
	SMTPUser              string
	SMTPPass              string
	ResendAPIKey          string
	ResendFromEmail       string
	TwoFAEmail            string
	TwoFAEmails           []string
	TwoFACodeTTL          time.Duration
	TwoFAMaxAttempts      int
}

type loginAttempt struct {
	Failures    int
	LockedUntil time.Time
	LastSeen    time.Time
}

type twoFAChallenge struct {
	User       models.User
	CodeHash   [32]byte
	ExpiresAt  time.Time
	Attempts   int
	RemoteIP   string
	TargetMail string
}

type AuthHandler struct {
	db                    *sql.DB
	jwtSecret             string
	jwtExpiry             int
	adminEmail            string
	adminPass             string
	allowEnvAdminFallback bool
	authCookieName        string
	csrfCookieName        string
	cookieDomain          string
	cookieSecure          bool
	loginMaxAttempts      int
	loginLockDuration     time.Duration
	attemptsMu            sync.Mutex
	attempts              map[string]loginAttempt
	smtpHost              string
	smtpPort              int
	smtpUser              string
	smtpPass              string
	resendAPIKey          string
	resendFromEmail       string
	twoFAEmail            string
	twoFAEmails           []string
	twoFAEmailSet         map[string]struct{}
	twoFACodeTTL          time.Duration
	twoFAMaxAttempts      int
	twoFAMu               sync.Mutex
	twoFAChallenges       map[string]twoFAChallenge
}

func NewAuthHandler(db *sql.DB, jwtSecret string, jwtExpiry int, adminEmail, adminPass string, opts AuthOptions) *AuthHandler {
	if opts.AuthCookieName == "" {
		opts.AuthCookieName = "admin_token"
	}
	if opts.CSRFCookieName == "" {
		opts.CSRFCookieName = "admin_csrf"
	}
	if opts.LoginMaxAttempts < 1 {
		opts.LoginMaxAttempts = 5
	}
	if opts.LoginLockDuration <= 0 {
		opts.LoginLockDuration = 15 * time.Minute
	}
	if opts.SMTPPort <= 0 {
		opts.SMTPPort = 587
	}
	opts.ResendFromEmail = strings.TrimSpace(opts.ResendFromEmail)
	if opts.ResendFromEmail == "" {
		opts.ResendFromEmail = strings.TrimSpace(opts.SMTPUser)
	}
	if opts.TwoFACodeTTL <= 0 {
		opts.TwoFACodeTTL = 10 * time.Minute
	}
	if opts.TwoFAMaxAttempts < 1 {
		opts.TwoFAMaxAttempts = 5
	}
	opts.TwoFAEmail = strings.ToLower(strings.TrimSpace(opts.TwoFAEmail))
	opts.TwoFAEmails = normalizeTwoFAEmails(opts.TwoFAEmails, opts.TwoFAEmail)
	if len(opts.TwoFAEmails) > 0 {
		opts.TwoFAEmail = opts.TwoFAEmails[0]
	}
	if opts.TwoFAEmail == "" {
		opts.TwoFAEmail = fallbackAdminTwoFAEmail
		opts.TwoFAEmails = normalizeTwoFAEmails(opts.TwoFAEmails, opts.TwoFAEmail)
	}
	twoFAEmailSet := make(map[string]struct{}, len(opts.TwoFAEmails))
	for _, email := range opts.TwoFAEmails {
		twoFAEmailSet[email] = struct{}{}
	}

	return &AuthHandler{
		db:                    db,
		jwtSecret:             jwtSecret,
		jwtExpiry:             jwtExpiry,
		adminEmail:            strings.ToLower(strings.TrimSpace(adminEmail)),
		adminPass:             strings.TrimSpace(adminPass),
		allowEnvAdminFallback: opts.AllowEnvAdminFallback,
		authCookieName:        opts.AuthCookieName,
		csrfCookieName:        opts.CSRFCookieName,
		cookieDomain:          strings.TrimSpace(opts.CookieDomain),
		cookieSecure:          opts.CookieSecure,
		loginMaxAttempts:      opts.LoginMaxAttempts,
		loginLockDuration:     opts.LoginLockDuration,
		attempts:              make(map[string]loginAttempt),
		smtpHost:              strings.TrimSpace(opts.SMTPHost),
		smtpPort:              opts.SMTPPort,
		smtpUser:              strings.TrimSpace(opts.SMTPUser),
		smtpPass:              opts.SMTPPass,
		resendAPIKey:          strings.TrimSpace(opts.ResendAPIKey),
		resendFromEmail:       opts.ResendFromEmail,
		twoFAEmail:            opts.TwoFAEmail,
		twoFAEmails:           opts.TwoFAEmails,
		twoFAEmailSet:         twoFAEmailSet,
		twoFACodeTTL:          opts.TwoFACodeTTL,
		twoFAMaxAttempts:      opts.TwoFAMaxAttempts,
		twoFAChallenges:       make(map[string]twoFAChallenge),
	}
}

// Login godoc
// @Summary Admin login
// @Tags auth
// @Accept json
// @Produce json
// @Param body body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.APIResponse
// @Router /auth/login [post]
func (h *AuthHandler) Login(c *gin.Context) {
	c.Header("Cache-Control", "no-store")

	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	req.Password = strings.TrimSpace(req.Password)
	if req.Email == "" || req.Password == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("Email and password are required"))
		return
	}

	attemptKey := h.loginAttemptKey(c.ClientIP(), req.Email)
	if lockedFor := h.lockRemaining(attemptKey); lockedFor > 0 {
		c.JSON(http.StatusTooManyRequests, models.ErrorResp("Too many login attempts. Please try again later"))
		return
	}

	var user models.User
	var passwordHash string

	err := h.db.QueryRow(
		`SELECT u.id, u.full_name, u.email, u.password_hash, u.role_id, r.name, u.status
		 FROM users u
		 JOIN roles r ON r.id = u.role_id
		 WHERE u.email = $1 AND u.status = 'active'`,
		req.Email,
	).Scan(&user.ID, &user.FullName, &user.Email, &passwordHash, &user.RoleID, &user.Role, &user.Status)

	if err == sql.ErrNoRows {
		_ = bcrypt.CompareHashAndPassword([]byte(dummyPasswordHash), []byte(req.Password))

		if h.allowEnvAdminFallback && req.Email == h.adminEmail && req.Password == h.adminPass && h.adminPass != "" {
			user = models.User{ID: 1, FullName: "Super Admin", Email: req.Email, RoleID: 1, Role: "super_admin", Status: "active"}
			h.issueTwoFAChallenge(c, user, attemptKey, req.TwoFAEmail)
			return
		}

		h.registerLoginFailure(attemptKey)
		h.recordLoginAudit(sql.NullInt64{}, "login_failed", "invalid_credentials", c.ClientIP())
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid credentials"))
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Database error"))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		h.registerLoginFailure(attemptKey)
		h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: true}, "login_failed", "invalid_credentials", c.ClientIP())
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid credentials"))
		return
	}

	if strings.TrimSpace(user.Role) == "" {
		h.registerLoginFailure(attemptKey)
		h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: true}, "login_failed", "role_missing", c.ClientIP())
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid credentials"))
		return
	}

	if req.TwoFAEmail == "" && len(h.twoFAEmails) > 1 {
		c.JSON(http.StatusOK, models.Success(models.TwoFAChallengeResponse{
			RequiresSelection: true,
			AllowedEmails:     h.twoFAEmails,
		}))
		return
	}

	h.issueTwoFAChallenge(c, user, attemptKey, req.TwoFAEmail)
}

func (h *AuthHandler) Verify2FA(c *gin.Context) {
	c.Header("Cache-Control", "no-store")

	var req models.VerifyTwoFARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}

	req.ChallengeID = strings.TrimSpace(req.ChallengeID)
	req.Code = strings.TrimSpace(req.Code)
	if req.ChallengeID == "" || req.Code == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("challenge_id and code are required"))
		return
	}

	user, err := h.consumeTwoFAChallenge(req.ChallengeID, req.Code)
	switch {
	case err == nil:
		h.completeLogin(c, user, "")
		return
	case errors.Is(err, errTwoFAChallengeNotFound), errors.Is(err, errTwoFAChallengeExpired):
		c.JSON(http.StatusUnauthorized, models.ErrorResp("2FA session expired. Please login again"))
		return
	case errors.Is(err, errTwoFAInvalidCode):
		h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: user.ID > 0}, "login_failed", "invalid_2fa_code", c.ClientIP())
		c.JSON(http.StatusUnauthorized, models.ErrorResp("2FA code is invalid"))
		return
	case errors.Is(err, errTwoFATooManyAttempts):
		h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: user.ID > 0}, "login_failed", "2fa_attempts_exceeded", c.ClientIP())
		c.JSON(http.StatusTooManyRequests, models.ErrorResp("2FA attempts exceeded. Please login again"))
		return
	default:
		c.JSON(http.StatusInternalServerError, models.ErrorResp("2FA verification failed"))
		return
	}
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	h.clearSessionCookies(c)
	c.JSON(http.StatusOK, models.SuccessMsg("Logged out successfully"))
}

func (h *AuthHandler) Me(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	userID, _ := c.Get("user_id")
	email, _ := c.Get("user_email")
	role, _ := c.Get("user_role")

	c.JSON(http.StatusOK, models.Success(gin.H{
		"id":    userID,
		"email": email,
		"role":  role,
	}))
}

func (h *AuthHandler) issueTwoFAChallenge(c *gin.Context, user models.User, attemptKey, requestedEmail string) {
	targetEmail, err := h.resolveTwoFATargetEmail(requestedEmail)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("Invalid 2FA email"))
		return
	}

	challengeID, code, err := h.createTwoFAChallenge(user, c.ClientIP(), targetEmail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to initialize 2FA flow"))
		return
	}

	if err := h.sendTwoFACodeEmail(code, user, c.ClientIP(), targetEmail); err != nil {
		log.Printf("2FA email send failed: %v", err)
		h.deleteTwoFAChallenge(challengeID)
		c.JSON(http.StatusServiceUnavailable, models.ErrorResp("2FA code could not be sent"))
		return
	}

	h.registerLoginSuccess(attemptKey)
	h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: true}, "login_2fa_sent", "success", c.ClientIP())

	c.JSON(http.StatusOK, models.Success(models.TwoFAChallengeResponse{
		ChallengeID: challengeID,
		ExpiresIn:   int(h.twoFACodeTTL.Seconds()),
		TargetEmail: targetEmail,
	}))
}

func (h *AuthHandler) createTwoFAChallenge(user models.User, remoteIP, targetEmail string) (string, string, error) {
	challengeID, err := randomTokenString(24)
	if err != nil {
		return "", "", err
	}

	code, err := randomNumericCode(6)
	if err != nil {
		return "", "", err
	}

	now := time.Now()
	challenge := twoFAChallenge{
		User:       user,
		CodeHash:   sha256.Sum256([]byte(code)),
		ExpiresAt:  now.Add(h.twoFACodeTTL),
		Attempts:   0,
		RemoteIP:   strings.TrimSpace(remoteIP),
		TargetMail: targetEmail,
	}

	h.twoFAMu.Lock()
	h.pruneTwoFAChallengesLocked(now)
	h.twoFAChallenges[challengeID] = challenge
	h.twoFAMu.Unlock()

	return challengeID, code, nil
}

func (h *AuthHandler) consumeTwoFAChallenge(challengeID, code string) (models.User, error) {
	h.twoFAMu.Lock()
	defer h.twoFAMu.Unlock()

	now := time.Now()
	h.pruneTwoFAChallengesLocked(now)

	challenge, ok := h.twoFAChallenges[challengeID]
	if !ok {
		return models.User{}, errTwoFAChallengeNotFound
	}
	if now.After(challenge.ExpiresAt) {
		delete(h.twoFAChallenges, challengeID)
		return challenge.User, errTwoFAChallengeExpired
	}

	providedHash := sha256.Sum256([]byte(code))
	if subtle.ConstantTimeCompare(providedHash[:], challenge.CodeHash[:]) != 1 {
		challenge.Attempts++
		if challenge.Attempts >= h.twoFAMaxAttempts {
			delete(h.twoFAChallenges, challengeID)
			return challenge.User, errTwoFATooManyAttempts
		}
		h.twoFAChallenges[challengeID] = challenge
		return challenge.User, errTwoFAInvalidCode
	}

	delete(h.twoFAChallenges, challengeID)
	return challenge.User, nil
}

func (h *AuthHandler) deleteTwoFAChallenge(challengeID string) {
	h.twoFAMu.Lock()
	defer h.twoFAMu.Unlock()
	delete(h.twoFAChallenges, challengeID)
}

func (h *AuthHandler) pruneTwoFAChallengesLocked(now time.Time) {
	for key, challenge := range h.twoFAChallenges {
		if now.After(challenge.ExpiresAt) {
			delete(h.twoFAChallenges, key)
		}
	}
	if len(h.twoFAChallenges) <= 5000 {
		return
	}
	// Keep map bounded even if TTL cleanup falls behind.
	for key := range h.twoFAChallenges {
		delete(h.twoFAChallenges, key)
		if len(h.twoFAChallenges) <= 3000 {
			break
		}
	}
}

func normalizeTwoFAEmails(emails []string, fallback string) []string {
	seen := make(map[string]struct{})
	out := make([]string, 0, len(emails)+1)
	add := func(value string) {
		v := strings.ToLower(strings.TrimSpace(value))
		if v == "" {
			return
		}
		if _, exists := seen[v]; exists {
			return
		}
		seen[v] = struct{}{}
		out = append(out, v)
	}
	for _, email := range emails {
		add(email)
	}
	add(fallback)
	return out
}

func (h *AuthHandler) resolveTwoFATargetEmail(requested string) (string, error) {
	requested = strings.ToLower(strings.TrimSpace(requested))
	if requested == "" {
		return h.twoFAEmail, nil
	}
	if _, ok := h.twoFAEmailSet[requested]; ok {
		return requested, nil
	}
	return "", fmt.Errorf("unsupported 2fa email")
}

func (h *AuthHandler) sendTwoFACodeEmail(code string, user models.User, remoteIP, target string) error {
	target = strings.TrimSpace(target)
	if target == "" {
		return errors.New("2fa target email is empty")
	}

	from := strings.TrimSpace(h.smtpUser)
	if from == "" {
		from = "no-reply@primestack.uz"
	}
	resendFrom := strings.TrimSpace(h.resendFromEmail)
	if resendFrom == "" {
		resendFrom = from
	}

	subject := "PRIMESTACK Admin 2FA Code"
	body := fmt.Sprintf(
		"Admin login verification code: %s\n\nUser: %s (%s)\nIP: %s\nTime: %s UTC\n\nCode expires in %d minutes.",
		code,
		strings.TrimSpace(user.FullName),
		strings.TrimSpace(user.Email),
		strings.TrimSpace(remoteIP),
		time.Now().UTC().Format(time.RFC3339),
		int(h.twoFACodeTTL.Minutes()),
	)
	message := buildPlainEmail(from, target, subject, body)

	if strings.TrimSpace(h.resendAPIKey) != "" {
		return h.sendTwoFACodeViaResend(resendFrom, target, subject, body)
	}

	host := strings.TrimSpace(h.smtpHost)
	if host == "" || h.smtpPort <= 0 {
		return errors.New("smtp configuration is incomplete")
	}

	addr := fmt.Sprintf("%s:%d", host, h.smtpPort)
	var auth smtp.Auth
	if h.smtpUser != "" {
		auth = smtp.PlainAuth("", h.smtpUser, h.smtpPass, host)
	}

	return smtp.SendMail(addr, auth, from, []string{target}, []byte(message))
}

func (h *AuthHandler) sendTwoFACodeViaResend(from, to, subject, body string) error {
	apiKey := strings.TrimSpace(h.resendAPIKey)
	if apiKey == "" {
		return errors.New("resend api key is empty")
	}
	from = strings.TrimSpace(from)
	if from == "" {
		from = "PrimeStack <no-reply@primestack.uz>"
	} else if strings.Contains(from, "@") && !strings.Contains(from, "<") {
		from = "PrimeStack <" + from + ">"
	}

	payload := map[string]interface{}{
		"from":    from,
		"to":      []string{strings.TrimSpace(to)},
		"subject": subject,
		"text":    body,
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", "https://api.resend.com/emails", bytes.NewReader(data))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("resend send failed: %s (%d)", strings.TrimSpace(string(b)), resp.StatusCode)
	}
	return nil
}

func (h *AuthHandler) completeLogin(c *gin.Context, user models.User, attemptKey string) {
	if attemptKey != "" {
		h.registerLoginSuccess(attemptKey)
	}

	_, _ = h.db.Exec(`UPDATE users SET last_login=$1 WHERE id=$2`, time.Now().UTC(), user.ID)

	token, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Token generation failed"))
		return
	}
	if err := h.setSessionCookies(c, token); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Session initialization failed"))
		return
	}

	h.recordLoginAudit(sql.NullInt64{Int64: user.ID, Valid: true}, "login", "success", c.ClientIP())

	resp := models.LoginResponse{
		ExpiresIn: h.jwtExpiry * 3600,
		User:      user,
	}
	if strings.EqualFold(strings.TrimSpace(c.GetHeader("X-Auth-Mode")), "bearer") {
		resp.Token = token
	}

	c.JSON(http.StatusOK, models.Success(resp))
}

func (h *AuthHandler) setSessionCookies(c *gin.Context, token string) error {
	csrfToken, err := randomTokenString(32)
	if err != nil {
		return err
	}

	maxAge := h.jwtExpiry * 3600
	secure := h.cookieSecure || isSecureRequest(c)
	sameSite := sameSiteMode(secure)
	cookieDomain := effectiveCookieDomain(h.cookieDomain, c.Request.Host, secure)

	authCookie := &http.Cookie{
		Name:     h.authCookieName,
		Value:    token,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	}
	csrfCookie := &http.Cookie{
		Name:     h.csrfCookieName,
		Value:    csrfToken,
		Path:     "/",
		MaxAge:   maxAge,
		HttpOnly: false,
		Secure:   secure,
		SameSite: sameSite,
	}

	if cookieDomain != "" {
		authCookie.Domain = cookieDomain
		csrfCookie.Domain = cookieDomain
	}

	http.SetCookie(c.Writer, authCookie)
	http.SetCookie(c.Writer, csrfCookie)
	return nil
}

func (h *AuthHandler) clearSessionCookies(c *gin.Context) {
	secure := h.cookieSecure || isSecureRequest(c)
	sameSite := sameSiteMode(secure)
	cookieDomain := effectiveCookieDomain(h.cookieDomain, c.Request.Host, secure)
	expiredAt := time.Unix(0, 0).UTC()

	authCookie := &http.Cookie{
		Name:     h.authCookieName,
		Value:    "",
		Path:     "/",
		Expires:  expiredAt,
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   secure,
		SameSite: sameSite,
	}
	csrfCookie := &http.Cookie{
		Name:     h.csrfCookieName,
		Value:    "",
		Path:     "/",
		Expires:  expiredAt,
		MaxAge:   -1,
		HttpOnly: false,
		Secure:   secure,
		SameSite: sameSite,
	}
	if h.cookieDomain != "" {
		authCookie.Domain = h.cookieDomain
		csrfCookie.Domain = h.cookieDomain
	} else if cookieDomain != "" {
		authCookie.Domain = cookieDomain
		csrfCookie.Domain = cookieDomain
	}

	http.SetCookie(c.Writer, authCookie)
	http.SetCookie(c.Writer, csrfCookie)
}

func (h *AuthHandler) loginAttemptKey(ip, email string) string {
	return strings.TrimSpace(ip) + "|" + strings.ToLower(strings.TrimSpace(email))
}

func (h *AuthHandler) lockRemaining(key string) time.Duration {
	h.attemptsMu.Lock()
	defer h.attemptsMu.Unlock()

	now := time.Now()
	state, exists := h.attempts[key]
	if !exists {
		return 0
	}

	if state.LastSeen.Before(now.Add(-24*time.Hour)) && !state.LockedUntil.After(now) {
		delete(h.attempts, key)
		return 0
	}

	if state.LockedUntil.After(now) {
		return time.Until(state.LockedUntil)
	}

	return 0
}

func (h *AuthHandler) registerLoginFailure(key string) {
	h.attemptsMu.Lock()
	defer h.attemptsMu.Unlock()

	now := time.Now()
	state := h.attempts[key]
	state.LastSeen = now

	if state.LockedUntil.After(now) {
		h.attempts[key] = state
		return
	}

	state.Failures++
	if state.Failures >= h.loginMaxAttempts {
		state.LockedUntil = now.Add(h.loginLockDuration)
		state.Failures = 0
	}
	h.attempts[key] = state

	if len(h.attempts) > 5000 {
		cutoff := now.Add(-24 * time.Hour)
		for k, v := range h.attempts {
			if v.LastSeen.Before(cutoff) && !v.LockedUntil.After(now) {
				delete(h.attempts, k)
			}
		}
	}
}

func (h *AuthHandler) registerLoginSuccess(key string) {
	h.attemptsMu.Lock()
	defer h.attemptsMu.Unlock()
	delete(h.attempts, key)
}

func (h *AuthHandler) recordLoginAudit(userID sql.NullInt64, action, detail, ip string) {
	var uid interface{}
	if userID.Valid {
		uid = userID.Int64
	}

	_, _ = h.db.Exec(
		`INSERT INTO audit_logs (user_id, action, resource, detail, ip, created_at)
		 VALUES ($1, $2, 'auth', $3, $4, NOW())`,
		uid, action, detail, strings.TrimSpace(ip),
	)
}

func randomTokenString(size int) (string, error) {
	if size <= 0 {
		size = 32
	}

	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func randomNumericCode(digits int) (string, error) {
	if digits <= 0 {
		digits = 6
	}

	limit := int64(1)
	for i := 0; i < digits; i++ {
		limit *= 10
	}

	n, err := rand.Int(rand.Reader, big.NewInt(limit))
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%0*d", digits, n.Int64()), nil
}

func buildPlainEmail(from, to, subject, body string) string {
	return strings.Join([]string{
		"From: " + from,
		"To: " + to,
		"Subject: " + subject,
		"MIME-Version: 1.0",
		"Content-Type: text/plain; charset=UTF-8",
		"",
		body,
	}, "\r\n")
}

func isSecureRequest(c *gin.Context) bool {
	if c.Request.TLS != nil {
		return true
	}
	return strings.EqualFold(strings.TrimSpace(c.GetHeader("X-Forwarded-Proto")), "https")
}

func sameSiteMode(secure bool) http.SameSite {
	if secure {
		return http.SameSiteNoneMode
	}
	return http.SameSiteStrictMode
}

func effectiveCookieDomain(cfgDomain, reqHost string, secure bool) string {
	cfgDomain = strings.TrimSpace(cfgDomain)
	if cfgDomain != "" {
		return cfgDomain
	}
	if !secure {
		// For non-HTTPS keep host-only cookie to avoid issues on localhost.
		return ""
	}
	host := strings.TrimSpace(reqHost)
	if host == "" {
		return ""
	}
	// Strip port if present.
	if idx := strings.Index(host, ":"); idx > 0 {
		host = host[:idx]
	}
	return host
}
