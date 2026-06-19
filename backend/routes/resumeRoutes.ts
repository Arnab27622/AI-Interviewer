/**
 * @file routes/resumeRoutes.ts
 * @description Resume API routes with TypeScript support
 */

import express, { Router } from "express";
import { protect } from "../middleware/auth.js";
import { uploadSingleResume } from "../middleware/resumeUploadMiddleware.js";
import {
  uploadResume,
  getUserResumes,
  getResume,
  getResumeStatus,
  rewriteBullet,
  generateCoverLetter,
  deleteResume,
} from "../controllers/resumeController.js";

const router: Router = express.Router();

router.route("/").get(protect, getUserResumes);

router.route("/upload").post(protect, uploadSingleResume, uploadResume);

router.route("/:id").get(protect, getResume).delete(protect, deleteResume);

router.route("/:id/status").get(protect, getResumeStatus);

router.route("/:id/rewrite").post(protect, rewriteBullet);

router.route("/:id/cover-letter").post(protect, generateCoverLetter);

export default router;
