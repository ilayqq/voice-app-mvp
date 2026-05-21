package oauth

import (
	"context"
	"log"
	"net/http"
	"time"
	"voice-app/config"

	"github.com/gin-gonic/gin"
)

const stateTTL = 5 * time.Minute

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) GoogleLogin(c *gin.Context) {
	url, state, err := h.service.GetAuthURL()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate auth url"})
		return
	}

	if err := config.RD.Set(context.Background(), stateKey(state), "1", stateTTL).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save state"})
		return
	}

	c.Redirect(http.StatusTemporaryRedirect, url)
}

func (h *Handler) GoogleCallback(c *gin.Context) {
	state := c.Query("state")
	if state == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing state"})
		return
	}

	key := stateKey(state)
	deleted, err := config.RD.Del(context.Background(), key).Result()
	if err != nil || deleted == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid or expired state"})
		return
	}

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing authorization code"})
		return
	}

	result, err := h.service.GoogleCallback(c.Request.Context(), code)
	if err != nil {
		log.Printf("[oauth] HandleCallback error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, result)
}

func stateKey(state string) string {
	return "oauth_state:" + state
}
