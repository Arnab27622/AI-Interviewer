import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../app/store";
import { useParams, Link } from "react-router-dom";
import { getSessionById } from "../features/session/sessionSlice";
import type { Question } from "../types/session";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import SessionReviewStats from "../components/SessionReviewStats";
import FeedbackItem from "../components/FeedbackItem";
import { formatDuration } from "../utils/formatters";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SessionReview = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { activeSession, isLoading } = useSelector((state: RootState) => state.session);

    useEffect(() => {
        if (sessionId) {
            dispatch(getSessionById(sessionId));
        }
    }, [sessionId, dispatch]);

    if (isLoading) return <div className="text-center py-32 font-black text-surface-500 animate-pulse uppercase tracking-[0.3em] text-[10px]">Processing Intelligence...</div>

    if (!activeSession || activeSession.status !== 'completed') {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-12 glass-card rounded-[3rem] text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5">
                    <span className="text-3xl">⌛</span>
                </div>
                <h2 className="text-2xl font-black text-white mb-4 tracking-tighter uppercase">Assessment In Progress</h2>
                <p className="text-surface-500 mb-10 font-bold text-xs uppercase tracking-widest leading-relaxed">
                    Our AI is currently synthesizing your performance data.<br/>Please check back in a few moments.
                </p>
                <Link to="/" className="btn-primary inline-flex items-center gap-3">
                    Return to Home
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </Link>
            </div>
        );
    }

    const { overallScore, metrics, role, level, questions, startTime, endTime } = activeSession;
    const finalMetrics = metrics || {};

    const barData = {
        labels: (questions || []).map((_: unknown, i: number) => `Q${i + 1}`),
        datasets: [{
            label: 'Technical Mastery',
            data: (questions || []).map((q: Question) => q.technicalScore || 0),
            backgroundColor: (questions || []).map((q: Question) => (q.technicalScore || 0) > 70 ? '#14b8a6' : '#6366f1'),
            borderRadius: 12,
            hoverBackgroundColor: '#2dd4bf',
        }],
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-12 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
                <div>
                    <span className="text-primary-400 font-black uppercase tracking-[0.4rem] text-[10px] bg-primary-500/10 px-4 py-1.5 rounded-full border border-primary-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]">Report Terminal</span>
                    <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter mt-6 uppercase leading-none">
                        {role} <span className="text-surface-600 font-bold block sm:inline">/ {level}</span>
                    </h1>
                </div>
                <div className="flex gap-4">
                     <span className="text-[10px] font-black uppercase tracking-widest text-surface-500 border border-white/5 px-4 py-2 rounded-xl">Session ID: {sessionId?.slice(-8)}</span>
                     <button onClick={() => window.print()} className="btn-secondary flex items-center gap-2 px-6! py-2! text-[10px] tracking-widest uppercase font-black print:hidden cursor-pointer hover:bg-white/10 transition-colors rounded-xl border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Export Report
                     </button>
                </div>
            </div>

            <SessionReviewStats 
                overallScore={overallScore || 0}
                avgTechnical={finalMetrics.avgTechnical || 0}
                avgConfidence={finalMetrics.avgConfidence || 0}
                duration={formatDuration(startTime, endTime)}
            />

            <div className="glass-card p-10 rounded-[3rem] relative group break-inside-avoid print:bg-surface-900 print:shadow-none">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity print:hidden">
                    <svg width="200" height="200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20V16"/></svg>
                </div>
                <h3 className="text-[10px] font-black text-surface-500 mb-10 uppercase tracking-[0.3rem] flex items-center gap-3">
                    <span className="w-1.5 h-4 bg-indigo-500 rounded-full"></span>
                    Mastery Calibration
                </h3>
                <div className="h-80 w-full relative print:max-w-[180mm] print:mx-auto">
                    <Bar data={barData} options={{
                        maintainAspectRatio: false,
                        animation: false,
                        responsive: true,
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { 
                                beginAtZero: true, 
                                max: 100, 
                                grid: { color: 'rgba(255,255,255,0.03)' },
                                ticks: { color: 'rgba(255,255,255,0.3)', font: { size: 10, weight: 'bold' } }
                            },
                            x: { 
                                grid: { display: false },
                                ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10, weight: 'bold' } }
                            }
                        }
                    }} />
                </div>
            </div>

            <div className="space-y-12">
                <div className="flex items-center gap-6 break-inside-avoid">
                    <h2 className="text-xl font-black uppercase tracking-widest text-white">Question Narrative</h2>
                    <div className="h-px grow bg-white/5"></div>
                </div>
                <div className="grid gap-10">
                    {(questions || []).map((q: Question, index: number) => (
                        <FeedbackItem key={index} question={q} index={index} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default SessionReview;
