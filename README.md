# Prepify

**Prepify** is an AI Interview platform supporting multiple roles and interview styles, combining an interactive frontend with an Express API and a Python AI microservice.

## Architecture Overview
This application uses a 3-tier architecture:
1. **Frontend**: React + Vite + TypeScript
2. **Backend**: Express + MongoDB + Socket.io
3. **AI Service**: FastAPI + Gemini + Whisper

## Requirements
- Node.js 18+ (since native fetch is used)
- Python 3.9+ 
- MongoDB running locally or remotely

## Running the application
1. Set up the `ai-service` according to `ai-service/README.md`.
2. Set up the `backend` according to `backend/README.md`.
3. Set up the `frontend` by CD-ing to it, `npm install` and `npm run dev`.
