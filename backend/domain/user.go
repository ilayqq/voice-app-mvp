package domain

type User struct {
	ID          uint    `gorm:"primaryKey;autoIncrement" json:"id"`
	FullName    string  `gorm:"not null" json:"full_name"`
	PhoneNumber *string `gorm:"unique" json:"phone_number"`
	Password    string  `gorm:"not null" json:"password"`
	Email       *string `gorm:"unique" json:"email"`
	Picture     string  `gorm:"not null; default:''" json:"picture"`
	Roles       []Role  `gorm:"many2many:user_roles;" json:"roles"`
}

type Role struct {
	ID    uint    `gorm:"primaryKey;autoIncrement"`
	Name  string  `json:"name"`
	Users []*User `gorm:"many2many:user_roles;"`
}
