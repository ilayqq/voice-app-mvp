package auth

import (
	"fmt"
	"os"
	"time"
	"voice-app/domain"

	"github.com/golang-jwt/jwt/v5"
)

func GenerateToken(user *domain.User) (string, error) {
	roleNames := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":          user.ID,
		"phone_number": user.PhoneNumber,
		"roles":        roleNames,
		"exp":          time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}

	return tokenString, nil
}
