# Prepify AI Service 🤖

The AI microservice backend for Prepify. This service specialized in handling heavy-duty AI tasks, including audio transcription and generative interview intelligence, while maintaining a minimal resource footprint.

## 🚀 Capabilities

- **🎙️ Cloud-Native Transcription**: Offloads verbal analysis to Gemini Cloud, staying within strict RAM limits (under 512MB) of free-tier hosting.
- **🧠 Generative Intelligence**: Uses advanced system prompting to generate exactly `n` role-specific questions with JSON output guarantees.
- **🛡️ Security Guardrails**: Implements input sanitization and prompt-injection hardening to prevent malicious behavior through user-provided roles or answers.
- **⚡ Async Execution**: Built with FastAPI for non-blocking processing of multiple parallel evaluation requests.

## 🏗️ Tech Stack

- **FastAPI**: Asynchronous, high-performance Python framework.
- **Google Generative AI**: Native SDK for optimized interaction with Gemini models.
- **Uvicorn**: Production-grade ASGI server with worker-based scaling.
- **Pydantic**: Type-strict data validation for all API requests and responses.

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Python 3.10+**
- (Recommended) **Virtual Environment**

### 2. Environment Setup
```bash
# Clone the repository and navigate to this directory
cd ai-service

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Configuration
Create a `.env` file in this directory based on `.env.example`:
```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_API_KEY_TRANSCRIPTION=your_gemini_api_key_here
MODEL_NAME=gemini-2.5-flash
REQUEST_TIMEOUT=60
```

## 🏃 Running the Service

```bash
# Production run
uvicorn main:app --host 0.0.0.0 --port 8000

# Development with reload (Increases RAM usage)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Endpoints (Core)

- `POST /generate-questions`: Batch generation of technical/conceptual questions.
- `POST /evaluate`: Detailed scoring and feedback for a specific answer/code snippet.
- `POST /transcribe`: High-speed audio-to-text conversion via Gemini base64 encoding.

---

## 🔒 Optimization & Architecture
- **Lazy Loading**: Service components are initialized only when first called to preserve startup memory.
- **Stateless Design**: Allows the service to be horizontally scaled without sticky sessions.
- **JSON Mode**: Explicitly uses `response_mime_type: application/json` for deterministic AI responses.

