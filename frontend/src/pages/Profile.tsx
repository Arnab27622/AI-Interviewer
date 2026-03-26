import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "react-toastify"
import { updateProfile, reset } from "../features/auth/authSlice"
import { ROLES } from "../types/misc"

function FormField({ label, children, muted }) {
    return (
        <div className={`space-y-1.5 ${muted ? 'opacity-60' : ''}`}>
            <label className="ml-1 text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest">{label}</label>
            {children}
        </div>
    )
}

function Loader() {
    return (
        <>
            <span className="w-5 h-5 border-2 border-slate-400 border-t-transparent animate-spin rounded-full" />
            <span className="ml-2 text-slate-500">Saving...</span>
        </>
    )
}

function SelectArrow() {
    return (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    )
}

const Profile = () => {
    const dispatch = useDispatch();
    const { user, isError, isSuccess, message, isProfileLoading } = useSelector((state: { auth: AuthState }) => state.auth);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        preferredRole: user?.preferredRole || "",
    });

    useEffect(() => {
        if (!isError && !isSuccess) return
        if (isError) toast.error(message);
        if (isSuccess) toast.success("Profile updated successfully");
        dispatch(reset());
    }, [isError, isSuccess, message, dispatch]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user?.name || "",
                email: user?.email || "",
                preferredRole: user?.preferredRole || "",
            });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (formData.name === user.name && formData.preferredRole === user.preferredRole) {
            toast.error("No changes to update");
            return;
        }

        dispatch(updateProfile(formData));
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 sm:py-12 pb-24">
            <div className="bg-white rounded-3xl shadow-xl sm:shadow-2xl p-6 sm:p-12 border border-slate-100">
                <header className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Edit Profile</h1>
                    <p className="text-slate-500 mt-1 text-sm">Update your personal information</p>
                </header>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <FormField label="Full Name" muted={false}>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl p-3.5 sm-4 font-semibold text-slate-700 text-base transition-all focus:bg-white focus:border-teal-500 outline-none" placeholder="Enter your full name" />
                    </FormField>

                    <FormField label="Email" muted={true}>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-slate-100 rounded-xl sm:rounded-2xl p-3.5 sm-4 font-semibold text-slate-500 text-base cursor-not-allowed" disabled />
                    </FormField>

                    <FormField label="Preferred Role" muted={false}>
                        <div className="relative">
                            <select name="preferredRole" value={formData.preferredRole} onChange={handleChange} className="w-full bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl p-3.5 sm-4 font-semibold text-slate-700 text-base transition-all focus:bg-white focus:border-teal-500 outline-none appearance-none cursor-pointer">
                                <option value="">Select your role</option>
                                {Object.values(ROLES).map((role) => (
                                    <option key={role} value={role}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </option>
                                ))}
                            </select>
                            <SelectArrow />
                        </div>
                    </FormField>

                    <div className="pt-4">
                        <button type="submit" disabled={isProfileLoading} className={`w-full flex items-center justify-center gap-2 py-4 font-bold rounded-xl sm:rounded-2xl transition-all active:scale-[0.98] ${isProfileLoading ? 'bg-slate-200 text-slate-400  cursor-wait' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-100 cursor-pointer'}`}>
                            {isProfileLoading ? <Loader /> : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Profile