import { motion, AnimatePresence, animate } from "framer-motion";
import { useSelector } from "react-redux";
import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { CloudUpload, FileCheck, AlertTriangle, ArrowLeft } from "lucide-react";
import type { RootState } from "../app/store";

import { useResumeUpload } from "../features/resume/hooks/useResumeUpload";
import { useResumeAnalysis } from "../features/resume/hooks/useResumeAnalysis";
import { EntityExtractionTab } from "../features/resume/components/EntityExtractionTab";
import { AtsScoreTab } from "../features/resume/components/AtsScoreTab";
import { JobMatchTab } from "../features/resume/components/JobMatchTab";
import { FeedbackTipsTab } from "../features/resume/components/FeedbackTipsTab";
import { ActionPlanFAB } from "../features/resume/components/ActionPlanFAB";

import type { ParsedProfile, ResultTab } from "../features/resume/types";

// ═══════════════════════════════════════════════════════════════════════
// Static Data
// ═══════════════════════════════════════════════════════════════════════

const SCORING_TIPS = [
  {
    title: "Use clear section headers",
    desc: "Skills, Experience, Education, Summary help ATS parsing",
  },
  {
    title: "Match job keywords exactly",
    desc: "Copy key phrases from the job description for higher ATS match",
  },
  {
    title: "Quantify your achievements",
    desc: 'Numbers stand out: "40% faster", "led team of 5", "25% cost reduction"',
  },
  {
    title: "Maintain tight formatting",
    desc: "300-800 words, single page (under 5 yrs experience) keeps it scannable",
  },
  {
    title: "Provide complete contact info",
    desc: "Name, email, phone, LinkedIn URL at the top of your resume",
  },
];

const TIP_NUMBER_COLORS = [
  "text-amber-400",
  "text-blue-400",
  "text-emerald-400",
  "text-purple-400",
  "text-rose-400",
];

const TABS: { key: ResultTab; label: string }[] = [
  { key: "ats", label: "ATS Score" },
  { key: "extraction", label: "Entity Extraction" },
  { key: "jobmatch", label: "Job Match" },
  { key: "feedback", label: "Feedback & Tips" },
];

// ═══════════════════════════════════════════════════════════════════════
// Animated Stat Component
// ═══════════════════════════════════════════════════════════════════════
const AnimatedStat = ({ value, label }: { value: string; label: string }) => {
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = nodeRef.current;
    if (!node) return;

    if (!isNaN(Number(value))) {
      const controls = animate(0, Number(value), {
        duration: 2,
        ease: "easeOut",
        onUpdate(val) {
          node.textContent = Math.round(val).toString();
        },
      });
      return () => controls.stop();
    } else {
      node.textContent = value;
    }
  }, [value]);

  return (
    <div className="text-center group cursor-default">
      <span ref={nodeRef} className="block text-3xl font-black text-white font-display group-hover:text-primary-400 transition-colors duration-500">
        {value}
      </span>
      <span className="text-sm text-surface-400 font-medium mt-1 block">
        {label}
      </span>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════

const ResumeAnalyzer = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?._id || user?.id;

  const {
    isUploading,
    setIsUploading,
    status,
    setStatus,
    resumeData,
    setResumeData,
    activeTab,
    setActiveTab,
    getStatusMessage,
    handleResetAnalysis,
    streamingFeedbackText,
    fetchResumeDetails,
  } = useResumeAnalysis({ userId });

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      // Clear the query parameter so refreshing doesn't keep reloading it unnecessarily if we navigate away
      // but keeping it is also fine. Let's just fetch it.
      setIsUploading(true);
      fetchResumeDetails(id);
    }
  }, [searchParams, fetchResumeDetails, setIsUploading]);

  const {
    file,
    jdText,
    setJdText,
    dragActive,
    fileInputRef,
    handleFileChange,
    handleDrag,
    handleDrop,
    handleUpload,
    handleReset: handleResetUpload,
  } = useResumeUpload({
    onUploadStart: () => {
      setIsUploading(true);
      setStatus("pending");
      setResumeData(null);
    },
    onUploadSuccess: () => {
      // The socket logic handles hiding the loading spinner when complete
    },
    onUploadError: () => {
      setIsUploading(false);
      setStatus(null);
    },
  });

  const handleResetAll = () => {
    handleResetAnalysis();
    handleResetUpload();
    if (searchParams.has("id")) {
      setSearchParams(new URLSearchParams());
    }
  };

  // ─── Derived Data ────────────────────────────────────────────────────
  const profile: ParsedProfile | undefined =
    resumeData?.analysisReport?.extracted_data || resumeData?.parsedData?.parsedProfile;
  const personalInfo = profile?.personal_info;
  const skills =
    resumeData?.analysisReport?.extracted_data?.skills ||
    resumeData?.analysisReport?._v2?.skills;
  const experience = profile?.experience || [];
  const education = profile?.education || [];
  const summary =
    profile?.summary ||
    resumeData?.analysisReport?.evaluation?.candidate_summary;

  const issues = resumeData?.analysisReport?._v2?.analysis?.weaknesses ||
    resumeData?.analysisReport?.evaluation?.weaknesses ||
    resumeData?.analysisReport?.evaluation?.improvement_suggestions ||
    ["Add your LinkedIn URL - many ATS systems require it for screening.", "Add your GitHub or portfolio URL - essential for technical roles."];

  const strengths = resumeData?.analysisReport?._v2?.analysis?.strengths ||
    resumeData?.analysisReport?.evaluation?.strengths ||
    ["No excessive all-caps text.", "Bullet point lengths look good.", "All sections have content.", "Good resume length (400 words).", "Mostly active voice - good.", "Email address present.", "Phone number present.", "Line density looks ATS-friendly.", "Good section structure (5 headers found)."];

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* ════════════════════════ UPLOAD VIEW ════════════════════════ */}
      {!resumeData && !isUploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-12"
        >
          {/* ── Hero ── */}
          <div className="text-center space-y-6 relative py-10">
            {/* Cyber-Industrial Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_at_center,black_20%,transparent_70%)] pointer-events-none -z-10" />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 20 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/20 bg-surface-800/80 backdrop-blur-sm text-[10px] font-black tracking-widest text-primary-400 uppercase shadow-[0_0_15px_rgba(45,212,191,0.1)]"
            >
              <span className="relative flex h-2 w-2 mr-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
              AI-Powered · Free · Instant Results
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
              className="text-5xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter"
            >
              Know exactly how your
              <br />
              <span className="text-gradient">resume performs</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              className="text-surface-400 max-w-2xl mx-auto leading-relaxed text-[15px] font-medium"
            >
              Upload your resume for an instant ATS score, skill extraction, work
              experience detection, and optional job description matching.
            </motion.p>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              className="flex items-center justify-center gap-8 pt-6"
            >
              {[
                { value: "100", label: "ATS Score Points" },
                { value: "6", label: "Scoring Sections" },
                { value: "AI", label: "Gemini Powered" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-8">
                  {i > 0 && <div className="w-px h-12 bg-linear-to-b from-transparent via-surface-700 to-transparent -ml-4" />}
                  <AnimatedStat value={s.value} label={s.label} />
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Upload + Tips Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Upload Card */}
            <div className="lg:col-span-3 bg-surface-800/40 border border-surface-600/30 rounded-3xl p-8 space-y-6 shadow-2xl shadow-black/40 backdrop-blur-md relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <h2 className="text-lg font-black text-white tracking-tight">Upload Resume</h2>
                <span className="px-3 py-1 bg-surface-900/50 rounded-full text-xs font-medium text-surface-400 border border-surface-700/50">PDF · DOCX · TXT · 5MB</span>
              </div>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-48 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden group ${dragActive
                  ? "bg-primary-500/10 border border-primary-500/50 shadow-[0_0_30px_rgba(45,212,191,0.15)]"
                  : file
                    ? "bg-primary-500/5 border border-primary-500/30"
                    : "bg-surface-900/40 border border-surface-700/60 hover:border-primary-500/40 shadow-inner shadow-black/20"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />

                <div className="relative z-10 flex flex-col items-center text-center">
                  {file ? (
                    <>
                      <div className="w-12 h-12 rounded-full bg-primary-400/20 flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                        <FileCheck className="w-6 h-6 text-primary-400" strokeWidth={2.5} />
                      </div>
                      <span className="text-sm font-black text-white">{file.name}</span>
                      <span className="text-[11px] text-surface-400 font-medium tracking-wide mt-1">Click or drop to replace</span>
                    </>
                  ) : (
                    <>
                      <CloudUpload className="w-10 h-10 text-surface-500 group-hover:text-primary-400/80 transition-colors duration-300 mb-3 drop-shadow-md" strokeWidth={1.5} />
                      <span className="text-[13px] font-bold text-surface-300 tracking-wide">
                        Drop your resume here or{" "}
                        <span className="text-primary-400 underline underline-offset-4 decoration-primary-400/30 group-hover:decoration-primary-400 transition-colors">browse</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* JD Section */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-surface-300">Job Description</h3>
                  <span className="text-xs font-medium text-primary-400/80">Optional</span>
                </div>
                <textarea
                  className="w-full h-24 bg-surface-900/40 border border-surface-700/60 rounded-xl p-4 text-[13px] text-surface-200 focus:outline-none focus:border-primary-400/50 focus:bg-surface-900/60 transition-all placeholder:text-surface-600 resize-none shadow-inner shadow-black/20"
                  placeholder="Paste target job description to enable match scoring..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              {/* Button */}
              <button
                onClick={handleUpload}
                disabled={!file}
                className={`relative z-10 w-full py-4 rounded-xl font-bold text-base transition-all duration-300 overflow-hidden ${file
                  ? "bg-primary-600 text-surface-950 hover:bg-primary-500 hover:-translate-y-px active:scale-[0.98] shadow-[0_0_20px_rgba(45,212,191,0.3)] cursor-pointer"
                  : "bg-surface-800 text-surface-600 border border-surface-700/50 cursor-not-allowed!"
                  }`}
              >
                {file && <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />}
                <span className="relative z-10">Analyse Resume</span>
              </button>
            </div>

            {/* Tips Card (Bento Box) */}
            <div className="lg:col-span-2 flex flex-col h-full space-y-4">
              <h3 className="text-sm font-bold text-surface-400 pt-2">How to score higher</h3>
              <div className="grid grid-cols-1 gap-3 flex-1">
                {SCORING_TIPS.map((tip, i) => (
                  <div key={i} className="group relative bg-surface-800/30 border border-surface-700/40 rounded-2xl p-4 overflow-hidden hover:-translate-y-1 hover:bg-surface-800/60 hover:border-surface-600/50 transition-all duration-300 cursor-default shadow-lg shadow-black/20">
                    {/* Oversized Number */}
                    <div className="absolute -right-2 -bottom-4 text-[80px] font-black text-surface-900/50 group-hover:text-surface-700/30 transition-colors font-display leading-none select-none z-0">
                      {i + 1}
                    </div>

                    <div className="relative z-10">
                      <p className={`text-sm font-black mb-1 ${TIP_NUMBER_COLORS[i]}`}>{tip.title}</p>
                      <p className="text-[12px] text-surface-400 leading-relaxed font-medium max-w-[85%] group-hover:text-surface-300 transition-colors">{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ════════════════════════ RESULTS VIEW ════════════════════════ */}
      {(resumeData || isUploading) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-0 pb-12 relative"
        >
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 mb-6">
            <div>
              <p className="text-xs font-medium text-surface-400 mb-1">
                FILE&nbsp;&nbsp;{resumeData?.originalFilename || file?.name || "Processing..."}
              </p>
              <h2 className="text-2xl font-black text-white">
                {isUploading ? getStatusMessage() : "Analysis Complete"}
              </h2>
            </div>
            {!isUploading && (
              <button
                onClick={handleResetAll}
                className="w-full sm:w-auto px-5 py-3 sm:py-2 border border-surface-600 rounded-lg text-[11px] font-bold text-surface-300 hover:text-white hover:border-surface-400 transition-all cursor-pointer whitespace-nowrap"
              >
                Analyze Another Resume
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-surface-700" />

          {status === "invalid_document" ? (
            <div className="py-16 text-center space-y-6">
              <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
                <AlertTriangle className="w-12 h-12 text-red-400" strokeWidth={2} />
              </div>
              <h3 className="text-3xl font-black text-white">This doesn't look like a resume</h3>
              <p className="text-surface-400 max-w-lg mx-auto text-sm leading-relaxed">
                We couldn't detect any professional experience, education, or typical resume sections in this document. Please upload a valid Resume or CV to get your analysis.
              </p>
              <button
                onClick={handleResetAll}
                className="mt-8 btn-primary px-8! py-4! text-base! rounded-xl inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                Upload Another Document
              </button>
            </div>
          ) : (
            <>
              {/* Tab Bar */}
              <div className="flex items-center gap-6 border-b border-surface-700 mt-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {TABS.map((tab) => {
                  // During upload, if we have streaming text, force 'feedback' tab, otherwise 'ats'
                  const isTabActive = isUploading ? (streamingFeedbackText ? tab.key === "feedback" : tab.key === "ats") : activeTab === tab.key;
                  const handleClick = () => {
                    if (!isUploading) setActiveTab(tab.key);
                  };

                  return (
                    <button
                      key={tab.key}
                      onClick={handleClick}
                      className={`relative pb-3 pt-4 text-sm font-semibold whitespace-nowrap transition-colors ${isUploading && !streamingFeedbackText ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                        } ${isTabActive ? "text-primary-400 opacity-100!" : "text-surface-400 hover:text-surface-200"}`}
                    >
                      {tab.label}
                      {isTabActive && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-400 rounded-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* ──────── Tab Content ──────── */}
              <div className="pt-6">
                <AnimatePresence mode="wait">
                  {isUploading && !streamingFeedbackText ? (
                    <AtsScoreTab isLoading={true} />
                  ) : isUploading && streamingFeedbackText ? (
                    <FeedbackTipsTab
                      isStreaming={true}
                      streamingText={streamingFeedbackText}
                    />
                  ) : (
                    <>
                      {activeTab === "extraction" && (
                        <EntityExtractionTab
                          resumeData={resumeData!}
                          profile={profile}
                          summary={summary}
                          skills={skills}
                          personalInfo={personalInfo}
                          experience={experience}
                          education={education}
                        />
                      )}
                      {activeTab === "ats" && <AtsScoreTab resumeData={resumeData!} />}
                      {activeTab === "jobmatch" && <JobMatchTab resumeData={resumeData!} />}
                      {activeTab === "feedback" && (
                        <FeedbackTipsTab
                          resumeData={resumeData!}
                          issues={issues}
                          strengths={strengths}
                          streamingText={resumeData?.streamingFeedbackText || streamingFeedbackText}
                          isStreaming={status === "analyzing" || status === "processing" || status === "parsed" || status === "pending"}
                        />
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Plan FAB */}
              {!isUploading && resumeData && <ActionPlanFAB issues={issues} />}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
