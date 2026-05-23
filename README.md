# Prepify - AI-Powered Interviewer 🚀

Prepify is a state-of-the-art AI Interview platform designed to help candidates prepare for their dream roles. By leveraging advanced generative AI and real-time audio processing, Prepify simulates realistic interview scenarios, providing instant feedback and personalized coaching.

---

## 🏗️ Architecture Overview

Prepify follows a modern, distributed 3-tier architecture designed for scalability and performance, integrating background job queues for heavy ML tasks:

```mermaid
graph TD
    User([User / Browser]) <--> Frontend[Frontend - React/Vite]
    Frontend <--> Backend[Backend - Node.js/Express]
    Backend <--> MongoDB[(MongoDB Atlas)]
    Backend -- Job Queues --> Redis[(Redis / BullMQ)]
    Redis -- Background Workers --> Backend
    Backend <--> AIService[AI Service - FastAPI]
    AIService <--> Gemini[[Google Gemini Cloud API]]
```

- **Frontend**: A "Neo-Dark" React/Vite application utilizing **WebSockets** for real-time progress syncing, and a rich dynamic UI for ATS Resume Analysis and PDF extraction.
- **Backend**: A hardened Express.js server managing authentication (HttpOnly JWT), session orchestration, and **BullMQ Background Workers** via Redis to offload heavy file processing and ML orchestration.
- **AI Service**: A high-efficiency Python microservice that offloads heavy transcription, resume parsing (PyMuPDF), and NLP evaluation tasks to the Google Gemini Cloud API without blocking the Node event loop.

---

## ✨ Key Features

- **🎯 Role-Specific AI Interviews**: Tailored questions based on job roles, seniority levels, and specific tech stacks generated dynamically by Gemini.
- **🎙️ Live Interview Terminal**: Interactive coder interface with real-time timers, code execution (JDoodle), and draft persistence.
- **🧠 Intelligent Evaluation**: Comprehensive feedback on answer quality, communication skills, and technical proficiency.
- **💾 Persistent Recording & WebSocket Sync**: Audio recordings are persisted in **IndexedDB**. Heavy AI tasks communicate real-time loading progress directly to the UI via Socket.io.
- **📄 ATS Resume Analyzer (Bonus Feature)**: Upload and visualize structured parsed data, with instant ATS scoring, missing keyword detection, and detailed industry alignment metrics.
- **📝 Automated Cover Letters & PDF Export**: One-click generation of beautifully formatted ATS-optimized Resumes and tailored cover letters dynamically matched to a provided Job Description.

---

## 🛠️ Tech Stack

| Component | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, TypeScript, Framer Motion, IndexedDB, Socket.io-client, React-PDF |
| **Backend** | Node.js, Express, MongoDB, Redis, BullMQ, Socket.io, JWT |
| **AI Service** | Python, FastAPI, PyMuPDF, Google Gemini API, Pydantic |
| **Deployment** | Render (Services), Vercel (Frontend), MongoDB Atlas, Upstash Redis |

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js 18+**
- **Python 3.10+**
- **MongoDB** (Local or Atlas)
- **Google Gemini API Key**

### 2. Setup All Components
For detailed setup instructions for each service, please refer to their respective READMEs:
- [/backend](./backend/README.md)
- [/ai-service](./ai-service/README.md)
- [/frontend](./frontend/README.md)

### 3. Running Locally
We've provided a helper script for Windows users:
```bash
./start-all.bat
```
Alternatively, start each service manually as described in the [Deployment Guide](./DEPLOYMENT_GUIDE.md).

---

## 📂 Project Structure

```text
AI-Interviewer/
├── ai-service/     # Python microservice for AI & Audio processing
├── backend/        # Node.js Express server & API
├── frontend/       # React application (Vite/TS)
├── start-all.bat   # Windows start script
└── DEPLOYMENT_GUIDE.md # Detailed deployment instructions
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.



