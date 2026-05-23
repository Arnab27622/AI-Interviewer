/**
 * @file services/queue/queueService.ts
 * @description BullMQ resume processing queue with TypeScript support
 */

import { Queue, Job } from "bullmq";
import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTls = redisUrl.startsWith("rediss://");

const redisOptions: any = {
  maxRetriesPerRequest: null,
  ...(isTls && { tls: { rejectUnauthorized: false } }), // Needed for managed services like Upstash/Render
};

export const connection = new Redis(redisUrl, redisOptions);

// Handle Redis connection errors gracefully
connection.on("error", (error) => {
  console.error("Redis connection error:", error);
});

export interface ResumeJobData {
  resumeId: string;
  userId?: string;
  jdText?: string;
}

export const resumeQueue = new Queue<ResumeJobData>("resume-processing", { connection });

/**
 * Enqueue a resume processing job
 * @param {string} resumeId - ID of the resume to process
 * @returns {Promise<Job<ResumeJobData>>}
 */
export const addResumeJob = async (resumeId: string): Promise<Job<ResumeJobData>> => {
  const job = await resumeQueue.add("process-resume", { resumeId }, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
  });
  return job;
};

/**
 * Get queue metrics
 */
export const getQueueMetrics = async () => {
  const counts = await resumeQueue.getJobCounts();
  return {
    waiting: counts.waiting || 0,
    active: counts.active || 0,
    completed: counts.completed || 0,
    failed: counts.failed || 0,
    delayed: counts.delayed || 0,
  };
};
