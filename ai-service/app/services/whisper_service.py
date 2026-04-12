import base64
from fastapi import UploadFile
from app.services.gemini_service import call_gemini

class WhisperService:
    def __init__(self):
        # We don't need to load any local models anymore!
        self.model = True # Dummy for compatibility

    def load_model(self):
        # No-op for compatibility
        pass

    async def transcribe(self, file: UploadFile):
        try:
            # Read audio data
            audio_data = await file.read()
            # Encode to base64 for Gemini
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            system_prompt = "You are an expert transcription service. Transcribe the following audio exactly as spoken. Return ONLY the transcribed text."
            user_prompt = "Transcribe this audio:"

            transcription = call_gemini(system_prompt, user_prompt, audio_base64=audio_base64)
            return transcription.strip()

        except Exception as e:
            print(f"Transcription error via Gemini: {e}")
            return ""

whisper_service = WhisperService()
