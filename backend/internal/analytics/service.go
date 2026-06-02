package analytics

import "voice-app/dto"

type Service interface {
	GetSummary(companyID uint) (*dto.AnalyticsSummary, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetSummary(companyID uint) (*dto.AnalyticsSummary, error) {
	data, err := s.repo.GetSummary(companyID)
	if err != nil {
		return nil, err
	}
	return &dto.AnalyticsSummary{
		TurnoverTotal:   data.TurnoverTotal,
		TurnoverToday:   data.TurnoverToday,
		TurnoverMonth:   data.TurnoverMonth,
		IncomingValue:   data.IncomingValue,
		IncomingToday:   data.IncomingToday,
		OutgoingValue:   data.OutgoingValue,
		OutgoingToday:   data.OutgoingToday,
		LowStockCount:   data.LowStockCount,
		InventoryValue:  data.InventoryValue,
		OperationsToday: data.OperationsToday,
		ProductsCount:   data.ProductsCount,
	}, nil
}
