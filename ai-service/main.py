import uvicorn
import os
from dotenv import load_dotenv
import json
import io
import tempfile
import whisper
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import ollama
from pydub import AudioSegment

load_dotenv()

PORT = os.getenv("PORT", 8000)
MODEL_NAME = os.getenv("MODEL_NAME", "mistral")

app = FastAPI(title="AI Interviewer Microservice", version="1.0.0")

origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"Hello": "World"}

if __name__ == "__main__":
    uvicorn.run(app, host="[IP_ADDRESS]", port=8000)