package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/primestack/backend/internal/models"
)

type ContactHandler struct {
	db             *sql.DB
	telegramToken  string
	telegramChatID string
}

func NewContactHandler(db *sql.DB, telegramToken, telegramChatID string) *ContactHandler {
	return &ContactHandler{db: db, telegramToken: telegramToken, telegramChatID: telegramChatID}
}

// Submit godoc
// @Summary Submit contact form
// @Tags contact
// @Accept json
// @Produce json
// @Param body body models.ContactRequest true "Contact form data"
// @Success 201 {object} models.APIResponse
// @Router /contact [post]
func (h *ContactHandler) Submit(c *gin.Context) {
	var req models.ContactRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}

	var id int64
	err := h.db.QueryRow(
		`INSERT INTO contact_messages (name, company, phone, email, message, source_page, status, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,'new',$7) RETURNING id`,
		req.Name, req.Company, req.Phone, req.Email, req.Message, req.SourcePage, time.Now(),
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to save message"))
		return
	}

	// Send Telegram notification (non-blocking)
	if h.telegramToken != "" && h.telegramChatID != "" {
		go h.sendTelegramNotification(req)
	}

	c.JSON(http.StatusCreated, models.Success(gin.H{"id": id, "message": "Message received successfully"}))
}

func (h *ContactHandler) sendTelegramNotification(req models.ContactRequest) {
	text := fmt.Sprintf(
		"📬 *Yangi murojaat!*\n\n"+
			"👤 *Ism:* %s\n"+
			"🏢 *Kompaniya:* %s\n"+
			"📧 *Email:* %s\n"+
			"📱 *Telefon:* %s\n"+
			"📝 *Xabar:* %s\n"+
			"🌐 *Sahifa:* %s",
		req.Name, req.Company, req.Email, req.Phone, req.Message, req.SourcePage,
	)
	_ = text // In production: call Telegram Bot API
}

func (h *ContactHandler) AdminList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * perPage

	query := `SELECT id, name, company, phone, email, message, source_page, status, created_at FROM contact_messages`
	countQuery := `SELECT COUNT(*) FROM contact_messages`
	var args []interface{}

	if status != "" {
		query += ` WHERE status=$1`
		countQuery += ` WHERE status=$1`
		args = append(args, status)
	}
	query += ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(len(args)+1) + ` OFFSET $` + strconv.Itoa(len(args)+2)
	args = append(args, perPage, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusOK, models.Success(models.PaginatedResponse{Data: []models.ContactMessage{}, Total: 0, Page: page, PerPage: perPage, TotalPages: 0}))
		return
	}
	defer rows.Close()

	var messages []models.ContactMessage
	for rows.Next() {
		var m models.ContactMessage
		if err := rows.Scan(&m.ID, &m.Name, &m.Company, &m.Phone, &m.Email, &m.Message, &m.SourcePage, &m.Status, &m.CreatedAt); err == nil {
			messages = append(messages, m)
		}
	}
	if messages == nil {
		messages = []models.ContactMessage{}
	}

	var total int64
	_ = h.db.QueryRow(countQuery, args[:len(args)-2]...).Scan(&total)
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.Success(models.PaginatedResponse{
		Data: messages, Total: total, Page: page, PerPage: perPage, TotalPages: totalPages,
	}))
}

func (h *ContactHandler) UpdateStatus(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	_, err := h.db.Exec(`UPDATE contact_messages SET status=$1 WHERE id=$2`, body.Status, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update status"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Status updated"))
}

func (h *ContactHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	_, _ = h.db.Exec(`DELETE FROM contact_messages WHERE id=$1`, id)
	c.JSON(http.StatusOK, models.SuccessMsg("Message deleted"))
}
