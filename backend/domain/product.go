package domain

import "time"

type Product struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Barcode     string    `json:"barcode" gorm:"unique;not null"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	Stocks []Stock `json:"stocks" gorm:"foreignKey:ProductID"`
}
