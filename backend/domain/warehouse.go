package domain

import (
	"time"
)

type Warehouse struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"not null" json:"name"`
	Location    string    `json:"location"`
	Description string    `json:"description"`
	OwnerID     uint      `json:"owner_id"`
	Owner       User      `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;" json:"owner"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	Stocks []Stock `gorm:"foreignKey:WarehouseID"`
}
