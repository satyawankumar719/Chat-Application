import { Server } from 'socket.io';

declare global {
  var io: Server | undefined;
}

const connectedUserSockets = new Map<string, Set<string>>();

function normalizeUserId(userId: any): string {
  if (!userId) return "";
  return (userId._id || userId.id || userId).toString();
}

function addUserSocket(userId: any, socketId: string): void {
  const userIdString = normalizeUserId(userId);
  if (!userIdString) return;

  if (!connectedUserSockets.has(userIdString)) {
    connectedUserSockets.set(userIdString, new Set());
  }

  connectedUserSockets.get(userIdString)!.add(socketId);
}

function removeUserSocket(userId: any, socketId: string): boolean {
  const userIdString = normalizeUserId(userId);
  if (!userIdString) return true;

  const socketIds = connectedUserSockets.get(userIdString);

  if (!socketIds) return true;

  socketIds.delete(socketId);

  if (socketIds.size === 0) {
    connectedUserSockets.delete(userIdString);
    return true;
  }

  return false;
}

function removeAllUserSockets(userId: any): void {
  const userIdString = normalizeUserId(userId);
  if (userIdString) {
    connectedUserSockets.delete(userIdString);
  }
}

function getUserSockets(userId: any): Set<string> | undefined {
  const userIdString = normalizeUserId(userId);
  return connectedUserSockets.get(userIdString);
}

function isUserOnline(userId: any): boolean {
  const uid = normalizeUserId(userId);
  if (!uid) return false;

  const socketIds = connectedUserSockets.get(uid);
  if (!socketIds || socketIds.size === 0) return false;

  if (global.io) {
    for (const sid of Array.from(socketIds)) {
      const socket = global.io.sockets.sockets.get(sid);
      if (!socket || !socket.connected) {
        socketIds.delete(sid);
      }
    }

    if (socketIds.size === 0) {
      connectedUserSockets.delete(uid);
      return false;
    }
  }

  return socketIds.size > 0;
}

function getSocketCount(userId: any): number {
  const uid = normalizeUserId(userId);
  const socketIds = connectedUserSockets.get(uid);
  return socketIds ? socketIds.size : 0;
}

export function getAllOnlineUserIds(): string[] {
  if (global.io) {
    for (const [uid, socketIds] of connectedUserSockets.entries()) {
      for (const sid of Array.from(socketIds)) {
        const socket = global.io.sockets.sockets.get(sid);
        if (!socket || !socket.connected) {
          socketIds.delete(sid);
        }
      }
      if (socketIds.size === 0) {
        connectedUserSockets.delete(uid);
      }
    }
  }
  return Array.from(connectedUserSockets.keys());
}

export function getSocketByUserId(userId: any) {
  const uid = normalizeUserId(userId);
  const socketIds = connectedUserSockets.get(uid);

  if (!socketIds || socketIds.size === 0) {
    return null;
  }

  return {
    emit(eventName: string, payload: any) {
      socketIds.forEach((socketId) => {
        global.io?.to(socketId).emit(eventName, payload);
      });
    },
  };
}

export {
  addUserSocket,
  removeUserSocket,
  removeAllUserSockets,
  getUserSockets,
  isUserOnline,
  getSocketCount,
};
