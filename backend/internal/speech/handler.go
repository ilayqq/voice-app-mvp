package speech

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"voice-app/internal/speech/whisper"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) Recognize(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(
		c.Writer,
		c.Request.Body,
		20<<20, // 20 MB
	)

	header, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file required"})
		return
	}

	src, err := header.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot open file"})
		return
	}
	defer src.Close()

	tmp, err := os.CreateTemp("", "whisper-*.wav")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "temp file error"})
		return
	}
	defer os.Remove(tmp.Name())
	defer tmp.Close()

	if _, err := io.Copy(tmp, src); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "write error"})
		return
	}

	ctx := c.Request.Context()

	text, err := whisper.RecognizeWithWhisper(ctx, tmp.Name())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	fmt.Println(text)
	c.JSON(http.StatusOK, gin.H{"text": text})
}
