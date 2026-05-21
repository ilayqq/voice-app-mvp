package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func RequireRole(allowed ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		roles := c.MustGet("roles").([]string)

		for _, r := range roles {
			for _, a := range allowed {
				if r == a {
					c.Next()
					return
				}
			}
		}

		c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
	}
}

//func RequireAllRoles(required ...string) gin.HandlerFunc {
//	return func(c *gin.Context) {
//		roles := c.MustGet("roles").([]string)
//
//		roleMap := make(map[string]bool)
//		for _, r := range roles {
//			roleMap[r] = true
//		}
//
//		for _, req := range required {
//			if !roleMap[req] {
//				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "forbidden"})
//				return
//			}
//		}
//
//		c.Next()
//	}
//}
