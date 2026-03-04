#! using Ollama

# import ollama
# import uvicorn
# import os
# from dotenv import load_dotenv
# import json
# import io
# import tempfile
# import whisper
# from fastapi import FastAPI, HTTPException, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from pydantic import BaseModel
# from typing import List, Optional
# import ollama
# import audioop
# from pydub import AudioSegment

# load_dotenv()

# PORT = int(os.getenv("PORT", 8000))
# MODEL_NAME = os.getenv("MODEL_NAME", "mistral")

# app = FastAPI(title="AI Interviewer Microservice", version="1.0.0")

# origins = ["*"]
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# WHISPER_MODEL = None

# try:
#     # Location - C:\Users\<Username>\.cache\whisper
#     print("Loading Whisper model...")
#     WHISPER_MODEL = whisper.load_model("base.en")
#     print("Whisper model loaded successfully.")
# except Exception as e:
#     print(f"Error loading Whisper model: {e}")


# class QuestionRequest(BaseModel):
#     role: str = "Full-Stack Developer"
#     level: str = "Junior"
#     count: int = 5
#     interview_type: str = "coding-mix"


# class QuestionResponse(BaseModel):
#     question: list[str]
#     model_used: str


# @app.get("/")
# async def root():
#     return {"message": "AI Interviewer Microservice is running"}


# @app.post("/generate-questions", response_model=QuestionResponse)
# async def generate_questions(req: QuestionRequest):
#     try:
#         if req.interview_type == "coding-mix":
#             coding_count = int(req.count * 0.2)
#             oral_count = int(req.count) - coding_count

#             instruction = (
#                 f"The first {coding_count} questions should be coding questions requiring you to write code."
#                 + f"The next {oral_count} questions should be conceptual questions."
#             )
#         else:
#             instruction = "All questions should be conceptual questions Do not generate any coding questions that needs to be run on a compiler or any implementation questions."

#         system_prompt = (
#             "You are an expert and highly experienced interviewer"
#             "Task: Generate {req.count} interview questions for a {req.level} {req.role}. {instruction}. Don't generate any conversational text. Just generate the questions."
#             f"Crucial: {instruction}"
#             "Output Format: Exactly one question per line. No markdown, no numbering, no explanations. Just the questions."
#         )

#         user_prompt = f"Generate exactly {req.count} unique interview questions for a {req.level} {req.role}. {instruction}. Don't generate any conversational text. Just generate the questions."

#         response = ollama.generate(
#             model=MODEL_NAME,
#             prompt=user_prompt,
#             system=system_prompt,
#             options={
#                 "temperature": 0.65,
#                 "top_p": 0.9,
#                 "top_k": 40,
#                 "num_predict": 200,
#                 "repeat_penalty": 1.1,
#                 "presence_penalty": 0.0,
#                 "frequency_penalty": 0.0,
#                 "num_ctx": 2048,
#                 "num_thread": 8,
#                 "seed": 0,
#                 "num_predict": 200,
#                 "repeat_penalty": 1.1,
#                 "presence_penalty": 0.0,
#                 "frequency_penalty": 0.0,
#                 "num_ctx": 2048,
#                 "num_thread": 8,
#                 "seed": 0,
#             },
#         )

#         questions = response["response"].strip()
#         questions = [q.strip() for q in questions.split("\n") if q.strip()]

#         return QuestionResponse(question=questions[:req.count], model_used=MODEL_NAME)

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


# if __name__ == "__main__":
#     uvicorn.run(app, host="0.0.0.0", port=PORT)


# Using Gemini API key

import requests
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
import audioop
from pydub import AudioSegment

load_dotenv()

PORT = int(os.getenv("PORT", 8000))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = os.getenv("MODEL_NAME")


app = FastAPI(title="AI Interviewer Microservice", version="1.0.0")

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

WHISPER_MODEL = None

try:
    # Location - C:\Users\<Username>\.cache\whisper
    print("Loading Whisper model...")
    WHISPER_MODEL = whisper.load_model("base.en")
    print("Whisper model loaded successfully.")
except Exception as e:
    print(f"Error loading Whisper model: {e}")


class QuestionRequest(BaseModel):
    role: str = "Full-Stack Developer"
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"


class QuestionResponse(BaseModel):
    question: list[str]
    model_used: str


@app.get("/")
async def root():
    return {"message": "AI Interviewer Microservice is running"}


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(req: QuestionRequest):
    try:
        if req.interview_type == "coding-mix":
            coding_count = int(req.count * 0.2)
            oral_count = int(req.count) - coding_count

            instruction = (
                f"The first {coding_count} questions should be coding questions requiring you to write code. "
                f"The next {oral_count} questions should be conceptual questions."
            )
        else:
            instruction = "All questions should be conceptual questions. No runnable coding questions."

        user_prompt = (
            f"Generate exactly {req.count} interview questions for a {req.level} {req.role}. "
            f"{instruction}. Just output questions, one per line, with no other text."
        )

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"

        headers = {
            "Content-Type": "application/json",
            "x-goog-api-key": GEMINI_API_KEY,
        }

        body = {
            "system_instruction": {
                "parts": [
                    {
                        "text": (
                            "You are an expert interviewer. Only output interview questions "
                            "exactly one per line, no explanations, no numbering."
                        )
                    }
                ]
            },
            "contents": [
                {"parts": [{"text": user_prompt}]}
            ],
            "generationConfig": {
                "maxOutputTokens": 5000
            }
        }

        resp = requests.post(url, json=body, headers=headers)

        if not resp.ok:
            error_detail = resp.json()
            raise HTTPException(status_code=500, detail=error_detail)

        data = resp.json()

        text_output = ""
        for candidate in data.get("candidates", []):
            for part in candidate.get("content", {}).get("parts", []):
                text_output += part.get("text", "")

        questions = [q.strip() for q in text_output.split("\n") if q.strip()]

        return QuestionResponse(question=questions[:req.count], model_used=MODEL_NAME)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    try:
        if not WHISPER_MODEL:
            raise HTTPException(status_code=500, detail="Whisper model not loaded")

        audio_data = await file.read()
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
        audio_segment = audio_segment.set_channels(1)
        audio_segment = audio_segment.set_frame_rate(16000)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            audio_segment.export(tmp.name, format="wav")
            result = WHISPER_MODEL.transcribe(tmp.name)
            os.unlink(tmp.name)

        return {"text": result["text"]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
