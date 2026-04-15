# Prepify Backend ⚙️

The core orchestrator for Prepify. This Node.js service manages the API, user authentication, session state, and coordinates communication between the frontend and the AI microservice.

## 🚀 Key Responsibilities

- **🔐 User Management**: Handles Google OAuth 2.0 and JWT-based session management using HttpOnly cookies.
- **🔄 Session Orchestration**: Manages the lifecycle of an interview session, from question generation to final evaluation.
- **📡 Real-time Updates**: Uses Socket.io to provide live progress feedback during heavy AI processing tasks.
- **🛡️ Request Throttling**: Implements API rate limiting to prevent resource exhaustion and abuse.
- **💾 Data Persistence**: Manages user profiles, interview history, and evaluation results using MongoDB.

## 🏗️ Tech Stack

- **Node.js & Express**: Fast and scalable web framework.
- **MongoDB & Mongoose**: NoSQL database for flexible data modeling.
- **Socket.io**: Real-time, bidirectional communication engine.
- **Passport.js**: Authentication middleware for Google OAuth.
- **JWT**: Secure token-based authorization.
- **Express-rate-limit**: Protective middleware against brute-force and DoS.

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js 18+**
- **npm** or **yarn**
- **MongoDB** (Local instance or Atlas URI)

### 2. Environment Setup
```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in this directory based on `.env.example`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
AI_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## 🏃 Running the Server

```bash
# Development mode with hot-reload
npm run dev

# Production mode
npm start
```

## 📡 API Endpoints (Highlights)

- `GET /health`: Health check endpoint for cloud monitoring. Returns database connectivity status.
- `POST /api/sessions`: Create a new session (Rate limited: 5 req / 15 mins).
- `GET /api/sessions`: Retrieve paginated interview history.
- `POST /api/auth/google`: OAuth login entry point.

## 📂 Internal Directory Structure

- `controllers/`: Logic for handling API requests.
- `models/`: Mongoose schemas for Users, Interviews, etc.
- `routes/`: Express route definitions.
- `services/`: External service integration (AI Service, Socket logic).
- `middleware/`: Auth, validation, and error handling filters.

---

## 🛡️ Security Features
- **HTTP-Only Cookies**: Secure storage for JWTs (mitigates XSS).
- **CORS Protection**: Hardened restricted origins for cross-domain safety.
- **Rate Limiting**: Automated IP-based throttling on sensitive creation endpoints.
- **Graceful Shutdown**: Handles process signals to close DB connections cleanly.

