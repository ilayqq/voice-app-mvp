package stockmovement

import (
	"voice-app/config"
	"voice-app/domain"
)

type Repository interface {
	GetAllByCompany(companyID uint) ([]domain.StockMovement, error)
	Create(movement *domain.StockMovement) error
	GetStockByProductAndWarehouse(productID, warehouseID uint) (*domain.Stock, error)
	CreateStock(stock *domain.Stock) error
	UpdateStock(stock *domain.Stock) error
	GetFirstWarehouseByCompany(companyID uint) (*domain.Warehouse, error)
	CreateWarehouse(warehouse *domain.Warehouse) error
	WarehouseBelongsToCompany(warehouseID, companyID uint) (bool, error)
	ProductBelongsToCompany(productID, companyID uint) (bool, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetAllByCompany(companyID uint) ([]domain.StockMovement, error) {
	var movements []domain.StockMovement
	err := config.DB.
		Joins("JOIN stocks ON stocks.id = stock_movements.stock_id").
		Joins("JOIN warehouses ON warehouses.id = stocks.warehouse_id").
		Where("warehouses.company_id = ?", companyID).
		Preload("Stock").
		Preload("Stock.Product").
		Preload("Stock.Warehouse").
		Preload("CreatedBy").
		Order("stock_movements.created_at DESC").
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

func (r *repository) GetFirstWarehouseByCompany(companyID uint) (*domain.Warehouse, error) {
	var w domain.Warehouse
	err := config.DB.Where("company_id = ?", companyID).First(&w).Error
	return &w, err
}

func (r *repository) CreateWarehouse(warehouse *domain.Warehouse) error {
	return config.DB.Create(warehouse).Error
}

func (r *repository) WarehouseBelongsToCompany(warehouseID, companyID uint) (bool, error) {
	var count int64
	err := config.DB.Model(&domain.Warehouse{}).
		Where("id = ? AND company_id = ?", warehouseID, companyID).
		Count(&count).Error
	return count > 0, err
}

func (r *repository) ProductBelongsToCompany(productID, companyID uint) (bool, error) {
	var count int64
	err := config.DB.Model(&domain.Product{}).
		Where("id = ? AND company_id = ?", productID, companyID).
		Count(&count).Error
	return count > 0, err
}
