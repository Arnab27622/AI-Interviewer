# Prepify AI Service

The AI microservice backend for Prepify. Handles transcription using Whisper and uses Gemini to generate and evaluate interview questions.

## Architecture
- **FastAPI**: Microservice host
- **Whisper**: For transcribing audio
- **Google Gemini**: Generative AI models

## Setup
1. Clone repo, CD to this directory.
2. Install Python 3.9+
3. `pip install -r requirements.txt`
4. Setup `.env` file with `PORT`, `GEMINI_API_KEY`, `MODEL_NAME`.
5. Run server with `uvicorn main:app --host 0.0.0.0 --port 8000`
