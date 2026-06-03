package speech

import (
	"testing"

	"voice-app/domain"
)

func TestFindProductByNameFuzzy(t *testing.T) {
	products := []domain.Product{
		{ID: 1, Name: "Вода Tassay"},
		{ID: 2, Name: "Молоко"},
	}

	got := findProductByName(products, "Тасай")
	if got == nil || got.ID != 1 {
		t.Fatalf("expected Вода Tassay, got %v", got)
	}

	got = findProductByName(products, "Tassay")
	if got == nil || got.ID != 1 {
		t.Fatalf("expected Вода Tassay by latin name, got %v", got)
	}
}

func TestFindProductBySpeech(t *testing.T) {
	products := []domain.Product{
		{ID: 1, Name: "Вода Tassay"},
		{ID: 2, Name: "Молоко"},
	}

	got := findProductBySpeech(products, "Добавь 10 вода тасай")
	if got == nil || got.ID != 1 {
		t.Fatalf("expected Вода Tassay from full speech, got %v", got)
	}

	got = findProductBySpeech(products, "Добавь 10 Тасай")
	if got == nil || got.ID != 1 {
		t.Fatalf("expected Вода Tassay from speech fallback, got %v", got)
	}
}

func TestWordSimilarityTassay(t *testing.T) {
	score := wordSimilarityScore("tassay", "тасай")
	if score < minFuzzyMatchScore {
		t.Fatalf("expected fuzzy match for тасай/tassay, score=%d", score)
	}
}
