package router

import (
	_ "voice-app/docs"
	"voice-app/internal/auth"
	"voice-app/internal/oauth"
	"voice-app/internal/product"
	"voice-app/internal/speech"
	"voice-app/internal/user"
	"voice-app/internal/warehouse"
	"voice-app/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
)

func NewRouter(
	authHandler *auth.Handler,
	oauthHandler *oauth.Handler,
	userHandler *user.Handler,
	productHandler *product.Handler,
	warehouseHandler *warehouse.Handler,
	speechHandler *speech.Handler,
) *gin.Engine {
	r := gin.Default()

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	r.Use(cors.New(cors.Config{
		//AllowOrigins:     []string{"http://localhost:5173"},
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	auth := r.Group("/auth")
	{
		auth.POST("/login", authHandler.Login)
		auth.POST("/register", authHandler.Register)
	}
	oauthGoogle := r.Group("/oauth/google")
	{
		oauthGoogle.GET("", oauthHandler.GoogleLogin)
		oauthGoogle.GET("/callback", oauthHandler.GoogleCallback)
	}

	api := r.Group("/v1")
	api.Use(middleware.JWTAuth())
	{
		user := api.Group("/users")
		{
			user.GET("", middleware.RequireRole("owner"), userHandler.GetUsers)
			user.PATCH("", middleware.RequireRole("owner"), userHandler.UpdateUser)
		}
		product := api.Group("/products")
		{
			product.GET("", productHandler.GetAll)
			product.POST("", productHandler.AddProduct)
			product.PATCH("", productHandler.UpdateProduct)
			product.DELETE("", productHandler.DeleteProduct)
		}
		warehouse := api.Group("/warehouse")
		{
			warehouse.GET("", warehouseHandler.GetAll)
			warehouse.POST("", warehouseHandler.AddWarehouse)
		}
		voice := api.Group("/voice")
		{
			voice.POST("/upload", speechHandler.Recognize)
		}
	}

	return r
}
