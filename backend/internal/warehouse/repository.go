package warehouse

import (
	"voice-app/config"
	"voice-app/domain"
)

type Repository interface {
	GetAll() ([]domain.Warehouse, error)
	GetByOwnerPhone(phoneNumber string) ([]domain.Warehouse, error)
	Create(warehouse *domain.Warehouse) error
}

type repository struct {
}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetAll() ([]domain.Warehouse, error) {
	var warehouses []domain.Warehouse

	result := config.DB.Preload("Owner").Preload("Owner.Roles").Preload("Stocks").Find(&warehouses)
	if result.Error != nil {
		return nil, result.Error
	}

	return warehouses, nil
}

func (r *repository) GetByOwnerPhone(phoneNumber string) ([]domain.Warehouse, error) {
	var warehouses []domain.Warehouse
	result := config.DB.Preload("Owner").Preload("Owner.Roles").Preload("Stocks").
		Joins("JOIN users ON users.id = warehouses.owner_id").
		Where("users.phone_number = ?", phoneNumber).Find(&warehouses)
	return warehouses, result.Error
}

func (r *repository) Create(warehouse *domain.Warehouse) error {
	return config.DB.Create(&warehouse).Error
}
