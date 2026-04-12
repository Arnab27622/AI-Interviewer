# 🚀 Deployment Guide: AI Interviewer

This guide explains how to set up the AI Interviewer locally and how to deploy it to the cloud for free.

## 🛠️ Prerequisites
1. **Node.js** & **npm** installed.
2. **Python 3.10+** installed.
3. A **GitHub** account.
4. An **[Atlas MongoDB](https://www.mongodb.com/)** account (Free tier).
5. A **[Google AI Studio](https://aistudio.google.com/)** account (for Gemini API Key).
6. A **[Google Cloud Console](https://console.cloud.google.com/)** project (for Google Login/OAuth).

---

## 💻 Local Development Setup

### 1. Backend (`/backend`)
1. Create a `.env` file:
   ```env
   PORT=5000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=any_random_string
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   AI_SERVICE_URL=http://localhost:8000
   FRONTEND_URL=http://localhost:5173
   NODE_ENV=development
   ```
2. Run: `npm install && npm start`

### 2. AI Service (`/ai-service`)
1. Create a `.env` file:
   ```env
   GEMINI_API_KEY=your_gemini_api_key
   MODEL_NAME=gemini-2.5-flash
   REQUEST_TIMEOUT=60
   ```
2. Run: `pip install -r requirements.txt && python main.py`

### 3. Frontend (`/frontend`)
1. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   ```
2. Run: `npm install && npm run dev`

---

## ☁️ Production Deployment (Free Tier)

### 1. 🤖 AI Service (Render)
- **New Web Service** -> Connect Repo.
- **Root Directory**: `ai-service`
- **Build Command**: `pip install -r requirements.txt` (Ensure `torch` and `whisper` are NOT in your requirements.txt to avoid OOM crashes).
- **Start Command**: `python main.py`
- **Env Vars**: Add `GEMINI_API_KEY`, `MODEL_NAME=gemini-2.5-flash`, `REQUEST_TIMEOUT=60`.

### 2. ⚙️ Backend (Render)
- **New Web Service** -> Connect Repo.
- **Root Directory**: `backend`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Env Vars**: Add `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Set `AI_SERVICE_URL` to your Render AI Service URL.

### 3. 💻 Frontend (Vercel)
- **Import Project** -> Connect Repo.
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Env Vars**: Add `VITE_API_URL` (your Render backend URL + `/api`) and `VITE_GOOGLE_CLIENT_ID`.

---

## 🔗 Finalizing Google OAuth
To make Google Login work in production:
1. Go to **Google Cloud Console** -> APIs & Services -> Credentials.
2. Add your Vercel URL (e.g., `https://my-app.vercel.app`) to **Authorized JavaScript Origins**.
3. Add `https://your-backend.onrender.com/api/user/auth/google/callback` to **Authorized redirect URIs**.

---

## 💡 Troubleshooting
- **502 Bad Gateway**: Usually a "Cold Start" on Render. Wait 30 seconds and refresh.
- **Cookie/Login Issues**: Ensure `NODE_ENV=production` is set in your Render Backend environment variables.
- **Memory Limits**: This app is optimized to run on 512MB RAM using Gemini's native audio support. Do not use local Whisper/Torch models on Render Free Tier.
