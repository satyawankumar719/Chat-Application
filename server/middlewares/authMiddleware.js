import { verifyToken } from "../utils/index.js";

export const authMiddleware = (req, res, next) => {
    const token = req.cookies?.token;

    if(!token) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized access. Token is missing."
        });
    }

    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(error.status || 401).json({
            success: false,
            message: error.message || "Unauthorized access. Invalid token."
        });
    }
}