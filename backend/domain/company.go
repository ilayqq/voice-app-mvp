package domain

import "time"

const (
	CompanyRoleOwner    = "owner"
	CompanyRoleManager  = "manager"
	CompanyRoleEmployee = "employee"
)

type Company struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"not null" json:"name"`
	OwnerID   uint      `gorm:"not null" json:"owner_id"`
	Owner     User      `gorm:"foreignKey:OwnerID" json:"-"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`

	Members    []CompanyMember `gorm:"foreignKey:CompanyID" json:"-"`
	Warehouses []Warehouse     `gorm:"foreignKey:CompanyID" json:"-"`
}

type CompanyMember struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CompanyID uint      `gorm:"not null;uniqueIndex:idx_company_user" json:"company_id"`
	Company   Company   `gorm:"foreignKey:CompanyID" json:"-"`
	UserID    uint      `gorm:"not null;uniqueIndex:idx_company_user" json:"user_id"`
	User      User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Role      string    `gorm:"not null" json:"role"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
