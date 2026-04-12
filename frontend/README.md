# Prepify Frontend 💻

The user-facing application for Prepify. A high-performance, responsive React application built with Vite and TypeScript, providing an immersive interview experience.

## ✨ Features

- **📊 Dynamic Dashboard**: View interview history, start new sessions, and track progress.
- **🎤 Interactive Interview Interface**: Smooth, distraction-free environment for answering questions.
- **📈 Comprehensive Reviews**: Detailed feedback screens with scores and AI-driven suggestions.
- **🌗 Modern UI/UX**: Clean, professional design with responsive layouts for all devices.
- **🔒 Secure Auth Flow**: Seamless integration with Google Login for quick access.

## 🏗️ Tech Stack

- **React 18**: Component-based UI library.
- **Vite**: Rapid development build tool.
- **TypeScript**: Type-safe development for robust code.
- **Shadcn UI & Tailwind CSS**: Elegant, modern styling and components.
- **Lucide Icons**: Beautiful, consistent iconography.
- **Socket.io-client**: Real-time communication with the backend.

## 🛠️ Installation & Setup

### 1. Prerequisites
- **Node.js 18+**
- **npm** or **yarn**

### 2. Environment Setup
```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 3. Configuration
Create a `.env` file in this directory:
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🏃 Running Locally

```bash
# Start the development server
npm run dev
```
The app will be available at `http://localhost:5173`.

## 🏗️ Core Modules Breakdown

- `src/pages/`: Main view components (Dashboard, Interview, Review).
- `src/components/`: Reusable UI elements and complex feature blocks.
- `src/services/`: API client and WebSocket handlers.
- `src/hooks/`: Custom React hooks for state and logic management.
- `src/features/`: Large functional modules like the Interview Runner.

---

