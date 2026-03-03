import express from "express";
import { createSession, getSession, getSessionById, deleteSession, submitAnswer, endSession } from "../controllers/sessionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { uploadSingleAudio } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createSession).get(getSession);
router.route("/:Id").get(getSessionById).delete(deleteSession);
router.route("/:Id/submit").post(uploadSingleAudio, submitAnswer);
router.route("/:Id/end").post(endSession);

export default router;