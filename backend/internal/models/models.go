package models

import (
	"database/sql"
	"log"
	"time"

	_ "github.com/lib/pq"
)

func NewDB(databaseURL string) *sql.DB {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		log.Printf("Warning: database not available: %v", err)
	} else {
		log.Println("✅ Database connected")
	}

	return db
}

// ─── Models ───────────────────────────────────────────────────

type User struct {
	ID           int64      `json:"id"`
	FullName     string     `json:"full_name"`
	Email        string     `json:"email"`
	PasswordHash string     `json:"-"`
	RoleID       int        `json:"role_id"`
	Role         string     `json:"role,omitempty"`
	Status       string     `json:"status"`
	LastLogin    *time.Time `json:"last_login,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type Service struct {
	ID               int64     `json:"id"`
	Title            string    `json:"title"`
	Slug             string    `json:"slug"`
	ShortDescription string    `json:"short_description"`
	FullContent      string    `json:"full_content,omitempty"`
	Icon             string    `json:"icon"`
	CoverImage       string    `json:"cover_image"`
	Order            int       `json:"order"`
	IsActive         bool      `json:"is_active"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type Project struct {
	ID         int64     `json:"id"`
	Title      string    `json:"title"`
	Slug       string    `json:"slug"`
	Client     string    `json:"client"`
	Summary    string    `json:"summary"`
	ResultKPI  string    `json:"result_kpi"`
	TechStack  string    `json:"tech_stack"`
	Gallery    []string  `json:"gallery"`
	CoverImage string    `json:"cover_image"`
	Category   string    `json:"category"`
	Year       string    `json:"year"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type TeamMember struct {
	ID          int64             `json:"id"`
	FullName    string            `json:"full_name"`
	Position    string            `json:"position"`
	Bio         string            `json:"bio"`
	Photo       string            `json:"photo"`
	Department  string            `json:"department"`
	LinkedInURL string            `json:"linkedin_url,omitempty"`
	GithubURL   string            `json:"github_url,omitempty"`
	WebsiteURL  string            `json:"website_url,omitempty"`
	Socials     map[string]string `json:"socials,omitempty"`
	Order       int               `json:"order"`
	Visible     bool              `json:"visible"`
	CreatedAt   time.Time         `json:"created_at"`
	UpdatedAt   time.Time         `json:"updated_at"`
}

type BlogPost struct {
	ID          int64      `json:"id"`
	Title       string     `json:"title"`
	Slug        string     `json:"slug"`
	Excerpt     string     `json:"excerpt"`
	Content     string     `json:"content,omitempty"`
	CoverImage  string     `json:"cover_image"`
	CategoryID  *int64     `json:"category_id,omitempty"`
	Category    string     `json:"category,omitempty"`
	Tags        []string   `json:"tags"`
	Author      string     `json:"author"`
	Status      string     `json:"status"` // draft | published | scheduled
	PublishedAt *time.Time `json:"published_at,omitempty"`
	ReadTime    int        `json:"read_time"` // minutes
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

type Vacancy struct {
	ID          int64     `json:"id"`
	Title       string    `json:"title"`
	Department  string    `json:"department"`
	Level       string    `json:"level"`
	Location    string    `json:"location"`
	Description string    `json:"description"`
	ApplyURL    string    `json:"apply_url"`
	Status      string    `json:"status"` // open | closed
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ContactMessage struct {
	ID         int64     `json:"id"`
	Name       string    `json:"name"`
	Company    string    `json:"company"`
	Phone      string    `json:"phone"`
	Email      string    `json:"email"`
	Message    string    `json:"message"`
	SourcePage string    `json:"source_page"`
	Status     string    `json:"status"` // new | read | replied
	CreatedAt  time.Time `json:"created_at"`
}

type BotProjectLead struct {
	ID               int64     `json:"id"`
	TelegramUserID   int64     `json:"telegram_user_id"`
	TelegramChatID   int64     `json:"telegram_chat_id"`
	TelegramUsername string    `json:"telegram_username"`
	FullName         string    `json:"full_name"`
	Company          string    `json:"company"`
	Phone            string    `json:"phone"`
	Email            string    `json:"email"`
	ProjectType      string    `json:"project_type"`
	Budget           string    `json:"budget"`
	Deadline         string    `json:"deadline"`
	Description      string    `json:"description"`
	Status           string    `json:"status"`
	Source           string    `json:"source"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

type TelegramAdmin struct {
	ID             int64     `json:"id"`
	TelegramUserID int64     `json:"telegram_user_id"`
	DisplayName    string    `json:"display_name"`
	Username       string    `json:"username"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type MediaFile struct {
	ID         int64     `json:"id"`
	FileName   string    `json:"file_name"`
	MimeType   string    `json:"mime_type"`
	Size       int64     `json:"size"`
	StorageKey string    `json:"storage_key"`
	URL        string    `json:"url"`
	AltText    string    `json:"alt_text"`
	UploadedBy int64     `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type SiteSetting struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AuditLog struct {
	ID         int64     `json:"id"`
	UserID     int64     `json:"user_id"`
	UserName   string    `json:"user_name,omitempty"`
	Action     string    `json:"action"`
	Resource   string    `json:"resource"`
	ResourceID string    `json:"resource_id"`
	Detail     string    `json:"detail"`
	IP         string    `json:"ip"`
	CreatedAt  time.Time `json:"created_at"`
}

type Page struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Body      string    `json:"body"`
	Status    string    `json:"status"`
	SEOMeta   *SEOMeta  `json:"seo_meta,omitempty"`
	Order     int       `json:"order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type SEOMeta struct {
	ID          int64  `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	OGImage     string `json:"og_image"`
	Canonical   string `json:"canonical"`
	Keywords    string `json:"keywords"`
}

// ─── Request / Response ───────────────────────────────────────

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginResponse struct {
	Token     string `json:"token,omitempty"`
	ExpiresIn int    `json:"expires_in"`
	User      User   `json:"user"`
}

type TwoFAChallengeResponse struct {
	ChallengeID string `json:"challenge_id"`
	ExpiresIn   int    `json:"expires_in"`
}

type VerifyTwoFARequest struct {
	ChallengeID string `json:"challenge_id" binding:"required"`
	Code        string `json:"code" binding:"required"`
}

type ContactRequest struct {
	Name       string `json:"name" binding:"required"`
	Company    string `json:"company"`
	Phone      string `json:"phone"`
	Email      string `json:"email" binding:"required,email"`
	Message    string `json:"message" binding:"required,min=10"`
	SourcePage string `json:"source_page"`
}

type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PerPage    int         `json:"per_page"`
	TotalPages int         `json:"total_pages"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func Success(data interface{}) APIResponse {
	return APIResponse{Success: true, Data: data}
}

func SuccessMsg(msg string) APIResponse {
	return APIResponse{Success: true, Message: msg}
}

func ErrorResp(err string) APIResponse {
	return APIResponse{Success: false, Error: err}
}
