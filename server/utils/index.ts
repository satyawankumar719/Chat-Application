import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import { randomUUID } from "crypto";
import { ENV } from "../config/envConfig.js";

export interface TokenPayload extends JwtPayload {
    id?: string;
    name?: string;
    email?: string;
    isVerified?: boolean;
    jti?: string;
}

export const generateToken = (user: any) => {
    const payload = {
        name: user.name,
        email: user.email,
        id: user.id || user._id,
        isVerified: user.isVerified ?? true,
        jti: randomUUID(),
        iat: Math.floor(Date.now() / 1000),
    };

    const options: SignOptions = ENV.JWT_EXPIRE
        ? ({ expiresIn: ENV.JWT_EXPIRE } as SignOptions)
        : {};

    return jwt.sign(payload, ENV.JWT_SECRET, options);
}

export const verifyToken = <T = TokenPayload>(token: string): T => {
    if (!token || typeof token !== "string" || token === "undefined" || token === "null" || token.trim() === "") {
        throw { status: 401, message: "Invalid or missing token" };
    }
    try {
        return jwt.verify(token, ENV.JWT_SECRET) as T;
    } catch (error) {
        throw { status: 401, message: "Invalid or expired token" };
    }
}

export const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
}