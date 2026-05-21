package speech

import (
	"context"
	"mime/multipart"
)

type Service interface {
	RecognizeSpeech(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader) (string, error)
}
type service struct {
}

func NewService() *service {
	return &service{}
}

func (s *service) RecognizeSpeech(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader) (string, error) {
	text, err := recognizeWithWhisper(ctx, file, fileHeader.Filename)
	if err != nil {
		return "", err
	}

	return text, nil
}
