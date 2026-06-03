package main

import (
	"log"
	"os"
	"voice-app/config"
	_ "voice-app/docs"
	"voice-app/internal/analytics"
	auth2 "voice-app/internal/auth"
	"voice-app/internal/company"
	"voice-app/internal/oauth"
	"voice-app/internal/product"
	router2 "voice-app/internal/router"
	"voice-app/internal/speech"
	"voice-app/internal/stockmovement"
	"voice-app/internal/user"
	"voice-app/internal/warehouse"

	"github.com/joho/godotenv"
)

//	@title			Voice-app API
//	@version		1.0
//	@description	Description
//	@host			sam.x64.kz
//  @schemes 		https

// @securityDefinitions.apikey	BearerAuth
// @in							header
// @name						Authorization
func main() {
	if err := godotenv.Load(".env"); err != nil {
		log.Println("Warning: .env file not found, using system env vars")
	}

	if err := os.MkdirAll("uploads/products", 0755); err != nil {
		log.Fatalf("Failed to create uploads dir: %s", err)
	}

	config.InitDB()
	config.InitRedis()
	config.InitGoogleOauth()

	userRepo := user.NewRepository()
	companyRepo := company.NewRepository()
	companyService := company.NewService(companyRepo, userRepo)
	companyHandler := company.NewHandler(companyService)

	authService := auth2.NewService(userRepo, companyService)
	authHandler := auth2.NewHandler(authService)

	oauthRepo := oauth.NewRepository(config.DB)
	oauthService := oauth.NewService(config.GoogleOauthConfig, config.DB, userRepo, oauthRepo, companyService)
	oauthHandler := oauth.NewHandler(oauthService)

	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	productRepo := product.NewRepository()
	productService := product.NewService(productRepo)
	productHandler := product.NewHandler(productService)

	warehouseRepo := warehouse.NewRepository()
	warehouseService := warehouse.NewService(warehouseRepo)
	warehouseHandler := warehouse.NewHandler(warehouseService)

	stockMovementRepo := stockmovement.NewRepository()
	stockMovementService := stockmovement.NewService(stockMovementRepo)
	stockMovementHandler := stockmovement.NewHandler(stockMovementService)

	speechService := speech.NewService(productService, stockMovementService)
	speechHandler := speech.NewHandler(speechService)

	analyticsRepo := analytics.NewRepository()
	analyticsService := analytics.NewService(analyticsRepo)
	analyticsHandler := analytics.NewHandler(analyticsService)

	router := router2.NewRouter(
		authHandler,
		oauthHandler,
		userHandler,
		productHandler,
		warehouseHandler,
		speechHandler,
		stockMovementHandler,
		companyHandler,
		analyticsHandler,
	)

	if err := router.Run(":8080"); err != nil {
		log.Printf("Error starting server: %s", err)
	}
}
