package stockmovement

import (
	"errors"
	"voice-app/domain"
	"voice-app/dto"

	"gorm.io/gorm"
)

type Service interface {
	GetAll() ([]dto.StockMovementResponse, error)
	Create(req dto.StockMovementRequest, userID uint) (*dto.StockMovementResponse, error)
}

type service struct {
	repo Repository
}

func NewService(repo Repository) Service {
	return &service{repo: repo}
}

func (s *service) GetAll() ([]dto.StockMovementResponse, error) {
	movements, err := s.repo.GetAll()
	if err != nil {
		return nil, err
	}
	result := make([]dto.StockMovementResponse, len(movements))
	for i, m := range movements {
		result[i] = toResponse(m)
	}
	return result, nil
}

func (s *service) Create(req dto.StockMovementRequest, userID uint) (*dto.StockMovementResponse, error) {
	warehouseID := req.WarehouseID
	if warehouseID == 0 {
		w, err := s.repo.GetFirstWarehouse()
		if err != nil {
			w = &domain.Warehouse{
				Name:    "Default",
				OwnerID: userID,
			}
			if err := s.repo.CreateWarehouse(w); err != nil {
				return nil, errors.New("failed to create default warehouse")
			}
		}
		warehouseID = w.ID
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
		}
	}
	return resp
}
