package router

import (
	_ "voice-app/docs"
	"voice-app/internal/analytics"
	"voice-app/internal/auth"
	"voice-app/internal/company"
	"voice-app/internal/oauth"
	"voice-app/internal/product"
	"voice-app/internal/speech"
	"voice-app/internal/stockmovement"
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
	stockMovementHandler *stockmovement.Handler,
	companyHandler *company.Handler,
	analyticsHandler *analytics.Handler,
) *gin.Engine {
	r := gin.Default()

	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.Static("/uploads", "./uploads")

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: false,
	}))

	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", authHandler.Login)
		authGroup.POST("/register", authHandler.Register)
	}
	oauthGoogle := r.Group("/oauth/google")
	{
		oauthGoogle.GET("", oauthHandler.GoogleLogin)
		oauthGoogle.GET("/callback", oauthHandler.GoogleCallback)
	}

	api := r.Group("/v1")
	api.Use(middleware.JWTAuth())
	{
		userGroup := api.Group("/users")
		{
			userGroup.GET("", userHandler.GetUsers)
			userGroup.PATCH("", userHandler.UpdateUser)
			userGroup.PATCH("/password", userHandler.ChangePassword)
		}

		companyGroup := api.Group("/company")
		companyGroup.Use(middleware.RequireCompany())
		{
			companyGroup.GET("/me", companyHandler.GetMyCompany)
			employees := companyGroup.Group("/employees")
			employees.Use(middleware.RequireCompanyRole("owner"))
			{
				employees.GET("", companyHandler.ListEmployees)
				employees.POST("", companyHandler.AddEmployee)
				employees.PATCH("/:id", companyHandler.UpdateEmployeeRole)
				employees.DELETE("/:id", companyHandler.RemoveEmployee)
			}
		}

		protected := api.Group("")
		protected.Use(middleware.RequireCompany())
		{
			productGroup := protected.Group("/products")
			{
				productGroup.GET("", productHandler.GetAll)
				productGroup.POST("", productHandler.AddProduct)
				productGroup.POST("/upload-image", productHandler.UploadImage)
				productGroup.PATCH("", productHandler.UpdateProduct)
				productGroup.DELETE("", productHandler.DeleteProduct)
			}
			warehouseGroup := protected.Group("/warehouse")
			{
				warehouseGroup.GET("", warehouseHandler.GetAll)
				warehouseGroup.POST("", warehouseHandler.AddWarehouse)
			}
			movements := protected.Group("/stock-movements")
			{
				movements.GET("", stockMovementHandler.GetAll)
				movements.POST("", stockMovementHandler.Create)
			}
			voice := protected.Group("/voice")
			{
				voice.POST("/upload", speechHandler.Recognize)
			}
			analyticsGroup := protected.Group("/analytics")
			{
				analyticsGroup.GET("/summary", analyticsHandler.GetSummary)
			}
		}
	}

	return r
}
