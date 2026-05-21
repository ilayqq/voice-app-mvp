package domain

import "time"

type Stock struct {
	ID          uint `gorm:"primaryKey"`
	WarehouseID uint `gorm:"not null"`
	Warehouse   Warehouse
	ProductID   uint `gorm:"not null"`
	Product     Product
	Quantity    int `gorm:"not null;default:0"`
	UpdatedAt   time.Time
	CreatedAt   time.Time

	Movements []StockMovement `gorm:"foreignKey:StockID"`
}
