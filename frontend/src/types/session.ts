interface Question {
    questionText: string;
    questionType: "coding" | "oral";
    isEvaluated: boolean;
    isSubmitted: boolean;
    userAnswerText?: string;
    userSubmittedCode?: string;
    idealAnswer?: string;
    technicalScore?: number;
    confidenceScore?: number;
    aiFeedback?: string;
}

interface Session {
    _id: string;
    user: string;
    role: string;
    level: string;
    interviewType: string;
    questions: Question[];
    status: "pending" | "in-progress" | "completed" | "failed";
    startTime?: Date | string;
    endTime?: Date | string | number;
    overallScore?: number;
    metrics?: {
        avgTechnical?: number;
        avgConfidence?: number;
    };
    createdAt?: string;
    updatedAt?: string;
}

interface SessionState {
    sessions: Session[];
    activeSession: Session | null;
    isGenerating: boolean;
    isError: boolean;
    message: string;
    isLoading: boolean;
}

export type { Question, Session, SessionState };

export interface SocketUpdatePayload {
    sessionId: string;
    status: string;
    message: string;
    session?: Session;
}