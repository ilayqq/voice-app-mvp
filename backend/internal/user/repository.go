package user

import (
	"errors"
	"voice-app/config"
	"voice-app/domain"

	"gorm.io/gorm"
)

type Repository interface {
	Create(user *domain.User) error
	Exist(phoneNumber string) (*domain.User, error)
	GetAll() ([]domain.User, error)
	GetByPhoneNumber(phoneNumber string) (*domain.User, error)
	Update(user *domain.User) error
}
type repository struct {
}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) Create(user *domain.User) error {
	return config.DB.Create(user).Error
}

func (r *repository) Exist(phoneNumber string) (*domain.User, error) {
	var user domain.User
	exist := config.DB.Where("phone_number = ?", phoneNumber).First(&user)
	if errors.Is(exist.Error, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, exist.Error
}

func (r *repository) GetAll() ([]domain.User, error) {
	var users []domain.User

	result := config.DB.Preload("Roles").Find(&users)
	if result.Error != nil {
		return nil, result.Error
	}

	return users, nil
}

func (r *repository) GetByPhoneNumber(phoneNumber string) (*domain.User, error) {
	var user domain.User
	result := config.DB.Preload("Roles").Where("phone_number = ?", phoneNumber).First(&user)
	return &user, result.Error
}

func (r *repository) Update(user *domain.User) error {
	return config.DB.Save(user).Error
}
