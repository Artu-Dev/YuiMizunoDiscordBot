from flask import Flask, request, send_file
from TTS.api import TTS
import torch
import os

app = Flask(__name__)

model_name = "tts_models/multilingual/multi-dataset/xtts_v2"
tts = TTS(model_name)
device = "cuda" if torch.cuda.is_available() else "cpu"
tts.to(device)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
speaker_wav = os.path.join(BASE_DIR, "voz_base.wav")
audio_dir = os.path.join(BASE_DIR, "audio")
os.makedirs(audio_dir, exist_ok=True)

@app.route("/speak", methods=["POST"])
def speak():
    text = request.json.get("text")
    if not text:
        return {"error": "Missing text"}, 400
    
    file_name = f"{torch.randint(0, 1_000_000_000, (1,), dtype=torch.int64).item()}.wav"
    file_path = os.path.join(audio_dir, file_name)
    
    tts.tts_to_file(text=text, file_path=file_path, speaker_wav=speaker_wav, language="pt")
    return send_file(file_path)

if __name__ == "__main__":
    app.run(port=5001)
