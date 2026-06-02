package domain

import "time"

type Product struct {
	ID          uint      `json:"id" gorm:"primaryKey"`
	CompanyID   uint      `json:"company_id" gorm:"not null;uniqueIndex:idx_company_barcode"`
	Name        string    `json:"name" gorm:"not null"`
	Barcode     string    `json:"barcode" gorm:"not null;uniqueIndex:idx_company_barcode"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Price       float64   `json:"price" gorm:"default:0"`
	ImageURL    string    `json:"image_url"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	Stocks []Stock `json:"stocks" gorm:"foreignKey:ProductID"`
}
