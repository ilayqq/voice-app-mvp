package product

import (
	"context"
	"net/http"
	"strconv"
	"time"
	"voice-app/domain"
	"voice-app/dto"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service}
}

// GetAll godoc
//
//	@Summary		Get products
//	@Description	Get all products
//	@Tags			products
//	@Param			barcode	query		string	false	"Product barcode"
//	@Success		200	{array}		domain.Product
//	@Failure		401	{object}	map[string]string
//	@Failure		403	{object}	map[string]string
//	@Failure		500	{object}	map[string]string
//	@Router			/api/v1/products [get]
//	@Security		BearerAuth
func (h *Handler) GetAll(c *gin.Context) {
	if barcode := c.Query("barcode"); barcode != "" {
		product, err := h.service.GetByBarcode(barcode)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "product not found"})
			return
		}

		c.JSON(http.StatusOK, product)
		return
	}

	if rawID := c.Query("warehouse_id"); rawID != "" {
		warehouseID, err := strconv.ParseInt(rawID, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid warehouse_id"})
			return
		}
		products, err := h.service.GetByWarehouseId(int(warehouseID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
			return
		}
		c.JSON(http.StatusOK, products)
		return
	}

	products, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, products)
}

// AddProduct godoc
//
//	@Summary		Add product
//	@Description	Add new product
//	@Tags			products
//	@Param			data	body		dto.ProductRequest	true	"Product data"
//	@Success		200		{array}		domain.Product
//	@Failure		401		{object}	domain.ErrorResponse
//	@Failure		403		{object}	domain.ErrorResponse
//	@Failure		500		{object}	domain.ErrorResponse
//	@Router			/api/v1/products [post]
//	@Security		BearerAuth
func (h *Handler) AddProduct(c *gin.Context) {
	var product domain.Product
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	createdProduct, err := h.service.Create(product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusCreated, createdProduct)
}

// UpdateProduct godoc
//
//	@Summary		Update product
//	@Description	Update product
//	@Tags			products
//	@Param			barcode	query		string				true	"Product barcode"
//	@Param			data	body		dto.ProductRequest	true	"Product data"
//	@Success		200		{object}	dto.ProductRequest
//	@Failure		500		{object}	domain.ErrorResponse
//	@Router			/api/v1/products [patch]
//	@Security		BearerAuth
func (h *Handler) UpdateProduct(c *gin.Context) {
	barcode := c.Query("barcode")
	//barcode, err := strconv.ParseInt(c.Param("barcode"), 10, 64)
	//if err != nil {
	//	c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
	//	return
	//}

	var product dto.ProductRequest
	if err := c.ShouldBindJSON(&product); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	//product.Barcode = barcode

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	updated, err := h.service.Update(ctx, barcode, product)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, updated)
}

// DeleteProduct godoc
//
//	@Summary		Delete product
//	@Description	Delete product
//	@Tags			products
//	@Param			id	query		string				false	"Product id"
//	@Param			barcode	query		string				false	"Product barcode"
//	@Success		200		{object}	dto.ProductRequest
//	@Failure		500		{object}	domain.ErrorResponse
//	@Router			/api/v1/products [delete]
//	@Security		BearerAuth
func (h *Handler) DeleteProduct(c *gin.Context) {
	barcode := c.Query("barcode")
	if err := h.service.Delete(barcode); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "product deleted"})
}
