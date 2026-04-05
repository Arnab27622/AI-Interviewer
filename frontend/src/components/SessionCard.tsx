import type { Session } from "../types/session";

interface SessionCardProps {
    session: Session;
    onClick: (session: Session) => void;
    onDelete: (e: React.MouseEvent, sessionId: string) => void;
}

const SessionCard = ({ session, onClick, onDelete }: SessionCardProps) => {
    const isDeletable = session.status !== 'pending';

    const getIcon = () => {
        const role = session.role || '';
        if (role.includes('Python')) return '🐍'
        if (role.includes('Java')) return '☕'
        if (role.includes('C++')) return '⚙️'
        if (role.includes('JavaScript')) return '🟨'
        if (role.includes('React')) return '⚛️'
        if (role.includes('Node')) return '🟩'
        if (role.includes('SQL')) return '🗄️'
        if (role.includes('MongoDB')) return '🍃'
        if (role.includes('Docker')) return '🐳'
        if (role.includes('Kubernetes')) return '🎡'
        if (role.includes('AWS')) return '☁️'
        if (role.includes('Azure')) return '🔷'
        if (role.includes('MERN')) return '🌐'
        if (role.includes('MEAN')) return '📐'
        if (role.includes('Android')) return '🤖'
        if (role.includes('iOS')) return '🍎'
        if (role.includes('Game')) return '🎮'
        if (role.includes('Blockchain')) return '⛓️'
        if (role.includes('Security') || role.includes('Cyber')) return '🛡️'
        if (role.includes('ML') || role.includes('Machine Learning')) return '🧠'
        if (role.includes('Data')) return '📊'
        if (role.includes('DevOps')) return '🔄'
        if (role.includes('Frontend')) return '🎨'
        if (role.includes('Backend')) return '🏗️'
        if (role.includes('Full Stack')) return '🥞'
        return '💻'
    }

    const statusColor = session.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : session.status === 'in-progress' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-700';

    const iconBg = session.status === 'completed' ? 'bg-[#EEF2FF] text-[#6366F1]' : 'bg-[#F0FDFA] text-[#14B8A6]';

    const scoreColor = session.status === 'completed' ? ((session.overallScore ?? 0) > 7.5 ? 'text-emerald-500' : 'text-orange-500') : 'text-slate-300';

    return (
        <div
            onClick={() => onClick(session)}
            className="group bg-white border border-slate-50 rounded-4xl p-6 flex flex-col md:flex-row items-center gap-6 transition-all hover:shadow-2xl hover:shadow-slate-200 active:scale-[0.99] cursor-pointer"
        >
            <div className="flex items-center gap-6 w-full md:w-auto grow">
                <div className={`w-16 h-16 shrink-0 rounded-3xl flex items-center justify-center text-3xl shadow-sm ${iconBg}`}>
                    {getIcon()}
                </div>
                <div className="overflow-hidden grow">
                    <h3 className="font-black text-[#10B981] text-base sm:text-lg truncate tracking-tight">
                        {session.role}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
                        <span>{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span className="text-slate-200">.</span>
                        <span className="text-slate-500 bg-slate-50 px-2 py-0.5 rounded-lg">
                            {session.level}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-left md:text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Global Score</p>
                    <p className={`text-xl sm:text-2xl font-black ${scoreColor}`}>
                        {session.status === 'completed' ? session.overallScore?.toFixed(1) : '0.0'}
                    </p>
                </div>

                <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor}`}>{session.status}</span>
                    <span className="text-teal-600 font-bold text-xs flex items-center">
                        {session.status === 'completed' ? 'Results' : 'Start Interview'}
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><polyline points="12 5 19 12 12 19"></polyline></svg>
                    </span>
                </div>
            </div>

            <div className="hidden md:block w-px h-10 bg-slate-300 mx-2"></div>

            <button onClick={(e) => { e.stopPropagation(); if (isDeletable) onDelete(e, session._id) }} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer" title="Delete Session">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
            </button>
        </div>
    );
}

export default SessionCard;
