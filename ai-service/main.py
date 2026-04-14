import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from app.api.interview import router as interview_router


load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Model is now lazy-loaded in whisper_service to save startup RAM
    yield
    # Cleanup logic (if any) can go here

def create_app() -> FastAPI:
    app = FastAPI(
        title="AI Interviewer Microservice",
        description="Refactored microservice for generating and evaluating interview questions.",
        version="2.0.0",
        lifespan=lifespan
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include Routers
    app.include_router(interview_router, tags=["Interview"])

    @app.get("/", tags=["Health"])
    async def root():
        return {"message": "AI Interviewer Microservice is running (Modular Version)"}

    return app

app = create_app()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Only enable reload in development; it doubles RAM usage and causes 502 on Render
    is_dev = os.getenv("NODE_ENV", "production") == "development"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=is_dev)
