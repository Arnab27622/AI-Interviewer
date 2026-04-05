import { useState, useEffect } from "react";
import type { ChangeEvent, SyntheticEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { login, reset, googleLogin } from "../features/auth/authSlice";
import type { RootState, AppDispatch } from "../app/store";
import type { User } from "../types/user";
import { GoogleLogin } from "@react-oauth/google";
import type { CredentialResponse } from "@react-oauth/google";

const Login = () => {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const { email, password } = formData;

    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isLoading, isError, isSuccess, message } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        dispatch(reset());
    }, [dispatch]);

    useEffect(() => {
        if (isError) {
            toast.error(message);
            dispatch(reset());
        }

        if (isSuccess && user) {
            toast.success("Login successful");
            navigate("/");
            dispatch(reset());
        }
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleSubmit = (e: SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        dispatch(login(formData as unknown as User));
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
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h2>
                <p className="text-gray-500 text-sm">Sign in to your account</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label htmlFor="email" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Email Address</label>
                    <input type="email" id="email" name="email" value={email} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter your email address" required />
                </div>
                <div className="space-y-1">
                    <label htmlFor="password" className="text-[10px] font-bold uppercase text-gray-400 ml-1">Password</label>
                    <input type="password" id="password" name="password" value={password} onChange={handleChange} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" placeholder="Enter your password" required />
                </div>
                <button type="submit" className="w-full p-3.5 bg-teal-600 text-white font-bold rounded-xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all active:scale-[0.98] cursor-pointer">Login</button>
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

            <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                    Don't have an account?{" "}
                    <Link to="/register" className="font-bold text-teal-600 hover:text-teal-700 transition-colors">Register here</Link>
                </p>
            </div>
        </div>
    </div>
    );
}

export default Login