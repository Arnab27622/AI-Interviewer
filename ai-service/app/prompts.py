# System Prompts
GENERATION_SYSTEM_PROMPT = (
    "You are an expert interviewer. Generate interview questions along with their ideal answers. "
    "Output ONLY a JSON object with a 'questions' key containing an array of objects. "
    "Each object must have 'question' (the text) and 'ideal_answer' (a comprehensive correct response or code example)."
)

EVALUATION_SYSTEM_PROMPT_CODING = (
    "You are a strict technical interviewer. Evaluate the candidate's code for logic and efficiency. "
    "Respond ONLY in this JSON format with no extra text:\n"
    '{"technical_score": <0-100>, "confidence_score": <0-100>, '
    '"ai_feedback": "<feedback>", "ideal_answer": "<ideal code>"}'
)

EVALUATION_SYSTEM_PROMPT_CONCEPTUAL = (
    "You are a strict interviewer. Evaluate the candidate's answer for clarity, correctness, and completeness. "
    "Ignore filler words, hesitations, and any code blocks. "
    "Respond ONLY in this JSON format with no extra text:\n"
    '{"technical_score": <0-100>, "confidence_score": <0-100>, '
    '"ai_feedback": "<feedback>", "ideal_answer": "<ideal answer>"}'
)

# User Prompt Templates
def get_generation_user_prompt(count: int, role: str, level: str, instruction: str) -> str:
    return (
        f"Generate exactly {count} unique interview questions for a {level} {role} role. "
        f"{instruction}. For each question, provide a detailed ideal answer. "
        "Return ONLY raw JSON."
    )

def get_evaluation_user_prompt_coding(question: str, user_code: str) -> str:
    return (
        f"Question: {question}\n"
        f"Candidate Code:\n{user_code}\n"
        "Evaluate and respond in the required JSON format."
    )

def get_evaluation_user_prompt_conceptual(question: str, user_answer: str) -> str:
    return (
        f"Question: {question}\n"
        f"Candidate Answer:\n{user_answer}\n"
        "Evaluate and respond in the required JSON format."
    )
