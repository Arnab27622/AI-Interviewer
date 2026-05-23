/**
 * @file types/resume.ts
 * @description Shared type definitions for Resume-related entities
 */

export interface Resume {
  _id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  status: ResumeStatus;
  analysisResult?: AnalysisResult;
  matchResult?: MatchResult;
}

export type ResumeStatus = "pending" | "processing" | "analyzed" | "matched" | "error";

export interface ResumeAnalysisData {
  skills: Skill[];
  experience: Experience[];
  education: Education[];
  summary: string;
}

export interface Skill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
}

export interface Experience {
  jobTitle: string;
  company: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  skills: string[];
}

export interface Education {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  graduationDate: Date;
}

export interface AnalysisResult {
  parsedData: ResumeAnalysisData;
  score: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: Date;
}

export interface MatchResult {
  jobDescription: string;
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  matchedAt: Date;
}

export interface ResumeUploadRequest {
  file: any;
  jobDescription?: string;
}

export interface ResumeStatusUpdate {
  resumeId: string;
  status: ResumeStatus;
  progress?: number;
  error?: string;
}
