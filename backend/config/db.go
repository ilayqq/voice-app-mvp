package config

import (
	"log"
	"os"
	"voice-app/domain"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() *gorm.DB {
	dsn := os.Getenv("DATABASE_URL")
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect database: %s", err)
	}

	db.AutoMigrate(&domain.User{}, &domain.Role{}, &domain.Stock{}, &domain.StockMovement{}, &domain.Product{}, &domain.Warehouse{})

	DB = db

	return DB
}
