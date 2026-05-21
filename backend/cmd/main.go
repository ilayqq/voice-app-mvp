package main

import (
	"log"
	"voice-app/config"
	_ "voice-app/docs"
	auth2 "voice-app/internal/auth"
	"voice-app/internal/oauth"
	"voice-app/internal/product"
	router2 "voice-app/internal/router"
	"voice-app/internal/speech"
	"voice-app/internal/user"
	"voice-app/internal/warehouse"
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
	//err := godotenv.Load(".env")
	//if err != nil {
	//	log.Fatal("Error loading .env file")
	//}

	config.InitDB()

	config.InitRedis()
	config.InitGoogleOauth()

	userRepo := user.NewRepository()
	authService := auth2.NewService(userRepo)
	authHandler := auth2.NewHandler(authService)

	oauthRepo := oauth.NewRepository(config.DB)
	oauthService := oauth.NewService(config.GoogleOauthConfig, config.DB, userRepo, oauthRepo)
	oauthHandler := oauth.NewHandler(oauthService)

	userService := user.NewService(userRepo)
	userHandler := user.NewHandler(userService)

	productRepo := product.NewRepository()
	productService := product.NewService(productRepo)
	productHandler := product.NewHandler(productService)

	warehouseRepo := warehouse.NewRepository()
	warehouseService := warehouse.NewService(warehouseRepo)
	warehouseHandler := warehouse.NewHandler(warehouseService)

	speechService := speech.NewService()
	speechHandler := speech.NewHandler(speechService)

	router := router2.NewRouter(authHandler, oauthHandler, userHandler, productHandler, warehouseHandler, speechHandler)

	if err := router.Run(":8080"); err != nil {
		log.Printf("Error starting server: %s", err)
	}
}
