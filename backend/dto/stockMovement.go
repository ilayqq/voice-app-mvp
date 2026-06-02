package dto

import "time"

type StockMovementRequest struct {
	ProductID   uint   `json:"product_id" binding:"required"`
	WarehouseID uint   `json:"warehouse_id"`
	Type        string `json:"type" binding:"required,oneof=incoming outgoing"`
	Quantity    int    `json:"quantity" binding:"required,gt=0"`
	Description string `json:"description"`
}

type StockMovementResponse struct {
	ID          uint      `json:"id"`
	StockID     uint      `json:"stock_id"`
	ProductID   uint      `json:"product_id"`
	ProductName string    `json:"product_name"`
	Barcode     string    `json:"barcode"`
	WarehouseID uint      `json:"warehouse_id"`
	Type        string    `json:"type"`
	Quantity    int       `json:"quantity"`
	Description string    `json:"description"`
	CreatedByID uint      `json:"created_by_id"`
	CreatedAt   time.Time `json:"created_at"`
	UnitPrice   float64   `json:"unit_price"`
	Amount      float64   `json:"amount"`
}
