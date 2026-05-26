package stockmovement

import (
	"net/http"
	"voice-app/dto"

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
//	@Summary		Get stock movements
//	@Description	Returns all stock movement records
//	@Tags			stock-movements
//	@Success		200	{array}		dto.StockMovementResponse
//	@Failure		500	{object}	map[string]string
//	@Router			/api/v1/stock-movements [get]
//	@Security		BearerAuth
func (h *Handler) GetAll(c *gin.Context) {
	movements, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}
	c.JSON(http.StatusOK, movements)
}

// Create godoc
//
//	@Summary		Create stock movement
//	@Description	Create incoming or outgoing stock movement and update stock quantity
//	@Tags			stock-movements
//	@Accept			json
//	@Produce		json
//	@Param			data	body		dto.StockMovementRequest	true	"Movement data"
//	@Success		201		{object}	dto.StockMovementResponse
//	@Failure		400		{object}	map[string]string
//	@Failure		500		{object}	map[string]string
//	@Router			/api/v1/stock-movements [post]
//	@Security		BearerAuth
func (h *Handler) Create(c *gin.Context) {
	var req dto.StockMovementRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	uid, _ := userID.(uint)

	resp, err := h.service.Create(req, uid)
	if err != nil {
		if err.Error() == "insufficient stock" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "insufficient stock"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}
