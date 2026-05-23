import { useState } from "react";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import type { AppDispatch } from "../../../app/store";
import { createSession } from "../../session/sessionSlice";
import type { ResumeData } from "../types";

interface JobMatchTabProps {
  resumeData: ResumeData;
}

export const JobMatchTab = ({ resumeData }: JobMatchTabProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loadingKeyword, setLoadingKeyword] = useState<string | null>(null);

  // Cover Letter state
  const [isGeneratingCL, setIsGeneratingCL] = useState(false);
  const [coverLetter, setCoverLetter] = useState<string | null>(null);

  const handleGenerateCoverLetter = async () => {
    if (!resumeData._id) return;
    try {
      setIsGeneratingCL(true);
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/resume/${resumeData._id}/cover-letter`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to generate cover letter");

      const data = await response.json();
      setCoverLetter(data.cover_letter);
      toast.success("Cover letter generated!");
    } catch (error) {
      toast.error("Error generating cover letter");
      console.error(error);
    } finally {
      setIsGeneratingCL(false);
    }
  };

  const copyToClipboard = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      toast.success("Copied to clipboard!");
    }
  };

  const handlePractice = async (keyword: string) => {
    try {
      setLoadingKeyword(keyword);
      // Dispatch createSession dynamically tailoring the role to the weakness
      const action = await dispatch(createSession({
        role: `Focus: ${keyword}`.substring(0, 50),
        level: "Intermediate",
        interviewType: "oral-only", // Oral only for quick targeted practice
        count: 3 // Short quick-fire session
      })).unwrap();

      toast.success(`Spinning up interview for ${keyword}...`);
      const sessionAction = action as { sessionId?: string; _id?: string };
      navigate(`/interview/${sessionAction.sessionId || sessionAction._id}`);
    } catch (error) {
      toast.error(`Failed to start session: ${error}`);
      setLoadingKeyword(null);
    }
  };

  const matchScore = resumeData?.jdMatchReport?.match_score || 0;
  const matchedKws = resumeData?.jdMatchReport?.matched_skills || [];
  const missingKws = resumeData?.jdMatchReport?.missing_skills || [];
  const totalKws = matchedKws.length + missingKws.length;
  const coverage = totalKws > 0 ? Math.round((matchedKws.length / totalKws) * 100) : 0;
  const explanation = resumeData?.jdMatchReport?.explanation || "Significant gaps between your resume and this role.";

  let colorClass = "text-rose-400";
  let borderClass = "border-rose-400/30";
  let bgClass = "bg-rose-400";
  let bgLightClass = "bg-rose-400/10";
  let label = "LOW MATCH";

  if (matchScore >= 80) {
    colorClass = "text-primary-400";
    borderClass = "border-primary-400/30";
    bgClass = "bg-primary-400";
    bgLightClass = "bg-primary-400/10";
    label = "HIGH MATCH";
  } else if (matchScore >= 50) {
    colorClass = "text-amber-400";
    borderClass = "border-amber-400/30";
    bgClass = "bg-amber-400";
    bgLightClass = "bg-amber-400/10";
    label = "MODERATE MATCH";
  }

  const baseScore = matchScore;
  const projectedScore = Math.min(100, baseScore + (missingKws.length > 0 ? 20 : 0));

  return (
    <motion.div
      key="jobmatch"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {!resumeData?.jdMatchReport && !resumeData?.jdText ? (
        <div className="flex flex-col items-center justify-center py-24 bg-surface-800/40 border border-white/5 rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-surface-800 border border-white/5 flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-surface-200">No Job Description Provided</h3>
          <p className="text-sm text-surface-500 mt-2 max-w-md text-center">
            To see your match score and keyword gap analysis, please upload your resume again and paste a job description.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Top Match Score Card */}
          <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-center md:items-stretch gap-6">
            <div className={`flex flex-col items-center justify-center w-32 h-24 rounded-xl border ${borderClass} ${bgLightClass}`}>
              <span className={`text-5xl font-black ${colorClass}`}>{matchScore}</span>
              <span className="text-[10px] text-surface-500 font-bold mt-1 uppercase tracking-widest">/ 100</span>
            </div>
            <div className="flex-1 flex flex-col justify-center w-full">
              <div className="mb-4">
                <span className={`px-3 py-1 rounded-full border ${borderClass} ${colorClass} text-[10px] font-bold tracking-wider uppercase`}>
                  {label}
                </span>
              </div>
              <div className="w-full h-1.5 bg-surface-700 rounded-full overflow-hidden mb-3">
                <div className={`h-full ${bgClass} rounded-full transition-all duration-1000`} style={{ width: `${matchScore}%` }} />
              </div>
              <p className="text-sm text-surface-400">{explanation}</p>
            </div>
          </div>

          {/* JD Keyword Coverage & Recommendation */}
          <div className="space-y-4">
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4">JD Keyword Coverage</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-surface-400 font-medium">Keywords Matched</span>
                <span className="text-xs font-bold text-primary-400">{matchedKws.length} / {totalKws}</span>
              </div>
              <div className="w-full h-2 bg-surface-700 rounded-full overflow-hidden mb-2">
                <div className="h-full bg-linear-to-r from-indigo-500 to-primary-400 rounded-full transition-all duration-1000" style={{ width: `${coverage}%` }} />
              </div>
              <span className="text-xs font-bold text-primary-400">{coverage}%</span>
            </div>
            <div className="bg-surface-800/60 border border-white/5 rounded-xl p-6 border-l-4 border-l-indigo-500">
              <h4 className="text-xs font-bold text-white mb-2">Recommendation</h4>
              <p className="text-sm text-surface-300">
                {coverage >= 80 ? `Excellent keyword coverage (${coverage}%). Your resume aligns very well with the job description.` :
                  coverage >= 50 ? `Moderate keyword coverage (${coverage}%). Add more role-specific terms from the job description to improve your chances.` :
                    `Low keyword coverage (${coverage}%). Consider heavily tailoring your resume to include the missing keywords below.`}
              </p>
            </div>
          </div>

          {/* Keyword Gap Analysis (Matched / Missing) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Matched Panel */}
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-sm font-bold text-primary-400">Matched</h3>
                <span className="px-2 py-0.5 rounded-full bg-primary-400/10 text-primary-400 text-xs font-bold">{matchedKws.length}</span>
              </div>
              {matchedKws.length === 0 ? (
                <p className="text-sm text-surface-500 italic">No matched keywords.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {matchedKws.map((kw, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg border border-primary-400/20 bg-primary-400/5 text-xs font-semibold text-primary-400">
                      {kw}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Missing Panel */}
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <h3 className="text-sm font-bold text-rose-400">Missing</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-400/10 text-rose-400 text-xs font-bold">{missingKws.length}</span>
              </div>
              {missingKws.length === 0 ? (
                <p className="text-sm text-surface-500 italic">No missing keywords found.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {missingKws.map((kw, i) => (
                    <span key={i} className="group flex items-center gap-2 px-3 py-1.5 rounded-lg border border-rose-400/20 bg-rose-400/5 text-xs font-semibold text-rose-400 cursor-default">
                      {kw}
                      <button
                        onClick={() => handlePractice(kw)}
                        disabled={loadingKeyword === kw}
                        title={`Start an AI Mock Interview focusing on ${kw}`}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 bg-rose-400/20 hover:bg-rose-400/40 text-rose-400 rounded px-2 py-0.5 text-[10px] uppercase tracking-wider cursor-pointer disabled:opacity-50"
                      >
                        {loadingKeyword === kw ? '⏳' : 'Practice ⚡'}
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score Projection */}
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Score Projection</h3>
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6">
              <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <div className="flex-1 w-full bg-surface-900/50 border border-white/5 rounded-xl p-5 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-surface-400 font-black uppercase tracking-widest mb-2">CURRENT SCORE</span>
                  <span className="text-4xl font-black text-white">{baseScore}</span>
                </div>
                <svg className="w-6 h-6 text-surface-500 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="flex-1 w-full bg-primary-400/5 border border-primary-400/20 rounded-xl p-5 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-primary-400 font-black uppercase tracking-widest mb-2">WITH MISSING KEYWORDS</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-black text-primary-400">{projectedScore}</span>
                    <span className="px-2 py-1 bg-primary-400/20 text-primary-400 text-xs font-bold rounded">+{projectedScore - baseScore}</span>
                  </div>
                </div>
              </div>

              {missingKws.length > 0 && (
                <div>
                  <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest mb-3">TOP KEYWORDS TO ADD:</p>
                  <div className="flex flex-wrap gap-2">
                    {missingKws.slice(0, 5).map((kw, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-lg border border-primary-400/30 bg-primary-400/10 text-xs font-semibold text-primary-400">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cover Letter Generator */}
          <div className="pt-6 border-t border-white/5">
            {!coverLetter ? (
              <button
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingCL}
                className={`w-full py-4 rounded-xl bg-linear-to-r from-indigo-500/20 to-primary-500/20 border border-primary-500/30 hover:bg-primary-500/30 text-primary-400 font-bold tracking-widest uppercase transition-all flex items-center justify-center gap-3 ${isGeneratingCL ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                {isGeneratingCL ? (
                  <>
                    <span className="animate-spin text-xl">✨</span>
                    Generating Tailored Cover Letter...
                  </>
                ) : (
                  <>
                    <span className="text-xl">📝</span>
                    Generate Tailored Cover Letter
                  </>
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-surface-800 border border-primary-500/30 rounded-2xl p-6 relative"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-primary-400 flex items-center gap-2">
                    <span>✨</span> Tailored Cover Letter
                  </h3>
                  <button
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="prose prose-invert max-w-none text-surface-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {coverLetter}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
