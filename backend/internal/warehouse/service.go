package warehouse

import "voice-app/domain"

type Service interface {
	GetAll() ([]domain.Warehouse, error)
	GetByOwnerPhone(phoneNumber string) ([]domain.Warehouse, error)
	Create(warehouse domain.Warehouse) (*domain.Warehouse, error)
}

type service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return &service{repository: repository}
}

func (s *service) GetAll() ([]domain.Warehouse, error) {
	warehouses, err := s.repository.GetAll()
	if err != nil {
		return nil, err
	}
	return warehouses, nil
}

func (s *service) GetByOwnerPhone(phoneNumber string) ([]domain.Warehouse, error) {
	warehouses, err := s.repository.GetByOwnerPhone(phoneNumber)
	if err != nil {
		return nil, err
	}
	return warehouses, nil
}

func (s *service) Create(warehouse domain.Warehouse) (*domain.Warehouse, error) {
	if err := s.repository.Create(&warehouse); err != nil {
		return nil, err
	}
	return &warehouse, nil
}
