package user

import (
	"net/http"
	"voice-app/dto"
	"voice-app/internal/mapper"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler { return &Handler{service: service} }

// GetUsers godoc
//
//	@Summary		Get users
//	@Description	Get all users or filter by phone number
//	@Tags			users
//	@Param			phone_number	query		string	false	"Phone number"
//	@Success		200				{array}		dto.UserResponse
//	@Failure		500				{object}	map[string]string
//	@Router			/api/v1/users [get]
//	@Security		BearerAuth
func (h *Handler) GetUsers(c *gin.Context) {
	phoneNumber := c.Query("phone_number")

	if phoneNumber != "" {
		user, err := h.service.GetByPhoneNumber(phoneNumber)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "user not found"})
			return
		}

		c.JSON(http.StatusOK, mapper.MapUserToDTO(*user))
		return
	}

	users, err := h.service.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, mapper.MapUsersToDTO(users))
}

// UpdateUser godoc
//
//	@Summary		Update user
//	@Description	Update user by phone number
//	@Tags			users
//	@Param			data	body		dto.UserRequest	true	"User data"
//	@Success		200		{object}	dto.UserRequest
//	@Failure		500		{object}	domain.ErrorResponse
//	@Router			/api/v1/users [patch]
//	@Security		BearerAuth
func (h *Handler) UpdateUser(c *gin.Context) {
	phoneNumber, exists := c.Get("phone_number")
	if !exists {
		c.JSON(http.StatusBadRequest, gin.H{"error": "unauthorized"})
		return
	}

	var req dto.UserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "bad request"})
		return
	}

	user, err := h.service.Update(phoneNumber.(string), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "internal error"})
		return
	}

	c.JSON(http.StatusOK, mapper.MapUserToDTO(*user))
}
