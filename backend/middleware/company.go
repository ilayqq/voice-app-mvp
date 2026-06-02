package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireCompany() gin.HandlerFunc {
	return func(c *gin.Context) {
		companyID, ok := GetCompanyID(c)
		if !ok || companyID == 0 {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no company access"})
			return
		}
		c.Next()
	}
}

func RequireCompanyRole(allowed ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, ok := c.Get("company_role")
		if !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "no company access"})
			return
		}
		roleStr, _ := role.(string)
		for _, a := range allowed {
			if roleStr == a {
				c.Next()
				return
			}
		}
		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}

func GetUserID(c *gin.Context) (uint, bool) {
	v, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	switch id := v.(type) {
	case uint:
		return id, true
	case float64:
		return uint(id), true
	case int:
		return uint(id), true
	case int64:
		return uint(id), true
	default:
		return 0, false
	}
}

func GetCompanyID(c *gin.Context) (uint, bool) {
	v, exists := c.Get("company_id")
	if !exists {
		return 0, false
	}
	switch id := v.(type) {
	case uint:
		return id, true
	case float64:
		return uint(id), true
	case int:
		return uint(id), true
	case int64:
		return uint(id), true
	default:
		return 0, false
	}
}
