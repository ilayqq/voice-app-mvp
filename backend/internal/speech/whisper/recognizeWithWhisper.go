package whisper

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
)

func RecognizeWithWhisper(ctx context.Context, wavPath string) (string, error) {
	cmd := exec.CommandContext(
		ctx,
		"python3",
		"/Users/sam/GolandProjects/voice-app/internal/speech/whisper/transcribe.py",
		wavPath)

	cmd.Stderr = nil

	var out bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = os.Stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("whisper error: %v", err)
	}

	fmt.Println("Whisper output:", out.String())
	return out.String(), nil
}
