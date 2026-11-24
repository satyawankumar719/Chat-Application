import { verifyToken } from "../utils/index.js";
import sessionService from "../services/session.service.js";
import { fetchUser } from "../services/auth.service.js";
import type { Request, Response, NextFunction } from "express";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let token = req.cookies?.Chat_token;

  if (
    !token &&
    req.headers.authorization?.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (
    !token ||
    token === "undefined" ||
    token === "null" ||
    token.trim() === ""
  ) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Token is missing.",
      code: "UNAUTHORIZED",
    });
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid token payload.",
        code: "UNAUTHORIZED",
      });
    }

    if (!decoded.jti) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out",
        code: "UNAUTHORIZED",
      });
    }

    const activeSession = await sessionService.isRefreshTokenValid(
      decoded.id,
      decoded.jti
    );

    if (!activeSession) {
      return res.status(401).json({
        success: false,
        message: "Session expired or logged out",
        code: "UNAUTHORIZED",
      });
    }

    const cachedOrDbUser = await fetchUser(decoded.id);

    if (!cachedOrDbUser) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. User no longer exists.",
        code: "UNAUTHORIZED",
      });
    }

    req.user = cachedOrDbUser as any;
    req.token = token;

    next();
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Unauthorized access. Invalid token.";

    return res.status(401).json({
      success: false,
      message,
      code: "UNAUTHORIZED",
    });
  }
};