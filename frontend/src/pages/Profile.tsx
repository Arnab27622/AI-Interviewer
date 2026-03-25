import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { toast } from "react-toastify"
import { updateProfile, reset } from "../features/auth/authSlice"
import { ROLES } from "../types/misc"

const inputBase = 'w-full bg-slate-50 border-2 border-transparent rounded-xl sm:rounded-2xl p-3.5 sm-4 font-semibold text-slate-700 text-base transition-all focus:bg-white focus:border-teal-500 outline-none'

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
            </div>
        </div>
    )
}

export default Profile