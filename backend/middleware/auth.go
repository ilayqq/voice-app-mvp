package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type Claims struct {
	UserID      uint     `json:"sub"`
	PhoneNumber string   `json:"phone_number"`
	Roles       []string `json:"roles"`
	CompanyID   uint     `json:"company_id,omitempty"`
	CompanyRole string   `json:"company_role,omitempty"`
	jwt.RegisteredClaims
}

func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing or invalid token"})
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		userID := claims.UserID
		if userID == 0 {
			if sub, ok := token.Claims.(jwt.MapClaims)["sub"]; ok {
				switch v := sub.(type) {
				case float64:
					userID = uint(v)
				case int:
					userID = uint(v)
				}
			}
		}

		c.Set("user_id", userID)
		c.Set("roles", claims.Roles)
		c.Set("phone_number", claims.PhoneNumber)
		c.Set("company_id", claims.CompanyID)
		c.Set("company_role", claims.CompanyRole)

		c.Next()
	}
}
