package handlers

import (
	"database/sql"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	"github.com/primestack/backend/internal/models"
)

type ServicesHandler struct {
	db *sql.DB
}

func NewServicesHandler(db *sql.DB) *ServicesHandler {
	return &ServicesHandler{db: db}
}

func (h *ServicesHandler) List(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, slug, short_description, full_content, icon, cover_image, "order", is_active, created_at, updated_at
		 FROM services WHERE is_active=true ORDER BY "order" ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch services"))
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.Title, &s.Slug, &s.ShortDescription, &s.FullContent, &s.Icon, &s.CoverImage, &s.Order, &s.IsActive, &s.CreatedAt, &s.UpdatedAt); err == nil {
			services = append(services, s)
		}
	}
	if services == nil {
		services = []models.Service{}
	}
	c.JSON(http.StatusOK, models.Success(services))
}

func (h *ServicesHandler) GetBySlug(c *gin.Context) {
	slug := c.Param("slug")
	var s models.Service
	err := h.db.QueryRow(
		`SELECT id, title, slug, short_description, full_content, icon, cover_image, "order", is_active, created_at, updated_at
		 FROM services WHERE slug=$1 AND is_active=true`, slug,
	).Scan(&s.ID, &s.Title, &s.Slug, &s.ShortDescription, &s.FullContent, &s.Icon, &s.CoverImage, &s.Order, &s.IsActive, &s.CreatedAt, &s.UpdatedAt)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResp("Service not found"))
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch service"))
		return
	}
	c.JSON(http.StatusOK, models.Success(s))
}

func (h *ServicesHandler) AdminList(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, slug, short_description, full_content, icon, cover_image, "order", is_active, created_at, updated_at
		 FROM services ORDER BY "order" ASC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch services"))
		return
	}
	defer rows.Close()

	var services []models.Service
	for rows.Next() {
		var s models.Service
		if err := rows.Scan(&s.ID, &s.Title, &s.Slug, &s.ShortDescription, &s.FullContent, &s.Icon, &s.CoverImage, &s.Order, &s.IsActive, &s.CreatedAt, &s.UpdatedAt); err == nil {
			services = append(services, s)
		}
	}
	if services == nil {
		services = []models.Service{}
	}
	c.JSON(http.StatusOK, models.Success(services))
}

func (h *ServicesHandler) Create(c *gin.Context) {
	var s models.Service
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(s.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("title is required"))
		return
	}
	if strings.TrimSpace(s.Slug) == "" {
		s.Slug = serviceSlugify(s.Title)
	}
	now := time.Now()
	err := h.db.QueryRow(
		`INSERT INTO services (title, slug, short_description, full_content, icon, cover_image, "order", is_active, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
		s.Title, s.Slug, s.ShortDescription, s.FullContent, s.Icon, s.CoverImage, s.Order, s.IsActive, now, now,
	).Scan(&s.ID)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			c.JSON(http.StatusConflict, models.ErrorResp("Slug allaqachon mavjud. Boshqa slug kiriting."))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create service: "+err.Error()))
		return
	}
	s.CreatedAt = now
	s.UpdatedAt = now
	c.JSON(http.StatusCreated, models.Success(s))
}

func (h *ServicesHandler) Update(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	var s models.Service
	if err := c.ShouldBindJSON(&s); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(s.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("title is required"))
		return
	}
	if strings.TrimSpace(s.Slug) == "" {
		s.Slug = serviceSlugify(s.Title)
	}
	s.ID = id
	s.UpdatedAt = time.Now()
	_, err := h.db.Exec(
		`UPDATE services SET title=$1, slug=$2, short_description=$3, full_content=$4, icon=$5, cover_image=$6, "order"=$7, is_active=$8, updated_at=$9 WHERE id=$10`,
		s.Title, s.Slug, s.ShortDescription, s.FullContent, s.Icon, s.CoverImage, s.Order, s.IsActive, s.UpdatedAt, id,
	)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok && pqErr.Code == "23505" {
			c.JSON(http.StatusConflict, models.ErrorResp("Slug allaqachon mavjud. Boshqa slug kiriting."))
			return
		}
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update service"))
		return
	}
	c.JSON(http.StatusOK, models.Success(s))
}

var serviceNonSlugChars = regexp.MustCompile(`[^a-z0-9]+`)

func serviceSlugify(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	s = serviceNonSlugChars.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		return "service"
	}
	return s
}

func (h *ServicesHandler) Delete(c *gin.Context) {
	id, _ := strconv.ParseInt(c.Param("id"), 10, 64)
	_, err := h.db.Exec(`DELETE FROM services WHERE id=$1`, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete service"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Service deleted"))
}
