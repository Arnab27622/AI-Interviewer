import requests
import os
import json
from fastapi import HTTPException

def call_gemini(system_prompt: str, user_prompt: str, as_json: bool = False) -> str:
    """Shared helper to call the Gemini API and return raw text output."""
    model_name = os.getenv("MODEL_NAME")
    api_key = os.getenv("GEMINI_API_KEY")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 5000,
            **({"responseMimeType": "application/json"} if as_json else {}),
        },
    }

    timeout = int(os.getenv("REQUEST_TIMEOUT", "30"))
    resp = requests.post(url, json=body, headers=headers, timeout=timeout)
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
            
        print(f"[ERROR] Gemini API Failure {resp.status_code}: {error_msg}")
            
        raise HTTPException(
            status_code=resp.status_code if resp.status_code != 500 else 500,
            detail="The AI Evaluation Service encountered an upstream error. Please try again later."
        )

    data = resp.json()
    text_output = "".join(
        part.get("text", "")
        for candidate in data.get("candidates", [])
        for part in candidate.get("content", {}).get("parts", [])
    )

    return text_output

def parse_response(text_output: str):
    """Clean and parse JSON response from the model."""
    try:
        cleaned = (
            text_output.strip()
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )
        return json.loads(cleaned)
    except Exception as e:
        raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")

def to_float(val, default: float = 0.0) -> float:
    """Safely coerce a value to float, handling formats like '8/10' or '8.5'."""
    try:
        return float(str(val).split("/")[0].strip())
    except (ValueError, TypeError):
        return default
