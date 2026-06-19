import React, { useState, useEffect } from "react";
import { ROLES, LEVELS, TYPES, COUNTS } from "../constants/interview";
import CustomSelect from "./CustomSelect";
import { COMPANIES } from "../constants/companies";
import type { NewInterviewFormProps } from "../types/forms";
import type { ResumeData } from "../features/resume/types";
import { getUserResumes } from "../services/resumeApi";
import { toast } from "react-toastify";

const NewInterviewForm: React.FC<NewInterviewFormProps> = ({
    formData,
    onChange,
    onSubmit,
    isProcessing,
}) => {
    const handleCustomChange = (name: string, value: string | number) => {
        onChange({ target: { name, value } });
    };

    const [resumes, setResumes] = useState<ResumeData[]>([]);

    useEffect(() => {
        const fetchResumes = async () => {
            try {
                const { data } = await getUserResumes();
                // Filter only completed resumes that have text/analysis
                setResumes(data.filter((r: ResumeData) => r.status === 'completed' || r.parsedData));
            } catch (error) {
                console.error("Failed to fetch resumes:", error);
                toast.error("Failed to load your resumes. Please try again later.");
            }
        };
        fetchResumes();
    }, []);

    const resumeOptions = [
        { label: "None (Standard Interview)", value: "" },
        ...resumes.map(r => ({ label: r.originalFilename || "Unnamed Resume", value: r._id }))
    ];

    const companyOptions = Object.values(COMPANIES).map(c => ({
        label: c.name,
        value: c.id
    }));

    const selectedCompany = COMPANIES[formData.company || "general"];
    const trackOptions = selectedCompany?.tracks.map(t => ({
        label: t.name,
        value: t.id
    })) || [{ label: "General", value: "general" }];

    return (
        <div className="bg-surface-800/40 border border-surface-600/30 rounded-3xl shadow-2xl shadow-black/40 backdrop-blur-md relative group/form z-10 transform-gpu">
            <div className="bg-surface-900/40 px-10 py-6 border-b border-surface-600/30 flex items-center justify-between rounded-t-3xl">
                <h2 className="text-xl font-black text-white flex items-center gap-4 font-display">
                    <span className="bg-primary-500 w-1.5 h-6 rounded-full shadow-[0_0_15px_rgba(45,212,191,0.5)]"></span>
                    Initiate <span className="text-surface-500">Session</span>
                </h2>
                <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-500/20"></div>
                    <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
                </div>
            </div>
            <form onSubmit={onSubmit} className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                <CustomSelect
                    label="Target Company"
                    name="company"
                    options={companyOptions}
                    value={formData.company || "general"}
                    onChange={(_, value) => {
                        handleCustomChange("company", value);
                        // Reset track when company changes
                        const companyObj = COMPANIES[value as string];
                        if (companyObj && companyObj.tracks.length > 0) {
                            handleCustomChange("companyTrack", companyObj.tracks[0].id);
                        } else {
                            handleCustomChange("companyTrack", "general");
                        }
                    }}
                />

                <CustomSelect
                    label="Company Track"
                    name="companyTrack"
                    options={trackOptions}
                    value={formData.companyTrack || "general"}
                    onChange={handleCustomChange}
                />

                <CustomSelect
                    label="Resume (Optional)"
                    name="resumeId"
                    options={resumeOptions}
                    value={formData.resumeId || ""}
                    onChange={handleCustomChange}
                />

                <div className="pt-5.5 lg:col-span-1 md:col-span-2">
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
