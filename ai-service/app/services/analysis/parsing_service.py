from app.services.gemini_service import call_gemini, parse_response
import logging

logger = logging.getLogger("ResumeParsingService")

PARSING_SYSTEM_PROMPT = """
You are an expert ATS parser. Your goal is to convert raw unstructured resume text into a highly structured JSON profile.
You MUST output a valid JSON object matching the exact structure below:
{
  "personal_info": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "links": ["string"]
  },
  "summary": "string (concise profile summary)",
  "experience": [
    {
      "company": "string",
      "role": "string",
      "duration": "string",
      "description": "string"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "year": "string"
    }
  ]
}
Be precise. If some sections are missing, leave them empty or as empty arrays. Do not invent any facts.
"""

class ResumeParsingService:
    @staticmethod
    def parse(raw_text: str) -> dict:
        logger.info("Executing LLM resume parsing pipeline")
        user_prompt = f"Extract structured profile data from the following resume text:\n\n{raw_text}"
        try:
            response_text = call_gemini(
                system_prompt=PARSING_SYSTEM_PROMPT,
                user_prompt=user_prompt,
                as_json=True
            )
            parsed_data = parse_response(response_text)
            logger.info("Resume parsed successfully")
            return parsed_data
        except Exception as e:
            logger.error(f"Resume parsing failed: {str(e)}")
            raise e
