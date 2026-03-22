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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-8 sm:space-y-12 animate-in duration-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-50 pb-6 sm:pb-8">
                <div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">Welcome, <span className="text-teal-600">{user?.name?.split(' ')[0]}</span></h1>
                    <p className="text-slate-500 mt-1 text-sm sm:text-lg font-medium">Let's get you ready for your next interview</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-50 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl border border-teal-100 flex sm:block items-center gap-2">
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">Total Sessions</p>
                        <p className="text-xl sm:text-2xl font-black text-teal-700 leading-none">{Array.isArray(sessions) ? sessions.length : 0}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-xl sm:shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 sm:px-8 sm:py-6">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <span className="bg-teal-500 w-1.5 h-5 rounded-full mr-3"></span>
                        New Interview
                    </h2>
                </div>
                <form onSubmit={onSubmit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 items-end">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                        <select name="role" value={formData.role} onChange={onChange} className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer">
                            {ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 lg:contents">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                            <select name="level" value={formData.level} onChange={onChange} className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer">
                                {LEVELS.map((level) => (
                                    <option key={level} value={level}>{level}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Length</label>
                            <select name="count" value={formData.count} onChange={onChange} className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer">
                                {COUNTS.map((count) => (
                                    <option key={count} value={count}>{count}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Interview Type</label>
                        <select name="interviewType" value={formData.interviewType} onChange={onChange} className="w-full bg-slate-50 border-none rounded-xl sm:rounded-2xl p-3 text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 cursor-pointer">
                            {TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={isProcessing} className={`w-full h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 ${isProcessing ? 'bg-slate-300' : 'bg-teal-600 hover:bg-teal-700'} cursor-pointer`}>
                        {isProcessing ? <>
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> Generating...
                        </> : <span className="text-sm">Start Interview</span>}
                    </button>
                </form>

                <div className="space-y-6 pb-20 sm:pb-0">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center px-2">
                        <span className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg sm:rounded-xl flex items-center justify-center mr-3 text-sm sm:text-lg">📊</span>
                        Interview History
                    </h2>
                    {isLoading && (!sessions || !Array.isArray(sessions) || sessions.length == 0) ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-teal-500 rounded-full"></div>
                        </div>
                    ) : (
                        (!sessions || !Array.isArray(sessions) || sessions.length == 0) ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl sm:rounded-4xl py-16 sm:py-20 text-center">
                                <p className="text-slate-400 font-bold text-base sm:text-lg">No Sessions yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {sessions.map((session, index) => (
                                    <SessionCard key={session._id || index} session={session} onClick={viewSession} onDelete={handleDelete} />
                                ))}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard