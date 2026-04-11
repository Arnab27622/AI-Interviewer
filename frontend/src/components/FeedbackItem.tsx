import React from "react";
import ReactMarkdown from "react-markdown";
import type { Question } from "../types/session";
import { sanitizeQuestionText, formatIdealAnswer } from "../utils/formatters";

interface FeedbackItemProps {
    question: Question;
    index: number;
}

const FeedbackItem: React.FC<FeedbackItemProps> = ({ question, index }) => {
    return (
        <div className="bg-white rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-500">
            <div className="p-6 space-y-6 sm:p-10 sm:space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6">
                    <h4 className="text-lg sm:text-2xl font-bold text-slate-800 flex-1 leading-snug">
                        <span className="text-teal-500 mr-2 font-black italic">Q{index + 1}.</span>
                        {sanitizeQuestionText(question.questionText)}
                    </h4>
                    <div className="flex gap-2 shrink-0">
                        <div className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl border flex items-center gap-2 bg-emerald-50 border-emerald-100">
                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400">Tech</span>
                            <span className="text-xs sm:text-sm font-black text-emerald-600">{question.technicalScore}%</span>
                        </div>

                        <div className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl border flex items-center gap-2 bg-blue-50/30 border-blue-50">
                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400">Conf</span>
                            <span className="text-xs sm:text-sm font-black text-blue-600">{question.confidenceScore}%</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">Your Submission</label>
                    <div className="bg-slate-50 rounded-xl sm:rounded-4xl border border-slate-100 overflow-hidden">
                        {question.userSubmittedCode && question.userSubmittedCode !== 'undefined' && (
                            <div className="p-4 sm:p-6 border-b border-slate-200 last:border-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Code</span>
                                <pre className="text-[11px] sm:text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                    {question.userSubmittedCode}
                                </pre>
                            </div>
                        )}

                        {question.userAnswerText && (
                            <div className="p-4 sm:p-6">
                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Transcript</span>
                                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">"{question.userAnswerText}"</p>
                            </div>
                        )}

                        {!question.userAnswerText && (!question.userSubmittedCode || question.userSubmittedCode === 'undefined') && (
                            <div className="p-6 text-center text-slate-400 text-xs italic">
                                No answer recorded.
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-r-slate-50">
                    <div className="space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">AI Analytical Feedback</label>
                        <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-4xl text-xs sm:text-sm italic text-slate-600 border-l-4 sm:border-l-[6px] border-teal-500 leading-relaxed">
                            <ReactMarkdown>
                                {question.aiFeedback || ""}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">Ideal Implementation</label>
                        <div className="bg-slate-900 text-slate-300 p-4 sm:p-6 rounded-2xl sm:rounded-4xl text-[11px] sm:text-[13px] overflow-x-auto shadow-inner leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-pre:bg-slate-800 prose-code:text-blue-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-code:font-mono prose-li:my-0.5">
                            <ReactMarkdown>
                                {formatIdealAnswer(question.idealAnswer)}
                            </ReactMarkdown>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackItem;
