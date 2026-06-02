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
