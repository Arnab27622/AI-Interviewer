interface Session {
    id: string;
    user_id: string;
    job_title: string;
    job_description: string;
    experience_level: string;
    questions: string[];
    answers: string[];
    feedback: string;
    created_at: string;
    updated_at: string;
}

interface SessionState {
    sessions: Session[];
    activeSession: Session | null;
    isError: boolean;
    message: string;
    isLoading: boolean;
}

export type { Session, SessionState };