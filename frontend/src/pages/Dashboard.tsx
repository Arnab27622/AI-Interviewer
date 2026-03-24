import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createSession, deleteSession, getSession, reset } from "../features/session/sessionSlice"
import type { RootState, AppDispatch } from "../app/store"
import { toast } from "react-toastify"
import SessionCard from "../components/SessionCard"
import type { Session } from "../types/session"

const ROLES = [
    "Software Engineer",
    "Data Scientist",
    "Product Manager",
    "UI/UX Designer",
    "Project Manager",
    "Business Analyst",
    "QA Engineer",
    "DevOps Engineer",
    "Cloud Engineer",
    "Security Engineer",
    "Mobile Developer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "Machine Learning Engineer",
    "Data Analyst"
]

const LEVELS = ["Junior", "Mid-level", "Senior", "Architect", "Manager"]

const TYPES = [{ label: "Oral only", value: "oral-only" }, { label: "Coding mix", value: "coding-mix" }]

const COUNTS = [5, 10, 15, 20]

const Dashboard = () => {
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const { user } = useSelector((state: RootState) => state.auth)
    const { sessions, isLoading, isGenerating, isError, message } = useSelector((state: RootState) => state.session)
    const isProcessing = isGenerating || isLoading;
    const [formData, setFormData] = useState({
        role: user?.preferredRole || ROLES[0],
        level: LEVELS[0],
        interviewType: TYPES[1].value,
        count: COUNTS[0],
    })

    useEffect(() => {
        dispatch(getSession())
    }, [dispatch]);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
            dispatch(reset());
        }
    }, [isError, message, dispatch]);

    const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        dispatch(createSession(formData));
    };

    const viewSession = (session: Session) => {
        if (session.status === 'completed') {
            navigate(`/review/${session._id}`)
        } else {
            navigate(`/interview/${session._id}`)
        }
    }

    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation()
        if (window.confirm("Are you sure you want to delete this session?")) {
            dispatch(deleteSession(sessionId));
            toast.success("Session deleted successfully");
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-16 space-y-12 animate-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Welcome, <span className="text-[#10B981]">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-base font-medium">
                        Let's get you ready for your next interview
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                        <div>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Total Sessions</p>
                            <p className="text-2xl font-black text-slate-800 leading-none mt-1">
                                {Array.isArray(sessions) ? sessions.length : 0}
                            </p>
                        </div>
                        <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Interview Card */}
            <div className="bg-white rounded-4xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="bg-[#1B1B2F] px-8 py-5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-4">
                        <span className="bg-[#10B981] w-1.5 h-5 rounded-full"></span>
                        New Interview
                    </h2>
                </div>
                <form onSubmit={onSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                        <div className="relative group/select">
                            <select name="role" value={formData.role} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                                {ROLES.map((role) => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                        <div className="relative group/select">
                            <select name="level" value={formData.level} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                                {LEVELS.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Length</label>
                        <div className="relative group/select">
                            <select name="count" value={formData.count} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                                {COUNTS.map((count) => (
                                    <option key={count} value={count}>{count} Qs</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                        <div className="relative group/select">
                            <select name="interviewType" value={formData.interviewType} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                                {TYPES.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                            </div>
                        </div>
                    </div>
                    <button type="submit" disabled={isProcessing} className={`w-full h-14 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 shadow-lg shadow-teal-100 transition-all active:scale-[0.98] ${isProcessing ? 'bg-slate-300' : 'bg-[#10B981] hover:bg-[#059669]'} cursor-pointer`}>
                        {isProcessing ? (
                            <>
                                <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></span> 
                                Processing...
                            </>
                        ) : (
                            "Start Interview"
                        )}
                    </button>
                </form>
            </div>

            {/* Interview History Section */}
            <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#1B1B2F] flex items-center gap-4">
                    <span className="w-12 h-12 bg-white shadow-sm border border-slate-100 rounded-2xl flex items-center justify-center text-2xl">📊</span>
                    Interview History
                </h2>
                
                <div className="grid gap-6">
                    {isLoading && (!sessions || !Array.isArray(sessions) || sessions.length === 0) ? (
                        <div className="flex items-center justify-center py-24">
                            <div className="animate-spin h-14 w-14 border-4 border-[#10B981] border-t-transparent rounded-full"></div>
                        </div>
                    ) : (
                        (!sessions || !Array.isArray(sessions) || sessions.length === 0) ? (
                            <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] py-24 text-center">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                </div>
                                <p className="text-slate-400 font-bold text-xl uppercase tracking-widest">No Sessions Found</p>
                                <p className="text-slate-300 mt-2 font-medium">Start a new interview to see your history here.</p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {sessions.map((session, index) => (
                                    <SessionCard 
                                        key={session._id || index} 
                                        session={session} 
                                        onClick={viewSession} 
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default Dashboard