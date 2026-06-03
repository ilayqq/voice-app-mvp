package speech

import (
	"context"
	"errors"
	"mime/multipart"
	"voice-app/dto"
	"voice-app/internal/product"
)

const errProductNotFound = "product_not_found"

type CommandResult struct {
	Parsed      bool                       `json:"parsed"`
	Type        string                     `json:"type,omitempty"`
	Action      string                     `json:"action,omitempty"`
	Quantity    int                        `json:"quantity,omitempty"`
	ProductName string                     `json:"product_name,omitempty"`
	ProductID   uint                       `json:"product_id,omitempty"`
	Movement    *dto.StockMovementResponse `json:"movement,omitempty"`
	Error       string                     `json:"error,omitempty"`
}

type RecognizeResult struct {
	Text    string         `json:"text"`
	Command *CommandResult `json:"command,omitempty"`
}

type Service interface {
	RecognizeAndExecute(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, userID, companyID uint) (*RecognizeResult, error)
}

type service struct {
	productService product.Service
}

func NewService(productService product.Service) Service {
	return &service{
		productService: productService,
	}
}

func (s *service) RecognizeAndExecute(ctx context.Context, file multipart.File, fileHeader *multipart.FileHeader, userID, companyID uint) (*RecognizeResult, error) {
	text, err := recognizeWithWhisper(ctx, file, fileHeader.Filename)
	if err != nil {
		return nil, err
	}

	result := &RecognizeResult{Text: text}
	cmd := ParseVoiceCommand(text)
	if !cmd.Parsed {
		result.Command = &CommandResult{Parsed: false}
		return result, nil
	}

	execResult, err := s.executeCommand(cmd, userID, companyID, text)
	if err != nil {
		result.Command = &CommandResult{
			Parsed:      true,
			Type:        cmd.Type,
			Quantity:    cmd.Quantity,
			ProductName: cmd.ProductName,
			Error:       err.Error(),
		}
		return result, nil
	}

	result.Command = execResult
	return result, nil
}

func (s *service) executeCommand(cmd ParsedCommand, userID, companyID uint, sourceText string) (*CommandResult, error) {
	if cmd.Type == "navigate" {
		return &CommandResult{
			Parsed:      true,
			Type:        cmd.Type,
			Action:      cmd.Action,
			ProductName: cmd.ProductName,
		}, nil
	}

	products, err := s.productService.GetAll(companyID)
	if err != nil {
		return nil, err
	}

	productItem := findProductByName(products, cmd.ProductName)
	if productItem == nil {
		productItem = findProductBySpeech(products, sourceText)
	}
	if productItem == nil || productItem.ID == 0 {
		return nil, errors.New(errProductNotFound)
	}

	return &CommandResult{
		Parsed:      true,
		Type:        cmd.Type,
		Quantity:    cmd.Quantity,
		ProductName: productItem.Name,
		ProductID:   productItem.ID,
	}, nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
