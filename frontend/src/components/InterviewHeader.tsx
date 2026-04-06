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
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6 mt-6">
            <div>
                <h1 className="text-xl font-black text-slate-900">
                    {role}
                </h1>
                <div className="flex gap-2 mt-2">
                    {questions.map((q, i) => (
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
    );
};

export default InterviewHeader;
