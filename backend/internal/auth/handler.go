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
	PhoneNumber string   `json:"phone_number" binding:"required"`
	Password    string   `json:"password" binding:"required"`
	Roles       []string `json:"roles"`
}

type authRequest struct {
	PhoneNumber string `json:"phone_number" binding:"required"`
	Password    string `json:"password" binding:"required"`
}

type authResponse struct {
	Token string `json:"token"`
}

// Register godoc
//
//	@Summary		Register new user
//	@Description	Register a new user with phone, password, and roles
//	@Tags			auth
//	@Param			data	body		registerRequest	true	"User data"
//	@Success		201		{object}	domain.User
//	@Failure		400		{object}	map[string]string
//	@Failure		500		{object}	map[string]string
//	@Router			/api/auth/register [post]
func (h *Handler) Register(c *gin.Context) {
	var req = &registerRequest{}

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	user, err := h.service.Register(req.PhoneNumber, req.Password, req.Roles)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"user": user})
}

// Login godoc
//
//	@Summary		Login user
//	@Description	Login and receive JWT token
//	@Tags			auth
//	@Param			data	body		authRequest	true	"Login data"
//	@Success		200		{object}	authResponse
//	@Failure		401		{object}	map[string]string
//	@Router			/api/auth/login [post]
func (h *Handler) Login(c *gin.Context) {
	var req authRequest

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	token, err := h.service.Login(req.PhoneNumber, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}
