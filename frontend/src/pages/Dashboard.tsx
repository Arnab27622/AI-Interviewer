import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { createSession, deleteSession, getSession } from "../features/session/sessionSlice"
import type { RootState, AppDispatch } from "../app/store"
import { toast } from "react-toastify"
import SessionCard from "../components/SessionCard"
import SkeletonSessionCard from "../components/SkeletonSessionCard"
import ConfirmModal from "../components/ConfirmModal"
import type { Session } from "../types/session"
import { ROLES, LEVELS, TYPES, COUNTS } from "../types/misc"


import NewInterviewForm, { type FormChangeEvent } from "../components/NewInterviewForm"

import { motion } from "framer-motion"

const Dashboard = () => {
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const { user } = useSelector((state: RootState) => state.auth)
    const { sessions, isLoading, isGenerating, isError, message, pagination, stats } = useSelector((state: RootState) => state.session)
    const isProcessing = isGenerating || isLoading;
    const [formData, setFormData] = useState({
        role: user?.preferredRole || ROLES[0],
        level: LEVELS[0],
        interviewType: TYPES[1].value,
        count: COUNTS[0],
    })

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        sessionId: '',
    })

    useEffect(() => {
        dispatch(getSession())
    }, [dispatch]);

    useEffect(() => {
        if (isError && message) {
            toast.error(message);
        }
    }, [isError, message, dispatch]);

    const onChange = (e: FormChangeEvent) => {
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
        } else if (session.status === 'in-progress') {
            navigate(`/interview/${session._id}`)
        } else {
            toast.info("Session not ready yet")
        }
    }

    const handleDelete = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation()
        setModalConfig({
            isOpen: true,
            sessionId: sessionId,
        })
    }

    const confirmDelete = () => {
        if (modalConfig.sessionId) {
            dispatch(deleteSession(modalConfig.sessionId));
            toast.success("Session deleted successfully");
            setModalConfig({ isOpen: false, sessionId: '' });
        }
    }

    const loadMore = () => {
        if (pagination && pagination.currentPage < pagination.totalPages) {
            dispatch(getSession({ page: pagination.currentPage + 1 }));
        }
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Calculate stats globally
    const totalSessions = stats?.totalSessions || 0;
    const completedSessions = stats?.completedSessions || 0;
    const activeSessions = stats?.activeSessions || 0;

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16">
            {/* Header Section */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col sm:flex-row sm:items-end justify-between gap-8 pb-4"
            >
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Terminal Active</span>
                    </div>
                    <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
                        Welcome, <span className="text-gradient pr-4">{user?.name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-surface-400 text-base sm:text-lg font-medium max-w-md leading-relaxed">
                        Precision practice for high-stakes interviews. Level up your performance today.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 lg:flex items-center gap-4">
                    <div className="glass-card px-6 py-4 rounded-3xl flex flex-col gap-1 border-white/5 shadow-inner">
                        <p className="text-[9px] text-surface-500 font-black uppercase tracking-[0.2em]">Total Pulse</p>
                        <p className="text-2xl font-black text-white">{totalSessions}</p>
                    </div>
                    <div className="glass-card px-6 py-4 rounded-3xl flex flex-col gap-1 border-white/5 border-l-primary-500/30">
                        <p className="text-[9px] text-surface-500 font-black uppercase tracking-[0.2em]">Completed</p>
                        <p className="text-2xl font-black text-emerald-400">{completedSessions}</p>
                    </div>
                    {activeSessions > 0 && (
                        <div className="glass-card px-6 py-4 rounded-3xl flex flex-col gap-1 border-white/5 border-l-indigo-500/30 animate-pulse">
                            <p className="text-[9px] text-surface-500 font-black uppercase tracking-[0.2em]">In Queue</p>
                            <p className="text-2xl font-black text-indigo-400">{activeSessions}</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* New Interview Card */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative group z-20"
            >
                <div className="absolute -inset-1 bg-linear-to-r from-primary-500/20 to-indigo-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000"></div>
                <div className="relative">
                    <NewInterviewForm
                        formData={formData}
                        onChange={onChange}
                        onSubmit={onSubmit}
                        isProcessing={isProcessing}
                    />
                </div>
            </motion.div>

            {/* Interview History Section */}
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8 pb-12"
            >
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black flex items-center gap-4 text-white">
                        <span className="p-2.5 glass-card rounded-xl flex items-center justify-center text-xl shadow-inner border-white/5">📋</span>
                        Interview <span className="text-surface-500">History</span>
                    </h2>
                    <div className="h-px grow mx-6 bg-white/5 hidden sm:block"></div>
                </div>

                <div className="grid gap-8">
                    {isLoading && (!sessions || !Array.isArray(sessions) || sessions.length === 0) ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <SkeletonSessionCard key={i} />
                            ))}
                        </div>
                    ) : (
                        (!sessions || !Array.isArray(sessions) || sessions.length === 0) ? (
                            <motion.div 
                                variants={itemVariants}
                                className="glass-card rounded-[3rem] py-24 text-center border-dashed border-white/10 group/empty"
                            >
                                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 group-hover/empty:scale-110 transition-transform duration-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-surface-600"><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-widest text-surface-400">Archive Clear</h3>
                                <p className="text-surface-500 mt-2 font-medium">Initialize your first session to populate this database.</p>
                                <button className="mt-8 btn-secondary py-2! px-8! text-[10px] uppercase tracking-widest font-black">Open Guidebook</button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sessions.map((session, index) => (
                                    <motion.div key={session._id || index} variants={itemVariants}>
                                        <SessionCard
                                            session={session}
                                            onClick={viewSession}
                                            onDelete={handleDelete}
                                        />
                                    </motion.div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {pagination && pagination.currentPage < pagination.totalPages && (
                    <div className="flex justify-center pt-8">
                        <button 
                            onClick={loadMore}
                            disabled={isLoading}
                            className="btn-secondary px-8 py-3 text-[10px] font-black uppercase tracking-widest disabled:opacity-50 cursor-pointer"
                        >
                            {isLoading ? 'Loading...' : 'Load More Archives'}
                        </button>
                    </div>
                )}
            </motion.div>

            <ConfirmModal
                isOpen={modalConfig.isOpen}
                title="Vanish Session?"
                message="This will permanently delete this interview session from your history. Are you sure?"
                confirmText="Vanish"
                cancelText="Keep"
                onConfirm={confirmDelete}
                onCancel={() => setModalConfig({ isOpen: false, sessionId: '' })}
                isDanger={true}
            />
        </div>
    );
}

export default Dashboard