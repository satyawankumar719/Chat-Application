import User from "../models/User.js";
import * as bcrypt from "bcrypt";
import redisClient from "../config/redis.js";
import {otpEmailTemplate} from "../templates/otpEmail.js";
import sendEmail from "../utils/sendEmail.js";
import {generateOtp} from "../utils/index.js";



export const login = async (data) => {
    const { email, password } = data;

    if(!email || !password) {
        throw { status: 400, message: "Email and password are required" };
    }

    const user = await User.findOne({ email });
    if (!user) {
        throw { status: 401, message: "Invalid email or password" };
    }

    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
        throw { status: 401, message: "Invalid email or password" };
    }

    return {name: user.name, email: user.email, id: user._id, phoneNumber: user.phoneNumber};
}

export const signup = async (data) => {
    const {name, email, password, phoneNumber} = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw { status: 409, message: "User with this email already exists" };
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phoneNumber
    });

    
    return {name: user.name, email: user.email, id: user._id, phoneNumber: user.phoneNumber};
}

export const sendOtpToEmail = async (email) => {
    const OTP = generateOtp();

    redisClient.set(email, OTP, 'EX', 600); 

    const html = otpEmailTemplate(OTP);
    await sendEmail(email, "Your OTP Code", html);
    return {message: "OTP sent successfully" }; 
}

export const verifyEmailOtp = async (email, otp) => {
    const storedOtp = await redisClient.get(email);
    if(!storedOtp) {
        throw { status: 400, message: "OTP has expired or is invalid" };
    }
    if(storedOtp !== otp) {
        throw { status: 400, message: "Invalid OTP" };
    }

    redisClient.del(email);

    return {message: "OTP verified successfully" };
}

export const fetchUser = async (userId) => {
    const user = await User.findById(userId).select('-password');
    if (!user) {
        throw { status: 404, message: "User not found" };
    }

    return user;
}