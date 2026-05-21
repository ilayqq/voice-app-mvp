package product

import (
	"context"
	"voice-app/domain"
	"voice-app/dto"
)

type Service interface {
	GetAll() ([]domain.Product, error)
	GetByBarcode(code string) (*domain.Product, error)
	GetByWarehouseId(warehouseId int) ([]domain.Product, error)
	Create(product domain.Product) (domain.Product, error)
	Update(ctx context.Context, barcode string, req dto.ProductRequest) (*domain.Product, error)
	Delete(barcode string) error
}

type service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return &service{repository}
}

func (s *service) GetAll() ([]domain.Product, error) {
	products, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}
	return products, nil
}

func (s *service) GetByBarcode(barcode string) (*domain.Product, error) {
	product, err := s.repository.GetByBarcode(barcode)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func (s *service) GetByWarehouseId(warehouseId int) ([]domain.Product, error) {
	products, err := s.repository.GetByWarehouseId(warehouseId)
	if err != nil {
		return nil, err
	}
	return products, nil
}

func (s *service) Create(product domain.Product) (domain.Product, error) {
	if err := s.repository.Create(&product); err != nil {
		return domain.Product{}, err
	}
	return product, nil
}

func (s *service) Update(ctx context.Context, barcode string, req dto.ProductRequest) (*domain.Product, error) {
	product, err := s.repository.GetByBarcode(barcode)
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

	if err := s.repository.Update(ctx, product); err != nil {
		return nil, err
	}

	return product, nil
}

func (s *service) Delete(barcode string) error {
	product, err := s.repository.GetByBarcode(barcode)
	if err != nil {
		return err
	}

	return s.repository.Delete(context.Background(), product)
}
