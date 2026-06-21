import express, { Router } from "express";
import { registerUser, loginUser, googleLogin, logoutUser, getUserProfile, updateUserProfile, refreshUserToken } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import rateLimit from "express-rate-limit";
import { registerValidation, loginValidation, profileUpdateValidation, validateResult } from "../middleware/validationMiddleware.js";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: { message: "Too many attempts from this IP, please try again after 15 minutes" }
});

const router: Router = express.Router();

router.post("/register", authLimiter, registerValidation, validateResult, registerUser);
router.post("/login", authLimiter, loginValidation, validateResult, loginUser);
router.post("/logout", protect, logoutUser);
router.post("/google", authLimiter, googleLogin);
router.post("/refresh", refreshUserToken);
router.route("/profile")
    .get(protect, getUserProfile)
    .put(protect, profileUpdateValidation, validateResult, updateUserProfile);

export default router;
