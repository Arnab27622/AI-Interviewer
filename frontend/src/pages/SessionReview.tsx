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
                    <span className="text-teal-600 font-black uppercase tracking-[0.2rem] text-[10px]">Assessment Complete</span>
                    <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight mt-2 uppercase">
                        {role} <span className="text-slate-300 font-medium lowercase block sm:inline">({level})</span>
                    </h1>
                </div>
            </div>

            <SessionReviewStats 
                overallScore={overallScore || 0}
                avgTechnical={finalMetrics.avgTechnical || 0}
                avgConfidence={finalMetrics.avgConfidence || 0}
                duration={formatDuration(startTime, endTime)}
            />

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
                {(questions || []).map((q: Question, index: number) => (
                    <FeedbackItem key={index} question={q} index={index} />
                ))}
            </div>
        </div>
    )
}

export default SessionReview;