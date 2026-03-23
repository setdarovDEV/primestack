package handlers

import (
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/primestack/backend/internal/middleware"
	"github.com/primestack/backend/internal/models"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db         *sql.DB
	jwtSecret  string
	jwtExpiry  int
	adminEmail string
	adminPass  string
}

func NewAuthHandler(db *sql.DB, jwtSecret string, jwtExpiry int, adminEmail, adminPass string) *AuthHandler {
	return &AuthHandler{db: db, jwtSecret: jwtSecret, jwtExpiry: jwtExpiry, adminEmail: adminEmail, adminPass: adminPass}
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
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}

	var user models.User
	var passwordHash string

	err := h.db.QueryRow(
		`SELECT id, full_name, email, password_hash, role_id, status FROM users WHERE email=$1 AND status='active'`,
		req.Email,
	).Scan(&user.ID, &user.FullName, &user.Email, &passwordHash, &user.RoleID, &user.Status)

	if err == sql.ErrNoRows {
		// Fallback to env admin for dev
		if req.Email == h.adminEmail && req.Password == h.adminPass {
			user = models.User{ID: 1, FullName: "Super Admin", Email: req.Email, RoleID: 1, Role: "super_admin", Status: "active"}
			token, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.ErrorResp("Token generation failed"))
				return
			}
			c.JSON(http.StatusOK, models.Success(models.LoginResponse{Token: token, ExpiresIn: h.jwtExpiry * 3600, User: user}))
			return
		}
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid credentials"))
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Database error"))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid credentials"))
		return
	}

	// Set role name
	roleMap := map[int]string{1: "super_admin", 2: "editor", 3: "hr"}
	user.Role = roleMap[user.RoleID]

	// Update last login
	_, _ = h.db.Exec(`UPDATE users SET last_login=$1 WHERE id=$2`, time.Now(), user.ID)

	token, err := middleware.GenerateToken(user, h.jwtSecret, h.jwtExpiry)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Token generation failed"))
		return
	}

	c.JSON(http.StatusOK, models.Success(models.LoginResponse{
		Token:     token,
		ExpiresIn: h.jwtExpiry * 3600,
		User:      user,
	}))
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.JSON(http.StatusOK, models.SuccessMsg("Logged out successfully"))
}

func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	email, _ := c.Get("user_email")
	role, _ := c.Get("user_role")

	c.JSON(http.StatusOK, models.Success(gin.H{
		"id":    userID,
		"email": email,
		"role":  role,
	}))
}
