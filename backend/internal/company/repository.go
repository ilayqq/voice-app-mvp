package company

import (
	"errors"
	"voice-app/config"
	"voice-app/domain"

	"gorm.io/gorm"
)

type Repository interface {
	CreateCompany(company *domain.Company) error
	CreateMember(member *domain.CompanyMember) error
	GetMemberByUserID(userID uint) (*domain.CompanyMember, error)
	GetCompanyByID(id uint) (*domain.Company, error)
	GetMembersByCompanyID(companyID uint) ([]domain.CompanyMember, error)
	GetMemberByCompanyAndUser(companyID, userID uint) (*domain.CompanyMember, error)
	UpdateMemberRole(memberID uint, role string) error
	DeleteMember(memberID uint) error
	CreateWarehouse(warehouse *domain.Warehouse) error
	GetWarehousesByCompanyID(companyID uint) ([]domain.Warehouse, error)
	GetFirstWarehouseByCompanyID(companyID uint) (*domain.Warehouse, error)
	WarehouseBelongsToCompany(warehouseID, companyID uint) (bool, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) CreateCompany(company *domain.Company) error {
	return config.DB.Create(company).Error
}

func (r *repository) CreateMember(member *domain.CompanyMember) error {
	return config.DB.Create(member).Error
}

func (r *repository) GetMemberByUserID(userID uint) (*domain.CompanyMember, error) {
	var member domain.CompanyMember
	err := config.DB.Preload("Company").Where("user_id = ?", userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *repository) GetCompanyByID(id uint) (*domain.Company, error) {
	var company domain.Company
	err := config.DB.First(&company, id).Error
	if err != nil {
		return nil, err
	}
	return &company, nil
}

func (r *repository) GetMembersByCompanyID(companyID uint) ([]domain.CompanyMember, error) {
	var members []domain.CompanyMember
	err := config.DB.Preload("User").Where("company_id = ?", companyID).Find(&members).Error
	return members, err
}

func (r *repository) GetMemberByCompanyAndUser(companyID, userID uint) (*domain.CompanyMember, error) {
	var member domain.CompanyMember
	err := config.DB.Where("company_id = ? AND user_id = ?", companyID, userID).First(&member).Error
	if err != nil {
		return nil, err
	}
	return &member, nil
}

func (r *repository) UpdateMemberRole(memberID uint, role string) error {
	return config.DB.Model(&domain.CompanyMember{}).Where("id = ?", memberID).Update("role", role).Error
}

func (r *repository) DeleteMember(memberID uint) error {
	return config.DB.Delete(&domain.CompanyMember{}, memberID).Error
}

func (r *repository) CreateWarehouse(warehouse *domain.Warehouse) error {
	return config.DB.Create(warehouse).Error
}

func (r *repository) GetWarehousesByCompanyID(companyID uint) ([]domain.Warehouse, error) {
	var warehouses []domain.Warehouse
	err := config.DB.Where("company_id = ?", companyID).Find(&warehouses).Error
	return warehouses, err
}

func (r *repository) GetFirstWarehouseByCompanyID(companyID uint) (*domain.Warehouse, error) {
	var w domain.Warehouse
	err := config.DB.Where("company_id = ?", companyID).First(&w).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}
	return &w, err
}

func (r *repository) WarehouseBelongsToCompany(warehouseID, companyID uint) (bool, error) {
	var count int64
	err := config.DB.Model(&domain.Warehouse{}).
		Where("id = ? AND company_id = ?", warehouseID, companyID).
		Count(&count).Error
	return count > 0, err
}
