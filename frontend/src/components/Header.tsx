import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../app/store";
import AccountModal from "./AccountModal";
import { AnimatePresence } from "framer-motion";

const Header = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const isActive = (path: string) => location.pathname === path;

    return (
        <>
            <header className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-surface-900/80 backdrop-blur-xl border-b border-white/5 py-2' : 'bg-transparent py-4 border-b border-transparent'}`}>
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

                                    <button 
                                        onClick={() => setIsAccountModalOpen(true)}
                                        className="flex items-center space-x-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-white/20 transition-all group cursor-pointer"
                                    >
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] group-hover:animate-pulse"></div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-surface-200 group-hover:text-white transition-colors">{user.name.split(' ')[0]}</span>
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
                    <div className="bg-surface-900/95 backdrop-blur-2xl px-6 py-8 space-y-6">
                        {user ? (
                            <>
                                <div 
                                    onClick={() => { setIsAccountModalOpen(true); setIsMenuOpen(false); }}
                                    className="flex items-center space-x-4 mb-4 p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition-all"
                                >
                                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse"></div>
                                    <span className="text-base font-black uppercase tracking-widest text-white">{user.name}</span>
                                </div>
                                <Link
                                    to="/"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block py-3 text-lg font-black uppercase tracking-widest transition-colors ${isActive('/') ? 'text-primary-400' : 'text-surface-400 hover:text-white'}`}
                                >
                                    Dashboard
                                </Link>
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

            <AnimatePresence>
                {isAccountModalOpen && (
                    <AccountModal onClose={() => setIsAccountModalOpen(false)} />
                )}
            </AnimatePresence>
        </>
    );
};

export default Header;