import { Router } from "express";
import {
    loginSchema,
    registerSchema,
    sendOtpSchema,
    verifyOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
} from "../validations/auth.validation.js";
import { validateBody } from "../middlewares/validation.js";
import {
    handleLogin,
    handleSignup,
    handleLogout,
    sendOtp,
    verifyOtp,
    getCurrentUser,
    handleForgotPassword,
    handleResetPassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.post("/login", validateBody(loginSchema), handleLogin);
router.post("/signup", validateBody(registerSchema), handleSignup);
router.post("/send-otp", validateBody(sendOtpSchema), sendOtp);
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOtp);
router.post("/forgot-password", validateBody(forgotPasswordSchema), handleForgotPassword);
router.post("/reset-password", validateBody(resetPasswordSchema), handleResetPassword);
router.post("/logout", handleLogout);
router.get("/me", authMiddleware, getCurrentUser);

export default router;