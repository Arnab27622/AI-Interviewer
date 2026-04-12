import whisper
import io
import os
import tempfile
from fastapi import HTTPException, UploadFile
from pydub import AudioSegment

class WhisperService:
    def __init__(self):
        self.model = None

    def load_model(self):
        if self.model is None:
            try:
                print("Loading Whisper model (lazy)...")
                # Using tiny.en to fit in Render Free Tier's 512MB RAM
                self.model = whisper.load_model("tiny.en")
                print("Whisper model loaded successfully.")
            except Exception as e:
                print(f"Error loading Whisper model: {e}")
                raise HTTPException(status_code=500, detail=f"Model load failed: {str(e)}")

    async def transcribe(self, file: UploadFile):
        # Load model only when needed
        if not self.model:
            self.load_model()

        tmp_path = None
        try:
            audio_data = await file.read()
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
            audio_segment = audio_segment.set_channels(1).set_frame_rate(16000)

            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
                audio_segment.export(tmp.name, format="wav")
                tmp_path = tmp.name

            result = self.model.transcribe(tmp_path, fp16=False)
            return result["text"].strip()

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.unlink(tmp_path)

whisper_service = WhisperService()
