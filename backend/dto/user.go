package dto

type UserResponse struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName    string  `gorm:"not null" json:"full_name"`
	PhoneNumber string  `gorm:"unique;not null" json:"phone_number"`
	Email       *string `gorm:"unique" json:"email"`
	Picture     string  `gorm:"not null; default:''" json:"picture"`

	RoleName    []string         `json:"roles"`
	Company     *CompanyResponse `json:"company,omitempty"`
}

type UserRequest struct {
	FullName    *string `json:"full_name"`
	PhoneNumber *string `json:"phone_number"`
	Email       *string `json:"email"`
	Picture     *string `json:"picture"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
}
