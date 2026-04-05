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
from typing import Optional
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


class QuestionItem(BaseModel):
    question: str
    ideal_answer: str

class QuestionResponse(BaseModel):
    questions: list[QuestionItem]
    model_used: str


class EvaluationRequest(BaseModel):
    question: str
    question_type: str
    role: str = "Full-Stack Developer"
    level: Optional[str] = None
    user_answer: Optional[str] = None
    user_code: Optional[str] = None


class EvaluationResponse(BaseModel):
    technical_score: float
    confidence_score: float
    ai_feedback: str
    ideal_answer: str


def call_gemini(system_prompt: str, user_prompt: str, as_json: bool = False) -> str:
    """Shared helper to call the Gemini API and return raw text output."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL_NAME}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
    }
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 5000,
            **({"responseMimeType": "application/json"} if as_json else {}),
        },
    }

    resp = requests.post(url, json=body, headers=headers)
    if not resp.ok:
        try:
            error_data = resp.json()
            if "error" in error_data and "message" in error_data["error"]:
                error_msg = error_data["error"]["message"]
            elif "detail" in error_data:
                error_msg = str(error_data["detail"])
            else:
                error_msg = resp.text
        except Exception:
            error_msg = resp.text
            
        raise HTTPException(
            status_code=resp.status_code if resp.status_code != 500 else 500,
            detail=error_msg
        )

    data = resp.json()
    text_output = ""
    for candidate in data.get("candidates", []):
        for part in candidate.get("content", {}).get("parts", []):
            text_output += part.get("text", "")

    return text_output


def to_float(val, default: float = 0.0) -> float:
    """Safely coerce a value to float, handling formats like '8/10' or '8.5'."""
    try:
        return float(str(val).split("/")[0].strip())
    except (ValueError, TypeError):
        return default


@app.get("/")
async def root():
    return {"message": "AI Interviewer Microservice is running"}


@app.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(req: QuestionRequest):
    try:
        if req.interview_type == "coding-mix":
            coding_count = int(req.count * 0.2)
            oral_count = req.count - coding_count
            instruction = (
                f"The first {coding_count} questions should be coding questions requiring you to write code. "
                f"The next {oral_count} questions should be conceptual questions."
            )
        else:
            instruction = "All questions should be conceptual questions. No runnable coding questions."

        system_prompt = (
            "You are an expert interviewer. Generate interview questions along with their ideal answers. "
            "Output ONLY a JSON object with a 'questions' key containing an array of objects. "
            "Each object must have 'question' (the text) and 'ideal_answer' (a comprehensive correct response or code example)."
        )
        user_prompt = (
            f"Generate exactly {req.count} unique interview questions for a {req.level} {req.role} role. "
            f"{instruction}. For each question, provide a detailed ideal answer. "
            "Return ONLY raw JSON."
        )

        text_output = call_gemini(system_prompt, user_prompt, as_json=True)
        
        try:
            cleaned = (
                text_output.strip()
                .removeprefix("```json")
                .removeprefix("```")
                .removesuffix("```")
                .strip()
            )
            parsed = json.loads(cleaned)
            
            # Accommodate both {"questions": [...]} and [...]
            if isinstance(parsed, dict):
                items = parsed.get("questions", [])
            elif isinstance(parsed, list):
                items = parsed
            else:
                items = []

            # Ensure we match the requested count and format
            final_questions = []
            for item in items[:req.count]:
                final_questions.append(QuestionItem(
                    question=item.get("question", item.get("text", "")),
                    ideal_answer=item.get("ideal_answer", item.get("answer", ""))
                ))

            if not final_questions:
                # If parsing failed or returned empty
                raise ValueError("No questions found in JSON response")

            return QuestionResponse(questions=final_questions, model_used=MODEL_NAME)
        except Exception as e:
            print(f"JSON parsing error: {e}")
            print(f"Raw output was: {text_output!r}")
            raise HTTPException(status_code=500, detail=f"Failed to parse AI response: {str(e)}")

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    tmp_path = None
    try:
        if not WHISPER_MODEL:
            raise HTTPException(status_code=500, detail="Whisper model not loaded")

        audio_data = await file.read()
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
        audio_segment = audio_segment.set_channels(1).set_frame_rate(16000)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            audio_segment.export(tmp.name, format="wav")
            tmp_path = tmp.name

        result = WHISPER_MODEL.transcribe(tmp_path, fp16=False)
        return {"transcription": result["text"].strip()}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


@app.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(req: EvaluationRequest):
    if req.question_type == "coding":
        if not req.user_code or not req.user_code.strip():
            raise HTTPException(status_code=422, detail="user_code is required for coding questions.")
        system_prompt = (
            "You are a strict technical interviewer. Evaluate the candidate's code for logic and efficiency. "
            "Respond ONLY in this JSON format with no extra text:\n"
            '{"technical_score": <0-100>, "confidence_score": <0-100>, '
            '"ai_feedback": "<feedback>", "ideal_answer": "<ideal code>"}'
        )
        user_prompt = (
            f"Question: {req.question}\n"
            f"Candidate Code:\n{req.user_code}\n"
            "Evaluate and respond in the required JSON format."
        )
    else:
        if not req.user_answer or not req.user_answer.strip():
            raise HTTPException(status_code=422, detail="user_answer is required for non-coding questions.")
        system_prompt = (
            "You are a strict interviewer. Evaluate the candidate's answer for clarity, correctness, and completeness. "
            "Ignore filler words, hesitations, and any code blocks. "
            "Respond ONLY in this JSON format with no extra text:\n"
            '{"technical_score": <0-100>, "confidence_score": <0-100>, '
            '"ai_feedback": "<feedback>", "ideal_answer": "<ideal answer>"}'
        )
        user_prompt = (
            f"Question: {req.question}\n"
            f"Candidate Answer:\n{req.user_answer}\n"
            "Evaluate and respond in the required JSON format."
        )

    try:
        text_output = call_gemini(system_prompt, user_prompt, as_json=True)

        cleaned = (
            text_output.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        parsed = json.loads(cleaned)

        return EvaluationResponse(
            technical_score=to_float(parsed.get("technical_score")),
            confidence_score=to_float(parsed.get("confidence_score")),
            ai_feedback=parsed.get("ai_feedback", ""),
            ideal_answer=parsed.get("ideal_answer", ""),
        )

    except HTTPException:
        raise
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to parse model response as JSON: {e}. Raw output: {text_output!r}",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=PORT)
