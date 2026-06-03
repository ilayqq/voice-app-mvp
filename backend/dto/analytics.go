package dto

type AnalyticsSummary struct {
	TurnoverTotal    float64 `json:"turnover_total"`
	TurnoverToday    float64 `json:"turnover_today"`
	TurnoverMonth    float64 `json:"turnover_month"`
	IncomingValue    float64 `json:"incoming_value"`
	IncomingToday    float64 `json:"incoming_today"`
	OutgoingValue    float64 `json:"outgoing_value"`
	OutgoingToday    float64 `json:"outgoing_today"`
	LowStockCount    int     `json:"low_stock_count"`
	InventoryValue   float64 `json:"inventory_value"`
	OperationsToday  int     `json:"operations_today"`
	ProductsCount    int     `json:"products_count"`
}

type TopProductItem struct {
	ProductID    uint    `json:"product_id"`
	ProductName  string  `json:"product_name"`
	Barcode      string  `json:"barcode"`
	QuantitySold int     `json:"quantity_sold"`
	Revenue      float64 `json:"revenue"`
}

type TopProductsResponse struct {
	Period string           `json:"period"`
	Items  []TopProductItem `json:"items"`
}
