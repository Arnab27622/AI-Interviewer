import express from "express";
import { registerUser, loginUser, googleLogin, getUserProfile, updateUserProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import { registerValidation, loginValidation, profileUpdateValidation, validateResult } from "../middleware/validationMiddleware.js";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many attempts from this IP, please try again after 15 minutes"
});

const router = express.Router();

router.post("/register", authLimiter, registerValidation, validateResult, registerUser);
router.post("/login", authLimiter, loginValidation, validateResult, loginUser);
router.post("/google", googleLogin);
router.route("/profile").get(protect, getUserProfile).put(protect, profileUpdateValidation, validateResult, updateUserProfile);

export default router;