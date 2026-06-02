package product

import (
	"context"
	"errors"
	"voice-app/domain"
	"voice-app/dto"

	"gorm.io/gorm"
)

type Service interface {
	GetAll(companyID uint) ([]domain.Product, error)
	GetByBarcode(companyID uint, code string) (*domain.Product, error)
	GetByWarehouseId(companyID uint, warehouseId int) ([]domain.Product, error)
	Create(companyID uint, product domain.Product) (domain.Product, error)
	Update(ctx context.Context, companyID uint, barcode string, req dto.ProductRequest) (*domain.Product, error)
	Delete(companyID uint, barcode string) error
}

type service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return &service{repository}
}

func (s *service) GetAll(companyID uint) ([]domain.Product, error) {
	return s.repository.GetAllByCompany(companyID)
}

func (s *service) GetByBarcode(companyID uint, barcode string) (*domain.Product, error) {
	product, err := s.repository.GetByBarcode(companyID, barcode)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *service) GetByWarehouseId(companyID uint, warehouseId int) ([]domain.Product, error) {
	return s.repository.GetByWarehouseId(companyID, warehouseId)
}

func (s *service) Create(companyID uint, product domain.Product) (domain.Product, error) {
	product.CompanyID = companyID
	if err := s.repository.Create(&product); err != nil {
		return domain.Product{}, err
	}
	return product, nil
}

func (s *service) Update(ctx context.Context, companyID uint, barcode string, req dto.ProductRequest) (*domain.Product, error) {
	product, err := s.repository.GetByBarcode(companyID, barcode)
	if err != nil {
		return nil, err
	}

	if req.Name != nil {
		product.Name = *req.Name
	}
	if req.Barcode != nil {
		product.Barcode = *req.Barcode
	}
	if req.Description != nil {
		product.Description = *req.Description
	}
	if req.Category != nil {
		product.Category = *req.Category
	}
	if req.Price != nil {
		product.Price = *req.Price
	}
	if req.ImageURL != nil {
		product.ImageURL = *req.ImageURL
	}

	if err := s.repository.Update(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *service) Delete(companyID uint, barcode string) error {
	product, err := s.repository.GetByBarcode(companyID, barcode)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("product not found")
		}
		return err
	}
	return s.repository.Delete(context.Background(), product)
}
