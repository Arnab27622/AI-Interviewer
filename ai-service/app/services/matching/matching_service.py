import logging
from app.services.matching.embedding_service import EmbeddingService
from app.services.matching.jd_analysis_service import JDAnalysisService
from app.services.gemini_service import call_gemini, parse_response

logger = logging.getLogger("ResumeJDMatchingService")

MATCHING_SYSTEM_PROMPT = """
You are a Senior Technical Recruiter and Career Coach. 
Your task is to perform a deep semantic comparison between a candidate's resume/skills profile and a Job Description (JD).
You will be provided with the resume details, the analyzed JD details, and a semantic vector similarity score computed between them.

### Output Requirements:
You MUST return a valid JSON object with the following structure:
{
  "match_score": number (0-100),
  "explanation": "string (concise summary of why this score was given, referencing the semantic similarity score)",
  "missing_skills": ["string (skills or requirements in the JD that are not in the resume)"],
  "matched_skills": ["string (skills in the resume that align with the JD)"],
  "experience_fit": "string (Good / Partial / Poor - assessment of years/level of experience)",
  "recommendations": ["string (how the candidate can bridge the gap for this specific role)"]
}

### Guidelines:
1. Review the provided semantic similarity score and factor it heavily into the final `match_score`.
2. Look beyond keyword matching. Evaluate semantic similarity (e.g., if JD asks for 'Cloud Experience' and resume has 'AWS/Azure', it's a match).
3. Be realistic. If the JD requires 5 years of React and the resume has 1 year, reflect this in the `experience_fit` and `match_score`.
4. Provide constructive, specific recommendations.
"""

class ResumeJDMatchingService:
    @staticmethod
    def match(resume_text: str, resume_skills: list[str], jd_text: str) -> dict:
        """
        Runs the comprehensive Resume-to-JD matching pipeline.
        Calculates local semantic vector similarity with FAISS, extracts JD requirements,
        and uses Gemini reasoning for contextual evaluation.
        """
        logger.info("Executing Resume-JD semantic matching pipeline")
        try:
            # 1. Analyze Job Description
            jd_data = JDAnalysisService.analyze_jd(jd_text)
            required_skills = jd_data.get("required_skills", [])
            preferred_skills = jd_data.get("preferred_skills", [])
            all_jd_skills = required_skills + preferred_skills
            
            # 2. Compute local vector embedding similarity via FAISS
            semantic_similarity = 0.0
            if resume_skills and all_jd_skills:
                try:
                    resume_embeddings = EmbeddingService.get_embeddings(resume_skills)
                    jd_embeddings = EmbeddingService.get_embeddings(all_jd_skills)
                    semantic_similarity = EmbeddingService.compute_similarity_faiss(resume_embeddings, jd_embeddings)
                    logger.info(f"FAISS cosine similarity calculated: {semantic_similarity:.4f}")
                except Exception as emb_err:
                    logger.warning(f"Failed to calculate FAISS embedding similarity: {str(emb_err)}")
            
            # 3. Use Gemini to perform final contextual cross-referencing
            user_prompt = (
                f"### Resume Text:\n{resume_text}\n\n"
                f"### Resume Extracted Skills:\n{', '.join(resume_skills) if resume_skills else 'None'}\n\n"
                f"### Job Description Requirements:\n{jd_text}\n\n"
                f"### Structured JD Analysis:\n{jd_data}\n\n"
                f"### Computed Semantic Vector Similarity (FAISS Cosine): {semantic_similarity:.4f} (where 1.0 is identical)\n"
            )
            
            from datetime import datetime
            current_year = datetime.now().year
            
            dynamic_prompt = MATCHING_SYSTEM_PROMPT + f"\n\n### CRITICAL CONTEXT:\n- The current year is {current_year}. Do NOT flag experience dates up to {current_year} as 'future dates' or 'typos'.\n"
            
            response_text = call_gemini(
                system_prompt=dynamic_prompt,
                user_prompt=user_prompt,
                as_json=True
            )
            
            match_report = parse_response(response_text)
            
            # Inject metrics and JD analysis metadata into match results
            match_report["semantic_similarity"] = round(semantic_similarity, 4)
            match_report["jd_analysis"] = jd_data
            
            logger.info("Resume-JD match report created successfully")
            return match_report
            
        except Exception as e:
            logger.error(f"Resume-JD matching pipeline failed: {str(e)}")
            raise e
