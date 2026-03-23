package main

import (
	"log"
	"os"

	"github.com/joho/godotenv"
	"github.com/primestack/backend/internal/config"
	"github.com/primestack/backend/internal/server"
)

// @title           PRIMESTACK API
// @version         1.0
// @description     IT kompaniya korporativ web platforma API
// @termsOfService  https://primestack.uz/terms

// @contact.name   PRIMESTACK Support
// @contact.email  hello@primestack.uz
// @contact.url    https://primestack.uz

// @license.name  Apache 2.0
// @license.url   http://www.apache.org/licenses/LICENSE-2.0.html

// @host      localhost:8080
// @BasePath  /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	srv, err := server.New(cfg)
	if err != nil {
		log.Fatalf("Failed to initialize server: %v", err)
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 PRIMESTACK API starting on :%s", port)
	if err := srv.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
