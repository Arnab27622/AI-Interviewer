export interface Question {
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

export interface Session {
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

export interface Pagination {
    totalSessions: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
}

export interface PaginatedSessionsResponse {
    message: string;
    sessions: Session[];
    pagination: Pagination;
    stats: {
        totalSessions: number;
        completedSessions: number;
        activeSessions: number;
    };
}

export interface SessionState {
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

export interface SocketUpdatePayload {
    sessionId: string;
    status: string;
    message: string;
    session?: Session;
}

/**
 * Structure for locally persisted interview drafts in IndexedDB.
 */
export type DraftRecord = Record<number, { code?: string; audio?: Blob }>;