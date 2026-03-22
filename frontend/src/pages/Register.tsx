import { useState, useEffect } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { googleLogin, register, reset } from "../features/auth/authSlice";
import type { AppDispatch, RootState } from "../app/store";
import { toast } from "react-toastify";
import type { User } from "../types/user";
import { GoogleLogin, type CredentialResponse } from "@react-oauth/google";

const Register = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const { name, email, password, confirmPassword } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const { user, isLoading, isError, isSuccess, message } = useSelector(
        (state: RootState) => state.auth
    );

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }

        if (isSuccess) {
            toast.success("Registration successful");
            navigate("/");
            dispatch(reset())
        }

        if (user && !isSuccess) {
            navigate("/");
        }

    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const onSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
        } else {
            const userData = {
                name,
                email,
                password,
            } as unknown as User;
            dispatch(register(userData));
        }
    };

    const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
        if (credentialResponse.credential) {
            dispatch(googleLogin(credentialResponse.credential));
        } else {
            toast.error("Google Login Failed");
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
            </div>);
    }

    return (<div className="flex justify-center items-center min-h-[90vh] bg-gray-50 sm:px-6 py-10">
        <div className="w-full max-w-md bg-white p-6 sm:p-10 border border-gray-200 rounded-2xl shadow-xl">
            <div className="text-center mb-8">
                <h2 className="text-xs font-black uppercase tracking-[0.3rem] text-teal-600 mb-2">Prepify</h2>
                <h1 className="text-3xl sm:text-4xl font-black text-gray-900 leading-tight">Get <span className="text-teal-500">Started</span></h1>
                <p className="text-gray-500 mt-3 text-sm sm:text-base px-2">Join thousands of developer practicing for their dream job</p>
            </div>

            <form className="grid grid-cols-1 gap-4" onSubmit={onSubmit}>
                <div className="space-y-1">
                    <label htmlFor="name" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Full Name</label>
                    <input type="text" id="name" name="name" value={name} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter your full name" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="email" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Email Address</label>
                    <input type="email" id="email" name="email" value={email} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter your email address" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="password" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Password</label>
                    <input type="password" id="password" name="password" value={password} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter your password" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="confirmPassword" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Confirm Password</label>
                    <input type="password" id="confirmPassword" name="confirmPassword" value={confirmPassword} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Confirm your password" required />
                </div>
                <button type="submit" className="w-full p-3.5 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all active:scale-[0.98] cursor-pointer">Register</button>
            </form>

            <div className="my-8 flex items-center">
                <div className="grow border-t border-gray-200"></div>
                <div className="mx-4 text-gray-400 text-[13px] font-black tracking-widest uppercase">OR</div>
                <div className="grow border-t border-gray-200"></div>
            </div>
            
            <div className="w-full flex items-center justify-center">
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => {
                        toast.error("Google Login Failed");
                    }}
                    theme="outline"
                    shape="circle"
                    size="large"
                    text="continue_with"
                />
            </div>

            <div className="mt-7 text-center">
                <p className="text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-teal-500 font-bold hover:underline">Log in</Link>
                </p>
            </div>
        </div>
    </div>
    )
}

export default Register