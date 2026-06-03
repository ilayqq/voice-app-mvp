package analytics

import "voice-app/dto"

type Service interface {
	GetSummary(companyID uint) (*dto.AnalyticsSummary, error)
	GetTopProducts(companyID uint, period string, limit int) (*dto.TopProductsResponse, error)
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

func normalizePeriod(period string) string {
	switch period {
	case "", "month":
		return "month"
	case "week", "7d", "today", "all", "30d":
		return period
	default:
		return "month"
	}
}

func (s *service) GetTopProducts(companyID uint, period string, limit int) (*dto.TopProductsResponse, error) {
	period = normalizePeriod(period)
	rows, err := s.repo.GetTopProducts(companyID, period, limit)
	if err != nil {
		return nil, err
	}

	items := make([]dto.TopProductItem, len(rows))
	for i, row := range rows {
		items[i] = dto.TopProductItem{
			ProductID:    row.ProductID,
			ProductName:  row.ProductName,
			Barcode:      row.Barcode,
			QuantitySold: row.QuantitySold,
			Revenue:      row.Revenue,
		}
	}
	if items == nil {
		items = []dto.TopProductItem{}
	}

	return &dto.TopProductsResponse{
		Period: period,
		Items:  items,
	}, nil
}
