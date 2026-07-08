/**
 * @file src/services/aiService.ts
 * @description Proxy service for communicating with the Python FastAPI AI microservice.
 * Handles question generation, transcription, and answer evaluation.
 */

import fetch from "node-fetch";
import FormData from "form-data";
import dotenv from "dotenv";
import { SpeechAnalysisResult } from "../types/SpeechAnalysisResult.js";

dotenv.config();

const API_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Utility for asynchronous delayed execution.
 */
// const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Helper: robust fetch with retry logic, specifically designed to bypass
 * Render's free tier shared NAT IP Cloudflare 429 rate limit walls.
 */
async function fetchWithRetry(
  url: string,
  options: any = {},
  retries: number = 6,
  backoff: number = 5000
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);

      // If it's a 429, we WANT to loop and retry.
      if (response.ok || (response.status >= 400 && response.status !== 429)) {
        return response;
      }

      console.warn(`[AI Service] Attempt ${i + 1} got 429 from Render NAT. Retrying in ${backoff}ms...`);
    } catch (error) {
      console.warn(`[AI Service] Fetch failed on attempt ${i + 1}: ${(error as Error).message}`);
    }

    if (i < retries - 1) {
      await new Promise((res) => setTimeout(res, backoff));
      backoff += 2000; // Increase backoff slightly: 5s, 7s, 9s...
    }
  }
  throw new Error(`Failed after ${retries} retries`);
}

import {
  GenerateQuestionsParams,
  GenerateQuestionsResponse,
  EvaluateAnswerParams,
  EvaluateAnswerResponse
} from "../types/aiService.js";

/**
 * Service to handle all interactions with the Python AI microservice.
 */
export const aiService = {
  /**
   * Request a list of interview questions from the AI service.
   */
  generateQuestions: async (params: GenerateQuestionsParams): Promise<GenerateQuestionsResponse> => {
    const { role, level, interviewType, count, resumeText } = params;

    const response = await fetchWithRetry(`${API_SERVICE_URL}/generate-questions`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": process.env.INTERNAL_API_KEY || ""
      },
      body: JSON.stringify({
        role,
        level,
        interview_type: interviewType,
        count,
        resume_text: resumeText,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as any;
      throw new Error(errorData.detail || errorData.error || "Generation failed");
    }

    return (await response.json()) as GenerateQuestionsResponse;
  },

  /**
   * Transcribe an audio blob using the AI service.
   */
  transcribeAudio: async (audioBuffer: Buffer): Promise<string> => {
    const formData = new FormData();
    formData.append("file", audioBuffer, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });

    const response = await fetchWithRetry(`${API_SERVICE_URL}/transcribe`, {
      method: "POST",
      body: formData,
      headers: {
        ...formData.getHeaders(),
        "X-API-Key": process.env.INTERNAL_API_KEY || ""
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transcription failed: ${error}`);
    }

    const data = (await response.json()) as { transcription?: string };
    return data.transcription || "";
  },

  /**
   * Evaluate a user's answer (verbal and/or code).
   */
  evaluateAnswer: async (params: EvaluateAnswerParams): Promise<EvaluateAnswerResponse> => {
    const response = await fetchWithRetry(`${API_SERVICE_URL}/evaluate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-API-Key": process.env.INTERNAL_API_KEY || ""
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      let errorMsg = await response.text();
      try {
        const parsed = JSON.parse(errorMsg);
        errorMsg = parsed.detail || parsed.message || errorMsg;
      } catch (e) {
        /* ignored */
      }
      throw new Error(errorMsg);
    }

    return (await response.json()) as EvaluateAnswerResponse;
  },

  /**
   * Analyze speech audio for pace, pauses, and filler words.
   * Transcribes if transcript is not provided.
   */
  analyzeSpeech: async (audioBuffer: Buffer, transcript?: string): Promise<SpeechAnalysisResult> => {
    const formData = new FormData();
    formData.append("audio", audioBuffer, {
      filename: "audio.webm",
      contentType: "audio/webm",
    });
    if (transcript) {
      formData.append("transcript", transcript);
    }

    const response = await fetchWithRetry(`${API_SERVICE_URL}/speech/analyze`, {
      method: "POST",
      body: formData,
      headers: {
        ...formData.getHeaders(),
        "X-API-Key": process.env.INTERNAL_API_KEY || ""
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Speech analysis failed: ${error}`);
    }

    return (await response.json()) as SpeechAnalysisResult;
  },
};
