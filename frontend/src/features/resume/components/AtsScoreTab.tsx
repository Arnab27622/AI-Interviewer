import { motion } from "framer-motion";
import { Radar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  ArcElement,
  Tooltip,
  Legend
);
import type { ResumeData } from "../types";

interface AtsScoreTabProps {
  resumeData?: ResumeData | null;
  isLoading?: boolean;
}

export const AtsScoreTab = ({ resumeData, isLoading = false }: AtsScoreTabProps) => {
  if (isLoading) {
    return (
      <motion.div
        key="ats-skeleton"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Skeleton Score Card */}
          <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="w-32 h-32 rounded-full border-8 border-surface-700/50 animate-pulse mb-6" />
            <div className="h-4 w-20 bg-surface-700/50 rounded-full animate-pulse mb-3" />
            <div className="h-3 w-32 bg-surface-700/50 rounded-full animate-pulse" />
          </div>

          {/* Skeleton Score Breakdown */}
          <div className="md:col-span-2 bg-surface-800/60 border border-white/5 rounded-2xl p-6">
            <div className="h-4 w-32 bg-surface-700/50 rounded-full animate-pulse mb-8" />
            <div className="space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-36 h-3 bg-surface-700/50 rounded-full animate-pulse" />
                  <div className="flex-1 h-1.5 bg-surface-700/50 rounded-full animate-pulse" />
                  <div className="w-10 h-3 bg-surface-700/50 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Skeleton Radar Chart */}
        <div>
          <div className="h-4 w-28 bg-surface-700/50 rounded-full animate-pulse mb-4 mt-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-48 h-48 rounded-full border-4 border-surface-700/50 animate-pulse" />
            </div>
            <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-48 h-48 rounded-full border-20 border-surface-700/50 animate-pulse" />
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
  const atsScore =
    resumeData?.scores?.ats ||
    resumeData?.analysisReport?._v2?.scores?.ats_score ||
    0;

  const rawTextLength = resumeData?.parsedData?.rawText?.split(/\s+/).length || 400;

  const readabilityScore =
    resumeData?.analysisReport?._v2?.analysis?.readability_score || 100;

  const getRadarData = () => {
    const techLen = resumeData?.analysisReport?._v2?.skills?.technical?.length || resumeData?.analysisReport?.extracted_data?.skills?.technical?.length || 0;
    const softLen = resumeData?.analysisReport?._v2?.skills?.soft?.length || resumeData?.analysisReport?.extracted_data?.skills?.soft?.length || 0;
    const expLen = resumeData?.parsedData?.parsedProfile?.experience?.length || resumeData?.analysisReport?.extracted_data?.experience?.length || 0;
    const eduLen = resumeData?.parsedData?.parsedProfile?.education?.length || resumeData?.analysisReport?.extracted_data?.education?.length || 0;
    
    return [
      Math.round(Math.min(100, Math.max(40, (techLen / 12) * 100))),
      Math.round(Math.min(100, Math.max(50, (softLen / 8) * 100))),
      Math.round(Math.min(100, Math.max(40, (expLen / 4) * 100))),
      eduLen > 0 ? 95 : 30,
      atsScore || 60
    ];
  };

  const getContentBalance = () => {
    const text = resumeData?.parsedData?.rawText?.toLowerCase() || "";
    if (!text) return [35, 45, 15, 5];

    const actionVerbsMatch = text.match(/\b(led|managed|developed|created|improved|increased|designed|built|optimized|implemented|reduced|resolved|spearheaded|architected)\b/g);
    const actionVerbs = actionVerbsMatch ? actionVerbsMatch.length : 5;

    const metricsMatch = text.match(/\b(\d+%|\$\d+|\d+[kKmM]|increased by|reduced by)\b/gi);
    const metricsCount = metricsMatch ? metricsMatch.length : 2;

    const fillerMatch = text.match(/\b(helped|worked|did|was|were|assisted|responsible for|duties included)\b/g);
    const fillerCount = fillerMatch ? fillerMatch.length : 5;

    const totalWords = text.split(/\s+/).length || 1;
    const keywordsCount = Math.max(5, (totalWords * 0.1) - actionVerbs - metricsCount - fillerCount);

    const total = actionVerbs + keywordsCount + metricsCount + fillerCount || 1;
    
    return [
      Math.max(5, Math.round((actionVerbs / total) * 100)),
      Math.max(15, Math.round((keywordsCount / total) * 100)),
      Math.max(5, Math.round((metricsCount / total) * 100)),
      Math.max(2, Math.round((fillerCount / total) * 100))
    ];
  };

  const radarData = getRadarData();
  const balanceData = getContentBalance();

  const text = resumeData?.parsedData?.rawText || "";
  const totalSentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
  const avgSentenceLength = Math.max(5, Math.round(rawTextLength / totalSentences));

  const contactScore = resumeData?.parsedData?.parsedProfile?.personal_info?.email && resumeData?.parsedData?.parsedProfile?.personal_info?.phone ? 20 : 10;
  const skillsScore = (resumeData?.analysisReport?._v2?.skills?.technical?.length || 0) > 0 ? 20 : 10;
  const eduScore = (resumeData?.parsedData?.parsedProfile?.education?.length || 0) > 0 ? 20 : 0;
  const expScore = (resumeData?.parsedData?.parsedProfile?.experience?.length || 0) > 0 ? 20 : 0;
  const actionVerbsMatch = text.toLowerCase().match(/\b(led|managed|developed|created|improved|increased|designed|built|optimized|implemented|reduced|resolved|spearheaded|architected)\b/g);
  const actionVerbsCount = actionVerbsMatch ? actionVerbsMatch.length : 5;
  const actionVerbsScoreCalculated = Math.min(20, actionVerbsCount * 2);
  const lengthScore = rawTextLength > 200 && rawTextLength < 800 ? 20 : 10;

  const scoreBreakdown = [
    { label: "Contact Information", score: contactScore, max: 20, color: "bg-primary-400" },
    { label: "Skills", score: skillsScore, max: 20, color: "bg-primary-400" },
    { label: "Education", score: eduScore, max: 20, color: "bg-indigo-400" },
    { label: "Work Experience", score: expScore, max: 20, color: "bg-indigo-400" },
    { label: "Action Verbs", score: actionVerbsScoreCalculated, max: 20, color: "bg-primary-400" },
    { label: "Resume Length", score: lengthScore, max: 20, color: "bg-indigo-400" },
  ];

  const readabilityGrade = readabilityScore > 80 ? "Excellent" : readabilityScore > 60 ? "Good" : "Needs Work";
  const activeVoicePercent = Math.min(100, Math.max(40, actionVerbsCount * 5));

  const generatedFeedback = [
    avgSentenceLength > 20 ? `Sentences are a bit long (avg ${avgSentenceLength} words).` : `Good sentence length (avg ${avgSentenceLength} words).`,
    actionVerbsCount > 5 ? `Strong action verb usage (${actionVerbsCount} verbs).` : `Consider using more action verbs (found ${actionVerbsCount}).`,
    activeVoicePercent > 50 ? `Good active voice ratio (${activeVoicePercent}%).` : `Try to use more active voice.`,
    rawTextLength > 800 ? `Resume is a bit long (${rawTextLength} words).` : rawTextLength < 200 ? `Resume is too short (${rawTextLength} words).` : `Good word count (${rawTextLength} words).`,
  ];

  return (
    <motion.div
      key="ats"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Top Section: Score & Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Score Card */}
        <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <div className="relative w-32 h-32 mb-4">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-surface-700"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${atsScore * 2.827} 282.7`}
                className="text-primary-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{atsScore}</span>
              <span className="text-[10px] text-surface-400 mt-[-4px]">/100</span>
            </div>
          </div>
          <span className="px-4 py-1 rounded-full border border-primary-500/30 bg-primary-500/10 text-[11px] font-bold text-primary-400 tracking-wider mb-2">
            EXCELLENT
          </span>
          <p className="text-xs text-surface-400">
            {rawTextLength} words{" "}
            <span className="text-primary-400 font-semibold">· good length</span>
          </p>
        </div>

        {/* Score Breakdown Card */}
        <div className="md:col-span-2 bg-surface-800/60 border border-white/5 rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-6">Score Breakdown</h3>
          <div className="space-y-4">
            {scoreBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-36 text-xs font-medium text-surface-300">
                  {item.label}
                </span>
                <div className="flex-1 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full`}
                    style={{ width: `${(item.score / item.max) * 100}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold text-surface-300">
                  {item.score}/{item.max}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Section: Visual Insights */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 mt-4">Visual Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h4 className="text-xs font-semibold text-surface-400 mb-4 w-full text-left uppercase tracking-wider">
              Competency Radar
            </h4>
            <div className="w-full max-w-[250px] aspect-square">
              <Radar
                data={{
                  labels: [
                    "Tech Skills",
                    "Soft Skills",
                    "Experience",
                    "Education",
                    "Format",
                  ],
                  datasets: [
                    {
                      data: radarData,
                      backgroundColor: "rgba(45, 212, 191, 0.2)",
                      borderColor: "#2dd4bf",
                      borderWidth: 2,
                      pointBackgroundColor: "#2dd4bf",
                    },
                  ],
                }}
                options={{
                  scales: {
                    r: {
                      min: 0,
                      max: 100,
                      angleLines: { color: "rgba(255,255,255,0.05)" },
                      grid: { color: "rgba(255,255,255,0.05)" },
                      pointLabels: { color: "#a3a3a3", font: { size: 10, family: "Inter" } },
                      ticks: { display: false },
                    },
                  },
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>

          <div className="bg-surface-800/60 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center">
            <h4 className="text-xs font-semibold text-surface-400 mb-4 w-full text-left uppercase tracking-wider">
              Content Balance
            </h4>
            <div className="w-full max-w-[200px] aspect-square relative">
              <Doughnut
                data={{
                  labels: ["Action Verbs", "Keywords", "Metrics", "Filler"],
                  datasets: [
                    {
                      data: balanceData,
                      backgroundColor: ["#2dd4bf", "#818cf8", "#f59e0b", "#ef4444"],
                      borderWidth: 0,
                      hoverOffset: 4,
                    },
                  ],
                }}
                options={{
                  cutout: "75%",
                  plugins: {
                    legend: {
                      position: "bottom",
                      labels: {
                        color: "#a3a3a3",
                        font: { size: 10, family: "Inter" },
                        padding: 15,
                        usePointStyle: true,
                      },
                    },
                  },
                  maintainAspectRatio: true,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Readability & Scannability */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 mt-4">
          Readability & Scannability
        </h3>

        {/* Metric Boxes */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-surface-800/60 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-500 mb-2 text-center">
              READABILITY SCORE
            </span>
            <div className="px-6 py-1 bg-primary-400/10 border border-primary-400/30 rounded text-xl font-bold text-white">
              {readabilityScore}
            </div>
          </div>
          <div className="bg-surface-800/60 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-500 mb-2 text-center">
              GRADE
            </span>
            <div className="text-xl font-bold text-white">{readabilityGrade}</div>
          </div>
          <div className="bg-surface-800/60 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-500 mb-2 text-center">
              AVG SENTENCE LENGTH
            </span>
            <div className="text-xl font-bold text-white">
              {avgSentenceLength} <span className="text-sm font-medium text-surface-400">words</span>
            </div>
          </div>
          <div className="bg-surface-800/60 border border-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-surface-500 mb-2 text-center">
              ACTIVE VOICE
            </span>
            <div className="text-xl font-bold text-white">{activeVoicePercent}%</div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-surface-800/60 border border-white/5 rounded-xl p-6">
          <h4 className="text-xs font-bold text-white mb-4">Feedback</h4>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[5px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-surface-700 before:to-transparent">
            {generatedFeedback.map((fb, idx) => (
              <div
                key={idx}
                className="relative flex items-center gap-4 border-l-2 border-surface-600 pl-4 py-1"
              >
                <p className="text-sm text-surface-300">{fb}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
