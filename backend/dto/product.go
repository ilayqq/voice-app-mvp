package dto

type ProductRequest struct {
	Name        *string `json:"name"`
	Barcode     *string `json:"barcode"`
	Description *string `json:"description"`
	Category    *string `json:"category"`
}

type ProductResponse struct {
}
