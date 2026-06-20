from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import tempfile
import os
from app.services.speech_analysis_service import SpeechAnalysisService
from app.services.whisper_service import WhisperService

router = APIRouter()

@router.post("/analyze")
def analyze_speech(
    audio: UploadFile = File(...),
    transcript: str = Form(None)
):
    """
    Analyzes uploaded audio to calculate speech metrics like pace, pauses, and filler words.
    If transcript is not provided, it generates one using Whisper.
    """
    temp_file_path = None
    try:
        # Save uploaded file temporarily
        suffix = os.path.splitext(audio.filename)[1] if audio.filename else ".webm"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = audio.file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Generate transcript if not provided
        actual_transcript = transcript
        if not actual_transcript:
            transcription_result = WhisperService.transcribe_audio(temp_file_path)
            actual_transcript = transcription_result.get("text", "")

        # Analyze speech patterns
        metrics = SpeechAnalysisService.analyze_audio(temp_file_path, actual_transcript)
        
        if "error" in metrics:
            raise HTTPException(status_code=500, detail=metrics["error"])
            
        return {
            "metrics": metrics,
            "transcript": actual_transcript
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze speech: {str(e)}")
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
