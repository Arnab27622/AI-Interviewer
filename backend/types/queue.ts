/**
 * @file types/queue.ts
 * @description Queue and job-related type definitions
 */

import { Resume } from "./resume";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "delayed";

export interface JobData {
  resumeId: string;
  userId: string;
  jobDescription?: string;
  fileUrl: string;
  requestId: string;
}

export interface JobResult {
  resumeId: string;
  status: JobStatus;
  result?: {
    parsedData: any;
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: Date;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface QueueMetrics {
  totalProcessed: number;
  totalFailed: number;
  averageProcessingTime: number;
  lastProcessedAt?: Date;
  lastFailureAt?: Date;
}

export interface DLQJob {
  jobId: string;
  data: JobData;
  failureReason: string;
  failureCount: number;
  lastAttemptAt: Date;
  createdAt: Date;
}
