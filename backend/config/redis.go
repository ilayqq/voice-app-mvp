package config

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/redis/go-redis/v9"
)

var RD *redis.Client

func InitRedis() {
	RD = redis.NewClient(&redis.Options{
		Addr:     fmt.Sprintf("%s:6379", os.Getenv("REDIS_HOST")),
		Password: "",
		DB:       0,
	})

	if err := RD.Ping(context.Background()).Err(); err != nil {
		log.Fatal(err)
	}
}
