import { Link } from "react-router-dom";

export const Logo = () => {
  return (
    <Link to="/" className="flex items-center space-x-3 group transition-all duration-300">
      <div className="bg-linear-to-br from-primary-400 to-indigo-500 p-2 rounded-xl group-hover:rotate-12 transition-all duration-500 shadow-[0_0_20px_rgba(45,212,191,0.3)]">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <span className="text-2xl font-black tracking-tighter uppercase font-display text-white group-hover:text-primary-400 transition-colors">
        Prepify
      </span>
    </Link>
  );
};
