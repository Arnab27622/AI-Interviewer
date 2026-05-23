/**
 * @file controllers/resumeController.ts
 * @description Resume upload and retrieval controllers with TypeScript support.
 * 
 * ARCHITECTURE OVERVIEW:
 * This file acts as the primary API bridge between the Frontend and the Backend ML logic.
 * - `uploadResume`: Saves the file to disk, creates a Mongo document, and instantly enqueues a background BullMQ job.
 * - `getResume`: Retrieves the parsed/analyzed resume, using Redis caching for speed.
 * - `rewriteBullet` & `generateCoverLetter`: Synchronously passes specific ML requests to the FastAPI Python service.
 */

import { Request, Response, NextFunction } from "express";
import asyncHandler from "express-async-handler";
import { Resume } from "../models/Resume.js";
import { addResumeJob, connection as redis } from "../services/queue/queueService.js";
import { emitResumeStatus } from "../services/socketService.js";
import { AppError } from "../types/errors.js";
import logger from "../utils/logger.js";
import fetch from "node-fetch";

import { AuthenticatedRequest } from "../types/express.js";

/**
 * @desc    Upload a resume
 * @route   POST /api/resume/upload
 * @access  Private
 */
export const uploadResume = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    throw new AppError("INVALID_FILE", "Please upload a file", {}, 400);
  }

  const { jdText } = req.body;
  const { originalname, filename, mimetype, size, path } = req.file;

  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "User not authenticated", {}, 401);
  }

  // Map mimetype to enum
  let fileType: "pdf" | "docx" | "txt" = "pdf";
  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    fileType = "docx";
  } else if (mimetype === "text/plain") {
    fileType = "txt";
  }

  // 1. Create Resume Document
  const resume = new Resume({
    user: req.user._id,
    originalFilename: originalname,
    storedFilename: filename,
    fileType,
    fileSize: size,
    filePath: path,
    status: "pending",
    jdText: jdText || null,
  });

  await resume.save();

  logger.info("Resume document created", { resumeId: resume._id.toString(), userId: req.user._id, requestId: req.requestId });

  // 2. Enqueue Background Job
  const job = await addResumeJob(resume._id.toString());

  logger.info("Resume job enqueued", { resumeId: resume._id.toString(), jobId: job.id, requestId: req.requestId });

  // 3. Save jobId to Document
  resume.jobId = job.id;
  await resume.save();

  // 4. Emit Socket.IO Event
  const io = req.app.get("io");
  if (io) {
    emitResumeStatus(io, req.user._id.toString(), {
      resumeId: resume._id,
      status: "pending",
    });
  }

  // 5. Respond
  res.status(201).json({
    success: true,
    data: {
      resumeId: resume._id,
      jobId: job.id,
      status: "pending",
    },
  });
});

/**
 * @desc    Get all user resumes
 * @route   GET /api/resume
 * @access  Private
 */
export const getUserResumes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "User not authenticated", {}, 401);
  }

  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({
    success: true,
    data: resumes,
  });
});

/**
 * @desc    Get single resume
 * @route   GET /api/resume/:id
 * @access  Private
 */
export const getResume = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "User not authenticated", {}, 401);
  }

  const cacheKey = `resume:${req.params.id}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    const resume = JSON.parse(cached);
    if (resume.user.toString() !== req.user._id.toString()) {
      throw new AppError("UNAUTHORIZED", "Not authorized to access this resume", {}, 401);
    }
    logger.info("Resume served from cache", { resumeId: req.params.id, userId: req.user._id });
    res.json({
      success: true,
      data: resume,
    });
    return;
  }

  const resume = await Resume.findById(req.params.id);

  if (!resume) {
    throw new AppError("NOT_FOUND", "Resume not found", {}, 404);
  }

  // Check ownership
  if (resume.user.toString() !== req.user._id.toString()) {
    throw new AppError("UNAUTHORIZED", "Not authorized to access this resume", {}, 401);
  }

  // Cache if completed
  if (resume.status === "completed") {
    await redis.setex(cacheKey, 86400, JSON.stringify(resume)); // 24 hours
  }

  res.json({
    success: true,
    data: resume,
  });
});

/**
 * @desc    Get resume processing status
 * @route   GET /api/resume/:id/status
 * @access  Private
 */
export const getResumeStatus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw new AppError("UNAUTHORIZED", "User not authenticated", {}, 401);
  }

  const resume = await Resume.findById(req.params.id).select("status error scores user");

  if (!resume) {
    throw new AppError("NOT_FOUND", "Resume not found", {}, 404);
  }

  if (resume.user.toString() !== req.user._id.toString()) {
    throw new AppError("UNAUTHORIZED", "Not authorized", {}, 401);
  }

  res.json({
    success: true,
    data: {
      status: resume.status,
      error: resume.error,
      scores: resume.scores,
    },
  });
});

/**
 * @desc    Rewrite a specific bullet point using AI
 * @route   POST /api/resume/:id/rewrite
 * @access  Private
 */
export const rewriteBullet = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { bullet } = req.body;

  if (!bullet) {
    throw new AppError("VALIDATION_ERROR", "Bullet point is required", {}, 400);
  }

  const resume = await Resume.findOne({ _id: id, user: req.user?._id });
  if (!resume) {
    throw new AppError("NOT_FOUND", "Resume not found", {}, 404);
  }

  const context = `Role: ${resume.analysisReport?._v2?.analysis?.role_summary || "Unknown Role"}`;

  const pythonServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const response = await fetch(`${pythonServiceUrl}/resume/v2/rewrite-bullet`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bullet, resume_context: context }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError("INTERNAL_ERROR", "Failed to rewrite bullet", { detail: errorText }, response.status);
  }

  const data = await response.json();
  res.status(200).json(data);
});

/**
 * @desc    Generate a tailored cover letter using AI
 * @route   POST /api/resume/:id/cover-letter
 * @access  Private
 */
export const generateCoverLetter = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  const resume = await Resume.findOne({ _id: id, user: req.user?._id });
  if (!resume) {
    throw new AppError("NOT_FOUND", "Resume not found", {}, 404);
  }

  const resumeText = resume.parsedData?.rawText;
  const jdText = resume.jdText;

  if (!resumeText || !jdText) {
    throw new AppError("VALIDATION_ERROR", "Resume text and Job Description text are required to generate a cover letter", {}, 400);
  }

  const pythonServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000";
  const response = await fetch(`${pythonServiceUrl}/resume/v2/generate-cover-letter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume_text: resumeText, jd_text: jdText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new AppError("INTERNAL_ERROR", "Failed to generate cover letter", { detail: errorText }, response.status);
  }

  const data = await response.json();
  res.status(200).json(data);
});
