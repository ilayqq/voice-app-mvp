package whisper

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

func RecognizeWithWhisper(ctx context.Context, audioPath string) (string, error) {
	scriptPath, err := scriptPath()
	if err != nil {
		return "", err
	}

	python := pythonCommand()
	cmd := exec.CommandContext(ctx, python, scriptPath, audioPath)
	cmd.Env = append(os.Environ(),
		fmt.Sprintf("WHISPER_MODEL=%s", modelName()),
		fmt.Sprintf("WHISPER_LANGUAGE=%s", language()),
	)

	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		msg := strings.TrimSpace(stderr.String())
		if msg == "" {
			msg = err.Error()
		}
		return "", fmt.Errorf("whisper error: %s", msg)
	}

	text := strings.TrimSpace(stdout.String())
	if text == "" {
		return "", fmt.Errorf("whisper error: empty transcription")
	}

	return text, nil
}

func pythonCommand() string {
	if python := os.Getenv("WHISPER_PYTHON"); python != "" {
		return python
	}
	if _, err := exec.LookPath("python3"); err == nil {
		return "python3"
	}
	return "python"
}

func modelName() string {
	if model := os.Getenv("WHISPER_MODEL"); model != "" {
		return model
	}
	return "medium"
}

func language() string {
	if lang := strings.TrimSpace(os.Getenv("WHISPER_LANGUAGE")); lang != "" {
		return lang
	}
	return "auto"
}

func scriptPath() (string, error) {
	if script := os.Getenv("WHISPER_SCRIPT"); script != "" {
		if _, err := os.Stat(script); err != nil {
			return "", fmt.Errorf("whisper script not found: %s", script)
		}
		return script, nil
	}

	candidates := []string{
		"internal/speech/whisper/transcribe.py",
		filepath.Join("backend", "internal", "speech", "whisper", "transcribe.py"),
	}

	for _, candidate := range candidates {
		if _, err := os.Stat(candidate); err == nil {
			abs, err := filepath.Abs(candidate)
			if err != nil {
				return candidate, nil
			}
			return abs, nil
		}
	}

	return "", fmt.Errorf("whisper script not found")
}
