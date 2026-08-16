import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { ENV } from "../config/envConfig.js";


export const generateToken = (user) => {
    const payload = {
        name: user.name,
        email: user.email,
        id: user.id || user._id,
        isVerified: user.isVerified ?? true,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
    }

    return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRE });
}


export const verifyToken = (token) => {
    if (!token || typeof token !== "string" || token === "undefined" || token === "null" || token.trim() === "") {
        throw { status: 401, message: "Invalid or missing token" };
    }
    try {
        return jwt.verify(token, ENV.JWT_SECRET);
    } catch (error) {
        throw { status: 401, message: "Invalid or expired token" };
    }
}

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}