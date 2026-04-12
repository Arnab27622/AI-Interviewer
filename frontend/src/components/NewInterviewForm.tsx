import React from "react";
import { ROLES, LEVELS, TYPES, COUNTS } from "../types/misc";
import CustomSelect from "./CustomSelect";

export type FormChangeEvent = 
    | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    | { target: { name: string; value: string | number } };

interface NewInterviewFormProps {
    formData: {
        role: string;
        level: string;
        interviewType: string;
        count: number;
    };
    onChange: (e: FormChangeEvent) => void;
    onSubmit: (e: React.SyntheticEvent) => void;
    isProcessing: boolean;
}

const NewInterviewForm: React.FC<NewInterviewFormProps> = ({
    formData,
    onChange,
    onSubmit,
    isProcessing,
}) => {
    const handleCustomChange = (name: string, value: string | number) => {
        onChange({ target: { name, value } });
    };

    return (
        <div className="glass-card rounded-[2.5rem] group/form relative z-10">
            <div className="bg-white/5 px-10 py-6 border-b border-white/5 flex items-center justify-between rounded-t-[2.5rem]">
                <h2 className="text-xl font-black text-white flex items-center gap-4">
                    <span className="bg-primary-500 w-1.5 h-6 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]"></span>
                    Initiate <span className="text-surface-500">Session</span>
                </h2>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
            </div>
            <form onSubmit={onSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                <CustomSelect
                    label="Professional Role"
                    name="role"
                    options={ROLES}
                    value={formData.role}
                    onChange={handleCustomChange}
                />

                <CustomSelect
                    label="Experience Level"
                    name="level"
                    options={LEVELS}
                    value={formData.level}
                    onChange={handleCustomChange}
                />

                <CustomSelect
                    label="Question Count"
                    name="count"
                    options={COUNTS.map(c => ({ label: `${c} Questions`, value: c }))}
                    value={formData.count}
                    onChange={handleCustomChange}
                />

                <CustomSelect
                    label="Modal Type"
                    name="interviewType"
                    options={TYPES}
                    value={formData.interviewType}
                    onChange={handleCustomChange}
                />

                <div className="pt-5.5">
                    <button
                        type="submit"
                        disabled={isProcessing}
                        className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-widest text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${isProcessing ? 'bg-surface-800 text-surface-500 cursor-not-allowed' : 'bg-primary-600 hover:bg-primary-500 shadow-lg shadow-primary-900/40 cursor-pointer hover:-translate-y-1'}`}
                    >
                        {isProcessing ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-surface-500 border-t-transparent rounded-full"></span>
                                Allocating...
                            </>
                        ) : (
                            <>
                                Launch Prep
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NewInterviewForm;
