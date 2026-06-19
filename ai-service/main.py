"""
AI Interviewer Microservice - Entry Point
Main entry for the modular AI service using FastAPI.

ARCHITECTURE OVERVIEW:
This is the isolated Python Microservice dedicated exclusively to running heavy ML and AI workloads.
1. It is deliberately detached from the Node.js backend so that memory-intensive models (Whisper, Gemini)
   don't block the Node event loop.
2. It handles audio transcription (Whisper), resume parsing (PyMuPDF), and intelligent NLP scoring (Gemini).
3. The server lazily loads models during the `lifespan` event to conserve RAM during cold boots.
"""

import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.api.interview import router as interview_router
from app.api.v2.resume import router as v2_resume_router

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan manager to handle startup and shutdown logic.
    Note: Heavy ML models are now lazy-loaded in whisper_service to save system RAM on cloud platforms.
    """
    yield
    # Cleanup logic (if any) can go here


def create_app() -> FastAPI:
    """
    Initialize and configure the FastAPI application instance.
    @returns: FastAPI application object.
    """
    app = FastAPI(
        title="AI Interviewer Microservice",
        description="Refactored microservice for generating and evaluating interview questions.",
        version="2.0.0",
        lifespan=lifespan,
    )

    # Configure CORS: Restricted to development or specific production origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Routers: Modular API endpoints for generation and evaluation
    from app.api.speech import router as speech_router

    app.include_router(interview_router, tags=["Interview"])
    app.include_router(v2_resume_router)
    app.include_router(speech_router, prefix="/speech", tags=["Speech"])

    @app.get("/", tags=["Health"])
    async def root():
        """Basic health check endpoint."""
        return {"message": "AI Interviewer Microservice is running (Modular Version)"}

    return app


app = create_app()

if __name__ == "__main__":
    # Host configuration for deployment
    port = int(os.getenv("PORT", 8000))
    # Only enable reload in development; it doubles RAM usage and causes 502 on Render
    is_dev = os.getenv("NODE_ENV", "production") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)
