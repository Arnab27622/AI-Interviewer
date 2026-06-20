/**
 * @file models/Resume.ts
 * @description MongoDB Resume model with TypeScript support
 */

import mongoose, { Schema, Document } from "mongoose";

export interface IResume extends Document {
  user: mongoose.Types.ObjectId;
  originalFilename: string;
  storedFilename: string;
  fileType: "pdf" | "docx" | "txt";
  fileSize: number;
  filePath: string;
  status: "pending" | "processing" | "parsed" | "analyzing" | "matching" | "completed" | "failed" | "invalid_document";
  jobId?: string;
  parsedData?: Record<string, any>;
  analysisReport?: Record<string, any>;
  jdText?: string;
  jdMatchReport?: Record<string, any>;
  scores?: {
    ats: number;
    overall: number;
    jdMatch: number;
  };
  error?: string;
  metrics?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    storedFilename: {
      type: String,
      required: true,
      unique: true,
    },
    fileType: {
      type: String,
      enum: ["pdf", "docx", "txt"],
      required: true,
    },
    fileSize: {
      type: Number,
      required: true,
    },
    filePath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "parsed", "analyzing", "matching", "completed", "failed", "invalid_document"],
      default: "pending",
      index: true,
    },
    jobId: {
      type: String,
      default: null,
    },
    parsedData: {
      type: Schema.Types.Mixed,
      default: {},
    },
    analysisReport: {
      type: Schema.Types.Mixed,
      default: {},
    },
    jdText: {
      type: String,
      default: null,
    },
    jdMatchReport: {
      type: Schema.Types.Mixed,
      default: {},
    },
    scores: {
      ats: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
      jdMatch: { type: Number, default: 0 },
    },
    error: {
      type: String,
      default: null,
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

resumeSchema.index({ user: 1, createdAt: -1 });

export const Resume = mongoose.model<IResume>("Resume", resumeSchema);
