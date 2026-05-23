import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import { getUserResumes } from "../../../services/resumeApi";
import type { ResumeData } from "../types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const ResumeHistoryWidget = () => {
  const [resumes, setResumes] = useState<ResumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getUserResumes();
        // Sort chronologically (oldest to newest) for the line chart
        const sorted = data.sort((a: ResumeData, b: ResumeData) => 
          new Date(a.createdAt || "").getTime() - new Date(b.createdAt || "").getTime()
        );
        setResumes(sorted);
      } catch (error) {
        console.error("Failed to fetch resume history:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="glass-card rounded-[3rem] p-8 min-h-[300px] flex items-center justify-center animate-pulse border-white/5">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-500/20 border-t-primary-500 animate-spin mb-4" />
          <span className="text-surface-500 text-sm font-bold uppercase tracking-widest">Loading History...</span>
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return null; // Hide if no history
  }

  // Extract ATS scores
  const chartData = resumes.map(r => {
    const atsScore = r.scores?.ats || r.analysisReport?._v2?.scores?.ats_score || 0;
    return atsScore;
  });

  const labels = resumes.map(r => {
    const d = new Date(r.createdAt || "");
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });

  const data = {
    labels,
    datasets: [
      {
        label: "ATS Score",
        data: chartData,
        fill: true,
        backgroundColor: "rgba(45, 212, 191, 0.1)", // primary-400
        borderColor: "#2dd4bf", // primary-400
        borderWidth: 3,
        pointBackgroundColor: "#2dd4bf",
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: "#2dd4bf",
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4, // smooth curve
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleFont: { family: "Inter", size: 13 },
        bodyFont: { family: "Inter", size: 14, weight: "bold" as const },
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: function (context: TooltipItem<"line">) {
            return `ATS Score: ${context.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "#94a3b8",
          font: { family: "Inter", size: 11 },
          stepSize: 20,
        },
        border: { dash: [4, 4] },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#94a3b8",
          font: { family: "Inter", size: 11 },
        },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-[3rem] p-8 border-white/5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
      
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="p-2 bg-primary-500/10 rounded-xl text-primary-400">📈</span>
            ATS Score History
          </h2>
          <p className="text-surface-400 text-sm mt-1 font-medium">
            Track your resume improvements over time
          </p>
        </div>
        <div className="px-4 py-1.5 rounded-full bg-surface-800 border border-white/5 text-xs font-bold text-surface-300">
          {resumes.length} Scans
        </div>
      </div>

      <div className="h-[250px] w-full">
        <Line data={data} options={options} />
      </div>
    </motion.div>
  );
};
