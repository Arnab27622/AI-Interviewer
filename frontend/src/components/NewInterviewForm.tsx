import React from "react";
import { ROLES, LEVELS, TYPES, COUNTS } from "../types/misc";

interface NewInterviewFormProps {
    formData: {
        role: string;
        level: string;
        interviewType: string;
        count: number;
    };
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    isProcessing: boolean;
}

const NewInterviewForm: React.FC<NewInterviewFormProps> = ({
    formData,
    onChange,
    onSubmit,
    isProcessing,
}) => {
    return (
        <div className="bg-white rounded-4xl shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
            <div className="bg-[#1B1B2F] px-8 py-5">
                <h2 className="text-lg font-bold text-white flex items-center gap-4">
                    <span className="bg-[#10B981] w-1.5 h-5 rounded-full"></span>
                    New Interview
                </h2>
            </div>
            <form onSubmit={onSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Role</label>
                    <div className="relative group/select">
                        <select name="role" value={formData.role} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                            {ROLES.map((role) => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Level</label>
                    <div className="relative group/select">
                        <select name="level" value={formData.level} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                            {LEVELS.map((level) => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Length</label>
                    <div className="relative group/select">
                        <select name="count" value={formData.count} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                            {COUNTS.map((count) => (
                                <option key={count} value={count}>{count} Qs</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Type</label>
                    <div className="relative group/select">
                        <select name="interviewType" value={formData.interviewType} onChange={onChange} className="w-full bg-slate-50 border-none rounded-2xl p-4 pr-12 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-[#10B981] cursor-pointer appearance-none transition-all">
                            {TYPES.map((type) => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within/select:text-[#10B981] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>
                        </div>
                    </div>
                </div>
                <button type="submit" disabled={isProcessing} className={`w-full h-14 rounded-2xl font-black text-sm text-white flex items-center justify-center gap-3 shadow-lg shadow-teal-100 transition-all active:scale-[0.98] ${isProcessing ? 'bg-slate-300' : 'bg-[#10B981] hover:bg-[#059669]'} cursor-pointer`}>
                    {isProcessing ? (
                        <>
                            <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full"></span> 
                            Processing...
                        </>
                    ) : (
                        "Start Interview"
                    )}
                </button>
            </form>
        </div>
    );
};

export default NewInterviewForm;
