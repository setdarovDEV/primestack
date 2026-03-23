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

type ContentHandler struct {
	db *sql.DB
}

func NewContentHandler(db *sql.DB) *ContentHandler {
	return &ContentHandler{db: db}
}

type projectPayload struct {
	Title      string   `json:"title"`
	Slug       string   `json:"slug"`
	Client     string   `json:"client"`
	Summary    string   `json:"summary"`
	ResultKPI  string   `json:"result_kpi"`
	TechStack  string   `json:"tech_stack"`
	Gallery    []string `json:"gallery"`
	CoverImage string   `json:"cover_image"`
	Category   string   `json:"category"`
	Year       string   `json:"year"`
	Status     string   `json:"status"`
}

type teamPayload struct {
	FullName    string `json:"full_name"`
	Position    string `json:"position"`
	Bio         string `json:"bio"`
	Photo       string `json:"photo"`
	Department  string `json:"department"`
	LinkedInURL string `json:"linkedin_url"`
	GithubURL   string `json:"github_url"`
	WebsiteURL  string `json:"website_url"`
	Order       int    `json:"order"`
	Visible     bool   `json:"visible"`
}

type blogPayload struct {
	Title      string   `json:"title"`
	Slug       string   `json:"slug"`
	Excerpt    string   `json:"excerpt"`
	Content    string   `json:"content"`
	CoverImage string   `json:"cover_image"`
	Category   string   `json:"category"`
	Tags       []string `json:"tags"`
	Author     string   `json:"author"`
	Status     string   `json:"status"`
	ReadTime   int      `json:"read_time"`
}

type vacancyPayload struct {
	Title       string `json:"title"`
	Department  string `json:"department"`
	Level       string `json:"level"`
	Location    string `json:"location"`
	Description string `json:"description"`
	ApplyURL    string `json:"apply_url"`
	Status      string `json:"status"`
}

// Projects
func (h *ContentHandler) PublicProjects(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, slug, COALESCE(client, ''), COALESCE(summary, ''), COALESCE(result_kpi, ''), COALESCE(tech_stack, ''), COALESCE(gallery, '{}'),
		        COALESCE(cover_image, ''), COALESCE(category, ''), COALESCE(year, ''), status, created_at, updated_at
		 FROM projects WHERE status='published' ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch projects"))
		return
	}
	defer rows.Close()

	projects := scanProjects(rows)
	c.JSON(http.StatusOK, models.Success(projects))
}

func (h *ContentHandler) AdminProjects(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, slug, COALESCE(client, ''), COALESCE(summary, ''), COALESCE(result_kpi, ''), COALESCE(tech_stack, ''), COALESCE(gallery, '{}'),
		        COALESCE(cover_image, ''), COALESCE(category, ''), COALESCE(year, ''), status, created_at, updated_at
		 FROM projects ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch projects"))
		return
	}
	defer rows.Close()

	projects := scanProjects(rows)
	c.JSON(http.StatusOK, models.Success(projects))
}

func (h *ContentHandler) CreateProject(c *gin.Context) {
	var req projectPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("title is required"))
		return
	}
	if strings.TrimSpace(req.Slug) == "" {
		req.Slug = slugify(req.Title)
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	now := time.Now()
	var id int64
	err := h.db.QueryRow(
		`INSERT INTO projects (title, slug, client, summary, result_kpi, tech_stack, gallery, cover_image, category, year, status, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
		req.Title, req.Slug, req.Client, req.Summary, req.ResultKPI, req.TechStack, pq.Array(req.Gallery), req.CoverImage, req.Category, req.Year, req.Status, now, now,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create project: "+err.Error()))
		return
	}

	c.JSON(http.StatusCreated, models.Success(gin.H{"id": id, "slug": req.Slug}))
}

func (h *ContentHandler) UpdateProject(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	var req projectPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.Slug) == "" {
		req.Slug = slugify(req.Title)
	}
	if req.Status == "" {
		req.Status = "draft"
	}

	_, err = h.db.Exec(
		`UPDATE projects
		 SET title=$1, slug=$2, client=$3, summary=$4, result_kpi=$5, tech_stack=$6, gallery=$7, cover_image=$8, category=$9, year=$10, status=$11, updated_at=$12
		 WHERE id=$13`,
		req.Title, req.Slug, req.Client, req.Summary, req.ResultKPI, req.TechStack, pq.Array(req.Gallery), req.CoverImage, req.Category, req.Year, req.Status, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update project: "+err.Error()))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Project updated"))
}

func (h *ContentHandler) DeleteProject(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	if _, err := h.db.Exec(`DELETE FROM projects WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete project"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Project deleted"))
}

// Team
func (h *ContentHandler) PublicTeam(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, full_name, position, COALESCE(bio, ''), COALESCE(photo, ''), COALESCE(department, ''), COALESCE(linkedin_url, ''),
		        COALESCE(github_url, ''), COALESCE(website_url, ''), "order", visible, created_at, updated_at
		 FROM team_members WHERE visible=true ORDER BY "order" ASC, created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch team members"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanTeamMembers(rows)))
}

func (h *ContentHandler) AdminTeam(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, full_name, position, COALESCE(bio, ''), COALESCE(photo, ''), COALESCE(department, ''), COALESCE(linkedin_url, ''),
		        COALESCE(github_url, ''), COALESCE(website_url, ''), "order", visible, created_at, updated_at
		 FROM team_members ORDER BY "order" ASC, created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch team members"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanTeamMembers(rows)))
}

func (h *ContentHandler) CreateTeam(c *gin.Context) {
	var req teamPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.FullName) == "" || strings.TrimSpace(req.Position) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("full_name and position are required"))
		return
	}
	now := time.Now()
	var id int64
	err := h.db.QueryRow(
		`INSERT INTO team_members (full_name, position, bio, photo, department, linkedin_url, github_url, website_url, "order", visible, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
		req.FullName, req.Position, req.Bio, req.Photo, req.Department, req.LinkedInURL, req.GithubURL, req.WebsiteURL, req.Order, req.Visible, now, now,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create team member: "+err.Error()))
		return
	}
	c.JSON(http.StatusCreated, models.Success(gin.H{"id": id}))
}

func (h *ContentHandler) UpdateTeam(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	var req teamPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	_, err = h.db.Exec(
		`UPDATE team_members
		 SET full_name=$1, position=$2, bio=$3, photo=$4, department=$5, linkedin_url=$6, github_url=$7, website_url=$8, "order"=$9, visible=$10, updated_at=$11
		 WHERE id=$12`,
		req.FullName, req.Position, req.Bio, req.Photo, req.Department, req.LinkedInURL, req.GithubURL, req.WebsiteURL, req.Order, req.Visible, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update team member: "+err.Error()))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Team member updated"))
}

func (h *ContentHandler) DeleteTeam(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	if _, err := h.db.Exec(`DELETE FROM team_members WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete team member"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Team member deleted"))
}

// Blog
func (h *ContentHandler) PublicPosts(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT p.id, p.title, p.slug, COALESCE(p.excerpt, ''), COALESCE(p.content, ''), COALESCE(p.cover_image, ''), COALESCE(cat.name, ''),
		        COALESCE(p.tags, '{}'), COALESCE(u.full_name, 'Admin'),
		        p.status, p.published_at, p.read_time, p.created_at, p.updated_at
		 FROM blog_posts p
		 LEFT JOIN categories cat ON cat.id = p.category_id
		 LEFT JOIN users u ON u.id = p.author_id
		 WHERE p.status='published'
		 ORDER BY COALESCE(p.published_at, p.created_at) DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch blog posts"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanPosts(rows)))
}

func (h *ContentHandler) AdminPosts(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT p.id, p.title, p.slug, COALESCE(p.excerpt, ''), COALESCE(p.content, ''), COALESCE(p.cover_image, ''), COALESCE(cat.name, ''),
		        COALESCE(p.tags, '{}'), COALESCE(u.full_name, 'Admin'),
		        p.status, p.published_at, p.read_time, p.created_at, p.updated_at
		 FROM blog_posts p
		 LEFT JOIN categories cat ON cat.id = p.category_id
		 LEFT JOIN users u ON u.id = p.author_id
		 ORDER BY p.created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch blog posts"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanPosts(rows)))
}

func (h *ContentHandler) CreatePost(c *gin.Context) {
	var req blogPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("title is required"))
		return
	}
	if strings.TrimSpace(req.Slug) == "" {
		req.Slug = slugify(req.Title)
	}
	if req.Status == "" {
		req.Status = "draft"
	}
	if req.ReadTime <= 0 {
		req.ReadTime = 5
	}
	catID, err := h.ensureCategory(req.Category, "blog")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to resolve blog category"))
		return
	}

	now := time.Now()
	var publishedAt interface{}
	if req.Status == "published" {
		publishedAt = now
	}

	var id int64
	err = h.db.QueryRow(
		`INSERT INTO blog_posts (title, slug, excerpt, content, cover_image, category_id, tags, author_id, status, published_at, read_time, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
		req.Title, req.Slug, req.Excerpt, req.Content, req.CoverImage, catID, pq.Array(req.Tags), 1, req.Status, publishedAt, req.ReadTime, now, now,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create post: "+err.Error()))
		return
	}
	c.JSON(http.StatusCreated, models.Success(gin.H{"id": id, "slug": req.Slug}))
}

func (h *ContentHandler) UpdatePost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	var req blogPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.Slug) == "" {
		req.Slug = slugify(req.Title)
	}
	if req.Status == "" {
		req.Status = "draft"
	}
	if req.ReadTime <= 0 {
		req.ReadTime = 5
	}
	catID, err := h.ensureCategory(req.Category, "blog")
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to resolve blog category"))
		return
	}

	var publishedAt interface{}
	if req.Status == "published" {
		publishedAt = time.Now()
	}

	_, err = h.db.Exec(
		`UPDATE blog_posts
		 SET title=$1, slug=$2, excerpt=$3, content=$4, cover_image=$5, category_id=$6, tags=$7, status=$8, published_at=COALESCE($9, published_at), read_time=$10, updated_at=$11
		 WHERE id=$12`,
		req.Title, req.Slug, req.Excerpt, req.Content, req.CoverImage, catID, pq.Array(req.Tags), req.Status, publishedAt, req.ReadTime, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update post: "+err.Error()))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Post updated"))
}

func (h *ContentHandler) DeletePost(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	if _, err := h.db.Exec(`DELETE FROM blog_posts WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete post"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Post deleted"))
}

// Vacancies
func (h *ContentHandler) PublicVacancies(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, COALESCE(department, ''), COALESCE(level, ''), COALESCE(location, ''), COALESCE(description, ''), COALESCE(apply_url, ''),
		        status, created_at, updated_at
		 FROM vacancies WHERE status='open' ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch vacancies"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanVacancies(rows)))
}

func (h *ContentHandler) AdminVacancies(c *gin.Context) {
	rows, err := h.db.Query(
		`SELECT id, title, COALESCE(department, ''), COALESCE(level, ''), COALESCE(location, ''), COALESCE(description, ''), COALESCE(apply_url, ''),
		        status, created_at, updated_at
		 FROM vacancies ORDER BY created_at DESC`,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to fetch vacancies"))
		return
	}
	defer rows.Close()
	c.JSON(http.StatusOK, models.Success(scanVacancies(rows)))
}

func (h *ContentHandler) CreateVacancy(c *gin.Context) {
	var req vacancyPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if strings.TrimSpace(req.Title) == "" {
		c.JSON(http.StatusBadRequest, models.ErrorResp("title is required"))
		return
	}
	if req.Status == "" {
		req.Status = "open"
	}
	now := time.Now()
	var id int64
	err := h.db.QueryRow(
		`INSERT INTO vacancies (title, department, level, location, description, apply_url, status, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		req.Title, req.Department, req.Level, req.Location, req.Description, req.ApplyURL, req.Status, now, now,
	).Scan(&id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to create vacancy: "+err.Error()))
		return
	}
	c.JSON(http.StatusCreated, models.Success(gin.H{"id": id}))
}

func (h *ContentHandler) UpdateVacancy(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	var req vacancyPayload
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp(err.Error()))
		return
	}
	if req.Status == "" {
		req.Status = "open"
	}
	_, err = h.db.Exec(
		`UPDATE vacancies
		 SET title=$1, department=$2, level=$3, location=$4, description=$5, apply_url=$6, status=$7, updated_at=$8
		 WHERE id=$9`,
		req.Title, req.Department, req.Level, req.Location, req.Description, req.ApplyURL, req.Status, time.Now(), id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to update vacancy: "+err.Error()))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Vacancy updated"))
}

func (h *ContentHandler) DeleteVacancy(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResp("invalid id"))
		return
	}
	if _, err := h.db.Exec(`DELETE FROM vacancies WHERE id=$1`, id); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to delete vacancy"))
		return
	}
	c.JSON(http.StatusOK, models.SuccessMsg("Vacancy deleted"))
}

// Helpers
func scanProjects(rows *sql.Rows) []models.Project {
	projects := make([]models.Project, 0)
	for rows.Next() {
		var p models.Project
		var gallery pq.StringArray
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Client, &p.Summary, &p.ResultKPI, &p.TechStack, &gallery, &p.CoverImage, &p.Category, &p.Year, &p.Status, &p.CreatedAt, &p.UpdatedAt); err == nil {
			p.Gallery = []string(gallery)
			projects = append(projects, p)
		}
	}
	return projects
}

func scanTeamMembers(rows *sql.Rows) []models.TeamMember {
	members := make([]models.TeamMember, 0)
	for rows.Next() {
		var m models.TeamMember
		if err := rows.Scan(&m.ID, &m.FullName, &m.Position, &m.Bio, &m.Photo, &m.Department, &m.LinkedInURL, &m.GithubURL, &m.WebsiteURL, &m.Order, &m.Visible, &m.CreatedAt, &m.UpdatedAt); err == nil {
			members = append(members, m)
		}
	}
	return members
}

func scanPosts(rows *sql.Rows) []models.BlogPost {
	posts := make([]models.BlogPost, 0)
	for rows.Next() {
		var p models.BlogPost
		var tags pq.StringArray
		if err := rows.Scan(&p.ID, &p.Title, &p.Slug, &p.Excerpt, &p.Content, &p.CoverImage, &p.Category, &tags, &p.Author, &p.Status, &p.PublishedAt, &p.ReadTime, &p.CreatedAt, &p.UpdatedAt); err == nil {
			p.Tags = []string(tags)
			posts = append(posts, p)
		}
	}
	return posts
}

func scanVacancies(rows *sql.Rows) []models.Vacancy {
	vacancies := make([]models.Vacancy, 0)
	for rows.Next() {
		var v models.Vacancy
		if err := rows.Scan(&v.ID, &v.Title, &v.Department, &v.Level, &v.Location, &v.Description, &v.ApplyURL, &v.Status, &v.CreatedAt, &v.UpdatedAt); err == nil {
			vacancies = append(vacancies, v)
		}
	}
	return vacancies
}

func (h *ContentHandler) ensureCategory(name, typ string) (*int64, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return nil, nil
	}
	var id int64
	err := h.db.QueryRow(`SELECT id FROM categories WHERE name=$1 AND type=$2`, name, typ).Scan(&id)
	if err == nil {
		return &id, nil
	}
	if err != sql.ErrNoRows {
		return nil, err
	}
	slug := slugify(name)
	err = h.db.QueryRow(
		`INSERT INTO categories (name, slug, type, created_at)
		 VALUES ($1, $2, $3, NOW())
		 ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name
		 RETURNING id`,
		name, slug, typ,
	).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &id, nil
}

var nonSlugChars = regexp.MustCompile(`[^a-z0-9]+`)

func slugify(v string) string {
	s := strings.ToLower(strings.TrimSpace(v))
	s = nonSlugChars.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	if s == "" {
		s = "item"
	}
	return s
}
