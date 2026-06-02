package speech

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"strings"
)

const openAITranscriptionURL = "https://api.openai.com/v1/audio/transcriptions"

func recognizeWithWhisper(ctx context.Context, file multipart.File, filename string) (string, error) {
	apiKey := os.Getenv("API_KEY")
	if apiKey == "" {
		return "", fmt.Errorf("api_key_not_set")
	}

	var body bytes.Buffer
	writer := multipart.NewWriter(&body)

	part, err := writer.CreateFormFile("file", filename)
	if err != nil {
		return "", err
	}

	if _, err = io.Copy(part, file); err != nil {
		return "", err
	}

	if err = writer.WriteField("model", "whisper-1"); err != nil {
		return "", err
	}

	// Без language — Whisper сам определяет казахский, русский или английский
	if err = writer.WriteField(
		"prompt",
		"Speech in Kazakh, Russian, or English.",
	); err != nil {
		return "", err
	}

	if err = writer.Close(); err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAITranscriptionURL, &body)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	if resp.StatusCode != http.StatusOK {
		var apiErr struct {
			Error struct {
				Message string `json:"message"`
				Code    string `json:"code"`
			} `json:"error"`
		}
		if err := json.Unmarshal(respBody, &apiErr); err == nil && apiErr.Error.Code != "" {
			switch apiErr.Error.Code {
			case "insufficient_quota":
				return "", fmt.Errorf("insufficient_quota")
			case "invalid_api_key":
				return "", fmt.Errorf("invalid_api_key")
			}
			if apiErr.Error.Message != "" {
				return "", fmt.Errorf("speech_api_error: %s", apiErr.Error.Message)
			}
		}
		return "", fmt.Errorf("speech_api_error")
	}

	var result struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		return "", err
	}

	text := strings.TrimSpace(result.Text)
	if text == "" {
		return "", fmt.Errorf("empty_transcription")
	}

	return text, nil
}
