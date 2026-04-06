import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import type { AppDispatch, RootState } from "../app/store";
import { getSessionById, submitAnswer, endSession } from "../features/session/sessionSlice";
import { ROLE_LANGUAGE_MAP } from "../constants/interview";

export const useInterviewSession = (stopRecording: () => void, setRecordingTime: (time: number) => void) => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { activeSession, isLoading, isError: sessionError, message: sessionMessage } = useSelector((state: RootState) => state.session);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [prevSessionRole, setPrevSessionRole] = useState<string | undefined>(undefined);
    const [submittedLocal, setSubmittedLocal] = useState<Record<number, boolean>>({});
    
    // Sync selectedLanguage during render to avoid useEffect warning (cascading renders)
    if (activeSession?.role && activeSession.role !== prevSessionRole) {
        setPrevSessionRole(activeSession.role);
        const defaultLang = ROLE_LANGUAGE_MAP[activeSession.role] || "plaintext";
        setSelectedLanguage(defaultLang);
    }

    const [drafts, setDrafts] = useState<Record<number, { code?: string; audio?: Blob }>>(() => {
        if (!sessionId) return {};
        const saved = localStorage.getItem(`draft_code_${sessionId}`); 
        const codes = saved ? JSON.parse(saved) : {};
        const initialDrafts: Record<number, { code?: string; audio?: Blob }> = {};
        Object.keys(codes).forEach(key => {
            initialDrafts[parseInt(key)] = { code: codes[key] };
        });
        return initialDrafts;
    });

    useEffect(() => {
        if (sessionId) {
            const codeOnly: Record<number, string> = {};
            Object.keys(drafts).forEach(key => {
                const idx = parseInt(key);
                if (drafts[idx].code) codeOnly[idx] = drafts[idx].code;
            });
            localStorage.setItem(`draft_code_${sessionId}`, JSON.stringify(codeOnly));
        }
    }, [drafts, sessionId]);

    useEffect(() => {
        if (sessionId) {
            dispatch(getSessionById(sessionId));
        }
    }, [dispatch, sessionId]);

    const currentQuestion = activeSession?.questions?.[currentQuestionIndex];
    const isReduxSubmitted = currentQuestion?.isSubmitted === true;
    const isLocallySubmitted = submittedLocal[currentQuestionIndex] === true;
    const isEvaluationError = sessionError && sessionMessage.includes("Failed");

    useEffect(() => {
        if (isEvaluationError && isLocallySubmitted) {
            const timer = setTimeout(() => {
                setSubmittedLocal(prev => ({
                    ...prev, [currentQuestionIndex]: false
                }));
            }, 0);
            toast.error(sessionMessage, { toastId: "eval-error" });
            return () => clearTimeout(timer);
        }
    }, [isEvaluationError, isLocallySubmitted, currentQuestionIndex, sessionMessage]);

    const isQuestionLocked = isReduxSubmitted || (isLocallySubmitted && !isEvaluationError);
    const isProcessing = isQuestionLocked && !currentQuestion?.isEvaluated;

    const handleNavigation = (index: number) => {
        if (activeSession?.questions && index >= 0 && index < activeSession.questions.length) {
            stopRecording();
            setCurrentQuestionIndex(index);
            setRecordingTime(0);
        }
    };

    const updateDraftCode = (newCode: string | undefined) => {
        if (isQuestionLocked) return;
        setDrafts(prev => ({
            ...prev,
            [currentQuestionIndex]: { ...prev[currentQuestionIndex], code: newCode ?? "" }
        }));
    };

    const updateDraftAudio = (audioBlob: Blob) => {
        setDrafts(prev => ({
            ...prev,
            [currentQuestionIndex]: { ...prev[currentQuestionIndex], audio: audioBlob }
        }));
    };

    const deleteDraftAudio = () => {
        setDrafts(prev => ({
            ...prev,
            [currentQuestionIndex]: { ...prev[currentQuestionIndex], audio: undefined }
        }));
    };

    const handleSubmitAnswer = async () => {
        if (isQuestionLocked || !sessionId) return;
        stopRecording();

        const draft = drafts[currentQuestionIndex] || {};
        const code = draft.code || "";
        const audio = draft.audio || null;

        if (!code && !audio) {
            toast.error("Please provide an answer before submitting.");
            return;
        }

        setSubmittedLocal(prev => ({
            ...prev, [currentQuestionIndex]: true
        }));

        const formData = new FormData();
        formData.append("questionIndex", currentQuestionIndex.toString());
        if (code) formData.append("code", code);
        if (audio) formData.append("audio", audio, 'audio.webm');

        dispatch(submitAnswer({ sessionId, formData })).unwrap().catch(() => {
            setSubmittedLocal(prev => ({
                ...prev, [currentQuestionIndex]: false
            }));
            toast.error("Failed to submit answer. Please try again.");
        });
    };

    const confirmFinishInterview = async () => {
        if (!sessionId) return;
        return dispatch(endSession(sessionId)).unwrap().then(() => {
            localStorage.removeItem(`draft_code_${sessionId}`);
            navigate(`/review/${sessionId}`);
            toast.success("Interview ended successfully.");
        }).catch(() => {
            toast.error("Failed to end interview. Please try again.");
        });
    };

    return {
        sessionId,
        activeSession,
        isLoading,
        sessionMessage,
        currentQuestionIndex,
        currentQuestion,
        selectedLanguage,
        setSelectedLanguage,
        drafts,
        isQuestionLocked,
        isProcessing,
        submittedLocal,
        handleNavigation,
        updateDraftCode,
        updateDraftAudio,
        deleteDraftAudio,
        handleSubmitAnswer,
        confirmFinishInterview
    };
};
