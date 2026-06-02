package auth

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

type registerRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
	FullName    string `json:"full_name"`
	CompanyName string `json:"company_name" binding:"required"`
}

type authRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

// Register godoc
//
//	@Summary		Register new company owner
//	@Description	Register a new user with company
//	@Tags			auth
//	@Param			data	body		registerRequest	true	"User data"
//	@Success		201		{object}	dto.AuthRegisterResponse
//	@Failure		400		{object}	map[string]string
//	@Router			/api/auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req registerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	resp, err := h.service.Register(req.PhoneNumber, req.Password, req.FullName, req.CompanyName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// Login godoc
//
//	@Summary		Login user
//	@Description	Login and receive JWT token with company context
//	@Tags			auth
//	@Param			data	body		authRequest	true	"Login data"
//	@Success		200		{object}	dto.AuthLoginResponse
//	@Failure		401		{object}	map[string]string
//	@Router			/api/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req authRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	resp, err := h.service.Login(req.PhoneNumber, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}
