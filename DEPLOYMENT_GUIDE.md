# 🚀 Deployment Guide: AI Interviewer

This guide explains how to set up the AI Interviewer locally and how to deploy it to the cloud for free.

## 🛠️ Prerequisites
1. **Node.js** & **npm** installed.
2. **Python 3.10+** installed.
3. A **GitHub** account.
4. An **[Atlas MongoDB](https://www.mongodb.com/)** account (Free tier).
5. An **[Upstash Redis](https://upstash.com/)** account (Free tier, required for background queues).
6. A **[Google AI Studio](https://aistudio.google.com/)** account (for Gemini API Key).
7. A **[Google Cloud Console](https://console.cloud.google.com/)** project (for Google Login/OAuth).
8. A **[JDoodle](https://www.jdoodle.com/)** account (for Live Code Execution API).

---

## 💻 Local Development Setup

### 1. Backend (`/backend`)
1. Create a `.env` file:
   ```env
   MONGO_URI=your_mongodb_connection_string_here
   FRONTEND_URL=http://localhost:5173
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_secure_jwt_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id_here
   GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   AI_SERVICE_URL=http://localhost:8000
   JDOODLE_CLIENT_ID=your_jdoodle_client_id_here
   JDOODLE_CLIENT_SECRET=your_jdoodle_client_secret_here
   REDIS_URL=rediss://default:your_upstash_redis_password@your-upstash-endpoint.upstash.io:6379
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
   CLOUDINARY_API_KEY=your_cloudinary_api_key_here
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
   ```
2. Run: `npm install && npm run dev`

### 2. AI Service (`/ai-service`)
1. Create a `.env` file:
   ```env
   PORT=8000
   MODEL_NAME=gemini-3.1-flash-lite
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_API_KEY_TRANSCRIPTION=your_gemini_api_key_here
   ALLOWED_ORIGINS=http://localhost:5000,http://localhost:5173
   REQUEST_TIMEOUT=60
   ```
2. Run: `pip install -r requirements.txt && python main.py`

### 3. Frontend (`/frontend`)
1. Create a `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   ```
2. Run: `npm install && npm run dev`

---

## ☁️ Production Deployment (Free Tier)

### 1. 🚀 Deploy Backend & AI Service (Render)
We have provided a `render.yaml` Blueprint which automatically configures Docker-based deployments for both services. The AI Service uses Docker to properly install `tesseract-ocr` and `poppler-utils`.

1. Go to your Render Dashboard and click **New** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will detect the `render.yaml` file.
4. Fill in the required environment variables in the Render UI (e.g., `MONGO_URI`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FRONTEND_URL`, `GEMINI_API_KEY`, `REDIS_URL`).
5. Click **Apply**. Render will build and deploy both the `ai-interviewer-backend` and `ai-interviewer-ai-service` automatically using the provided Dockerfiles.

*Note: You can find the AI Service URL in your Render dashboard after deployment. Update your Backend's `AI_SERVICE_URL` environment variable to point to it, and the Backend URL will go in your Frontend's `VITE_API_URL`.*

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
