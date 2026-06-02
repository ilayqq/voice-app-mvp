import os
import sys

import whisper

model_name = os.environ.get("WHISPER_MODEL", "medium")
language = os.environ.get("WHISPER_LANGUAGE", "auto").strip().lower()
audio_path = sys.argv[1]

model = whisper.load_model(model_name)

if language in ("", "auto"):
    # Auto-detect: Kazakh, Russian, English and other supported languages
    result = model.transcribe(audio_path)
else:
    result = model.transcribe(audio_path, language=language)

print(result["text"].strip())
