package auth

import (
	"fmt"
	"os"
	"time"
	"voice-app/domain"
	"voice-app/middleware"

	"github.com/golang-jwt/jwt/v5"
)

type TokenData struct {
	CompanyID   uint
	CompanyRole string
}

func GenerateToken(user *domain.User, data *TokenData) (string, error) {
	roleNames := make([]string, len(user.Roles))
	for i, role := range user.Roles {
		roleNames[i] = role.Name
	}

	claims := middleware.Claims{
		UserID:      user.ID,
		PhoneNumber: "",
		Roles:       roleNames,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}
	if user.PhoneNumber != nil {
		claims.PhoneNumber = *user.PhoneNumber
	}
	if data != nil {
		claims.CompanyID = data.CompanyID
		claims.CompanyRole = data.CompanyRole
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(os.Getenv("JWT_SECRET")))
	if err != nil {
		return "", fmt.Errorf("sign token: %w", err)
	}
	return tokenString, nil
}
