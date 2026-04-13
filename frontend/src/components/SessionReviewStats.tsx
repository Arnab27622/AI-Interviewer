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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
                <div key={i} className="glass-card p-8 rounded-[2.5rem] border-l-4 border-l-primary-500 relative overflow-hidden group hover:border-l-primary-400 transition-all duration-500">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-primary-500/5 blur-xl -mr-8 -mt-8"></div>
                    <p className="text-[10px] font-black text-surface-500 uppercase tracking-widest leading-none mb-3">{stat.label}</p>
                    <p className="text-2xl sm:text-4xl font-black text-white tracking-tighter transition-colors">{stat.value}</p>
                </div>
            ))}
        </div>
    );
};

export default SessionReviewStats;
