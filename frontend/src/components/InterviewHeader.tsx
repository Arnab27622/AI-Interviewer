import React from "react";

interface InterviewHeaderProps {
    role: string;
    questionsCount: number;
    currentQuestionIndex: number;
    submittedLocal: Record<number, boolean>;
    questions: { isEvaluated: boolean; isSubmitted: boolean }[];
    handleNavigation: (index: number) => void;
    handleFinishInterview: () => void;
    isLoading: boolean;
}

const InterviewHeader: React.FC<InterviewHeaderProps> = ({
    role,
    questions,
    currentQuestionIndex,
    submittedLocal,
    handleNavigation,
    handleFinishInterview,
    isLoading
}) => {
    return (
        <div className="flex justify-between items-center glass-card p-6 rounded-3xl mb-10 mt-6 border-white/5 relative z-40">
            <div>
                <h1 className="text-xl font-black text-white tracking-tight uppercase leading-none">
                    {role}
                </h1>
                <div className="flex gap-3 mt-4">
                    {questions.map((q, i) => (
                        <div key={i}
                            onClick={() => handleNavigation(i)}
                            className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all duration-300 ${i === currentQuestionIndex ? 'bg-primary-500 scale-125 shadow-[0_0_15px_rgba(20,184,166,0.6)]' : q.isEvaluated ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : (q.isSubmitted || submittedLocal[i]) ? 'bg-indigo-400 animate-pulse' : 'bg-surface-800'}`}
                            title={`Question ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
            <button 
                onClick={handleFinishInterview} 
                disabled={isLoading} 
                className="btn-danger flex items-center gap-3 px-8! cursor-pointer"
            >
                {isLoading ? (
                    <span className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                )}
                {isLoading ? "Finalizing..." : "Finish Session"}
            </button>
        </div>
    );
};

export default InterviewHeader;
