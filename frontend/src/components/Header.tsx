import { useState } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import type { RootState, AppDispatch } from "../app/store"
import { useDispatch, useSelector } from "react-redux"
import { logout, reset } from "../features/auth/authSlice"

const Header = () => {
    const { user } = useSelector((state: RootState) => state.auth)
    const dispatch = useDispatch<AppDispatch>()
    const navigate = useNavigate()
    const location = useLocation()

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const onLogout = () => {
        dispatch(logout())
        dispatch(reset())
        navigate('/')
    }

    const isActive = (path: string) => location.pathname === path;

    return (<>
        <header className="bg-slate-900/95 backdrop-blur-md text-white shadow-2xl sticky top-0 z-50 border-b border-slate-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2">
                    <div className="bg-teal-500 p-1.5 rounded-lg group-hover:rotate-12 transition-transform duration-300">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                    </div>
                    <span className="text-lg sm:text-xl font-black tracking-tighter uppercase text-white group-hover:text-teal-400 transition-colors">Prepify</span>
                </Link>

                <nav className="hidden md:flex items-center space-x-6">
                    {user ? (
                        <>
                            <Link to="/" className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive('/') ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
                                Dashboard
                            </Link>
                            <Link to="/profile" className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive('/profile') ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
                                Profile
                            </Link>
                            <div className="flex items-center space-x-2 bg-slate-800/50 px-4 py-1.5 rounded-full border border-slate-700">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold uppercase text-slate-300">{user.name.split(' ')[0]}</span>
                            </div>
                            <button onClick={onLogout} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-5 py-2.5 rounded-xl uppercase tracking-widest transition duration-300 shadow-lg active:scale-95">
                                Logout
                            </button>
                        </>
                    ) : (
                        <div className="flex space-x-6">
                            <Link to="/login" className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive('/login') ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
                                Login
                            </Link>
                            <Link to="/register" className={`text-sm font-bold uppercase tracking-widest transition-all ${isActive('/register') ? 'text-teal-400 border-b-2 border-teal-400' : 'text-slate-400 hover:text-white border-b-2 border-transparent'}`}>
                                Register
                            </Link>
                        </div>
                    )}
                </nav>

                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-teal-400 transition-colors cursor-pointer">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </div>
            {isMenuOpen && (
                <div className="md:hidden bg-slate-900 border-t border-slate-800 animate-in slide-in-from-top-2 duration-300">
                    <div className="px-6 py-8 space-y-4">
                        {user ? (<>
                            <div className="flex items-center space-x-3 mb-6 p-4 bg-slate-800 rounded-2xl border border-slate-700">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-lg font-black uppercase tracking-tighter text-slate-200">{user.name}</span>
                            </div>
                            <Link to='/' onClick={() => setIsMenuOpen(false)} className={`block py-4 text-xl font-black uppercase tracking-widest border-b border-slate-800 ${isActive('/') ? 'text-teal-400' : 'text-slate-400'}`}>
                                Dashboard
                            </Link>
                            <Link to='/profile' onClick={() => setIsMenuOpen(false)} className={`block py-4 text-xl font-black uppercase tracking-widest border-b border-slate-800 ${isActive('/profile') ? 'text-teal-400' : 'text-slate-400'}`}>
                                Profile
                            </Link>
                            <button onClick={onLogout} className="w-full mt-6 bg-rose-600 hover:bg-rose-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                Logout
                            </button>
                        </>) : (<>
                            <Link to='/login' onClick={() => setIsMenuOpen(false)} className={`block py-4 text-xl font-black uppercase tracking-widest border-b border-slate-800 ${isActive('/login') ? 'text-teal-400' : 'text-slate-400'}`}>
                                Login
                            </Link>
                            <Link to='/register' onClick={() => setIsMenuOpen(false)} className={`block py-4 text-xl font-black uppercase tracking-widest border-b border-slate-800 ${isActive('/register') ? 'text-teal-400' : 'text-slate-400'}`}>
                                Register
                            </Link>
                        </>)}
                    </div>
                </div>
            )}
        </header>
    </>
    )
}

export default Header