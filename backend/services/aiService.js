/**
 * @file aiService.js
 * @description Proxy service for communicating with the Python FastAPI AI microservice.
 * Handles question generation, transcription, and answer evaluation.
 */

const API_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Utility for asynchronous delayed execution.
 */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Enhanced fetch with retry logic and exponential backoff.
 * @param {string} url - Target URL.
 * @param {Object} options - Fetch options.
 * @param {number} retries - Number of retry attempts.
 * @param {number} backoff - Initial backoff duration in ms.
 */
const fetchWithRetry = async (url, options = {}, retries = 2, backoff = 2000) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // Don't retry 5xx - let the AI service handle its own retries
            if (response.ok || response.status >= 400) {
                return response;
            }
            const errBody = await response.text();
            throw new Error(`Server returned status ${response.status}: ${errBody}`);
        } catch (error) {
            lastError = error;
            if (i < retries - 1) {
                console.warn(`Fetch attempt ${i + 1} failed for ${url}. Retrying in ${backoff}ms...`);
                await wait(backoff);
                backoff *= 2; // Exponential backoff
            }
        }
    }
    throw lastError;
};

/**
 * Service to handle all interactions with the Python AI microservice.
 */
export const aiService = {
    /**
     * Request a list of interview questions from the AI service.
     */
    generateQuestions: async (params) => {
        const { role, level, interviewType, count } = params;
        
        const response = await fetchWithRetry(`${API_SERVICE_URL}/generate-questions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                role,
                level,
                interview_type: interviewType,
                count,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || errorData.error || "Generation failed");
        }

        return await response.json();
    },

    /**
     * Transcribe an audio blob using the AI service.
     */
    transcribeAudio: async (audioBuffer) => {
        const fileBlob = new Blob([audioBuffer], { type: 'audio/webm' });
        const formData = new FormData();
        formData.append("file", fileBlob, "audio.webm");

        const response = await fetchWithRetry(`${API_SERVICE_URL}/transcribe`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Transcription failed: ${error}`);
        }

        const data = await response.json();
        return data.transcription || "";
    },

    /**
     * Evaluate a user's answer (verbal and/or code).
     */
    evaluateAnswer: async (params) => {
        const response = await fetchWithRetry(`${API_SERVICE_URL}/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
        });

        if (!response.ok) {
            let errorMsg = await response.text();
            try {
                const parsed = JSON.parse(errorMsg);
                errorMsg = parsed.detail || parsed.message || errorMsg;
            } catch (e) { /* ignored */ }
            throw new Error(errorMsg);
        }

        return await response.json();
    }
};
