package product

import (
	"context"
	"voice-app/config"
	"voice-app/domain"

	"gorm.io/gorm"
)

type Repository interface {
	GetAll() ([]domain.Product, error)
	GetByBarcode(code string) (*domain.Product, error)
	GetByWarehouseId(warehouseId int) ([]domain.Product, error)
	Create(product *domain.Product) error
	Update(ctx context.Context, product *domain.Product) error
	Delete(ctx context.Context, product *domain.Product) error
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetAll() ([]domain.Product, error) {
	var products []domain.Product
	config.DB.Preload("Stocks").Find(&products)
	return products, nil
}

func (r *repository) GetByBarcode(code string) (*domain.Product, error) {
	var product domain.Product
	result := config.DB.Preload("Stocks").Where("barcode = ?", code).First(&product)
	return &product, result.Error
}

func (r *repository) GetByWarehouseId(warehouseId int) ([]domain.Product, error) {
	var products []domain.Product
	err := config.DB.
		Joins("JOIN stocks ON stocks.product_id = products.id").
		Where("stocks.warehouse_id = ?", warehouseId).
		Preload("Stocks", "warehouse_id = ?", warehouseId).
		Preload("Stocks.Warehouse").
		Preload("Stocks.Warehouse.Owner").
		Preload("Stocks.Product").
		Find(&products).Error
	return products, err
}

func (r *repository) Create(product *domain.Product) error {
	return config.DB.Create(&product).Error
}

func (r *repository) Update(ctx context.Context, product *domain.Product) error {
	return config.DB.WithContext(ctx).Save(&product).Error
}

func (r *repository) Delete(ctx context.Context, product *domain.Product) error {
	return config.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var stockIDs []uint
		tx.Model(&domain.Stock{}).Where("product_id = ?", product.ID).Pluck("id", &stockIDs)

		if len(stockIDs) > 0 {
			if err := tx.Where("stock_id IN ?", stockIDs).Delete(&domain.StockMovement{}).Error; err != nil {
				return err
			}
		}

		if err := tx.Where("product_id = ?", product.ID).Delete(&domain.Stock{}).Error; err != nil {
			return err
		}

		return tx.Delete(product).Error
	})
}
