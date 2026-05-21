import whisper
import sys

# print("Python script работает")

model = whisper.load_model("medium")

audio_path = sys.argv[1]

result = model.transcribe(audio_path, language="kk")

print(result["text"])