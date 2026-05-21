package domain

import "time"

type StockMovement struct {
	ID          uint `gorm:"primaryKey"`
	StockID     uint `gorm:"not null"`
	Stock       Stock
	Type        string `gorm:"not null"` // "incoming" | "outgoing" | "transfer"
	Quantity    int    `gorm:"not null"`
	Description string
	CreatedByID uint
	CreatedBy   User
	CreatedAt   time.Time
}
