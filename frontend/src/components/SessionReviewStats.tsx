import React from "react";

interface SessionReviewStatsProps {
    overallScore: number;
    avgTechnical: number;
    avgConfidence: number;
    duration: string;
}

const SessionReviewStats: React.FC<SessionReviewStatsProps> = ({
    overallScore,
    avgTechnical,
    avgConfidence,
    duration,
}) => {
    const stats = [
        { label: 'Overall Result', value: `${overallScore}%`, color: 'teal' },
        { label: 'Avg. Technical', value: `${avgTechnical}%`, color: 'teal' },
        { label: 'Avg Confidence', value: `${avgConfidence}%`, color: 'teal' },
        { label: 'Session Time', value: duration, color: 'teal' }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4 sm:pb-0 no-scrollbar snap-x">
            {stats.map((stat, i) => (
                <div key={i} className={`min-w-40 snap-center bg-white p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] shadow-sm border-l-8 ${stat.color === 'teal' ? 'border-teal-500' : 'border-slate-100'}`}>
                    <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.1rem]">{stat.label}</p>
                    <p className={`text-2xl sm:text-4xl font-black mt-2 leading-none ${stat.color === 'teal' ? 'text-teal-600' : 'text-slate-800'}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
};

export default SessionReviewStats;
