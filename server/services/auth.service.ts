import User from "../models/User.js";
import bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import { otpEmailTemplate } from "../templates/otpEmail.js";
import sendEmail from "../utils/sendEmail.js";
import { generateOtp } from "../utils/index.js";
import { logger } from "../logger.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "./cache.service.js";


export interface SignupInterface {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
    isVerified: boolean;
}

const sanitizeUser = (user: any) => {
    if (!user) return null;
    const u = typeof user.toObject === "function" ? user.toObject() : user;
    const { password: _password, __v, ...safeUser } = u;
    const stringId = u._id ? u._id.toString() : (u.id ? u.id.toString() : "");
    return { ...safeUser, id: stringId, _id: stringId };
};

export const login = async (data: SignupInterface) => {
    const { email, password } = data;
    if (!email || !password) {
        throw { status: 400, message: "Email and password are required" };
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.password) {
        throw { status: 401, message: "Invalid email or password" };
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw { status: 401, message: "Invalid email or password" };
    }

    if (!user.isVerified) {
        await sendOtpToEmail(normalizedEmail);
        throw {
            status: 403,
            message: "Email not verified. A new OTP has been sent to your email.",
            isVerified: false,
            email: normalizedEmail,
        };
    }

    return sanitizeUser(user);
};

export const sendOtpToEmail = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isVerified) {
        throw { status: 409, message: "User with this email already exists" };
    }

    const OTP: string = generateOtp();
    await redisClient.set(`otp:${normalizedEmail}`, OTP, { EX: 300 });

    const html = otpEmailTemplate(OTP);

    try {
        await sendEmail(normalizedEmail, "Your OTP Code", html);
        return { success: true, message: "OTP sent successfully" };
    } catch (emailErr) {
        logger.error("Failed to send OTP email, but OTP is stored:", OTP);
        return { success: false, message: "Failed to send OTP email", emailErr };
    }
};

export const verifyEmailOtp = async (email: string, otp: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const storedOtp = await redisClient.get(`otp:${normalizedEmail}`);
    console.log(storedOtp,cleanOtp)
    if (!storedOtp || storedOtp !== cleanOtp) {
        throw { status: 400, message: "Invalid or expired OTP" };
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
        throw { status: 404, message: "User not found. Please sign up again." };
    }

    user.isVerified = true;
    await user.save();
    await redisClient.del(`otp:${normalizedEmail}`);

    return sanitizeUser(user);
};

export const signup = async (data: SignupInterface) => {
    const { name, email, password, phoneNumber } = data;
    const normalizedEmail = email.trim().toLowerCase();
    const cleanPhone = phoneNumber ? phoneNumber.trim() : "";

    let user = await User.findOne({ email: normalizedEmail });
    if (user && user.isVerified) {
        throw { status: 409, message: "User with this email already exists" };
    }

    if (cleanPhone) {
        const existingPhone = await User.findOne({ phoneNumber: cleanPhone, isVerified: true });
        if (existingPhone && (!user || existingPhone._id.toString() !== user._id.toString())) {
            throw { status: 409, message: "Phone number is already registered. Please use another one." };
        }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
        user.name = name;
        user.password = hashedPassword;
        if (cleanPhone) user.phoneNumber = cleanPhone;
        user.isVerified = false;
        await user.save();

    } else {
        const createPayload: Record<string, any> = {
            name,
            email: normalizedEmail,
            password: hashedPassword,
            isVerified: false,
        };
        if (cleanPhone) {
            createPayload.phoneNumber = cleanPhone;
        }
        user = await User.create(createPayload);
    }

    const otpResult = await sendOtpToEmail(normalizedEmail);

    return {
        success: true,
        message: "Signup successful. OTP sent to your email.",
        email: user.email,
        otpSent: otpResult.success,
    };
};

export const fetchUser = async (userId: string | any) => {
    if (!userId) return null;
    const uid = userId.toString();
    const cacheKey = CACHE_KEYS.USER_PROFILE(uid);

    return cacheService.getOrSet(
        cacheKey,
        async () => {
            const user = await User.findById(uid).select("-password").lean();
            if (!user) {
                return null;
            }
            return sanitizeUser(user);
        },
        CACHE_TTL.USER_PROFILE
    );
};

export const sendForgotPasswordOtp = async (email: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail, isVerified: true });
    if (!user) {
        throw { status: 404, message: "No verified user found with this email" };
    }

    const OTP: string = generateOtp();
    await redisClient.set(`reset-otp:${normalizedEmail}`, OTP, { EX: 600 });

    const html = otpEmailTemplate(OTP);

    try {
        await sendEmail(normalizedEmail, "Reset Your Password - OTP", html);
        return { success: true, message: "Password reset OTP sent to your email" };
    } catch (emailErr) {
        logger.error("Failed to send reset OTP email, but OTP is stored:", OTP);
        return { success: false, message: "Failed to send reset OTP email", emailErr };
    }
};

export const resetPasswordService = async (email: string, otp: string, newPassword: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();

    const user = await User.findOne({ email: normalizedEmail, isVerified: true });
    if (!user) {
        throw { status: 404, message: "No verified user found with this email" };
    }

    const storedOtp = await redisClient.get(`reset-otp:${normalizedEmail}`);
    if (!storedOtp) {
        throw { status: 400, message: "OTP has expired or is invalid" };
    }
    if (storedOtp !== cleanOtp) {
        throw { status: 400, message: "Invalid OTP" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await redisClient.del(`reset-otp:${normalizedEmail}`);
    return { message: "Password reset successfully" };
};