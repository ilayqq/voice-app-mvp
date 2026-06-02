package warehouse

import "voice-app/domain"

type Service interface {
	GetByCompanyID(companyID uint) ([]domain.Warehouse, error)
	Create(companyID, ownerID uint, warehouse domain.Warehouse) (*domain.Warehouse, error)
}

type service struct {
	repository Repository
}

func NewService(repository Repository) Service {
	return &service{repository: repository}
}

func (s *service) GetByCompanyID(companyID uint) ([]domain.Warehouse, error) {
	return s.repository.GetByCompanyID(companyID)
}

func (s *service) Create(companyID, ownerID uint, warehouse domain.Warehouse) (*domain.Warehouse, error) {
	warehouse.CompanyID = companyID
	warehouse.OwnerID = ownerID
	if err := s.repository.Create(&warehouse); err != nil {
		return nil, err
	}
	return &warehouse, nil
}
