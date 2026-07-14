/**
 * @file src/models/Session.ts
 * @description Mongoose schemas and models for Interview Sessions.
 * Includes embedded Question schema for session-specific state.
 */
import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Interface for an individual interview question within a session.
 */
export interface IQuestion {
  questionText: string;
  questionType: "oral" | "coding" | "system-design";
  idealAnswer: string;
  userAnswerText?: string;
  userSubmittedCode?: string;
  userSubmittedDiagram?: string;
  diagramImageUrl?: string;
  isSubmitted: boolean;
  isEvaluated: boolean;
  technicalScore?: number;
  confidenceScore?: number;
  aiFeedback?: string;
  speechMetrics?: {
    fillerWordCount: number;
    fillerWords: { word: string; count: number }[];
    speakingPaceWpm: number;
    paceRating: string;
    totalPauseDurationMs: number;
    pauseCount: number;
    clarityScore: number;
  };
  isFollowUp?: boolean;
  parentQuestionIndex?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface for the primary Interview Session.
 */
export interface ISession extends Document {
  user: mongoose.Types.ObjectId;
  role: string;
  level: string;
  interviewType: "oral-only" | "coding-mix" | "company-specific";
  company?: string;
  companyTrack?: string;
  status: "pending" | "in-progress" | "completed" | "cancelled" | "failed";
  overallScore: number;
  metrics: {
    avgTechnical: number;
    avgConfidence: number;
  };
  resumeId?: mongoose.Types.ObjectId;
  questions: mongoose.Types.DocumentArray<IQuestion & mongoose.Document>;

  startTime: Date;
  endTime?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Interface for the Session Model (to declare static methods).
 */
export interface ISessionModel extends Model<ISession> {
  calculateScoreSummary(sessionId: string | mongoose.Types.ObjectId): Promise<{
    overallScore: number;
    avgTechnical: number;
    avgConfidence: number;
  }>;
}

const questionSchema = new Schema<IQuestion & mongoose.Document>(
  {
    questionText: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["oral", "coding", "system-design"],
      required: true,
    },
    idealAnswer: {
      type: String,
      required: true,
      default: "Pending",
    },
    userAnswerText: {
      type: String,
      default: "",
    },
    userSubmittedCode: {
      type: String,
      default: "",
    },
    isSubmitted: {
      type: Boolean,
      default: false,
    },
    isEvaluated: {
      type: Boolean,
      default: false,
      index: true,
    },
    technicalScore: {
      type: Number,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    aiFeedback: {
      type: String,
      default: "",
    },
    userSubmittedDiagram: {
      type: String,
      default: "",
    },
    diagramImageUrl: {
      type: String,
      default: "",
    },
    speechMetrics: {
      fillerWordCount: { type: Number, default: 0 },
      fillerWords: [{ word: String, count: Number }],
      speakingPaceWpm: { type: Number, default: 0 },
      paceRating: { type: String },
      totalPauseDurationMs: { type: Number, default: 0 },
      pauseCount: { type: Number, default: 0 },
      clarityScore: { type: Number, default: 0 },
    },
    isFollowUp: {
      type: Boolean,
      default: false,
    },
    parentQuestionIndex: {
      type: Number,
      default: null,
    },
  },
  { timestamps: true }
);

const sessionSchema = new Schema<ISession, ISessionModel>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    interviewType: {
      type: String,
      enum: ["oral-only", "coding-mix", "company-specific"],
      required: true,
    },
    company: {
      type: String,
      index: { sparse: true },
    },
    companyTrack: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "in-progress", "completed", "cancelled", "failed"],
      default: "pending",
      index: true,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    metrics: {
      avgTechnical: {
        type: Number,
        default: 0,
      },
      avgConfidence: {
        type: Number,
        default: 0,
      },
    },
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: "Resume",
      required: false,
    },
    questions: [questionSchema],

    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for efficient sorting by user and creation date (used in Dashboard)
sessionSchema.index({ user: 1, createdAt: -1 });

/**
 * Aggregate and calculate overall proficiency metrics for a specific session.
 * Uses MongoDB aggregation pipeline to compute averages across evaluated questions.
 * @param {string|mongoose.Types.ObjectId} sessionId - The session to analyze.
 * @returns {Promise<Object>} Object containing overallScore, avgTechnical, and avgConfidence.
 */
sessionSchema.statics.calculateScoreSummary = async function (
  sessionId: string | mongoose.Types.ObjectId
): Promise<{ overallScore: number; avgTechnical: number; avgConfidence: number }> {
  const result = await this.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(sessionId),
      },
    },
    {
      $unwind: "$questions",
    },
    {
      $group: {
        _id: "$_id",
        avgTechnical: {
          $avg: {
            $cond: [{ $eq: ["$questions.isEvaluated", true] }, "$questions.technicalScore", 0],
          },
        },
        avgConfidence: {
          $avg: {
            $cond: [{ $eq: ["$questions.isEvaluated", true] }, "$questions.confidenceScore", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        overallScore: {
          $round: [
            {
              $avg: ["$avgTechnical", "$avgConfidence"],
            },
            0,
          ],
        },
        avgTechnical: { $round: ["$avgTechnical", 0] },
        avgConfidence: { $round: ["$avgConfidence", 0] },
      },
    },
  ]);

  return result[0] || { overallScore: 0, avgTechnical: 0, avgConfidence: 0 };
};

sessionSchema.pre("save", async function () {
  if (this.interviewType === "company-specific") {
    if (!this.company || !this.companyTrack) {
      throw new Error("Both 'company' and 'companyTrack' are required when interviewType is 'company-specific'.");
    }
  }
});

const Session = mongoose.model<ISession, ISessionModel>("Session", sessionSchema);

export default Session;
