import { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { useParams, Link } from "react-router-dom";
import { getSessionById } from "../features/session/sessionSlice";
import type { Question } from "../types/session";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const formatDuration = (start: string | number | Date | undefined, end: string | number | Date | undefined) => {
    if (!start || !end) return 'N/A';
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    return `${minutes}m ${seconds % 60}s`;
};

const sanitizeQuestionText = (text: string | undefined) => {
    if (!text) return '';
    return text.replace(/^\d+[\s. )]+/, '').trim();
};

const formatIdealAnswer = (text: string | undefined) => {
    try {
        if (!text) return 'Pending Evaluation';

        let cleanText = text.trim();

        if (cleanText.startsWith('```json')) {
            cleanText = cleanText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
        }

        if (cleanText.startsWith('{') && cleanText.endsWith('}')) {
            const parsed = JSON.parse(cleanText);

            if (parsed.verbalAnswer || parsed.idealAnswer || parsed.ideal_answer) {
                return parsed.verbalAnswer || parsed.idealAnswer || parsed.ideal_answer;
            }

            const explanation = parsed.explanation || parsed.understanding || "";
            const code = parsed.code || parsed.codeExample || parsed.example || "";

            if (explanation || code) {
                return `${explanation}\n\n${code}`.trim();
            }
        }

        return text;
    } catch {
        return text;
    }
};

const SessionReview = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { activeSession, isLoading } = useSelector((state: RootState) => state.session);

    useEffect(() => {
        if (sessionId) {
            dispatch(getSessionById(sessionId));
        }
    }, [sessionId, dispatch]);

    if (isLoading) return <div className="text-center py-20 font-bold text-slate-400 animate-pulse uppercase tracking-widest">Generating Analysis...</div>

    if (!activeSession || activeSession.status !== 'completed') {
        return (
            <div className="max-w-xl mx-auto mt-10 sm:mt-20 p-6 sm:p-10 bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl text-center border border-slate-100">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-4 tracking-tighter uppercase">Report Not Ready</h2>
                <p className="text-slate-500 mb-8 font-medium text-sm sm:text-base">
                    This session is still being processed by our AI assistant.
                </p>
                <Link to="/" className="inline-block bg-teal-600 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl transition hover:bg-teal-700 active:scale-95 text-xs sm:text-sm">Dashboard</Link>
            </div>
        );
    }

    const { overallScore, metrics, role, level, questions, startTime, endTime } = activeSession;
    const finalMetrics = metrics || {};

    const barData = {
        labels: (questions || []).map((_: unknown, i: number) => `Q${i + 1}`),
        datasets: [{
            label: 'Technical Score',
            data: (questions || []).map((q: Question) => q.technicalScore || 0),
            backgroundColor: (questions || []).map((q: Question) => (q.technicalScore || 0) > 70 ? '#10b981' : '#f59e0b'),
            borderRadius: 8,
        }],
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 sm:space-y-12 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-col justify-between items-start md:items-end gap-4 border-b border-slate-100 pb-6 sm:pb-10">
                <div>
                    <span className="text-teal-600 font-black uppercase tracking-[0.2rem] text-[10px]">Assesment Complete</span>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2 uppercase">
                        {role} <span className="text-slate-300 font-medium lowercase block sm:inline">({level})</span>
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 no-scrollbar snap-x">
                {[
                    { label: 'Overall Result', value: `${overallScore}%`, color: 'teal' },
                    { label: 'Avg. Technical', value: `${finalMetrics.avgTechnical || 0}%`, color: 'teal' },
                    { label: 'Avg Confidence', value: `${finalMetrics.avgConfidence || 0}%`, color: 'teal' },
                    { label: 'Session Time', value: formatDuration(startTime, endTime), color: 'teal' }
                ].map((stat, i) => (
                    <div key={i} className={`min-w-40 snap-center bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border-l-8 ${stat.color === 'teal' ? 'border-teal-500' : 'border-slate-100'}`}>
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1rem]">{stat.label}</p>
                        <p className={`text-2xl sm:text-4xl font-black mt-2 leading-none ${stat.color === 'teal' ? 'text-teal-600' : 'text-slate-800'}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-sm border border-slate-50">
                <h3 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2rem]">Per-Question Performance</h3>
                <div className="h-64 sm:h-80">
                    <Bar data={barData} options={{
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: true, max: 100, grid: { color: '#f8fafc' } },
                            x: { grid: { display: false } }
                        }
                    }} />
                </div>
            </div>

            <div className="space-y-6 sm:space-y-10">
                {
                    (questions || []).map((q: Question, index: number) => (
                        <div key={index} className="bg-white rounded-3xl sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden group hover:shadow-lg transition-all duration-500">
                            <div className="p-6 space-y-6 sm:p-10 sm:space-y-8">
                                <div className="flex flex-col lg:flex-row justify-between items-start gap-4 sm:gap-6">
                                    <h4 className="text-lg sm:text-2xl font-bold text-slate-800 flex-1 leading-snug">
                                        <span className="text-teal-500 mr-2 font-black italic">Q{index + 1}.</span>
                                        {sanitizeQuestionText(q.questionText)}
                                    </h4>
                                    <div className="flex gap-2 shrink-0">
                                        <div className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl border flex items-center gap-2 bg-emerald-50 border-emerald-100">
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400">Tech</span>
                                            <span className="text-xs sm:text-sm font-black text-emerald-600">{q.technicalScore}%</span>
                                        </div>

                                        <div className="px-3 py-1.5 sm:px-5 sm:py-2 rounded-xl sm:rounded-2xl border flex items-center gap-2 bg-blue-50/30 border-blue-50">
                                            <span className="text-[8px] sm:text-[10px] font-black uppercase text-slate-400">Conf</span>
                                            <span className="text-xs sm:text-sm font-black text-blue-600">{q.confidenceScore}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">Your Submission</label>
                                    <div className="bg-slate-50 rounded-xl sm:rounded-4xl border border-slate-100 overflow-hidden">
                                        {q.userSubmittedCode && q.userSubmittedCode !== 'undefined' && (
                                            <div className="p-4 sm:p-6 border-b border-slate-200 last:border-0">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Code</span>
                                                <pre className="text-[11px] sm:text-xs font-mono text-slate-700 whitespace-pre-wrap overflow-x-auto">
                                                    {q.userSubmittedCode}
                                                </pre>
                                            </div>
                                        )}

                                        {q.userAnswerText && (
                                            <div className="p-4 sm:p-6">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Transcript</span>
                                                <p className="text-xs sm:text-sm text-slate-600 italic leading-relaxed">"{q.userAnswerText}"</p>
                                            </div>
                                        )}

                                        {(!q.userAnswerText || q.userSubmittedCode === 'undefined') && !q.userAnswerText && (
                                            <div className="p-6 text-center text-slate-400 text-xs italic">
                                                No answer recorded.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 pt-6 sm:pt-8 border-t border-r-slate-50">
                                    <div className="space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">AI Analytical Feedback</label>
                                        <div className="bg-slate-50/50 p-4 sm:p-6 rounded-2xl sm:rounded-4xl text-xs sm:text-sm italic text-slate-600 border-l-4 sm:border-l-[6px] border-teal-500 leading-relaxed">"{q.aiFeedback}"</div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[9px] sm:text-[10px] font-black text-slate-300 uppercase tracking-[0.2rem] block ml-1">Ideal Implementation</label>
                                        <div className="bg-slate-900 text-slate-300 p-4 sm:p-6 rounded-2xl sm:rounded-4xl text-[11px] sm:text-[13px] overflow-x-auto shadow-inner leading-relaxed prose prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-pre:bg-slate-800 prose-code:text-blue-400 prose-code:bg-slate-800 prose-code:px-1 prose-code:rounded prose-code:font-mono prose-li:my-0.5">
                                            <ReactMarkdown>
                                                {formatIdealAnswer(q.idealAnswer)}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default SessionReview;