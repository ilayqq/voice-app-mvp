package warehouse

import (
	"net/http"
	"voice-app/domain"
	"voice-app/internal/mapper"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

// GetAll godoc
//
//	@Summary		Get warehouses
//	@Description	Get all warehouses or filter by owner phone number
//	@Tags			warehouses
//	@Param			phone_number	query		string	false	"Owner phone number"
//	@Success		200				{array}		dto.WarehouseResponse
//	@Failure		500				{object}	domain.ErrorResponse
//	@Router			/api/v1/warehouses [get]
//	@Security		BearerAuth
func (h *Handler) GetAll(c *gin.Context) {
	ownerPhone := c.Query("phone_number")

	if ownerPhone != "" {
		warehouses, err := h.service.GetByOwnerPhone(ownerPhone)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "warehouse not found"})
			return
		}

		if len(warehouses) == 0 {
			c.JSON(http.StatusNotFound, gin.H{"error": "warehouse not found"})
			return
		}

		c.JSON(http.StatusOK, mapper.MapWarehousesToDTO(warehouses))
		return
	}

	warehouseDTO, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, mapper.MapWarehousesToDTO(warehouseDTO))
}

// AddWarehouse godoc
//
//	@Summary		Add warehouse
//	@Description	Add new warehouse
//	@Tags			warehouses
//	@Accept			json
//	@Produce		json
//	@Param			warehouse	body		dto.WarehouseRequest	true	"Warehouse data"
//	@Success		201			{object}	dto.WarehouseResponse
//	@Failure		500			{object}	domain.ErrorResponse
//	@Router			/api/v1/warehouses [post]
//	@Security		BearerAuth
func (h *Handler) AddWarehouse(c *gin.Context) {
	var warehouse domain.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	createdWarehouse, err := h.service.Create(warehouse)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusCreated, createdWarehouse)
}
