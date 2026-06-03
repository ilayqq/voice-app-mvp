package speech

import "testing"

func TestParseVoiceCommand(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantType string
		wantQty  int
		wantName string
	}{
		{
			name:     "russian add water bottles",
			input:    "Добавь 10 бутылок воды",
			wantType: "incoming",
			wantQty:  10,
			wantName: "Воды",
		},
		{
			name:     "english add bottles typo",
			input:    "Add 10 bottls of water",
			wantType: "incoming",
			wantQty:  10,
			wantName: "Water",
		},
		{
			name:     "english add water",
			input:    "Add 10 water",
			wantType: "incoming",
			wantQty:  10,
			wantName: "Water",
		},
		{
			name:     "russian incoming",
			input:    "Приход 5 молока",
			wantType: "incoming",
			wantQty:  5,
			wantName: "Молока",
		},
		{
			name:     "russian outgoing",
			input:    "Убери 3 хлеба",
			wantType: "outgoing",
			wantQty:  3,
			wantName: "Хлеба",
		},
		{
			name:     "english remove",
			input:    "Remove 2 bottles of milk",
			wantType: "outgoing",
			wantQty:  2,
			wantName: "Milk",
		},
		{
			name:     "kazakh add water latin",
			input:    "10 su qos",
			wantType: "incoming",
			wantQty:  10,
			wantName: "Su",
		},
		{
			name:     "kazakh add water cyrillic",
			input:    "10 су қос",
			wantType: "incoming",
			wantQty:  10,
			wantName: "Су",
		},
		{
			name:     "kazakh incoming",
			input:    "5 сүт енгіз",
			wantType: "incoming",
			wantQty:  5,
			wantName: "Сүт",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ParseVoiceCommand(tt.input)
			if !got.Parsed {
				t.Fatalf("expected parsed command")
			}
			if got.Type != tt.wantType {
				t.Fatalf("type = %q, want %q", got.Type, tt.wantType)
			}
			if got.Quantity != tt.wantQty {
				t.Fatalf("quantity = %d, want %d", got.Quantity, tt.wantQty)
			}
			if got.ProductName != tt.wantName {
				t.Fatalf("product = %q, want %q", got.ProductName, tt.wantName)
			}
		})
	}
}

func TestParseVoiceCommandNotParsed(t *testing.T) {
	got := ParseVoiceCommand("hello world")
	if got.Parsed {
		t.Fatalf("expected unparsed command")
	}
}

func TestParseVoiceCommandCreateProduct(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantName string
	}{
		{name: "russian create product", input: "Создай товар", wantName: ""},
		{name: "russian create product with name", input: "Создай товар молоко", wantName: "Молоко"},
		{name: "russian new product", input: "Новый товар", wantName: ""},
		{name: "english create product", input: "Create product water", wantName: "Water"},
		{name: "kazakh new product", input: "Жаңа тауар сүт", wantName: "Сүт"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ParseVoiceCommand(tt.input)
			if !got.Parsed {
				t.Fatalf("expected parsed command")
			}
			if got.Type != "navigate" {
				t.Fatalf("type = %q, want navigate", got.Type)
			}
			if got.Action != "create_product" {
				t.Fatalf("action = %q, want create_product", got.Action)
			}
			if got.ProductName != tt.wantName {
				t.Fatalf("product = %q, want %q", got.ProductName, tt.wantName)
			}
		})
	}
}
