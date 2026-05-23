/**
 * @file types/socket.ts
 * @description Socket.IO event and communication type definitions
 */

import { ResumeStatus } from "./resume";

export type SocketEventType =
  | "resume:upload"
  | "resume:status"
  | "resume:analysis"
  | "resume:error"
  | "resume:complete"
  | "queue:status";

export interface SocketEvent<T = any> {
  type: SocketEventType;
  data: T;
  requestId: string;
  timestamp: Date;
}

export interface StatusUpdate {
  resumeId: string;
  status: ResumeStatus;
  progress: number;
  message: string;
  requestId: string;
  timestamp: Date;
}

export interface AnalysisUpdate {
  resumeId: string;
  analysis: {
    skills: string[];
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  requestId: string;
  timestamp: Date;
}

export interface ErrorUpdate {
  resumeId: string;
  code: string;
  message: string;
  requestId: string;
  timestamp: Date;
}

export interface QueueStatusUpdate {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  requestId: string;
  timestamp: Date;
}
