# Prepify Frontend 💻

The user-facing application for Prepify. A high-performance, responsive React application built with Vite and TypeScript, providing an immersive interview experience.

## ✨ Features

- **📊 Dynamic Dashboard**: View interview history and stats with professional **Skeleton Shimmer** loading states.
- **🎙️ Persistent Resume System**: Leveraging **IndexedDB** to store audio blobs and code drafts locally, ensuring no progress is lost if the browser is closed mid-session.
- **🎤 Interactive Interview Terminal**: Real-time status updates (Transcribing -> Evaluating -> Feedback Ready) via WebSockets.
- **⏲️ Active Session Timer**: Real-time display of interview duration.
- **📈 Performance Visualization**: Detailed feedback reports with SVG progress rings and Chart.js mastery calibration charts.
- **📁 PDF Reporting**: Print-optimized reporting system for exporting interview results.

## 🏗️ Tech Stack

- **React 18 & TypeScript**: Robust, type-safe Component UI.
- **Vite**: Ultra-fast build tool and dev server.
- **Framer Motion**: Smooth micro-animations and layout transitions.
- **IndexedDB**: Persistent client-side storage for binary audio data.
- **Chart.js**: Graphical mastery calibration and performance metrics.
- **Tailwind CSS**: Utility-first CSS for the modern Neo-Dark design system.
- **Socket.io-client**: Real-time event synchronization.

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

## 📂 Core Modules Breakdown

- `src/pages/`: Main view components (Dashboard, Interview, Review).
- `src/components/`: Reusable UI elements, loaders, and card systems.
- `src/features/`: Feature-sliced logic for the Session Runner and User Auth.
- `src/hooks/`: Custom hooks for Audio Recording and Socket management.
- `src/utils/`: IndexedDB handlers and formatting utilities.

---

