import type { Session } from "../types/session";

interface SessionCardProps {
    session: Session;
    onClick: (session: Session) => void;
    onDelete: (e: React.MouseEvent, sessionId: string) => void;
}

const SessionCard = ({ session, onClick, onDelete }: SessionCardProps) => {
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
        if (role.includes('Data')) return '📊'
        if (role.includes('DevOps')) return '🔄'
        return '💻'
    }

    const iconBg = session.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600';
    const scoreColor = session.status === 'completed' ? ((session.overallScore ?? 0) > 7.5 ? 'text-emerald-500' : 'text-orange-500') : 'text-slate-300';
    
    return (
        <div onClick={() => onClick(session)} className="group bg-white border border-slate-100 rounded-2xl sm:rounded-4xl p-5 sm:p-6 flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-lg active:scale-[0.98] cursor-pointer">
            <div className="flex items-center gap-4 sm:gap-6 w-full md:w-auto grow">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-xl sm:rounded-2xl flex items-center justify-center text-xl sm:text-2xl shadow-sm ${iconBg}`}>
                    {getIcon()}
                </div>
                <div className="overflow-hidden grow">
                    <h3 className="font-bold text-slate-900 text-base sm:text-lg truncate group-hover:text-teal-600">{session.role}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                        <span>{session.createdAt ? new Date(session.createdAt).toLocaleDateString() : 'N/A'}</span>
                        <span>.</span>
                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md" >{session.level}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                {session.status === 'completed' && (
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Score</p>
                        <p className={`text-xl font-black ${scoreColor}`}>
                            {session.overallScore?.toFixed(1) || '0.0'}
                        </p>
                    </div>
                )}
                <button 
                    onClick={(e) => onDelete(e, session._id)}
                    className="p-2 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-colors"
                    title="Delete session"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </div>
        </div>
    )
}

export default SessionCard;