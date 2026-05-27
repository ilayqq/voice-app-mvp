package domain

import "time"

type Stock struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	WarehouseID uint      `gorm:"not null" json:"warehouseID"`
	Warehouse   Warehouse `json:"-"`
	ProductID   uint      `gorm:"not null" json:"productID"`
	Product     Product   `json:"-"`
	Quantity    int       `gorm:"not null;default:0" json:"quantity"`
	UpdatedAt   time.Time `json:"updatedAt"`
	CreatedAt   time.Time `json:"createdAt"`

	Movements []StockMovement `gorm:"foreignKey:StockID" json:"-"`
}
