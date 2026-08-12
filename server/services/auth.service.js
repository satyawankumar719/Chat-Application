import User from "../models/User.js";
import bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import { otpEmailTemplate } from "../templates/otpEmail.js";
import sendEmail from "../utils/sendEmail.js";
import { generateOtp } from "../utils/index.js";
import { logger } from "../logger.js";

export const login = async (data) => {
    const { email, password } = data;
if (!email || !password) {
        throw { status: 400, message: "Email and password are required" };}
        const user = await User.findOne({ email });
    if (!user) {
        throw { status: 401, message: "Invalid email or password" };
    }

    if (!user.isVerified) {
        throw { status: 403, message: "Please verify your email before logging in" };
    }

    if (!user.password) {
        throw { status: 401, message: "Invalid email or password" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw { status: 401, message: "Invalid email or password" };
    }

    return {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
    };
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
    if (!storedOtp) {
        throw { status: 400, message: "OTP has expired or is invalid" };
    }
    if (storedOtp !== otp) {
        throw { status: 400, message: "Invalid OTP" };
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw { status: 404, message: "User not found. Please sign up again." };
    }

    user.isVerified = true;
    await user.save();

    await redisClient.del(`otp:${email}`);

    return {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        bio: user.bio,
    };
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
    const user = await User.findById(userId).select("-password");
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    return {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        phoneNumber: user.phoneNumber,
        avatar: user.avatar,
        bio: user.bio,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
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
    } catch (emailErr) {
        logger.error("Failed to send reset OTP email, but OTP is stored:", OTP);
    }
    return { message: "Password reset OTP sent to your email" };
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