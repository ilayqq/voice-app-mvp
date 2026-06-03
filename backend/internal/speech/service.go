package speech

import (
	"context"
	"errors"
	"fmt"
	"mime/multipart"
	"strings"
	"voice-app/domain"
	"voice-app/dto"
	"voice-app/internal/product"
	"voice-app/internal/stockmovement"
)

const errProductNotFound = "product_not_found"

type CommandResult struct {
	Parsed      bool                       `json:"parsed"`
	Type        string                     `json:"type,omitempty"`
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
	stockService   stockmovement.Service
}

func NewService(productService product.Service, stockService stockmovement.Service) Service {
	return &service{
		productService: productService,
		stockService:   stockService,
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
	products, err := s.productService.GetAll(companyID)
	if err != nil {
		return nil, err
	}

	productItem := findProductByName(products, cmd.ProductName)
	if productItem == nil || productItem.ID == 0 {
		return nil, errors.New(errProductNotFound)
	}

	movement, err := s.stockService.Create(dto.StockMovementRequest{
		ProductID:   productItem.ID,
		Type:        cmd.Type,
		Quantity:    cmd.Quantity,
		Description: fmt.Sprintf("voice: %s", strings.TrimSpace(sourceText)),
	}, userID, companyID)
	if err != nil {
		return nil, err
	}

	return &CommandResult{
		Parsed:      true,
		Type:        cmd.Type,
		Quantity:    cmd.Quantity,
		ProductName: productItem.Name,
		ProductID:   productItem.ID,
		Movement:    movement,
	}, nil
}

func findProductByName(products []domain.Product, name string) *domain.Product {
	query := normalizeProductName(name)
	if query == "" {
		return nil
	}

	var (
		best       *domain.Product
		bestScore  int
		exactMatch *domain.Product
	)

	for i := range products {
		candidate := normalizeProductName(products[i].Name)
		if candidate == query {
			exactMatch = &products[i]
			break
		}

		score := nameMatchScore(candidate, query)
		if score > bestScore {
			bestScore = score
			best = &products[i]
		}
	}

	if exactMatch != nil {
		return exactMatch
	}
	if bestScore > 0 {
		return best
	}
	return nil
}

func normalizeProductName(name string) string {
	name = strings.ToLower(strings.TrimSpace(name))
	replacer := strings.NewReplacer("ё", "е")
	return replacer.Replace(name)
}

func nameMatchScore(candidate, query string) int {
	if candidate == query {
		return 1000 + len(candidate)
	}
	if strings.Contains(candidate, query) || strings.Contains(query, candidate) {
		return 100 + min(len(candidate), len(query))
	}

	cStem := stemWord(candidate)
	qStem := stemWord(query)
	if cStem != "" && qStem != "" && (cStem == qStem || strings.HasPrefix(candidate, qStem) || strings.HasPrefix(query, cStem)) {
		return 50 + min(len(cStem), len(qStem))
	}

	return 0
}

func stemWord(word string) string {
	word = strings.TrimSpace(word)
	if len(word) < 4 {
		return word
	}

	suffixes := []string{
		"ами", "ями", "ами", "ов", "ев", "ей", "ам", "ям", "ах", "ях",
		"ом", "ем", "ою", "ею", "ы", "и", "а", "я", "у", "ю", "е", "о",
	}
	for _, suffix := range suffixes {
		if strings.HasSuffix(word, suffix) && len(word)-len(suffix) >= 3 {
			return word[:len(word)-len(suffix)]
		}
	}
	return word
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
