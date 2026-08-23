import { Server } from 'socket.io';

declare global {
  var io: Server | undefined;
}

const connectedUserSockets = new Map<string, Set<string>>();

function addUserSocket(userId: any, socketId: string): void {
  const userIdString = userId.toString();

  if (!connectedUserSockets.has(userIdString)) {
    connectedUserSockets.set(userIdString, new Set());
  }

  connectedUserSockets.get(userIdString)!.add(socketId);
}

function removeUserSocket(userId: any, socketId: string): boolean {
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

function isUserOnline(userId: any): boolean {
  const socketIds = connectedUserSockets.get(userId.toString());
  return !!(socketIds && socketIds.size > 0);
}

function getSocketCount(userId: any): number {
  const socketIds = connectedUserSockets.get(userId.toString());
  return socketIds ? socketIds.size : 0;
}

export function getAllOnlineUserIds(): string[] {
  return Array.from(connectedUserSockets.keys());
}

export function getSocketByUserId(userId: any) {
  const socketIds = connectedUserSockets.get(userId.toString());

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
  isUserOnline,
  getSocketCount,
};
