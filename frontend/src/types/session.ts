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
    status: "pending" | "in-progress" | "completed" | "failed" | "cancelled";
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

interface Pagination {
    totalSessions: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

interface PaginatedSessionsResponse {
    message: string;
    sessions: Session[];
    pagination: Pagination;
    stats: {
        totalSessions: number;
        completedSessions: number;
        activeSessions: number;
    };
}

interface SessionState {
    sessions: Session[];
    activeSession: Session | null;
    isGenerating: boolean;
    isError: boolean;
    message: string;
    isLoading: boolean;
    pagination: Pagination | null;
    stats: {
        totalSessions: number;
        completedSessions: number;
        activeSessions: number;
    } | null;
}

export type { Question, Session, SessionState, Pagination, PaginatedSessionsResponse };

export interface SocketUpdatePayload {
    sessionId: string;
    status: string;
    message: string;
    session?: Session;
}