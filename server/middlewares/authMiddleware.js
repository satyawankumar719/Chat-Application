import { verifyToken } from '../utils/index.js';

export const authMiddleware = (req, res, next) => {
    const token = req.cookies?.Chat_token;

    if (!token) {
        return next({ status: 401, message: 'Unauthorized access. Token is missing.' });
    }

    try {
        const decoded = verifyToken(token);
        if (!decoded.isVerified) {
            return next({ status: 403, message: 'Please verify your email before accessing protected resources.' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return next({
            status: error.status || 401,
            message: error.message || 'Unauthorized access. Invalid token.'
        });
    }
};