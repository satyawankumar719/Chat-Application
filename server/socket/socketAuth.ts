import type { Socket } from "socket.io";
import { verifyToken } from "../utils/index.js";
import { type UserSchemaInterface } from "../models/User.js";
import sessionService from "../services/session.service.js";
import { fetchUser } from "../services/auth.service.js";

export interface AuthenticatedSocket extends Socket {
  user?: UserSchemaInterface;
  authToken?: string;
}

function getTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("Chat_token=")
  );

  if (!authCookie) return null;

  return authCookie.split("=")[1] ?? null;
}

async function socketAuthMiddleware(socket: AuthenticatedSocket, next: (err?: Error) => void) {
  let token: string | undefined = socket.handshake.auth?.token;

  if (!token) {
    const authHeader = socket.handshake?.headers?.authorization;
    if (authHeader && typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    const cookieHeader = socket.request?.headers?.cookie || socket.handshake?.headers?.cookie;
    token = getTokenFromCookie(cookieHeader) ?? undefined;
  }

  if (token && typeof token === "string" && token.startsWith("Bearer ")) {
    token = token.split(" ")[1];
  }

  if (!token || token === "undefined" || token === "null" || token.trim() === "") {
    return next(new Error("UNAUTHORIZED: Token missing"));
  }

  try {
    const decodedUser = verifyToken(token);

    if (!decodedUser || !decodedUser.id) {
      return next(new Error("UNAUTHORIZED: Invalid token payload"));
    }

    if (!decodedUser.jti) {
      return next(new Error("UNAUTHORIZED: Session expired or logged out"));
    }

    const activeSession = await sessionService.isRefreshTokenValid(
      decodedUser.id,
      decodedUser.jti
    );
    if (!activeSession) {
      return next(new Error("UNAUTHORIZED: Session expired or logged out"));
    }

    const cachedOrDbUser = await fetchUser(decodedUser.id);
    if (!cachedOrDbUser) {
      return next(new Error("UNAUTHORIZED: User no longer exists"));
    }

    socket.user = cachedOrDbUser as any;
    socket.authToken = token;
    next();
  } catch {
    next(new Error("UNAUTHORIZED: Invalid token"));
  }
}

export { socketAuthMiddleware, getTokenFromCookie };
