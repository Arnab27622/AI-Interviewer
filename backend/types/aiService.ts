/**
 * @file types/aiService.ts
 * @description Type definitions for AI Service integration
 */

export interface GenerateQuestionsParams {
  role: string;
  level: string;
  interviewType: string;
  count: number;
}

export interface GenerateQuestionsResponse {
  questions: {
    question: string;
    ideal_answer: string;
  }[];
}

export interface EvaluateAnswerParams {
  question: string;
  question_type: "oral" | "coding";
  user_answer: string;
  user_code: string;
  selected_language: string;
  role: string;
  level: string;
  interview_type: string;
}

export interface EvaluateAnswerResponse {
  ideal_answer: string;
  technical_score: number;
  confidence_score: number;
  ai_feedback: string;
}
