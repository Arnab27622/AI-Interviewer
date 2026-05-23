import requests
import os
import json
import time
import threading
from fastapi import HTTPException

# ============================================================================
# Global Rate Limiter
# ============================================================================
# Gemini free-tier limits: 15 RPM for gemini-2.5-flash.
# One resume analysis fires 5-7 calls in quick succession, easily exceeding
# the limit. This enforcer serialises calls and adds a configurable gap.
# ============================================================================

_rate_lock = threading.Lock()
_last_call_time: float = 0.0
# Minimum seconds between consecutive Gemini API calls.
# 15 RPM ≈ 1 call every 4 seconds; use 4s as the default floor.
MIN_CALL_INTERVAL = float(os.getenv("GEMINI_MIN_CALL_INTERVAL", "4"))


def _wait_for_rate_limit() -> None:
    """Block until at least MIN_CALL_INTERVAL seconds have elapsed since the last call."""
    global _last_call_time
    with _rate_lock:
        now = time.time()
        elapsed = now - _last_call_time
        if elapsed < MIN_CALL_INTERVAL:
            sleep_time = MIN_CALL_INTERVAL - elapsed
            print(f"[RATE LIMITER] Throttling — waiting {sleep_time:.1f}s before next Gemini call")
            time.sleep(sleep_time)
        _last_call_time = time.time()


def call_gemini(system_prompt: str, user_prompt: str, as_json: bool = False, audio_base64: str = None, api_key: str = None) -> str:
    """Shared helper to call the Gemini API. Supports text or text+audio."""
    model_name = os.getenv("MODEL_NAME")
    # Use override key if provided, otherwise fallback to default env var
    actual_api_key = api_key or os.getenv("GEMINI_API_KEY")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": actual_api_key,
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
            "maxOutputTokens": 8192,
            **({"responseMimeType": "application/json"} if as_json else {}),
        },
    }

    timeout = int(os.getenv("REQUEST_TIMEOUT", "60"))
    
    # Retry logic for Rate Limiting (429) and Server Errors (500, 503, 504)
    max_retries = 5
    retry_delay = 10  # Start with a 10s delay for rate limits
    
    resp = None  # ensure resp is defined for the post-loop code

    for attempt in range(max_retries + 1):
        # Enforce global rate limit before every attempt
        _wait_for_rate_limit()

        try:
            resp = requests.post(url, json=body, headers=headers, timeout=timeout)
            
            if resp.status_code == 429 and attempt < max_retries:
                # Parse Retry-After header if available
                retry_after = resp.headers.get("Retry-After")
                wait_time = int(retry_after) if retry_after and retry_after.isdigit() else retry_delay
                print(f"[RATE LIMIT] 429 received. Waiting {wait_time}s before retry... (Attempt {attempt+1}/{max_retries})")
                time.sleep(wait_time)
                retry_delay = int(retry_delay * 1.5)  # Exponential backoff
                continue
                
            if resp.status_code in [500, 503, 504] and attempt < max_retries:
                print(f"[UPSTREAM ERROR] {resp.status_code} received. Retrying in {retry_delay}s... (Attempt {attempt+1}/{max_retries})")
                time.sleep(retry_delay)
                retry_delay = int(retry_delay * 1.5)
                continue
        except requests.exceptions.RequestException as e:
            if attempt < max_retries:
                print(f"[RETRY] Network error: {str(e)}. Retrying in 5s...")
                time.sleep(5)
                continue
            raise HTTPException(status_code=504, detail=f"AI Service Timeout: {str(e)}")
            
        if not resp.ok:
            try:
                error_data = resp.json()
                if "error" in error_data:
                    err_info = error_data["error"]
                    error_msg = f"{err_info.get('status', 'ERROR')}: {err_info.get('message', 'No message')}"
                else:
                    error_msg = resp.text
            except Exception:
                error_msg = resp.text
                
            print(f"!!! [CRITICAL] Gemini API Failure {resp.status_code} !!!")
            print(f"!!! Error Message: {error_msg} !!!")
            
            detail = "The AI Evaluation Service encountered an upstream error. Please try again later."
            if resp.status_code == 429:
                detail = "AI Service rate limit exceeded. Please wait a moment and try again."
            elif resp.status_code == 503:
                detail = "AI Service is currently overloaded or undergoing maintenance. Please try a smaller question count or wait a minute."
                
            raise HTTPException(
                status_code=resp.status_code if resp.status_code != 500 else 500,
                detail=detail
            )
        break

    if resp is None:
        raise HTTPException(status_code=500, detail="No response received from AI service after retries")

    data = resp.json()
    
    # Check for truncated responses
    candidate = data.get("candidates", [{}])[0]
    finish_reason = candidate.get("finishReason", "UNKNOWN")
    if finish_reason != "STOP" and finish_reason != "SUCCESS":
        print(f"!!! [WARNING] Gemini finished with reason: {finish_reason}. Response may be truncated !!!")

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
        print(f"Failed to parse JSON: {str(e)}")
        return {}

def stream_gemini(system_prompt: str, user_prompt: str, api_key: str = None):
    """Shared helper to call the Gemini API with streaming."""
    model_name = os.getenv("MODEL_NAME")
    actual_api_key = api_key or os.getenv("GEMINI_API_KEY")
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:streamGenerateContent?alt=sse"
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": actual_api_key,
    }
    
    body = {
        "system_instruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "maxOutputTokens": 8192,
        },
    }

    _wait_for_rate_limit()
    
    try:
        resp = requests.post(url, json=body, headers=headers, stream=True)
        resp.raise_for_status()
        
        for line in resp.iter_lines():
            if line:
                decoded_line = line.decode('utf-8')
                if decoded_line.startswith("data:"):
                    data_str = decoded_line[5:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        data_json = json.loads(data_str)
                        candidates = data_json.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text = part.get("text", "")
                                if text:
                                    yield text
                    except json.JSONDecodeError:
                        continue
    except Exception as e:
        print(f"!!! [CRITICAL] Gemini Streaming API Failure: {str(e)} !!!")
        yield f"Error generating stream: {str(e)}"

def to_float(val, default: float = 0.0) -> float:
    """Safely coerce a value to float, handling formats like '8/10' or '8.5'."""
    try:
        return float(str(val).split("/")[0].strip())
    except (ValueError, TypeError):
        return default
