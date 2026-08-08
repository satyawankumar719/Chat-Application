const connectedUserSockets = new Map();
import { authMiddleware } from "../middlewares/authMiddleware.js";

function addUserSocket(userId, socketId) {
  const userIdString = userId.toString();

  if (!connectedUserSockets.has(userIdString)) {
    connectedUserSockets.set(userIdString, new Set());
  }

  connectedUserSockets.get(userIdString).add(socketId);
}

function removeUserSocket(userId, socketId) {
  const userIdString = userId.toString();
  const socketIds = connectedUserSockets.get(userIdString);

  if (!socketIds) return true;

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    connectedUserSockets.delete(userIdString);
    return true;
  }

  return false;
}

function isUserOnline(userId) {
  const socketIds = connectedUserSockets.get(userId.toString());
  return socketIds && socketIds.size > 0;
}

function getSocketCount(userId) {
  const socketIds = connectedUserSockets.get(userId.toString());
  return socketIds ? socketIds.size : 0;
}

export function getAllOnlineUserIds() {
  return Array.from(connectedUserSockets.keys());
}

export function getSocketByUserId(userId) {
  const socketIds = connectedUserSockets.get(userId.toString());

  if (!socketIds || socketIds.size === 0) {
    return null;
  }

  return {
    emit(eventName, payload) {
      socketIds.forEach((socketId) => {
        global.io?.to(socketId).emit(eventName, payload);
      });
    },
  };
}

export {
  addUserSocket,
  removeUserSocket,
  isUserOnline,
  getSocketCount,
};
