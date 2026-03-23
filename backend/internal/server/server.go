package server

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/primestack/backend/internal/config"
	"github.com/primestack/backend/internal/handlers"
	"github.com/primestack/backend/internal/middleware"
	"github.com/primestack/backend/internal/models"
)

type Server struct {
	router *gin.Engine
	db     *sql.DB
	cfg    *config.Config
}

func New(cfg *config.Config) (*Server, error) {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.SecurityHeaders())
	r.Use(middleware.RateLimitMiddleware())

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// DB
	db := models.NewDB(cfg.DatabaseURL)
	if err := models.RunSQLFile(db, "migrations/001_init.sql"); err != nil {
		return nil, fmt.Errorf("run migrations: %w", err)
	}

	// Handlers
	authH := handlers.NewAuthHandler(db, cfg.JWTSecret, cfg.JWTExpiry, cfg.AdminEmail, cfg.AdminPassword)
	servicesH := handlers.NewServicesHandler(db)
	contactH := handlers.NewContactHandler(db, cfg.TelegramToken, cfg.TelegramChatID)
	contentH := handlers.NewContentHandler(db)
	telegramH := handlers.NewTelegramHandler(db, cfg.TelegramToken, cfg.TelegramChatID, cfg.TelegramWebhookSecret)

	// Generic public handler
	notFound := func(c *gin.Context) {
		c.JSON(http.StatusNotFound, models.ErrorResp("Not found"))
	}

	// ─── Health ──────────────────────────────────────────────
	r.GET("/health", func(c *gin.Context) {
		dbStatus := "connected"
		if err := db.Ping(); err != nil {
			dbStatus = "disconnected"
		}
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"db":      dbStatus,
			"version": "1.0.0",
			"env":     cfg.AppEnv,
		})
	})

	// ─── API v1 ───────────────────────────────────────────────
	v1 := r.Group("/api/v1")

	// Auth
	auth := v1.Group("/auth")
	auth.POST("/login", authH.Login)
	auth.POST("/logout", authH.Logout)

	// Public
	public := v1.Group("")

	public.GET("/settings", func(c *gin.Context) {
		result := gin.H{
			"site_name":       "PRIMESTACK",
			"tagline":         "Premium IT Solutions",
			"email":           "hello@primestack.uz",
			"phone":           "+998 90 000 00 00",
			"address":         "Toshkent, Uzbekistan",
			"footer_text":     "© PRIMESTACK. Barcha huquqlar himoyalangan.",
			"twitter":         "",
			"linkedin":        "",
			"github":          "",
			"instagram":       "",
			"youtube":         "",
			"telegram_notify": "@Primestackuz",
		}

		rows, err := db.Query("SELECT key, value FROM site_settings")
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var k, v string
				if scanErr := rows.Scan(&k, &v); scanErr == nil {
					result[k] = v
				}
			}
		}

		c.JSON(http.StatusOK, models.Success(result))
	})

	public.GET("/services", servicesH.List)
	public.GET("/services/:slug", servicesH.GetBySlug)

	public.GET("/projects", contentH.PublicProjects)
	public.GET("/projects/:slug", notFound)

	public.GET("/team", contentH.PublicTeam)

	public.GET("/blog", contentH.PublicPosts)
	public.GET("/blog/:slug", notFound)

	public.GET("/vacancies", contentH.PublicVacancies)

	public.POST("/contact", contactH.Submit)
	public.POST("/telegram/webhook", telegramH.Webhook)
	public.POST("/telegram/webhook/:secret", telegramH.Webhook)

	public.GET("/pages/:slug", func(c *gin.Context) {
		c.JSON(http.StatusOK, models.Success(gin.H{
			"slug":  c.Param("slug"),
			"title": "Page",
			"body":  "",
		}))
	})

	// ─── Admin ────────────────────────────────────────────────
	admin := v1.Group("/admin")
	admin.Use(middleware.AuthMiddleware(cfg.JWTSecret))

	admin.GET("/me", authH.Me)

	admin.GET("/dashboard", func(c *gin.Context) {
		count := func(query string, args ...interface{}) int64 {
			var v int64
			if err := db.QueryRow(query, args...).Scan(&v); err != nil {
				return 0
			}
			return v
		}

		messagesCount := count(`SELECT COUNT(*) FROM contact_messages`)
		messagesThisWeek := count(`SELECT COUNT(*) FROM contact_messages WHERE created_at >= NOW() - INTERVAL '7 days'`)
		newMessagesCount := count(`SELECT COUNT(*) FROM contact_messages WHERE status = 'new'`)

		projectsCount := count(`SELECT COUNT(*) FROM projects`)
		projectsThisMonth := count(`SELECT COUNT(*) FROM projects WHERE created_at >= DATE_TRUNC('month', NOW())`)

		teamCount := count(`SELECT COUNT(*) FROM team_members`)
		teamThisMonth := count(`SELECT COUNT(*) FROM team_members WHERE created_at >= DATE_TRUNC('month', NOW())`)

		vacanciesOpenCount := count(`SELECT COUNT(*) FROM vacancies WHERE status = 'open'`)
		vacanciesCount := count(`SELECT COUNT(*) FROM vacancies`)

		recentMessages := []gin.H{}
		rows, err := db.Query(
			`SELECT id, COALESCE(name, ''), COALESCE(company, ''), COALESCE(message, ''), COALESCE(status, 'new'), COALESCE(source_page, ''), created_at
			 FROM contact_messages
			 ORDER BY created_at DESC
			 LIMIT 8`,
		)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var (
					id         int64
					name       string
					company    string
					message    string
					status     string
					sourcePage string
					createdAt  time.Time
				)
				if scanErr := rows.Scan(&id, &name, &company, &message, &status, &sourcePage, &createdAt); scanErr == nil {
					recentMessages = append(recentMessages, gin.H{
						"id":          id,
						"name":        name,
						"company":     company,
						"message":     message,
						"status":      status,
						"source_page": sourcePage,
						"created_at":  createdAt,
					})
				}
			}
		}

		dbStatus := "OK"
		if err := db.Ping(); err != nil {
			dbStatus = "ERROR"
		}

		c.JSON(http.StatusOK, models.Success(gin.H{
			"messages_count":       messagesCount,
			"messages_this_week":   messagesThisWeek,
			"new_messages_count":   newMessagesCount,
			"projects_count":       projectsCount,
			"projects_this_month":  projectsThisMonth,
			"team_count":           teamCount,
			"team_this_month":      teamThisMonth,
			"vacancies_open_count": vacanciesOpenCount,
			"vacancies_count":      vacanciesCount,
			"recent_messages":      recentMessages,
			"system_status": gin.H{
				"api":      "OK",
				"database": dbStatus,
				"storage":  "OK",
				"cdn":      "OK",
			},
		}))
	})

	// Admin services
	adminServices := admin.Group("/services")
	adminServices.Use(middleware.RoleMiddleware("super_admin", "editor"))
	adminServices.GET("", servicesH.AdminList)
	adminServices.POST("", servicesH.Create)
	adminServices.PUT("/:id", servicesH.Update)
	adminServices.DELETE("/:id", servicesH.Delete)

	// Admin projects
	admin.GET("/projects", middleware.RoleMiddleware("super_admin", "editor"), contentH.AdminProjects)
	admin.POST("/projects", middleware.RoleMiddleware("super_admin", "editor"), contentH.CreateProject)
	admin.PUT("/projects/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.UpdateProject)
	admin.DELETE("/projects/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.DeleteProject)

	// Admin team
	admin.GET("/team", middleware.RoleMiddleware("super_admin", "editor"), contentH.AdminTeam)
	admin.POST("/team", middleware.RoleMiddleware("super_admin", "editor"), contentH.CreateTeam)
	admin.PUT("/team/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.UpdateTeam)
	admin.DELETE("/team/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.DeleteTeam)

	// Admin blog
	admin.GET("/posts", middleware.RoleMiddleware("super_admin", "editor"), contentH.AdminPosts)
	admin.POST("/posts", middleware.RoleMiddleware("super_admin", "editor"), contentH.CreatePost)
	admin.PUT("/posts/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.UpdatePost)
	admin.DELETE("/posts/:id", middleware.RoleMiddleware("super_admin", "editor"), contentH.DeletePost)

	// Admin vacancies
	admin.GET("/vacancies", middleware.RoleMiddleware("super_admin", "editor", "hr"), contentH.AdminVacancies)
	admin.POST("/vacancies", middleware.RoleMiddleware("super_admin", "editor", "hr"), contentH.CreateVacancy)
	admin.PUT("/vacancies/:id", middleware.RoleMiddleware("super_admin", "editor", "hr"), contentH.UpdateVacancy)
	admin.DELETE("/vacancies/:id", middleware.RoleMiddleware("super_admin", "editor", "hr"), contentH.DeleteVacancy)

	// Admin messages
	admin.GET("/messages", contactH.AdminList)
	admin.PATCH("/messages/:id/status", contactH.UpdateStatus)
	admin.DELETE("/messages/:id", contactH.Delete)

	// Admin telegram bot leads
	admin.GET("/bot-leads", middleware.RoleMiddleware("super_admin", "editor"), telegramH.AdminListLeads)
	admin.PATCH("/bot-leads/:id/status", middleware.RoleMiddleware("super_admin", "editor"), telegramH.AdminUpdateLeadStatus)
	admin.DELETE("/bot-leads/:id", middleware.RoleMiddleware("super_admin"), telegramH.AdminDeleteLead)

	// Admin telegram bot users (max 3 active)
	admin.GET("/telegram-admins", middleware.RoleMiddleware("super_admin"), telegramH.AdminListTelegramAdmins)
	admin.POST("/telegram-admins", middleware.RoleMiddleware("super_admin"), telegramH.AdminCreateTelegramAdmin)
	admin.DELETE("/telegram-admins/:id", middleware.RoleMiddleware("super_admin"), telegramH.AdminDeleteTelegramAdmin)

	// Admin media upload
	admin.POST("/media/upload", func(c *gin.Context) {
		c.JSON(http.StatusOK, models.Success(gin.H{
			"url":  "https://cdn.primestack.uz/media/placeholder.jpg",
			"key":  "placeholder.jpg",
			"size": 0,
		}))
	})
	admin.GET("/media", func(c *gin.Context) { c.JSON(http.StatusOK, models.Success([]gin.H{})) })
	admin.DELETE("/media/:id", func(c *gin.Context) { c.JSON(http.StatusOK, models.SuccessMsg("Media deleted")) })

	// Admin settings
	admin.GET("/settings", func(c *gin.Context) {
		rows, err := db.Query("SELECT key, value FROM site_settings")
		if err != nil {
			c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to load settings"))
			return
		}
		defer rows.Close()
		result := gin.H{}
		for rows.Next() {
			var k, v string
			if err := rows.Scan(&k, &v); err == nil {
				result[k] = v
			}
		}
		c.JSON(http.StatusOK, models.Success(result))
	})
	admin.PUT("/settings", func(c *gin.Context) {
		var body map[string]string
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(http.StatusBadRequest, models.ErrorResp("Invalid JSON"))
			return
		}
		for k, v := range body {
			_, err := db.Exec(
				`INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, NOW())
				 ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, k, v)
			if err != nil {
				c.JSON(http.StatusInternalServerError, models.ErrorResp("Failed to save setting: "+k))
				return
			}
		}
		c.JSON(http.StatusOK, models.SuccessMsg("Settings saved"))
	})

	// Admin users (super_admin only)
	adminUsers := admin.Group("/users")
	adminUsers.Use(middleware.RoleMiddleware("super_admin"))
	adminUsers.GET("", func(c *gin.Context) { c.JSON(http.StatusOK, models.Success([]gin.H{})) })
	adminUsers.POST("", func(c *gin.Context) { c.JSON(http.StatusCreated, models.SuccessMsg("User created")) })
	adminUsers.DELETE("/:id", func(c *gin.Context) { c.JSON(http.StatusOK, models.SuccessMsg("User deleted")) })

	// Admin audit log
	admin.GET("/audit-log", middleware.RoleMiddleware("super_admin"), func(c *gin.Context) {
		c.JSON(http.StatusOK, models.Success([]gin.H{}))
	})

	// Sitemap
	r.GET("/sitemap.xml", func(c *gin.Context) {
		c.Data(http.StatusOK, "application/xml", []byte(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://primestack.uz/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>https://primestack.uz/about</loc><changefreq>monthly</changefreq><priority>0.8</priority></url>
  <url><loc>https://primestack.uz/services</loc><changefreq>weekly</changefreq><priority>0.9</priority></url>
  <url><loc>https://primestack.uz/projects</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://primestack.uz/team</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
  <url><loc>https://primestack.uz/blog</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>https://primestack.uz/careers</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>
  <url><loc>https://primestack.uz/contact</loc><changefreq>monthly</changefreq><priority>0.7</priority></url>
</urlset>`))
	})

	r.GET("/robots.txt", func(c *gin.Context) {
		c.Data(http.StatusOK, "text/plain", []byte("User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: https://primestack.uz/sitemap.xml\n"))
	})

	// 404
	r.NoRoute(func(c *gin.Context) {
		c.JSON(http.StatusNotFound, models.ErrorResp("Route not found"))
	})

	return &Server{router: r, db: db, cfg: cfg}, nil
}

func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}
