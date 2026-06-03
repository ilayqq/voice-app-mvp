package speech

import (
	"math"
	"regexp"
	"strconv"
	"strings"
	"unicode"
)

var quantityPattern = regexp.MustCompile(`(\d+(?:[.,]\d+)?)`)

var incomingKeywords = []string{
	"добавь", "добавить", "добавте", "приход", "поступление", "положи", "положить", "принять", "прими", "закуп",
	"add", "incoming", "receive", "received", "stock in", "stockin",
	"қос", "qos", "қосу", "qosy", "qosu", "енгіз", "engiz", "енгізу", "engizu", "кіріс", "kiris",
}

var outgoingKeywords = []string{
	"убери", "убрать", "расход", "списать", "спиши", "выдать", "выдай", "продать", "продай",
	"remove", "take", "outgoing", "stock out", "stockout", "sell",
	"шығар", "shygar", "шығару", "shygary", "кетіс", "ketis", "алу", "алын",
}

var unitWords = []string{
	"бутылок", "бутылки", "бутылка", "бутылку", "штук", "штука", "штуки", "шт",
	"литров", "литра", "литр", "килограмм", "килограмма", "кг",
	"упаковок", "упаковки", "упаковка", "пачек", "пачки", "пачка",
	"bottles", "bottle", "bottls", "pieces", "piece", "pcs", "pc",
	"liters", "liter", "litres", "litre", "kilograms", "kilogram", "kg", "units", "unit",
	"дана", "dane", "ботелке", "бөтелке", "botelke", "литр", "litr",
}

var fillerWords = []string{"of", "the", "a", "an", "и", "в", "на", "по"}

type ParsedCommand struct {
	Parsed      bool
	Type        string
	Action      string
	Quantity    int
	ProductName string
}

var createProductPhrases = []string{
	"создай товар", "создать товар", "создайте товар",
	"новый товар", "новая товар", "новое товар",
	"добавить товар", "добавь товар", "добавте товар",
	"create product", "new product", "add product",
	"тауар жаса", "жаңа тауар", "жана тауар", "тауар қос", "тауар qos",
}

var createProductKeywords = []string{
	"создай", "создать", "создайте", "новый", "новая", "новое",
	"добавить", "добавь", "добавте",
	"create", "new", "add",
	"жаса", "жаңа", "жана", "қос", "qos",
}

var productNounKeywords = []string{
	"товар", "тауар", "product",
}

func ParseVoiceCommand(text string) ParsedCommand {
	normalized := normalizeText(text)
	if normalized == "" {
		return ParsedCommand{}
	}

	if nav := parseCreateProductNavigation(normalized); nav.Parsed {
		return nav
	}

	qty, qtyToken := extractQuantity(normalized)
	if qty <= 0 {
		return ParsedCommand{}
	}

	movType := detectMovementType(normalized)
	if movType == "" {
		movType = "incoming"
	}

	productName := extractProductName(normalized, qtyToken)
	if productName == "" {
		return ParsedCommand{}
	}

	return ParsedCommand{
		Parsed:      true,
		Type:        movType,
		Quantity:    qty,
		ProductName: productName,
	}
}

func parseCreateProductNavigation(text string) ParsedCommand {
	if !matchesCreateProductIntent(text) {
		return ParsedCommand{}
	}

	name := extractCreateProductName(text)
	return ParsedCommand{
		Parsed:      true,
		Type:        "navigate",
		Action:      "create_product",
		ProductName: name,
	}
}

func matchesCreateProductIntent(text string) bool {
	for _, phrase := range createProductPhrases {
		if strings.Contains(text, phrase) {
			return true
		}
	}

	hasProductNoun := false
	for _, noun := range productNounKeywords {
		if keywordInText(text, noun) {
			hasProductNoun = true
			break
		}
	}
	if !hasProductNoun {
		return false
	}

	for _, kw := range createProductKeywords {
		if keywordInText(text, kw) {
			return true
		}
	}
	return false
}

func extractCreateProductName(text string) string {
	cleaned := text
	for _, phrase := range createProductPhrases {
		cleaned = strings.ReplaceAll(cleaned, phrase, " ")
	}
	for _, kw := range append(append([]string{}, createProductKeywords...), productNounKeywords...) {
		cleaned = removeKeyword(cleaned, kw)
	}
	for _, word := range fillerWords {
		cleaned = removeKeyword(cleaned, word)
	}

	cleaned = strings.Join(strings.Fields(cleaned), " ")
	cleaned = strings.TrimSpace(cleaned)
	if cleaned == "" {
		return ""
	}
	return titleProductName(cleaned)
}

func normalizeText(text string) string {
	text = strings.ToLower(strings.TrimSpace(text))
	if text == "" {
		return ""
	}

	var b strings.Builder
	for _, r := range text {
		switch {
		case unicode.IsLetter(r), unicode.IsDigit(r):
			b.WriteRune(r)
		case r == ' ':
			b.WriteRune(' ')
		case r == '.' || r == ',':
			b.WriteRune(r)
		default:
			b.WriteRune(' ')
		}
	}

	return strings.Join(strings.Fields(b.String()), " ")
}

func extractQuantity(text string) (int, string) {
	match := quantityPattern.FindStringSubmatch(text)
	if len(match) < 2 {
		return 0, ""
	}

	token := match[1]
	value := strings.ReplaceAll(token, ",", ".")
	num, err := strconv.ParseFloat(value, 64)
	if err != nil || num <= 0 {
		return 0, ""
	}

	qty := int(math.Round(num))
	if qty <= 0 {
		return 0, ""
	}

	return qty, token
}

func detectMovementType(text string) string {
	if containsKeyword(text, outgoingKeywords) {
		return "outgoing"
	}
	if containsKeyword(text, incomingKeywords) {
		return "incoming"
	}
	return ""
}

func containsKeyword(text string, keywords []string) bool {
	for _, kw := range keywords {
		if keywordInText(text, kw) {
			return true
		}
	}
	return false
}

func keywordInText(text, keyword string) bool {
	if strings.Contains(keyword, " ") {
		return strings.Contains(text, keyword)
	}

	parts := strings.Fields(text)
	for _, part := range parts {
		if part == keyword {
			return true
		}
	}
	return false
}

func extractProductName(text, qtyToken string) string {
	cleaned := text
	cleaned = strings.ReplaceAll(cleaned, qtyToken, " ")

	for _, kw := range append(append([]string{}, incomingKeywords...), outgoingKeywords...) {
		cleaned = removeKeyword(cleaned, kw)
	}
	for _, word := range append(append([]string{}, unitWords...), fillerWords...) {
		cleaned = removeKeyword(cleaned, word)
	}

	cleaned = strings.Join(strings.Fields(cleaned), " ")
	cleaned = strings.TrimSpace(cleaned)
	if cleaned == "" {
		return ""
	}

	return titleProductName(cleaned)
}

func removeKeyword(text, keyword string) string {
	if strings.Contains(keyword, " ") {
		return strings.ReplaceAll(text, keyword, " ")
	}

	parts := strings.Fields(text)
	filtered := make([]string, 0, len(parts))
	for _, part := range parts {
		if part != keyword {
			filtered = append(filtered, part)
		}
	}
	return strings.Join(filtered, " ")
}

func titleProductName(name string) string {
	words := strings.Fields(name)
	for i, word := range words {
		if len(word) == 0 {
			continue
		}
		runes := []rune(word)
		runes[0] = unicode.ToUpper(runes[0])
		words[i] = string(runes)
	}
	return strings.Join(words, " ")
}
