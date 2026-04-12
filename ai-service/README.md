# Prepify AI Service 🤖

The AI microservice backend for Prepify. This service specialized in handling heavy-duty AI tasks, including audio transcription and generative interview intelligence.

## 🚀 Capabilities

- **🎙️ Advanced Transcription**: Utilizes Gemini's native audio analysis to transcribe and understand candidate responses.
- **🧠 Generative Intelligence**: Leverages Google Gemini models to generate contextual interview questions and evaluate candidate performance.
- **⚡ High Performance**: Built with FastAPI for asynchronous execution and low-latency response times.

## 🏗️ Tech Stack

- **FastAPI**: Modern, fast (high-performance) web framework for building APIs with Python.
- **Google Generative AI SDK**: Direct integration with Gemini models.
- **Uvicorn**: Lightning-fast ASGI server implementation.

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
Create a `.env` file in this directory:
```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-2.5-flash
REQUEST_TIMEOUT=60
```

## 🏃 Running the Service

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## 📡 API Endpoints (Highlights)

- `GET /health`: Health check endpoint.
- `POST /transcribe`: Process audio files and return AI-driven insights (Internal use by Backend).
- `POST /generate`: Generate customized interview questions based on role.

---

## 🔒 Security & Optimization
- **CORS Configured**: Restricted to trusted origins in production.
- **Memory Optimized**: Designed to run efficiently on free-tier platforms by offloading transcription to the cloud.

