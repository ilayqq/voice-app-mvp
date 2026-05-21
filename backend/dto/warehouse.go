package dto

import "time"

type WarehouseResponse struct {
	ID          uint         `json:"id"`
	Name        string       `json:"name"`
	Location    string       `json:"location"`
	Description string       `json:"description"`
	Owner       UserResponse `json:"owner"`
	CreatedAt   time.Time    `json:"created_at"`
	UpdatedAt   time.Time    `json:"updated_at"`
}

// todo add stocks

type WarehouseRequest struct {
	Name        string `json:"name"`
	Location    string `json:"location"`
	Description string `json:"description"`
	OwnerID     uint   `json:"owner_id"`
}
