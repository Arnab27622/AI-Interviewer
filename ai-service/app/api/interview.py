from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
import os
from ..services.gemini_service import call_gemini, parse_response, to_float
from ..services.whisper_service import whisper_service
from ..prompts import (
    GENERATION_SYSTEM_PROMPT, 
    EVALUATION_SYSTEM_PROMPT_CODING,
    EVALUATION_SYSTEM_PROMPT_CONCEPTUAL,
    get_generation_user_prompt,
    get_evaluation_user_prompt_coding,
    get_evaluation_user_prompt_conceptual
)

router = APIRouter()

class QuestionRequest(BaseModel):
    role: str = "Full-Stack Developer"
    level: str = "Junior"
    count: int = 5
    interview_type: str = "coding-mix"

class QuestionItem(BaseModel):
    question: str
    ideal_answer: str

class QuestionResponse(BaseModel):
    questions: List[QuestionItem]
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

@router.post("/generate-questions", response_model=QuestionResponse)
async def generate_questions(req: QuestionRequest):
    try:
        instruction = (
            f"The first {int(req.count * 0.2)} questions should be coding questions requiring you to write code. "
            f"The next {req.count - int(req.count * 0.2)} questions should be conceptual questions."
        ) if req.interview_type == "coding-mix" else "All questions should be conceptual questions. No runnable coding questions."

        user_prompt = get_generation_user_prompt(req.count, req.role, req.level, instruction)
        text_output = call_gemini(GENERATION_SYSTEM_PROMPT, user_prompt, as_json=True)
        
        parsed = parse_response(text_output)
        items = parsed.get("questions", []) if isinstance(parsed, dict) else parsed
        
        final_questions = [
            QuestionItem(
                question=item.get("question", item.get("text", "")),
                ideal_answer=item.get("ideal_answer", item.get("answer", ""))
            ) for item in items[:req.count] if isinstance(item, dict)
        ]

        if not final_questions:
            raise ValueError("No questions found in AI response")

        return QuestionResponse(questions=final_questions, model_used=os.getenv("MODEL_NAME", "unknown"))

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    text = await whisper_service.transcribe(file)
    return {"transcription": text}

@router.post("/evaluate", response_model=EvaluationResponse)
async def evaluate_answer(req: EvaluationRequest):
    if req.question_type == "coding":
        if not req.user_code or not req.user_code.strip():
            raise HTTPException(status_code=422, detail="user_code is required for coding questions.")
        system_prompt = EVALUATION_SYSTEM_PROMPT_CODING
        user_prompt = get_evaluation_user_prompt_coding(req.question, req.user_code)
    else:
        if not req.user_answer or not req.user_answer.strip():
            raise HTTPException(status_code=422, detail="user_answer is required for non-coding questions.")
        system_prompt = EVALUATION_SYSTEM_PROMPT_CONCEPTUAL
        user_prompt = get_evaluation_user_prompt_conceptual(req.question, req.user_answer)

    try:
        text_output = call_gemini(system_prompt, user_prompt, as_json=True)
        parsed = parse_response(text_output)
        
        if not isinstance(parsed, dict):
            parsed = {}

        return EvaluationResponse(
            technical_score=to_float(parsed.get("technical_score")),
            confidence_score=to_float(parsed.get("confidence_score")),
            ai_feedback=parsed.get("ai_feedback", "Missing feedback. Format error."),
            ideal_answer=parsed.get("ideal_answer", "Missing ideal answer. Format error."),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
