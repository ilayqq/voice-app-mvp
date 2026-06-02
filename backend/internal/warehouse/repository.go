package warehouse

import (
	"voice-app/config"
	"voice-app/domain"
)

type Repository interface {
	GetByCompanyID(companyID uint) ([]domain.Warehouse, error)
	Create(warehouse *domain.Warehouse) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetByCompanyID(companyID uint) ([]domain.Warehouse, error) {
	var warehouses []domain.Warehouse
	err := config.DB.Where("company_id = ?", companyID).
		Preload("Stocks").
		Find(&warehouses).Error
	return warehouses, err
}

func (r *repository) Create(warehouse *domain.Warehouse) error {
	return config.DB.Create(warehouse).Error
}
