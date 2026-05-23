import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
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
// Component
// ═══════════════════════════════════════════════════════════════════════

const ResumeAnalyzer = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const userId = user?._id || user?.id;

  const {
    isUploading,
    setIsUploading,
    setStatus,
    resumeData,
    setResumeData,
    activeTab,
    setActiveTab,
    getStatusMessage,
    handleResetAnalysis,
    streamingFeedbackText,
  } = useResumeAnalysis({ userId });

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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* ════════════════════════ UPLOAD VIEW ════════════════════════ */}
      {!resumeData && !isUploading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-10"
        >
          {/* ── Hero ── */}
          <div className="text-center space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-400/30 bg-primary-400/5 text-[11px] font-bold tracking-widest text-primary-400 uppercase">
              AI-Powered · Free · Instant Results
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Know exactly how your
              <br />
              <span className="text-gradient">resume performs</span>
            </h1>

            <p className="text-surface-400 max-w-2xl mx-auto leading-relaxed text-[15px]">
              Upload your resume for an instant ATS score, skill extraction, work
              experience detection, and optional job description matching.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-2">
              {[
                { value: "100", label: "ATS Score Points" },
                { value: "6", label: "Scoring Sections" },
                { value: "AI", label: "Gemini Powered" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-8">
                  {i > 0 && <div className="w-px h-10 bg-surface-700 -ml-4" />}
                  <div className="text-center">
                    <span className="block text-2xl font-black text-white">{s.value}</span>
                    <span className="text-[11px] text-surface-500 tracking-wide">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Upload + Tips Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Upload Card */}
            <div className="lg:col-span-3 bg-surface-800/60 border border-white/5 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Upload Resume</h2>
                <span className="text-[11px] text-surface-500">PDF · DOCX · TXT · max 5MB</span>
              </div>

              {/* Drop Zone */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-44 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${dragActive
                  ? "border-primary-400 bg-primary-400/10"
                  : file
                    ? "border-primary-400/40 bg-primary-400/5"
                    : "border-surface-600 bg-surface-900/50 hover:border-surface-500"
                  }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.docx,.txt"
                  onChange={handleFileChange}
                />
                {file ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-primary-400/20 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-bold text-white">{file.name}</span>
                    <span className="text-[11px] text-surface-500 mt-1">Click or drop to replace</span>
                  </>
                ) : (
                  <>
                    <svg className="w-8 h-8 text-surface-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm font-semibold text-surface-300">FILE</span>
                    <span className="text-sm text-surface-400 mt-1">
                      Drop your resume here or{" "}
                      <span className="text-primary-400 font-semibold underline underline-offset-2">browse</span>
                    </span>
                    <span className="text-[11px] text-surface-500 mt-1">Supports PDF, DOCX, TXT</span>
                  </>
                )}
              </div>

              {/* JD Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">Job Description</h3>
                  <span className="text-[11px] text-surface-500">Optional – enables match scoring</span>
                </div>
                <textarea
                  className="w-full h-28 bg-surface-900/60 border border-surface-700 rounded-xl p-3 text-sm text-surface-200 focus:outline-none focus:border-primary-400/50 transition-all placeholder:text-surface-600 resize-y"
                  placeholder="Paste the job description to see match score and missing keywords…"
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              {/* Button */}
              <button
                onClick={handleUpload}
                disabled={!file}
                className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer ${file
                  ? "bg-linear-to-r from-primary-400 to-indigo-500 text-white hover:opacity-90 active:scale-[0.98] shadow-lg shadow-primary-400/20"
                  : "bg-surface-700 text-surface-500 cursor-not-allowed!"
                  }`}
              >
                Analyse Resume
              </button>
            </div>

            {/* Tips Card */}
            <div className="lg:col-span-2 bg-surface-800/60 border border-white/5 rounded-2xl p-6">
              <h3 className="text-base font-bold text-white mb-5">How to score higher</h3>
              <div className="space-y-5">
                {SCORING_TIPS.map((tip, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`text-lg font-black mt-0.5 min-w-[20px] ${TIP_NUMBER_COLORS[i]}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-white leading-snug">{tip.title}</p>
                      <p className="text-[12px] text-surface-400 leading-relaxed mt-0.5">{tip.desc}</p>
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
              <p className="text-[11px] text-surface-500 uppercase tracking-wider mb-1">
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
                  className={`relative pb-3 pt-4 text-sm font-semibold whitespace-nowrap transition-colors ${
                    isUploading && !streamingFeedbackText ? "cursor-not-allowed opacity-50" : "cursor-pointer"
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
        </motion.div>
      )}
    </div>
  );
};

export default ResumeAnalyzer;
