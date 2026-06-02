package stockmovement

import (
	"errors"
	"voice-app/domain"
	"voice-app/dto"

	"gorm.io/gorm"
)

type Service interface {
	GetAll(companyID uint) ([]dto.StockMovementResponse, error)
	Create(req dto.StockMovementRequest, userID, companyID uint) (*dto.StockMovementResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetAll(companyID uint) ([]dto.StockMovementResponse, error) {
	movements, err := s.repo.GetAllByCompany(companyID)
	if err != nil {
		return nil, err
	}
	result := make([]dto.StockMovementResponse, len(movements))
	for i, m := range movements {
		result[i] = toResponse(m)
	}
	return result, nil
}

func (s *service) Create(req dto.StockMovementRequest, userID, companyID uint) (*dto.StockMovementResponse, error) {
	ok, err := s.repo.ProductBelongsToCompany(req.ProductID, companyID)
	if err != nil || !ok {
		return nil, errors.New("product not found in your company")
	}

	warehouseID := req.WarehouseID
	if warehouseID == 0 {
		w, err := s.repo.GetFirstWarehouseByCompany(companyID)
		if err != nil {
			w = &domain.Warehouse{
				Name:      "Основной склад",
				CompanyID: companyID,
				OwnerID:   userID,
			}
			if err := s.repo.CreateWarehouse(w); err != nil {
				return nil, errors.New("failed to create default warehouse")
			}
		}
		warehouseID = w.ID
	} else {
		belongs, err := s.repo.WarehouseBelongsToCompany(warehouseID, companyID)
		if err != nil || !belongs {
			return nil, errors.New("warehouse not found in your company")
		}
	}

	stock, err := s.repo.GetStockByProductAndWarehouse(req.ProductID, warehouseID)
	if errors.Is(err, gorm.ErrRecordNotFound) {
		stock = &domain.Stock{
			ProductID:   req.ProductID,
			WarehouseID: warehouseID,
			Quantity:    0,
		}
		if err := s.repo.CreateStock(stock); err != nil {
			return nil, err
		}
	} else if err != nil {
		return nil, err
	}

	if req.Type == "outgoing" && stock.Quantity < req.Quantity {
		return nil, errors.New("insufficient stock")
	}

	movement := &domain.StockMovement{
		StockID:     stock.ID,
		Type:        req.Type,
		Quantity:    req.Quantity,
		Description: req.Description,
		CreatedByID: userID,
	}
	if err := s.repo.Create(movement); err != nil {
		return nil, err
	}

	switch req.Type {
	case "incoming":
		stock.Quantity += req.Quantity
	case "outgoing":
		stock.Quantity -= req.Quantity
	}
	if err := s.repo.UpdateStock(stock); err != nil {
		return nil, err
	}

	movement.Stock = *stock
	resp := toResponse(*movement)
	return &resp, nil
}

func toResponse(m domain.StockMovement) dto.StockMovementResponse {
	resp := dto.StockMovementResponse{
		ID:          m.ID,
		StockID:     m.StockID,
		Type:        m.Type,
		Quantity:    m.Quantity,
		Description: m.Description,
		CreatedByID: m.CreatedByID,
		CreatedAt:   m.CreatedAt,
	}
	if m.Stock.ID != 0 {
		resp.ProductID = m.Stock.ProductID
		resp.WarehouseID = m.Stock.WarehouseID
		if m.Stock.Product.ID != 0 {
			resp.ProductName = m.Stock.Product.Name
			resp.Barcode = m.Stock.Product.Barcode
			resp.UnitPrice = m.Stock.Product.Price
			resp.Amount = float64(m.Quantity) * m.Stock.Product.Price
		}
	}
	return resp
}
