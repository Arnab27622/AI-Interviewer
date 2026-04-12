import requests
import os
import json
import base64
import time
from fastapi import HTTPException

def call_gemini(system_prompt: str, user_prompt: str, as_json: bool = False, audio_base64: str = None) -> str:
    """Shared helper to call the Gemini API. Supports text or text+audio."""
    model_name = os.getenv("MODEL_NAME")
    api_key = os.getenv("GEMINI_API_KEY")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }
    
    # Build parts list
    parts = [{"text": user_prompt}]
    if audio_base64:
        parts.append({
            "inline_data": {
                "mime_type": "audio/webm", # Most browsers record in webm
                "data": audio_base64
            }
        })

    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": parts}],
        "generationConfig": {
            "maxOutputTokens": 5000,
            **({"responseMimeType": "application/json"} if as_json else {}),
        },
    }

    timeout = int(os.getenv("REQUEST_TIMEOUT", "60"))
    
    # Retry logic for Rate Limiting (429)
    max_retries = 2
    retry_delay = 2
    
    for attempt in range(max_retries + 1):
        resp = requests.post(url, json=body, headers=headers, timeout=timeout)
        
        if resp.status_code == 429 and attempt < max_retries:
            print(f"[RETRY] 429 Too Many Requests. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
            time.sleep(retry_delay)
            retry_delay *= 2
            continue
            
        if not resp.ok:
            try:
                error_data = resp.json()
                if "error" in error_data and "message" in error_data["error"]:
                    error_msg = error_data["error"]["message"]
                else:
                    error_msg = resp.text
            except Exception:
                error_msg = resp.text
                
            print(f"[ERROR] Gemini API Failure {resp.status_code}: {error_msg}")
            
            detail = "The AI Evaluation Service encountered an upstream error. Please try again later."
            if resp.status_code == 429:
                detail = "AI Service rate limit exceeded. Please wait a moment and try again."
                
            raise HTTPException(
                status_code=resp.status_code if resp.status_code != 500 else 500,
                detail=detail
            )
        break

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
