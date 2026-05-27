package dto

type ProductRequest struct {
	Name        *string  `json:"name"`
	Barcode     *string  `json:"barcode"`
	Description *string  `json:"description"`
	Category    *string  `json:"category"`
	Price       *float64 `json:"price"`
}

type ProductResponse struct {
}
