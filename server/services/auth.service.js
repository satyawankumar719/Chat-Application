import User from "../models/User.js";
import bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import { otpEmailTemplate } from "../templates/otpEmail.js";
import sendEmail from "../utils/sendEmail.js";
import { generateOtp } from "../utils/index.js";
import { logger } from "../logger.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "./cache.service.js";

const sanitizeUser = (user) => {
    if (!user) return null;
    const u = typeof user.toObject === "function" ? user.toObject() : user;
    const { password, __v, ...safeUser } = u;
    return { ...safeUser, id: u._id };
};

export const login = async (data) => {
    const { email, password } = data;
    if (!email || !password) {
        throw { status: 400, message: "Email and password are required" };
    }
    const user = await User.findOne({ email });
    if (!user || !user.password) {
        throw { status: 401, message: "Invalid email or password" };
    }
    if (!user.isVerified) {
        throw { status: 403, message: "Please verify your email before logging in" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw { status: 401, message: "Invalid email or password" };
    }

    return sanitizeUser(user);
};

export const sendOtpToEmail = async (email) => {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
        throw { status: 409, message: "User with this email already exists" };
    }

    const OTP = generateOtp();
    await redisClient.set(`otp:${email}`, OTP, "EX", 300);

    const html = otpEmailTemplate(OTP);
    
    try {
        await sendEmail(email, "Your OTP Code", html);
        return { success: true, message: "OTP sent successfully" };
    } catch (emailErr) {
        logger.error("Failed to send OTP email, but OTP is stored:", OTP);
        return { success: false, message: "Failed to send OTP email", emailErr };
    }
};

export const verifyEmailOtp = async (email, otp) => {
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp || storedOtp !== otp) {
        throw { status: 400, message: "Invalid or expired OTP" };
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw { status: 404, message: "User not found. Please sign up again." };
    }

    user.isVerified = true;
    await user.save();
    await redisClient.del(`otp:${email}`);

    return sanitizeUser(user);
};

export const signup = async (data) => {
    const { name, email, password, phoneNumber } = data;

    let user = await User.findOne({ email });
    if (user && user.isVerified) {
        throw { status: 409, message: "User with this email already exists" };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    if (user) {
        user.name = name;
        user.password = hashedPassword;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.isVerified = false;
        await user.save();
    } else {
        user = await User.create({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            isVerified: false,
        });
    }

    const otpResult = await sendOtpToEmail(email);

    return {
        success: true,
        message: "Signup successful. OTP sent to your email.",
        email: user.email,
        otpSent: otpResult.success,
    };
};

export const fetchUser = async (userId) => {
    const cacheKey = CACHE_KEYS.USER_PROFILE(userId);

    return cacheService.getOrSet(
        cacheKey,
        async () => {
            const user = await User.findById(userId).select("-password");
            if (!user) {
                throw { status: 404, message: "User not found" };
            }
            return sanitizeUser(user);
        },
        CACHE_TTL.USER_PROFILE
    );
};

export const sendForgotPasswordOtp = async (email) => {
    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
        throw { status: 404, message: "No verified user found with this email" };
    }

    const OTP = generateOtp();
    await redisClient.set(`reset-otp:${email}`, OTP, "EX", 600);

    const html = otpEmailTemplate(OTP);
    
    try {
        await sendEmail(email, "Reset Your Password - OTP", html);
        return { success: true, message: "Password reset OTP sent to your email" };
    } catch (emailErr) {
        logger.error("Failed to send reset OTP email, but OTP is stored:", OTP);
        return { success: false, message: "Failed to send reset OTP email", emailErr };
    }
};

export const resetPasswordService = async (email, otp, newPassword) => {
    const user = await User.findOne({ email, isVerified: true });
    if (!user) {
        throw { status: 404, message: "No verified user found with this email" };
    }

    const storedOtp = await redisClient.get(`reset-otp:${email}`);
    if (!storedOtp) {
        throw { status: 400, message: "OTP has expired or is invalid" };
    }
    if (storedOtp !== otp) {
        throw { status: 400, message: "Invalid OTP" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await redisClient.del(`reset-otp:${email}`);
    return { message: "Password reset successfully" };
};