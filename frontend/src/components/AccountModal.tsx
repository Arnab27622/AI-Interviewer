import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, updateProfile, reset } from "../features/auth/authSlice";
import { useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../app/store";
import { X, LogOut, User, Mail, Save } from "lucide-react";
import { motion } from "framer-motion";
import { ROLES } from "../types/misc";
import CustomSelect from "./CustomSelect";
import { toast } from "react-toastify";

const AccountModal = ({ onClose }: { onClose: () => void }) => {
    const { user, isProfileLoading } = useSelector((state: RootState) => state.auth);
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: user?.name || "",
        preferredRole: user?.preferredRole || "",
    });

    // Lock background scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    const onLogout = () => {
        dispatch(logout());
        dispatch(reset());
        onClose();
        navigate('/');
    };

    const handleRoleChange = (name: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
    };

    const handleSave = async () => {
        if (!user) return;
        
        if (formData.name === user.name && formData.preferredRole === user.preferredRole) {
            toast.info("No changes detected");
            return;
        }

        try {
            await dispatch(updateProfile({ ...user, ...formData })).unwrap();
            toast.success("Identity synchronized");
            dispatch(reset());
        } catch (error: unknown) {
            const errorMessage = (error as { message?: string })?.message || "Protocol error";
            toast.error(errorMessage);
            dispatch(reset());
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-surface-950/60 backdrop-blur-md"
            />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md glass-card rounded-[2.5rem] overflow-visible shadow-2xl border border-white/5"
            >
                {/* Header */}
                <div className="bg-white/3 px-8 py-6 border-b border-white/5 flex items-center justify-between rounded-t-[2.5rem] overflow-hidden">
                    <div>
                        <h1 className="text-xl font-black text-surface-100 uppercase tracking-tighter">Settings</h1>
                        <p className="text-surface-500 text-[9px] font-black uppercase tracking-widest mt-1">Configure your profile</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 text-surface-500 hover:text-white transition-colors rounded-xl hover:bg-white/5 cursor-pointer"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        {/* Name Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest ml-1">Identity Name</label>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-600 group-focus-within:text-primary-400 transition-colors">
                                    <User size={16} />
                                </div>
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                                    className="glass-input h-12 pl-12 text-sm font-bold w-full"
                                    placeholder="Enter your name"
                                />
                            </div>
                        </div>

                        {/* Email (Locked) */}
                        <div className="space-y-2 opacity-60">
                            <label className="text-[10px] font-black text-surface-500 uppercase tracking-widest ml-1">Locked Access Email</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-500">
                                    <Mail size={16} />
                                </div>
                                <div className="glass-input h-12 pl-12 flex items-center text-sm font-bold bg-white/2 cursor-not-allowed">
                                    {user?.email}
                                </div>
                            </div>
                        </div>

                        {/* Role Selection */}
                        <div className="z-50">
                            <CustomSelect 
                                label="Preferred Role"
                                name="preferredRole"
                                value={formData.preferredRole}
                                options={ROLES}
                                onChange={handleRoleChange}
                            />
                        </div>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex gap-3 pt-2">
                        <button 
                            onClick={handleSave}
                            disabled={isProfileLoading}
                            className={`flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all active:scale-[0.98] ${isProfileLoading ? 'bg-surface-800 text-surface-500' : 'btn-primary py-0! px-0!'}`}
                        >
                            <Save size={14} />
                            {isProfileLoading ? 'Syncing...' : 'Save Changes'}
                        </button>
                        
                        <button 
                            onClick={onLogout}
                            className="w-12 h-12 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center transition-all shadow-lg shadow-rose-900/20 active:scale-[0.98] group cursor-pointer"
                            title="Logout"
                        >
                            <LogOut size={16} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default AccountModal;
