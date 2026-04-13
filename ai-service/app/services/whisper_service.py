import base64
import os
from fastapi import UploadFile
from app.services.gemini_service import call_gemini


# Service to handle audio transcription. 
# Migrated from local Whisper model to Gemini-powered transcription 
# to work within the tight 512MB RAM limits of free-tier cloud platforms.

class WhisperService:
    def __init__(self):
        # We don't need to load heavy machine learning models locally anymore!
        self.model = True # Compatibility flag

    def load_model(self):
        """No-op kept for backward compatibility with existing startup logic."""
        pass

    async def transcribe(self, file: UploadFile):
        """
        Sends audio data to Gemini API for transcription.
        Encoded as Base64 to avoid temporary file storage issues on cloud platforms.
        """
        try:
            # Read and encode bio data
            audio_data = await file.read()
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            # We use a specialized prompt to ensure we only get the text back
            system_prompt = "You are an expert transcription service. Transcribe the following audio exactly as spoken. Return ONLY the transcribed text."
            user_prompt = "Transcribe this audio:"

            # Use a separate API key for transcription to bypass rate limits if available
            transcription_api_key = os.getenv("GEMINI_API_KEY_TRANSCRIPTION")
            
            # Offload the heavy lifting to Google's infrastructure
            transcription = call_gemini(
                system_prompt, 
                user_prompt, 
                audio_base64=audio_base64, 
                api_key=transcription_api_key
            )
            return transcription.strip()

        except Exception as e:
            print(f"[CRITICAL] Gemini Transcription error: {e}")
            return ""

whisper_service = WhisperService()
