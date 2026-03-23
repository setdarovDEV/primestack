package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/primestack/backend/internal/models"
)

type TelegramHandler struct {
	db                *sql.DB
	botToken          string
	defaultNotifyChat string
	webhookSecret     string
	httpClient        *http.Client
}

func NewTelegramHandler(db *sql.DB, botToken, defaultNotifyChat, webhookSecret string) *TelegramHandler {
	return &TelegramHandler{
		db:                db,
		botToken:          botToken,
		defaultNotifyChat: strings.TrimSpace(defaultNotifyChat),
		webhookSecret:     strings.TrimSpace(webhookSecret),
		httpClient:        &http.Client{Timeout: 8 * time.Second},
	}
}

const (
	botStepFullName    = "full_name"
	botStepCompany     = "company"
	botStepPhone       = "phone"
	botStepEmail       = "email"
	botStepProjectType = "project_type"
	botStepBudget      = "budget"
	botStepDeadline    = "deadline"
	botStepDescription = "description"
)

var (
	phonePattern = regexp.MustCompile(`^[0-9+()\- ]{7,20}$`)
	emailPattern = regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
)

type telegramUpdate struct {
	UpdateID      int64            `json:"update_id"`
	Message       *telegramMessage `json:"message"`
	EditedMessage *telegramMessage `json:"edited_message"`
}

type telegramMessage struct {
	MessageID int64        `json:"message_id"`
	Text      string       `json:"text"`
	Chat      telegramChat `json:"chat"`
	From      telegramUser `json:"from"`
}

type telegramChat struct {
	ID   int64  `json:"id"`
	Type string `json:"type"`
}

type telegramUser struct {
	ID        int64  `json:"id"`
	IsBot     bool   `json:"is_bot"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Username  string `json:"username"`
}

type telegramAPIResponse struct {
	Ok          bool   `json:"ok"`
	Description string `json:"description"`
}

type botLeadSession struct {
	ChatID      int64
	UserID      int64
	Username    string
	CurrentStep string
	Payload     map[string]string
}

func (h *TelegramHandler) Webhook(c *gin.Context) {
	if h.botToken == "" {
		c.JSON(http.StatusServiceUnavailable, models.ErrorResp("Telegram bot token is not configured"))
		return
	}
	if !h.validateWebhookSecret(c) {
		c.JSON(http.StatusUnauthorized, models.ErrorResp("Invalid webhook secret"))
		return
	}

	var update telegramUpdate
	if err := c.ShouldBindJSON(&update); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("Invalid telegram update payload"))
		return
	}

	msg := update.Message
	if msg == nil {
		msg = update.EditedMessage
	}
	if msg == nil || strings.TrimSpace(msg.Text) == "" || msg.From.IsBot {
		c.JSON(http.StatusOK, models.SuccessMsg("ignored"))
		return
	}
	if msg.Chat.Type != "" && msg.Chat.Type != "private" {
		c.JSON(http.StatusOK, models.SuccessMsg("ignored"))
		return
	}

	text := strings.TrimSpace(msg.Text)
	lower := strings.ToLower(text)

	switch {
	case strings.HasPrefix(lower, "/start"):
		_ = h.deleteSession(msg.Chat.ID)
		h.sendHelpMessage(msg.Chat.ID)
	case lower == "/id" || lower == "/myid":
		_ = h.sendTelegramMessage(msg.Chat.ID, fmt.Sprintf("Sizning Telegram ID: %d", msg.From.ID))
	case lower == "/cancel":
		_ = h.deleteSession(msg.Chat.ID)
		_ = h.sendTelegramMessage(msg.Chat.ID, "Joriy jarayon bekor qilindi. Yangi ariza uchun /loyiha buyrug'ini yuboring.")
	case lower == "/loyiha" || lower == "loyiha boshlash":
		h.startLeadSession(msg)
	case strings.HasPrefix(lower, "/admin"), strings.HasPrefix(lower, "/panel"), strings.HasPrefix(lower, "/leads"):
		h.handleBotAdminCommand(msg, lower)
	default:
		h.handleSessionInput(msg, text)
	}

	c.JSON(http.StatusOK, models.SuccessMsg("ok"))
}

func (h *TelegramHandler) AdminListLeads(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := strings.TrimSpace(c.Query("status"))

	if page < 1 {
		page = 1
	}
	if perPage < 1 {
		perPage = 20
	}
	if perPage > 200 {
		perPage = 200
	}

	offset := (page - 1) * perPage

	baseQuery := `SELECT id, telegram_user_id, telegram_chat_id, COALESCE(telegram_username, ''),
	                     full_name, COALESCE(company, ''), COALESCE(phone, ''), COALESCE(email, ''),
	                     COALESCE(project_type, ''), COALESCE(budget, ''), COALESCE(deadline, ''),
	                     description, status, source, created_at, updated_at
	              FROM bot_project_leads`
	countQuery := `SELECT COUNT(*) FROM bot_project_leads`

	args := make([]interface{}, 0, 3)
	where := ""
	if status != "" {
		where = " WHERE status=$1"
		args = append(args, status)
	}

	query := baseQuery + where + ` ORDER BY created_at DESC LIMIT $` + strconv.Itoa(len(args)+1) +
		` OFFSET $` + strconv.Itoa(len(args)+2)
	args = append(args, perPage, offset)

	rows, err := h.db.Query(query, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch bot leads"))
		return
	}
	defer rows.Close()

	leads := make([]models.BotProjectLead, 0)
	for rows.Next() {
		var lead models.BotProjectLead
		if err := rows.Scan(
			&lead.ID,
			&lead.TelegramUserID,
			&lead.TelegramChatID,
			&lead.TelegramUsername,
			&lead.FullName,
			&lead.Company,
			&lead.Phone,
			&lead.Email,
			&lead.ProjectType,
			&lead.Budget,
			&lead.Deadline,
			&lead.Description,
			&lead.Status,
			&lead.Source,
			&lead.CreatedAt,
			&lead.UpdatedAt,
		); err == nil {
			leads = append(leads, lead)
		}
	}

	var total int64
	countArgs := []interface{}{}
	if status != "" {
		countArgs = append(countArgs, status)
	}
	if err := h.db.QueryRow(countQuery+where, countArgs...).Scan(&total); err != nil {
		total = int64(len(leads))
	}
	totalPages := int(total) / perPage
	if int(total)%perPage != 0 {
		totalPages++
	}

	c.JSON(http.StatusOK, models.Success(models.PaginatedResponse{
		Data:       leads,
		Total:      total,
		Page:       page,
		PerPage:    perPage,
		TotalPages: totalPages,
	}))
}

func (h *TelegramHandler) AdminUpdateLeadStatus(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}

	newStatus := strings.TrimSpace(strings.ToLower(body.Status))
	switch newStatus {
	case "new", "contacted", "qualified", "won", "lost", "archived":
	default:
		c.JSON(http.StatusBadRequest, models.ErrorResp("Invalid status"))
		return
	}

	res, err := h.db.Exec(`UPDATE bot_project_leads SET status=$1, updated_at=NOW() WHERE id=$2`, newStatus, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update status"))
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResp("Lead not found"))
		return
	}

	c.JSON(http.StatusOK, models.SuccessMsg("Lead status updated"))
}

func (h *TelegramHandler) AdminDeleteLead(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	res, err := h.db.Exec(`DELETE FROM bot_project_leads WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete lead"))
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResp("Lead not found"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Lead deleted"))
}

func (h *TelegramHandler) AdminListTelegramAdmins(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, telegram_user_id, COALESCE(display_name, ''), COALESCE(username, ''), is_active, created_at, updated_at
		 FROM telegram_admins
		 ORDER BY created_at ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch telegram admins"))
		return
	}
	defer rows.Close()

	admins := make([]models.TelegramAdmin, 0)
	for rows.Next() {
		var a models.TelegramAdmin
		if err := rows.Scan(&a.ID, &a.TelegramUserID, &a.DisplayName, &a.Username, &a.IsActive, &a.CreatedAt, &a.UpdatedAt); err == nil {
			admins = append(admins, a)
		}
	}
	c.JSON(http.StatusOK, models.Success(admins))
}

func (h *TelegramHandler) AdminCreateTelegramAdmin(c *gin.Context) {
	var body struct {
		TelegramUserID int64  `json:"telegram_user_id" binding:"required"`
		DisplayName    string `json:"display_name"`
		Username       string `json:"username"`
		IsActive       *bool  `json:"is_active"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if body.TelegramUserID <= 0 {
		c.JSON(http.StatusBadRequest, models.ErrorResp("telegram_user_id must be positive"))
		return
	}

	isActive := true
	if body.IsActive != nil {
		isActive = *body.IsActive
	}

	if isActive {
		var activeCount int
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM telegram_admins WHERE is_active=true`).Scan(&activeCount)
		if activeCount >= 3 {
			c.JSON(http.StatusBadRequest, models.ErrorResp("Maksimal 3 ta faol telegram admin bo'lishi mumkin"))
			return
		}
	}

	var admin models.TelegramAdmin
	admin.TelegramUserID = body.TelegramUserID
	admin.DisplayName = strings.TrimSpace(body.DisplayName)
	admin.Username = strings.TrimPrefix(strings.TrimSpace(body.Username), "@")
	admin.IsActive = isActive
	admin.CreatedAt = time.Now()
	admin.UpdatedAt = admin.CreatedAt

	err := h.db.QueryRow(
		`INSERT INTO telegram_admins (telegram_user_id, display_name, username, is_active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6)
		 RETURNING id`,
		admin.TelegramUserID, admin.DisplayName, admin.Username, admin.IsActive, admin.CreatedAt, admin.UpdatedAt,
	).Scan(&admin.ID)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			c.JSON(http.StatusConflict, models.ErrorResp("Bu telegram ID allaqachon mavjud"))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create telegram admin"))
		return
	}

	c.JSON(http.StatusCreated, models.Success(admin))
}

func (h *TelegramHandler) AdminDeleteTelegramAdmin(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	res, err := h.db.Exec(`DELETE FROM telegram_admins WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete telegram admin"))
		return
	}
	affected, _ := res.RowsAffected()
	if affected == 0 {
		c.JSON(http.StatusNotFound, models.ErrorResp("Telegram admin not found"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Telegram admin deleted"))
}

func (h *TelegramHandler) validateWebhookSecret(c *gin.Context) bool {
	if h.webhookSecret == "" {
		return true
	}
	secret := strings.TrimSpace(c.Param("secret"))
	if secret == "" {
		secret = strings.TrimSpace(c.GetHeader("X-Telegram-Bot-Api-Secret-Token"))
	}
	return secret != "" && secret == h.webhookSecret
}

func (h *TelegramHandler) sendHelpMessage(chatID int64) {
	text := "Assalomu alaykum. Men PRIMESTACK loyiha qabul qiluvchi botiman.\n\n" +
		"Yangi loyiha arizasi yuborish uchun /loyiha buyrug'ini yuboring.\n" +
		"Jarayonni bekor qilish uchun /cancel buyrug'idan foydalaning."
	_ = h.sendTelegramMessage(chatID, text)
}

func (h *TelegramHandler) startLeadSession(msg *telegramMessage) {
	payload := map[string]string{}
	if err := h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepFullName, payload); err != nil {
		_ = h.sendTelegramMessage(msg.Chat.ID, "Texnik xatolik yuz berdi. Iltimos qayta urinib ko'ring.")
		return
	}
	_ = h.sendTelegramMessage(msg.Chat.ID, "Ajoyib. Loyiha uchun ariza boshladik.\n\n1/8 Ism-familiyangizni yuboring:")
}

func (h *TelegramHandler) handleBotAdminCommand(msg *telegramMessage, cmd string) {
	isAdmin, err := h.isTelegramAdmin(msg.From.ID)
	if err != nil {
		_ = h.sendTelegramMessage(msg.Chat.ID, "Xatolik yuz berdi. Keyinroq qayta urinib ko'ring.")
		return
	}
	if !isAdmin {
		_ = h.sendTelegramMessage(msg.Chat.ID, "Sizda admin ruxsati yo'q.")
		return
	}

	switch {
	case strings.HasPrefix(cmd, "/leads"):
		h.sendRecentLeads(msg.Chat.ID)
	default:
		var total int64
		var fresh int64
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM bot_project_leads`).Scan(&total)
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM bot_project_leads WHERE status='new'`).Scan(&fresh)
		text := fmt.Sprintf("Bot admin panel\n\nJami lead: %d\nYangi lead: %d\n\nSo'nggi leadlar: /leads", total, fresh)
		_ = h.sendTelegramMessage(msg.Chat.ID, text)
	}
}

func (h *TelegramHandler) sendRecentLeads(chatID int64) {
	rows, err := h.db.Query(
		`SELECT id, full_name, COALESCE(project_type, ''), status, created_at
		 FROM bot_project_leads
		 ORDER BY created_at DESC
		 LIMIT 5`,
	)
	if err != nil {
		_ = h.sendTelegramMessage(chatID, "Leadlarni olishda xatolik bo'ldi.")
		return
	}
	defer rows.Close()

	lines := []string{"So'nggi 5 ta lead:"}
	for rows.Next() {
		var id int64
		var fullName, projectType, status string
		var createdAt time.Time
		if err := rows.Scan(&id, &fullName, &projectType, &status, &createdAt); err == nil {
			if projectType == "" {
				projectType = "-"
			}
			lines = append(lines, fmt.Sprintf("#%d | %s | %s | %s", id, fullName, projectType, status))
		}
	}

	if len(lines) == 1 {
		lines = append(lines, "Hozircha lead yo'q.")
	}
	_ = h.sendTelegramMessage(chatID, strings.Join(lines, "\n"))
}

func (h *TelegramHandler) handleSessionInput(msg *telegramMessage, text string) {
	session, err := h.getSession(msg.Chat.ID)
	if err != nil {
		_ = h.sendTelegramMessage(msg.Chat.ID, "Texnik xatolik yuz berdi. Qayta urinib ko'ring.")
		return
	}
	if session == nil {
		_ = h.sendTelegramMessage(msg.Chat.ID, "Yangi loyiha arizasi uchun /loyiha buyrug'ini yuboring.")
		return
	}

	payload := session.Payload
	if payload == nil {
		payload = map[string]string{}
	}

	switch session.CurrentStep {
	case botStepFullName:
		if len([]rune(strings.TrimSpace(text))) < 2 {
			_ = h.sendTelegramMessage(msg.Chat.ID, "Ism-familiya kamida 2 ta belgidan iborat bo'lsin.")
			return
		}
		payload[botStepFullName] = strings.TrimSpace(text)
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepCompany, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "2/8 Kompaniya nomi (bo'lmasa '-' yuboring):")
	case botStepCompany:
		payload[botStepCompany] = strings.TrimSpace(text)
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepPhone, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "3/8 Telefon raqamingizni yuboring (masalan: +998901234567):")
	case botStepPhone:
		phone := strings.TrimSpace(text)
		if !phonePattern.MatchString(phone) {
			_ = h.sendTelegramMessage(msg.Chat.ID, "Telefon formati noto'g'ri. Masalan: +998901234567")
			return
		}
		payload[botStepPhone] = phone
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepEmail, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "4/8 Email manzilingizni yuboring:")
	case botStepEmail:
		email := strings.TrimSpace(text)
		if !emailPattern.MatchString(email) {
			_ = h.sendTelegramMessage(msg.Chat.ID, "Email formati noto'g'ri. Masalan: name@example.com")
			return
		}
		payload[botStepEmail] = email
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepProjectType, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "5/8 Loyiha turi (web, mobile, telegram bot, CRM va h.k.):")
	case botStepProjectType:
		payload[botStepProjectType] = strings.TrimSpace(text)
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepBudget, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "6/8 Taxminiy byudjet (masalan: 1500-3000 USD):")
	case botStepBudget:
		payload[botStepBudget] = strings.TrimSpace(text)
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepDeadline, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "7/8 Muddat (masalan: 1 oy):")
	case botStepDeadline:
		payload[botStepDeadline] = strings.TrimSpace(text)
		_ = h.saveSession(msg.Chat.ID, msg.From.ID, msg.From.Username, botStepDescription, payload)
		_ = h.sendTelegramMessage(msg.Chat.ID, "8/8 Loyiha haqida batafsil yozing:")
	case botStepDescription:
		desc := strings.TrimSpace(text)
		if len([]rune(desc)) < 10 {
			_ = h.sendTelegramMessage(msg.Chat.ID, "Iltimos, loyihani kamida 10 ta belgi bilan batafsilroq yozing.")
			return
		}
		payload[botStepDescription] = desc
		leadID, saveErr := h.saveLeadFromSession(msg, payload)
		if saveErr != nil {
			_ = h.sendTelegramMessage(msg.Chat.ID, "Arizani saqlashda xatolik bo'ldi. Iltimos qayta urinib ko'ring.")
			return
		}
		_ = h.deleteSession(msg.Chat.ID)
		_ = h.sendTelegramMessage(msg.Chat.ID, fmt.Sprintf("Rahmat. Arizangiz qabul qilindi.\nLead ID: #%d\nTez orada siz bilan bog'lanamiz.", leadID))
	default:
		_ = h.deleteSession(msg.Chat.ID)
		_ = h.sendTelegramMessage(msg.Chat.ID, "Jarayon qayta boshlandi. /loyiha buyrug'ini yuboring.")
	}
}

func (h *TelegramHandler) saveLeadFromSession(msg *telegramMessage, payload map[string]string) (int64, error) {
	now := time.Now()
	var id int64

	company := strings.TrimSpace(payload[botStepCompany])
	if company == "-" {
		company = ""
	}

	err := h.db.QueryRow(
		`INSERT INTO bot_project_leads (
			telegram_user_id, telegram_chat_id, telegram_username,
			full_name, company, phone, email, project_type, budget, deadline, description,
			status, source, created_at, updated_at
		) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'new','telegram_bot',$12,$13)
		RETURNING id`,
		msg.From.ID,
		msg.Chat.ID,
		msg.From.Username,
		payload[botStepFullName],
		company,
		payload[botStepPhone],
		payload[botStepEmail],
		payload[botStepProjectType],
		payload[botStepBudget],
		payload[botStepDeadline],
		payload[botStepDescription],
		now,
		now,
	).Scan(&id)
	if err != nil {
		return 0, err
	}

	h.notifyLeadToAdmins(id, payload, msg)
	return id, nil
}

func (h *TelegramHandler) notifyLeadToAdmins(leadID int64, payload map[string]string, msg *telegramMessage) {
	text := fmt.Sprintf(
		"🆕 Yangi Telegram lead #%d\n\n"+
			"👤 Ism: %s\n"+
			"🏢 Kompaniya: %s\n"+
			"📱 Telefon: %s\n"+
			"📧 Email: %s\n"+
			"🧩 Loyiha turi: %s\n"+
			"💰 Byudjet: %s\n"+
			"⏱ Muddat: %s\n"+
			"📝 Tavsif: %s\n"+
			"🔗 User: @%s (%d)",
		leadID,
		payload[botStepFullName],
		valueOrDash(payload[botStepCompany]),
		valueOrDash(payload[botStepPhone]),
		valueOrDash(payload[botStepEmail]),
		valueOrDash(payload[botStepProjectType]),
		valueOrDash(payload[botStepBudget]),
		valueOrDash(payload[botStepDeadline]),
		valueOrDash(payload[botStepDescription]),
		msg.From.Username,
		msg.From.ID,
	)

	targets := map[int64]struct{}{}
	if h.defaultNotifyChat != "" {
		if id, err := strconv.ParseInt(h.defaultNotifyChat, 10, 64); err == nil && id != 0 {
			targets[id] = struct{}{}
		}
	}

	rows, err := h.db.Query(`SELECT telegram_user_id FROM telegram_admins WHERE is_active=true`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var uid int64
			if scanErr := rows.Scan(&uid); scanErr == nil && uid != 0 {
				targets[uid] = struct{}{}
			}
		}
	}

	for chatID := range targets {
		_ = h.sendTelegramMessage(chatID, text)
	}
}

func valueOrDash(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return "-"
	}
	return v
}

func (h *TelegramHandler) getSession(chatID int64) (*botLeadSession, error) {
	var raw []byte
	var s botLeadSession
	s.ChatID = chatID

	err := h.db.QueryRow(
		`SELECT user_id, COALESCE(username, ''), current_step, payload
		 FROM bot_lead_sessions
		 WHERE chat_id=$1`,
		chatID,
	).Scan(&s.UserID, &s.Username, &s.CurrentStep, &raw)

	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	s.Payload = map[string]string{}
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &s.Payload)
	}
	return &s, nil
}

func (h *TelegramHandler) saveSession(chatID, userID int64, username, step string, payload map[string]string) error {
	if payload == nil {
		payload = map[string]string{}
	}
	blob, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	_, err = h.db.Exec(
		`INSERT INTO bot_lead_sessions (chat_id, user_id, username, current_step, payload, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7)
		 ON CONFLICT (chat_id) DO UPDATE SET
		   user_id=EXCLUDED.user_id,
		   username=EXCLUDED.username,
		   current_step=EXCLUDED.current_step,
		   payload=EXCLUDED.payload,
		   updated_at=EXCLUDED.updated_at`,
		chatID, userID, strings.TrimSpace(username), step, blob, time.Now(), time.Now(),
	)
	return err
}

func (h *TelegramHandler) deleteSession(chatID int64) error {
	_, err := h.db.Exec(`DELETE FROM bot_lead_sessions WHERE chat_id=$1`, chatID)
	return err
}

func (h *TelegramHandler) isTelegramAdmin(userID int64) (bool, error) {
	var exists bool
	err := h.db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM telegram_admins WHERE telegram_user_id=$1 AND is_active=true)`,
		userID,
	).Scan(&exists)
	return exists, err
}

func (h *TelegramHandler) sendTelegramMessage(chatID int64, text string) error {
	if h.botToken == "" || chatID == 0 {
		return nil
	}
	payload := map[string]interface{}{
		"chat_id": chatID,
		"text":    text,
	}
	blob, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/sendMessage", h.botToken),
		bytes.NewReader(blob),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("telegram send message returned status: %d", resp.StatusCode)
	}
	return nil
}

func (h *TelegramHandler) EnsureWebhook(baseURL string) error {
	if h.botToken == "" {
		return nil
	}

	base := strings.TrimRight(strings.TrimSpace(baseURL), "/")
	if base == "" {
		return nil
	}

	payload := map[string]interface{}{
		"url": base + "/api/v1/telegram/webhook",
	}
	if h.webhookSecret != "" {
		payload["secret_token"] = h.webhookSecret
	}
	blob, _ := json.Marshal(payload)

	req, err := http.NewRequest(http.MethodPost,
		fmt.Sprintf("https://api.telegram.org/bot%s/setWebhook", h.botToken),
		bytes.NewReader(blob),
	)
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := h.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("telegram setWebhook returned status: %d", resp.StatusCode)
	}

	var tgResp telegramAPIResponse
	if err := json.NewDecoder(resp.Body).Decode(&tgResp); err != nil {
		return nil
	}
	if !tgResp.Ok {
		return fmt.Errorf("telegram setWebhook failed: %s", tgResp.Description)
	}
	return nil
}
