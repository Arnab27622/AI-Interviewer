import React from "react";

interface AIFeedbackSectionProps {
    isEvaluated: boolean;
    feedback: string;
    score: number;
}

const AIFeedbackSection: React.FC<AIFeedbackSectionProps> = ({ isEvaluated, feedback, score }) => {
    if (!isEvaluated) return null;

    return (
        <div className="mt-6 bg-emerald-50 border border-emerald-100 p-6 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-emerald-800 font-bold mb-2">AI Feedback</h3>
            <p className="text-emerald-700 text-sm leading-relaxed">{feedback}</p>
            <div className="mt-4 flex gap-4">
                <span className="bg-white px-3 py-1 rounded-lg text-xs font-bold text-emerald-600 shadow-sm">
                    Score: {score}
                </span>
            </div>
        </div>
    );
};

export default AIFeedbackSection;
