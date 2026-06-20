from fastapi import APIRouter, UploadFile, File, HTTPException, Body
import logging
from app.services.resume_orchestrator_service import ResumeOrchestratorService
from app.services.generation.resume_generation_service import ResumeGenerationService

logger = logging.getLogger("ResumeRouterV2")

router = APIRouter(prefix="/resume/v2", tags=["Resume (v2)"])

@router.post("/process")
async def process_resume_v2(file: UploadFile = File(...)):
    """
    [SOA v2] Handles file upload, text extraction, OCR fallback, and LLM-based parsing.
    Returns raw text and structured parsed profile.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = file.filename.lower().split(".")[-1]
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Must be PDF, DOCX, or TXT.",
        )

    try:
        contents = await file.read()
        return ResumeOrchestratorService.process_resume(contents, file.filename)
    except ValueError as ve:
        logger.warning(f"[v2/process] Validation Error: {str(ve)}")
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"[v2/process] Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing resume: {str(e)}")


@router.post("/analyze")
async def analyze_resume_v2(payload: dict = Body(...)):
    """
    [SOA v2] Performs modular analysis using COMBINED Gemini calls to stay within
    free-tier rate limits (15 RPM).
    """
    raw_text = payload.get("raw_text")
    parsed_profile = payload.get("parsed_profile", {})

    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text is required")

    try:
        return ResumeOrchestratorService.analyze_resume(raw_text, parsed_profile)
    except Exception as e:
        logger.error(f"[v2/analyze] Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error during modular analysis: {str(e)}"
        )


@router.post("/match")
async def match_resume_v2(payload: dict = Body(...)):
    """
    [SOA v2] Analyzes JD, performs semantic contextual matching via Gemini, and
    performs semantic scoring with Gemini contextual cross-referencing.
    """
    resume_text = payload.get("resume_text")
    resume_skills = payload.get("resume_skills", [])
    jd_text = payload.get("jd_text")

    if not resume_text or not jd_text:
        raise HTTPException(status_code=400, detail="resume_text and jd_text are required")

    try:
        return ResumeOrchestratorService.match_resume(resume_text, resume_skills, jd_text)
    except Exception as e:
        logger.error(f"[v2/match] Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error during JD matching: {str(e)}"
        )


@router.post("/rewrite-bullet")
async def rewrite_bullet(payload: dict = Body(...)):
    """
    [SOA v2] Rewrites a single resume bullet point into 3 STAR method variations.
    """
    bullet = payload.get("bullet")
    resume_context = payload.get("resume_context", "")

    if not bullet:
        raise HTTPException(status_code=400, detail="bullet is required")

    try:
        return ResumeGenerationService.rewrite_bullet(bullet, resume_context)
    except Exception as e:
        logger.error(f"[v2/rewrite-bullet] Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error during bullet rewrite: {str(e)}"
        )


@router.post("/generate-cover-letter")
async def generate_cover_letter(payload: dict = Body(...)):
    """
    [SOA v2] Generates a tailored cover letter based on resume and JD.
    """
    resume_text = payload.get("resume_text")
    jd_text = payload.get("jd_text")

    if not resume_text or not jd_text:
        raise HTTPException(status_code=400, detail="resume_text and jd_text are required")

    try:
        return ResumeGenerationService.generate_cover_letter(resume_text, jd_text)
    except Exception as e:
        logger.error(f"[v2/generate-cover-letter] Error: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Error generating cover letter: {str(e)}"
        )


from fastapi.responses import StreamingResponse
from app.services.analysis.feedback_stream_service import FeedbackStreamService

@router.post("/stream-feedback")
async def stream_feedback_v2(payload: dict = Body(...)):
    """
    [SOA v2] Streams a markdown feedback report for the given resume text.
    """
    raw_text = payload.get("raw_text")

    if not raw_text:
        raise HTTPException(status_code=400, detail="raw_text is required")

    def generate():
        for chunk in FeedbackStreamService.stream_feedback(raw_text):
            yield chunk

    return StreamingResponse(generate(), media_type="text/plain")
