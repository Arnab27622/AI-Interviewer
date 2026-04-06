import React from "react";

interface QuestionSectionProps {
    index: number;
    text: string;
}

const QuestionSection: React.FC<QuestionSectionProps> = ({ index, text }) => {
    return (
        <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-6">
            <span className="text-blue-400 text-xs font-bold uppercase tracking-widest">Question {index + 1}</span>
            <h2 className="text-2xl font-medium leading-relaxed mt-2">{text}</h2>
        </div>
    );
};

export default QuestionSection;
