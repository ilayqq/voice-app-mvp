package mapper

import (
	"voice-app/domain"
	"voice-app/dto"
)

func MapWarehouseToDTO(warehouse domain.Warehouse) dto.WarehouseResponse {
	return dto.WarehouseResponse{
		ID:          warehouse.ID,
		Name:        warehouse.Name,
		Location:    warehouse.Location,
		Description: warehouse.Description,
		Owner:       MapUserToDTO(warehouse.Owner),

		CreatedAt: warehouse.CreatedAt,
		UpdatedAt: warehouse.UpdatedAt,
	}
}

func MapWarehousesToDTO(warehouses []domain.Warehouse) []dto.WarehouseResponse {
	dtoWarehouses := make([]dto.WarehouseResponse, len(warehouses))
	for i, warehouse := range warehouses {
		dtoWarehouses[i] = MapWarehouseToDTO(warehouse)
	}
	return dtoWarehouses
}
