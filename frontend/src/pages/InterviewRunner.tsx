import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { useNavigate, useParams } from "react-router-dom";
import { getSessionById, submitAnswer, endSession } from "../features/session/sessionSlice";
import MonacoEditor from "@monaco-editor/react";
import { toast } from "react-toastify";
import MicIcon from "../components/MicIcon";

const SUPPORTED_LANGUAGES = [
    { label: 'JavaScript', value: 'javascript' },
    { label: 'TypeScript', value: 'typescript' },
    { label: 'Python', value: 'python' },
    { label: 'Java', value: 'java' },
    { label: 'C++', value: 'cpp' },
    { label: 'C', value: 'c' },
    { label: 'C#', value: 'csharp' },
    { label: 'Go', value: 'go' },
    { label: 'Rust', value: 'rust' },
    { label: 'PHP', value: 'php' },
    { label: 'Ruby', value: 'ruby' },
    { label: 'Swift', value: 'swift' },
    { label: 'Kotlin', value: 'kotlin' },
    { label: 'Scala', value: 'scala' },
    { label: 'Haskell', value: 'haskell' },
    { label: 'Elixir', value: 'elixir' },
    { label: 'Clojure', value: 'clojure' },
    { label: 'F#', value: 'fsharp' },
    { label: 'R', value: 'r' },
    { label: 'SQL', value: 'sql' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'Solidity', value: 'solidity' },
    { label: 'YAML', value: 'yaml' },
    { label: 'Markdown', value: 'markdown' },
    { label: 'Plain Text', value: 'plaintext' },
    { label: 'Shell', value: 'shell' },
    { label: 'Bash', value: 'bash' },
    { label: 'PowerShell', value: 'powershell' },
    { label: 'Perl', value: 'perl' },
    { label: 'Lua', value: 'lua' },
    { label: 'Dart', value: 'dart' },
    { label: 'Julia', value: 'julia' },
    { label: 'Objective-C', value: 'objective-c' }
];

const ROLE_LANGUAGE_MAP: Record<string, string> = {
    "Software Engineer": "javascript",
    "Data Scientist": "python",
    "Product Manager": "markdown",
    "UI/UX Designer": "css",
    "Project Manager": "markdown",
    "Business Analyst": "sql",
    "QA Engineer": "javascript",
    "DevOps Engineer": "shell",
    "Cloud Engineer": "yaml",
    "Cyber Security Engineer": "python",
    "Mobile Developer": "swift",
    "Frontend Developer": "javascript",
    "Backend Developer": "python",
    "Full Stack Developer": "javascript",
    "Full Stack Python Developer": "python",
    "Full Stack Java Developer": "java",
    "Machine Learning Engineer": "python",
    "Data Analyst": "python",
    "Machine Learning Developer": "python",
    "MERN Stack Developer": "javascript",
    "MEAN Stack Developer": "typescript",
    "Android Developer": "kotlin",
    "iOS Developer": "swift",
    "Game Developer": "cpp",
    "Embedded Systems Engineer": "c",
    "Blockchain Developer": "solidity",
    "Systems Programmer": "rust",
    "Database Administrator": "sql",
    "Web Developer": "javascript"
};

const InterviewRunner = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { activeSession, isLoading, message, isError: sessionError, message: sessionMessage } = useSelector((state: RootState) => state.session);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const [prevSessionRole, setPrevSessionRole] = useState<string | undefined>(undefined);

    // Sync selectedLanguage during render to avoid useEffect warning (cascading renders)
    if (activeSession?.role && activeSession.role !== prevSessionRole) {
        setPrevSessionRole(activeSession.role);
        const defaultLang = ROLE_LANGUAGE_MAP[activeSession.role] || "plaintext";
        setSelectedLanguage(defaultLang);
    }

    const [submittedLocal, setSubmittedLocal] = useState<Record<number, boolean>>({});

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

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    
    // Check if there's an error message related to evaluation
    const isEvaluationError = sessionError && sessionMessage.includes("Failed");

    // If an error occurs, we should unlock the question for resubmission
    useEffect(() => {
        if (isEvaluationError && isLocallySubmitted) {
            // Defer state update to avoid cascading render lint warning
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
            if (isRecording) stopRecording();
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

    const startRecording = async () => {
        if (isQuestionLocked) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

                setDrafts(prev => ({
                    ...prev,
                    [currentQuestionIndex]: { ...prev[currentQuestionIndex], audio: audioBlob }
                }));
            };

            mediaRecorderRef.current.start(1000);
            setIsRecording(true);
            setRecordingTime(0);
            timerIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        } catch {
            toast.error("Failed to start recording. Please allow microphone access.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') {
            mediaRecorderRef.current?.stop();
            streamRef.current?.getTracks().forEach(track => track.stop());
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            setIsRecording(false);
        }
    };

    const handleSubmitAnswer = async () => {
        if (isQuestionLocked || !sessionId) return;
        if (isRecording) stopRecording();

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

    const handleFinishInterview = async () => {
        if (!window.confirm("Are you sure you want to finish the interview?")) return;
        if (!sessionId) return;

        dispatch(endSession(sessionId)).unwrap().then(() => {
            localStorage.removeItem(`drafts_${sessionId}`);
            navigate(`/review/${sessionId}`);
            toast.success("Interview ended successfully.");
        }).catch(() => {
            toast.error("Failed to end interview. Please try again.");
        });
    };

    if (!activeSession || !activeSession.questions || activeSession.questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-40 gap-6">
                <div className="animate-bounce h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl">
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                    </svg>
                </div>
                <div className="text-center">
                    <p className="text-slate-800 font-black text-xl italic tracking-tight">Preparing your interview questions...</p>
                    {message && (
                        <div className="mt-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-2xl text-blue-600 text-xs font-mono animate-pulse inline-block">
                            {message}...
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const currentDraft = drafts[currentQuestionIndex] || {};

    return (
        <div className="max-w-7xl mx-auto px-4 pb-32">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 mt-6">
                <div>
                    <h1 className="text-xl font-black text-slate-900">
                        {activeSession.role}
                    </h1>
                    <div className="flex gap-2 mt-2">
                        {activeSession?.questions?.map((q, i) => (
                            <div key={i}
                                onClick={() => handleNavigation(i)}
                                className={`w-3 h-3 rounded-full cursor-pointer transition-all ${i === currentQuestionIndex ? 'bg-blue-600 scale-125 ring-2 ring-blue-200' : q.isEvaluated ? 'bg-emerald-500' : (q.isSubmitted || submittedLocal[i]) ? 'bg-amber-400 animate-pulse' : 'bg-slate-200'}`}
                            />
                        ))}
                    </div>
                </div>
                <button onClick={handleFinishInterview} disabled={isLoading} className="bg-rose-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-rose-700 disabled:opacity-50 cursor-pointer">
                    {isLoading ? "Finalizing..." : "Finish Interview"}
                </button>
            </div>

            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-6">
                <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Question {currentQuestionIndex + 1}</span>
                <h2 className="text-2xl font-medium leading-relaxed mt-2">{currentQuestion?.questionText}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center min-h-100">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Verbal Answer</h3>
                    {!isRecording && !currentDraft.audio ? (
                        <button onClick={startRecording} disabled={isQuestionLocked} className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl hover:scale-105 transition-all disabled:opacity-50 cursor-pointer">
                            <MicIcon />
                        </button>
                    ) : isRecording ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center text-white animate-pulse">
                                <div className="w-4 h-4 bg-white rounded-sm"></div>
                            </div>
                            <span className="text-red-500 font-mono font-bold">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
                            <button onClick={stopRecording} className="text-slate-500 underline text-sm">Stop Recording</button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="text-emerald-500 font-bold text-lg mb-2">Audio Captured 🟩</div>
                            {!isQuestionLocked && (
                                <button onClick={() => setDrafts(prev => ({ ...prev, [currentQuestionIndex]: { ...prev[currentQuestionIndex], audio: undefined } }))} className="text-xs text-slate-400 underline hover:text-rose-500">
                                    Delete & Re-record
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm overflow-hidden h-100">
                    <div className="flex justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-500 uppercase py-2">Code Editor</span>
                        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} disabled={isQuestionLocked} className="text-xs bg-white border border-slate-200 rounded-lg px-2 disabled:bg-slate-100 disabled:text-slate-400">
                            {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                        </select>
                    </div>
                    <MonacoEditor
                        height="100%"
                        language={selectedLanguage}
                        theme="vs-dark"
                        value={currentDraft.code || ''}
                        onChange={updateDraftCode}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            scrollBeyondLastLine: false,
                            readOnly: isQuestionLocked,
                            domReadOnly: isQuestionLocked,
                        }}
                    />
                </div>
            </div>

            {currentQuestion?.isEvaluated && (
                <div className="mt-6 bg-emerald-50 border border-emerald-100 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="text-emerald-800 font-bold mb-2">AI Feedback</h3>
                    <p className="text-emerald-700 text-sm leading-relaxed">{currentQuestion?.aiFeedback}</p>
                    <div className="mt-4 flex gap-4">
                        <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-emerald-600 shadow-sm">
                            Score: {currentQuestion?.technicalScore}
                        </span>
                    </div>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 px-6 md:px-12 flex justify-between items-center z-50">
                <button onClick={() => handleNavigation(currentQuestionIndex - 1)} disabled={currentQuestionIndex === 0} className="text-slate-500 font-bold text-sm hover:text-slate-800 disabled:opacity-30 cursor-pointer">
                    ← Previous
                </button>

                <div className="flex flex-col items-center">
                    {isProcessing && message && (
                        <div className="mb-2 text-xs font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full animate-pulse border border-blue-100">
                            {message}...
                        </div>
                    )}

                    <button onClick={handleSubmitAnswer} disabled={isQuestionLocked} className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${isProcessing ? 'bg-slate-400 cursor-wait' : currentQuestion?.isEvaluated ? 'bg-emerald-500' : isQuestionLocked ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800 active:scale-95'}`}>
                        {isProcessing ? 'Analyzing...' : currentQuestion?.isEvaluated ? 'Answer Submitted' : isQuestionLocked ? 'Submitted' : 'Submit Answer'}
                    </button>
                </div>

                <button onClick={() => handleNavigation(currentQuestionIndex + 1)} disabled={currentQuestionIndex === (activeSession?.questions?.length || 0) - 1} className="text-slate-500 font-bold hover:text-slate-800 disabled:opacity-30 cursor-pointer">
                    Next →
                </button>
            </div>
        </div>
    );
};

export default InterviewRunner;