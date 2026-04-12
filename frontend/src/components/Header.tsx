import { useState, useEffect } from "react"
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
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const onLogout = () => {
        dispatch(logout())
        dispatch(reset())
        navigate('/')
    }

    const isActive = (path: string) => location.pathname === path;

    return (
        <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-surface-950/80 backdrop-blur-xl border-b border-white/5 py-2' : 'bg-transparent py-4 border-b border-transparent'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-full">
                    {/* Logo Section */}
                    <Link to="/" className="flex items-center space-x-3 group transition-all duration-300">
                        <div className="bg-linear-to-br from-primary-400 to-indigo-500 p-2 rounded-xl group-hover:rotate-12 transition-all duration-500 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="text-2xl font-black tracking-tighter uppercase font-display text-white group-hover:text-primary-400 transition-colors">
                            Prepify
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-10">
                        {user ? (
                            <>
                                <Link
                                    to="/"
                                    className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${isActive('/') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                                >
                                    Dashboard
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-400 transition-all duration-500 ${isActive('/') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>

                                <Link
                                    to="/profile"
                                    className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${isActive('/profile') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                                >
                                    Profile
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-400 transition-all duration-500 ${isActive('/profile') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>

                                <div className="flex items-center space-x-2 bg-white/5 px-4 py-2 rounded-full border border-white/5 transition-all">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-surface-300">{user.name.split(' ')[0]}</span>
                                </div>

                                <button
                                    onClick={onLogout}
                                    className="btn-primary bg-rose-600! hover:bg-rose-500! py-2! px-5! rounded-xl! shadow-rose-900/20!"
                                >
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Logout</span>
                                </button>
                            </>
                        ) : (
                            <div className="flex space-x-10">
                                <Link
                                    to="/login"
                                    className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${isActive('/login') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                                >
                                    Login
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-400 transition-all duration-500 ${isActive('/login') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                                <Link
                                    to="/register"
                                    className={`relative py-1 text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 group ${isActive('/register') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                                >
                                    Register
                                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-primary-400 transition-all duration-500 ${isActive('/register') ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 hover:border-primary-400 transition-all duration-300 cursor-pointer group"
                    >
                        <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1.5">
                            <span className={`block w-5 h-0.5 bg-surface-300 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                            <span className={`block w-5 h-0.5 bg-surface-300 transition-all duration-300 ${isMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                            <span className={`block w-5 h-0.5 bg-surface-300 transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
                        </div>
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className={`md:hidden absolute top-full left-0 w-full overflow-hidden transition-all duration-500 ease-in-out ${isMenuOpen ? 'max-h-125 border-b border-white/10 shadow-2xl' : 'max-h-0'}`}>
                <div className="bg-surface-950/95 backdrop-blur-2xl px-6 py-8 space-y-6">
                    {user ? (
                        <>
                            <div className="flex items-center space-x-4 mb-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="w-3 h-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] animate-pulse"></div>
                                <span className="text-base font-black uppercase tracking-widest text-white">{user.name}</span>
                            </div>
                            <Link
                                to="/"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block py-3 text-lg font-black uppercase tracking-widest transition-colors ${isActive('/') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/profile"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block py-3 text-lg font-black uppercase tracking-widest transition-colors ${isActive('/profile') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                            >
                                Profile
                            </Link>
                            <button
                                onClick={() => { onLogout(); setIsMenuOpen(false); }}
                                className="w-full mt-6 btn-primary bg-rose-600! hover:bg-rose-500!"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block py-3 text-lg font-black uppercase tracking-widest transition-colors ${isActive('/login') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                onClick={() => setIsMenuOpen(false)}
                                className={`block py-3 text-lg font-black uppercase tracking-widest transition-colors ${isActive('/register') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                            >
                                Register
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}

export default Header