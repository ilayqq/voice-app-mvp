package stockmovement

import (
	"voice-app/config"
	"voice-app/domain"
)

type Repository interface {
	GetAll() ([]domain.StockMovement, error)
	GetByStockID(stockID uint) ([]domain.StockMovement, error)
	Create(movement *domain.StockMovement) error
	GetStockByProductAndWarehouse(productID, warehouseID uint) (*domain.Stock, error)
	CreateStock(stock *domain.Stock) error
	UpdateStock(stock *domain.Stock) error
	GetFirstWarehouse() (*domain.Warehouse, error)
	CreateWarehouse(warehouse *domain.Warehouse) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetAll() ([]domain.StockMovement, error) {
	var movements []domain.StockMovement
	err := config.DB.
		Preload("Stock").
		Preload("Stock.Product").
		Preload("Stock.Warehouse").
		Preload("CreatedBy").
		Order("created_at DESC").
		Find(&movements).Error
	return movements, err
}

func (r *repository) GetByStockID(stockID uint) ([]domain.StockMovement, error) {
	var movements []domain.StockMovement
	err := config.DB.
		Where("stock_id = ?", stockID).
		Order("created_at DESC").
		Find(&movements).Error
	return movements, err
}

func (r *repository) Create(movement *domain.StockMovement) error {
	return config.DB.Create(movement).Error
}

func (r *repository) GetStockByProductAndWarehouse(productID, warehouseID uint) (*domain.Stock, error) {
	var stock domain.Stock
	err := config.DB.
		Where("product_id = ? AND warehouse_id = ?", productID, warehouseID).
		First(&stock).Error
	if err != nil {
		return nil, err
	}
	return &stock, nil
}

func (r *repository) CreateStock(stock *domain.Stock) error {
	return config.DB.Create(stock).Error
}

func (r *repository) UpdateStock(stock *domain.Stock) error {
	return config.DB.Save(stock).Error
}

func (r *repository) GetFirstWarehouse() (*domain.Warehouse, error) {
	var w domain.Warehouse
	err := config.DB.First(&w).Error
	return &w, err
}

func (r *repository) CreateWarehouse(warehouse *domain.Warehouse) error {
	return config.DB.Create(warehouse).Error
}
