import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "react-toastify"
import { updateProfile, reset } from "../features/auth/authSlice"
import { ROLES } from "../types/misc"
import type { RootState, AppDispatch } from "../app/store"
import CustomSelect from "../components/CustomSelect"

interface FormFieldProps {
    label: string;
    children: React.ReactNode;
    muted?: boolean;
}

function FormField({ label, children, muted }: FormFieldProps) {
    return (
        <div className={`space-y-3 ${muted ? 'opacity-40' : ''}`}>
            <label className="ml-1 text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">{label}</label>
            {children}
        </div>
    )
}

function Loader() {
    return (
        <>
            <span className="w-5 h-5 border-2 border-white/20 border-t-white animate-spin rounded-full" />
            <span className="ml-2">Updating...</span>
        </>
    )
}

const Profile = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, isProfileLoading } = useSelector((state: RootState) => state.auth);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        preferredRole: user?.preferredRole || "",
    });

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    const [prevUserId, setPrevUserId] = useState(user?.id);
    if (user?.id !== prevUserId) {
        setPrevUserId(user?.id);
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            preferredRole: user?.preferredRole || "",
        });
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRoleChange = (name: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [name]: String(value) }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) return;
        
        if (formData.name === user?.name && formData.preferredRole === user?.preferredRole) {
            toast.error("No changes to update");
            return;
        }

        try {
            await dispatch(updateProfile({ ...user, ...formData })).unwrap();
            toast.success("Profile updated successfully");
            dispatch(reset());
        } catch (error: unknown) {
            const errorMessage = (error as { message?: string })?.message || "An error occurred";
            toast.error(errorMessage);
            dispatch(reset());
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-12 pb-32">
            <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-primary-500 to-indigo-500 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="glass-card rounded-[2.5rem] relative">
                    <div className="bg-white/5 px-10 py-8 border-b border-white/5 flex items-center justify-between rounded-t-[2.5rem]">
                        <div>
                            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Aesthetic <span className="text-surface-500">Settings</span></h1>
                            <p className="text-surface-500 mt-1 text-xs font-bold uppercase tracking-widest">Update your identification</p>
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center text-3xl shadow-lg shadow-primary-500/10">
                            👤
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-10 space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <FormField label="Full Identity">
                                <input 
                                    type="text" 
                                    name="name" 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    className="glass-input h-14 font-bold" 
                                    placeholder="Enter your name" 
                                />
                            </FormField>

                            <FormField label="Email Access" muted={true}>
                                <div className="glass-input h-14 flex items-center opacity-60 bg-white/2 cursor-not-allowed">
                                    <span className="font-bold text-surface-400">{formData.email}</span>
                                </div>
                            </FormField>
                        </div>

                        <div className="pt-4">
                            <CustomSelect 
                                label="Primary Professional Role" 
                                name="preferredRole" 
                                options={ROLES} 
                                value={formData.preferredRole} 
                                onChange={handleRoleChange} 
                            />
                        </div>

                        <div className="pt-6">
                            <button 
                                type="submit" 
                                disabled={isProfileLoading} 
                                className={`w-full h-14 flex items-center justify-center gap-3 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all active:scale-[0.98] ${isProfileLoading ? 'bg-surface-800 text-surface-500 cursor-wait' : 'bg-primary-600 text-white hover:bg-primary-500 shadow-xl shadow-primary-900/40 hover:-translate-y-1 cursor-pointer'}`}
                            >
                                {isProfileLoading ? <Loader /> : (
                                    <>
                                        Synchronize Changes
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4"/><path d="m16 2-4 4-4-4"/><path d="M12 22v-4"/><path d="m8 22 4-4 4 4"/><path d="M22 12h-4"/><path d="m22 8-4 4 4 4"/><path d="M2 12h4"/><path d="m2 16 4-4-4-4"/></svg>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Profile