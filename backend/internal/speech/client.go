package speech

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"

	"voice-app/internal/speech/whisper"
)

func recognizeWithWhisper(ctx context.Context, file multipart.File, filename string) (string, error) {
	ext := filepath.Ext(filename)
	if ext == "" {
		ext = ".webm"
	}

	tmp, err := os.CreateTemp("", "voice-*"+ext)
	if err != nil {
		return "", fmt.Errorf("create temp file: %w", err)
	}
	tmpPath := tmp.Name()
	defer os.Remove(tmpPath)

	if _, err := io.Copy(tmp, file); err != nil {
		tmp.Close()
		return "", fmt.Errorf("save audio: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return "", err
	}

	return whisper.RecognizeWithWhisper(ctx, tmpPath)
}
