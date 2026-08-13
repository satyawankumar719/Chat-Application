import {
    login,
    signup,
    sendOtpToEmail,
    verifyEmailOtp,
    fetchUser,
    sendForgotPasswordOtp,
    resetPasswordService,
} from "../services/auth.service.js";
import { generateToken } from "../utils/index.js";
import { ENV } from "../config/envConfig.js";

const COOKIE_OPTIONS = {
    httpOnly: false,
    secure: ENV.NODE_ENV === "production",
    sameSite: ENV.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
};

export const handleLogin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await login({ email, password });
        const token = generateToken(user);
        res.cookie("Chat_token", token, COOKIE_OPTIONS);
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

export const handleSignup = async (req, res, next) => {
    try {
        const { name, email, password, phoneNumber } = req.body;
        const result = await signup({ name, email, password, phoneNumber });
        return res.status(201).json({
            success: true,
            message: result.message,
            email: result.email,
        });
    } catch (error) {
        next(error);
    }
};

export const sendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await sendOtpToEmail(email);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message || "Failed to send OTP",
            });
        }

        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export const verifyOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        const user = await verifyEmailOtp(email, otp);
        const token = generateToken(user);
        res.cookie("Chat_token", token, COOKIE_OPTIONS);
        return res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user,
            token,
        });
    } catch (error) {
        next(error);
    }
};

export const handleLogout = (req, res) => {
    res.clearCookie("Chat_token", COOKIE_OPTIONS);
    return res.status(200).json({
        success: true,
        message: "Logout successful",
    });
};

export const getCurrentUser = async (req, res, next) => {
    try {
        const user = await fetchUser(req.user.id);
        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user,
        });
    } catch (error) {
        next(error);
    }
};

export const handleForgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const result = await sendForgotPasswordOtp(email);
        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.message || "Failed to send reset OTP",
            });
        }
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};

export const handleResetPassword = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const result = await resetPasswordService(email, otp, newPassword);
        return res.status(200).json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
};