import express from "express";
import { createSession, getSession, getSessionById, deleteSession, submitAnswer, endSession } from "../controllers/sessionController.js";
import { protect } from "../middleware/auth.js";
import { uploadSingleAudio } from "../middleware/uploadMiddleware.js";
import { sessionCreationValidation, validateResult } from "../middleware/validationMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(sessionCreationValidation, validateResult, createSession).get(getSession);
router.route("/:sessionId").get(getSessionById).delete(deleteSession);
router.route("/:sessionId/submit-answer").post(uploadSingleAudio, submitAnswer);
router.route("/:sessionId/end").post(endSession);

export default router;