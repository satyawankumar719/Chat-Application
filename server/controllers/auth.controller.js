import { login, signup, sendOtpToEmail, verifyEmailOtp, fetchUser } from "../services/auth.service.js";
import {generateToken} from "../utils/index.js";
import { ENV } from "../config/envConfig.js";

export const handleLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await login({ email, password });
        const token = generateToken(user);
        res.cookie("Chat_token", token, {
            httpOnly: true,
            secure: ENV.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

export const handleSignup = async (req, res) => {
    try {
        const {name, email, password, phoneNumber} = req.body;

        const user = await signup({name, email, password, phoneNumber});

        const token = generateToken(user);
        res.cookie("Chat_token", token, {
            httpOnly: true,
            secure: ENV.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        })

        return res.status(201).json({
            success: true,
            message: "Signup successful",
            user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        const result = await sendOtpToEmail(email);
        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        return res.status(error.status || 500).json({   
            success: false,
            message: error.message || "Internal server error"
        });
    }
}


export const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        const result = await verifyEmailOtp(email, otp);
        return res.status(200).json({
            success: true,
            message: result.message
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}

export const handleLogout = (req, res) => {
    res.clearCookie("Chat_token", {
        httpOnly: true,
        secure: ENV.NODE_ENV === "production",
        sameSite: "strict",
    });
    return res.status(200).json({
        success: true,
        message: "Logout successful"
    });
}

export const getCurrentUser = (req, res) => {
    try {
        const user = req.user;
        fetchUser(user.id);
        return res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user
        });
    } catch (error) {
        return res.status(error.status || 500).json({
            success: false,
            message: error.message || "Internal server error"
        });
    }
}