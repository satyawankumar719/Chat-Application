import { verifyToken } from '../utils/index.js';
import User from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  let token = req.cookies?.Chat_token;

  if (!token && req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access. Token is missing.',
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Invalid token payload.',
        code: 'UNAUTHORIZED'
      });
    }

    const dbUser = await User.findById(decoded.id).select('-password');
    if (!dbUser) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. User no longer exists.',
        code: 'UNAUTHORIZED'
      });
    }

    req.user = dbUser;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || 'Unauthorized access. Invalid token.',
      code: 'UNAUTHORIZED'
    });
  }
};
