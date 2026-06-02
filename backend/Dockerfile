FROM golang:1.25-alpine AS builder

RUN apk add --no-cache git ca-certificates

WORKDIR /app

RUN go install github.com/swaggo/swag/cmd/swag@latest

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN swag init -g cmd/main.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o app ./cmd/main.go


FROM python:3.11-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# openai-whisper тянет torch (~800MB+) — при медленной сети pip падает по таймауту
RUN pip install --no-cache-dir --default-timeout=600 --retries 5 \
        torch --index-url https://download.pytorch.org/whl/cpu \
    && pip install --no-cache-dir --default-timeout=600 --retries 5 openai-whisper

WORKDIR /app

COPY --from=builder /app/app .
COPY --from=builder /app/docs ./docs
COPY --from=builder /app/internal/speech/whisper ./internal/speech/whisper

ENV WHISPER_MODEL=base
ENV WHISPER_LANGUAGE=auto
ENV WHISPER_PYTHON=python3

EXPOSE 8080

CMD ["./app"]
