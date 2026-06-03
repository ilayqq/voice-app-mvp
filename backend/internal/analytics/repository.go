package analytics

import (
	"fmt"
	"strings"
	"voice-app/config"
)

const lowStockThreshold = 5

type turnoverRow struct {
	IncomingValue float64
	OutgoingValue float64
}

type SummaryData struct {
	TurnoverTotal   float64
	TurnoverToday   float64
	TurnoverMonth   float64
	IncomingValue   float64
	IncomingToday   float64
	OutgoingValue   float64
	OutgoingToday   float64
	LowStockCount   int
	InventoryValue  float64
	OperationsToday int
	ProductsCount   int
}

type TopProductRow struct {
	ProductID    uint
	ProductName  string
	Barcode      string
	QuantitySold int
	Revenue      float64
}

type Repository interface {
	GetSummary(companyID uint) (*SummaryData, error)
	GetTopProducts(companyID uint, period string, limit int) ([]TopProductRow, error)
}

type repository struct{}

func NewRepository() Repository {
	return &repository{}
}

func (r *repository) GetSummary(companyID uint) (*SummaryData, error) {
	var total turnoverRow
	err := config.DB.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN sm.type = 'incoming' THEN sm.quantity * p.price ELSE 0 END), 0) AS incoming_value,
			COALESCE(SUM(CASE WHEN sm.type = 'outgoing' THEN sm.quantity * p.price ELSE 0 END), 0) AS outgoing_value
		FROM stock_movements sm
		JOIN stocks s ON s.id = sm.stock_id
		JOIN products p ON p.id = s.product_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ? AND p.company_id = ?
	`, companyID, companyID).Scan(&total).Error
	if err != nil {
		return nil, err
	}

	var today turnoverRow
	_ = config.DB.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN sm.type = 'incoming' THEN sm.quantity * p.price ELSE 0 END), 0) AS incoming_value,
			COALESCE(SUM(CASE WHEN sm.type = 'outgoing' THEN sm.quantity * p.price ELSE 0 END), 0) AS outgoing_value
		FROM stock_movements sm
		JOIN stocks s ON s.id = sm.stock_id
		JOIN products p ON p.id = s.product_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ?
		  AND p.company_id = ?
		  AND sm.created_at >= CURRENT_DATE
		  AND sm.created_at < CURRENT_DATE + INTERVAL '1 day'
	`, companyID, companyID).Scan(&today)

	var month turnoverRow
	_ = config.DB.Raw(`
		SELECT
			COALESCE(SUM(CASE WHEN sm.type = 'incoming' THEN sm.quantity * p.price ELSE 0 END), 0) AS incoming_value,
			COALESCE(SUM(CASE WHEN sm.type = 'outgoing' THEN sm.quantity * p.price ELSE 0 END), 0) AS outgoing_value
		FROM stock_movements sm
		JOIN stocks s ON s.id = sm.stock_id
		JOIN products p ON p.id = s.product_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ?
		  AND p.company_id = ?
		  AND sm.created_at >= DATE_TRUNC('month', CURRENT_DATE)
	`, companyID, companyID).Scan(&month)

	var inventoryValue float64
	_ = config.DB.Raw(`
		SELECT COALESCE(SUM(s.quantity * p.price), 0)
		FROM stocks s
		JOIN products p ON p.id = s.product_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ? AND p.company_id = ?
	`, companyID, companyID).Scan(&inventoryValue)

	var lowStock int64
	_ = config.DB.Raw(`
		SELECT COUNT(*) FROM (
			SELECT p.id
			FROM products p
			LEFT JOIN stocks s ON s.product_id = p.id
			LEFT JOIN warehouses w ON w.id = s.warehouse_id AND w.company_id = ?
			WHERE p.company_id = ?
			GROUP BY p.id
			HAVING COALESCE(SUM(CASE WHEN w.id IS NOT NULL THEN s.quantity ELSE 0 END), 0) < ?
		) AS low_items
	`, companyID, companyID, lowStockThreshold).Scan(&lowStock)

	var opsToday int64
	_ = config.DB.Raw(`
		SELECT COUNT(*)
		FROM stock_movements sm
		JOIN stocks s ON s.id = sm.stock_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ?
		  AND sm.created_at >= CURRENT_DATE
		  AND sm.created_at < CURRENT_DATE + INTERVAL '1 day'
	`, companyID).Scan(&opsToday)

	var productsCount int64
	_ = config.DB.Table("products").Where("company_id = ?", companyID).Count(&productsCount).Error

	return &SummaryData{
		TurnoverTotal:   total.OutgoingValue,
		TurnoverToday:   today.OutgoingValue,
		TurnoverMonth:   month.OutgoingValue,
		IncomingValue:   total.IncomingValue,
		IncomingToday:   today.IncomingValue,
		OutgoingValue:   total.OutgoingValue,
		OutgoingToday:   today.OutgoingValue,
		LowStockCount:   int(lowStock),
		InventoryValue:  inventoryValue,
		OperationsToday: int(opsToday),
		ProductsCount:   int(productsCount),
	}, nil
}

func periodSQLFilter(period string) (string, error) {
	switch period {
	case "week", "7d":
		return "AND sm.created_at >= CURRENT_DATE - INTERVAL '7 days'", nil
	case "month", "30d":
		return "AND sm.created_at >= DATE_TRUNC('month', CURRENT_DATE)", nil
	case "today":
		return "AND sm.created_at >= CURRENT_DATE AND sm.created_at < CURRENT_DATE + INTERVAL '1 day'", nil
	case "all":
		return "", nil
	default:
		return "", fmt.Errorf("invalid period")
	}
}

func (r *repository) GetTopProducts(companyID uint, period string, limit int) ([]TopProductRow, error) {
	dateFilter, err := periodSQLFilter(period)
	if err != nil {
		return nil, err
	}
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	query := fmt.Sprintf(`
		SELECT
			p.id AS product_id,
			p.name AS product_name,
			p.barcode AS barcode,
			COALESCE(SUM(sm.quantity), 0)::int AS quantity_sold,
			COALESCE(SUM(sm.quantity * p.price), 0) AS revenue
		FROM stock_movements sm
		JOIN stocks s ON s.id = sm.stock_id
		JOIN products p ON p.id = s.product_id
		JOIN warehouses w ON w.id = s.warehouse_id
		WHERE w.company_id = ?
		  AND p.company_id = ?
		  AND sm.type = 'outgoing'
		  %s
		GROUP BY p.id, p.name, p.barcode
		HAVING COALESCE(SUM(sm.quantity * p.price), 0) > 0
		ORDER BY revenue DESC
		LIMIT ?
	`, strings.TrimSpace(dateFilter))

	var rows []TopProductRow
	if err := config.DB.Raw(query, companyID, companyID, limit).Scan(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
