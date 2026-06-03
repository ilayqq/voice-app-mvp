package speech

import (
	"strings"
	"unicode"

	"voice-app/domain"
)

const minFuzzyMatchScore = 40

func findProductByName(products []domain.Product, name string) *domain.Product {
	query := normalizeProductName(name)
	if query == "" {
		return nil
	}

	if item := pickBestProductMatch(products, query); item != nil {
		return item
	}
	return nil
}

func findProductBySpeech(products []domain.Product, speech string) *domain.Product {
	query := speechTokensForProductMatch(speech)
	if query == "" {
		return nil
	}
	return pickBestProductMatch(products, query)
}

func speechTokensForProductMatch(speech string) string {
	cleaned := normalizeText(speech)
	if cleaned == "" {
		return ""
	}

	for _, kw := range append(append([]string{}, incomingKeywords...), outgoingKeywords...) {
		cleaned = removeKeyword(cleaned, kw)
	}
	for _, word := range append(append([]string{}, unitWords...), fillerWords...) {
		cleaned = removeKeyword(cleaned, word)
	}

	parts := strings.Fields(cleaned)
	filtered := make([]string, 0, len(parts))
	for _, part := range parts {
		if isNumericToken(part) {
			continue
		}
		filtered = append(filtered, part)
	}

	return strings.Join(filtered, " ")
}

func isNumericToken(token string) bool {
	token = strings.ReplaceAll(token, ",", ".")
	for _, r := range token {
		if r != '.' && !unicode.IsDigit(r) {
			return false
		}
	}
	return len(token) > 0
}

func pickBestProductMatch(products []domain.Product, query string) *domain.Product {
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
	if bestScore >= minFuzzyMatchScore {
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

	cWords := strings.Fields(candidate)
	qWords := strings.Fields(query)
	if len(cWords) > 0 && len(qWords) > 0 {
		tokenScore := tokenMatchScore(cWords, qWords)
		if tokenScore > 0 {
			return tokenScore
		}
	}

	cStem := stemWord(candidate)
	qStem := stemWord(query)
	if cStem != "" && qStem != "" && (cStem == qStem || strings.HasPrefix(candidate, qStem) || strings.HasPrefix(query, cStem)) {
		return 50 + min(len(cStem), len(qStem))
	}

	return 0
}

func tokenMatchScore(candidateWords, queryWords []string) int {
	if len(queryWords) == 0 {
		return 0
	}

	total := 0
	matched := 0
	for _, q := range queryWords {
		best := 0
		for _, c := range candidateWords {
			if s := wordSimilarityScore(c, q); s > best {
				best = s
			}
		}
		if best >= minFuzzyMatchScore {
			matched++
			total += best
		}
	}

	if matched == 0 {
		return 0
	}

	// Prefer matches where every spoken token maps to the product name.
	if matched == len(queryWords) {
		total += 20 * matched
	}
	return total
}

func wordSimilarityScore(a, b string) int {
	a = normalizeProductName(a)
	b = normalizeProductName(b)
	if a == b {
		return 120 + len(a)
	}
	if strings.Contains(a, b) || strings.Contains(b, a) {
		return 90 + min(len(a), len(b))
	}

	aLat := transliterateToLatin(a)
	bLat := transliterateToLatin(b)
	if aLat == bLat {
		return 85 + min(len(aLat), len(bLat))
	}
	if strings.Contains(aLat, bLat) || strings.Contains(bLat, aLat) {
		return 75 + min(len(aLat), len(bLat))
	}

	dist := levenshteinDistance(aLat, bLat)
	maxLen := max(len(aLat), len(bLat))
	if maxLen == 0 {
		return 0
	}

	// Allow one typo for short brand names (e.g. тасай -> tassay).
	maxDist := 1
	if maxLen >= 6 {
		maxDist = 2
	}
	if dist > maxDist {
		return 0
	}

	similarity := (maxLen - dist) * 100 / maxLen
	return 40 + similarity
}

func transliterateToLatin(s string) string {
	var b strings.Builder
	for _, r := range s {
		if mapped, ok := cyrillicToLatin[r]; ok {
			b.WriteString(mapped)
			continue
		}
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
		}
	}
	return b.String()
}

var cyrillicToLatin = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "h", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch",
	'ъ': "", 'ы': "y", 'ь': "", 'э': "e", 'ю': "yu", 'я': "ya",
}

func levenshteinDistance(a, b string) int {
	if a == b {
		return 0
	}
	if len(a) == 0 {
		return len(b)
	}
	if len(b) == 0 {
		return len(a)
	}

	prev := make([]int, len(b)+1)
	curr := make([]int, len(b)+1)
	for j := range prev {
		prev[j] = j
	}

	for i := 1; i <= len(a); i++ {
		curr[0] = i
		for j := 1; j <= len(b); j++ {
			cost := 1
			if a[i-1] == b[j-1] {
				cost = 0
			}
			curr[j] = minInt3(
				prev[j]+1,
				curr[j-1]+1,
				prev[j-1]+cost,
			)
		}
		prev, curr = curr, prev
	}
	return prev[len(b)]
}

func stemWord(word string) string {
	word = strings.TrimSpace(word)
	if len(word) < 4 {
		return word
	}

	suffixes := []string{
		"ами", "ями", "ов", "ев", "ей", "ам", "ям", "ах", "ях",
		"ом", "ем", "ою", "ею", "ы", "и", "а", "я", "у", "ю", "е", "о",
	}
	for _, suffix := range suffixes {
		if strings.HasSuffix(word, suffix) && len(word)-len(suffix) >= 3 {
			return word[:len(word)-len(suffix)]
		}
	}
	return word
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func minInt3(a, b, c int) int {
	return min(a, min(b, c))
}
