import { verifyToken } from "../utils/index.js";
import User from "../models/User.js";

function getTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("Chat_token=")
  );

  if (!authCookie) return null;

  return authCookie.split("=")[1];
}

async function socketAuthMiddleware(socket, next) {
  let token = socket.handshake.auth?.token;

  if (!token) {
    const cookieHeader = socket.request?.headers?.cookie || socket.handshake?.headers?.cookie;
    token = getTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return next(new Error("UNAUTHORIZED: Token missing"));
  }

  try {
    const decodedUser = verifyToken(token);

    if (!decodedUser || !decodedUser.id) {
      return next(new Error("UNAUTHORIZED: Invalid token payload"));
    }

    const dbUser = await User.findById(decodedUser.id).select("-password");
    if (!dbUser) {
      return next(new Error("UNAUTHORIZED: User no longer exists"));
    }

    socket.user = dbUser;
    socket.authToken = token;
    next();
  } catch (error) {
    next(new Error("UNAUTHORIZED: Invalid token"));
  }
}

export { socketAuthMiddleware, getTokenFromCookie };

