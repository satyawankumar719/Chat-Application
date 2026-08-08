import { verifyToken } from "../utils/index.js";

function getTokenFromCookie(cookieHeader) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";");

  const authCookie = cookies.find((cookie) =>
    cookie.trim().startsWith("Chat_token=")
  );

  if (!authCookie) return null;

  return authCookie.split("=")[1];
}

function socketAuthMiddleware(socket, next) {
  let token = socket.handshake.auth?.token;

  if (!token) {
    const cookieHeader = socket.request?.headers?.cookie || socket.handshake?.headers?.cookie;
    token = getTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return next(new Error("Unauthorized access. Token missing."));
  }

  try {
    const decodedUser = verifyToken(token);

    if (!decodedUser.isVerified) {
      return next(new Error("Unauthorized. Email not verified."));
    }

    socket.user = decodedUser;
    next();
  } catch (error) {
    next(new Error("Unauthorized access. Invalid token."));
  }
}

export { socketAuthMiddleware, getTokenFromCookie };
