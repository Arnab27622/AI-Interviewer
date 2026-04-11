const API_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Service to handle all interactions with the Python AI microservice.
 */
export const aiService = {
    /**
     * Request a list of interview questions from the AI service.
     */
    generateQuestions: async (params) => {
        const { role, level, interviewType, count } = params;
        
        const response = await fetch(`${API_SERVICE_URL}/generate-questions`, {
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

        const response = await fetch(`${API_SERVICE_URL}/transcribe`, {
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
        const response = await fetch(`${API_SERVICE_URL}/evaluate`, {
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
