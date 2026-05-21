package dto

type UserResponse struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName    string  `gorm:"not null" json:"full_name"`
	PhoneNumber string  `gorm:"unique;not null" json:"phone_number"`
	Email       *string `gorm:"unique" json:"email"`
	Picture     string  `gorm:"not null; default:''" json:"picture"`

	RoleName []string `json:"roles"`
}

type UserRequest struct {
	FullName    *string `json:"full_name"`
	PhoneNumber *string `json:"phone_number"`
	Email       *string `json:"email"`
	Picture     *string `json:"picture"`
}
