import User from "../models/User.js";
import {
  addUserSocket,
  removeUserSocket,
  removeAllUserSockets,
  getUserSockets,
  getSocketCount,
  getAllOnlineUserIds,
} from "./userManager.js";
import { deliverPendingMessages } from "./socketHelpers.js";
import { logger } from "../logger.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "../services/cache.service.js";
import type { Server } from "socket.io";
async function handleUserConnect(io:Server, socket:any, currentUserId:string) {
  addUserSocket(currentUserId, socket.id);

  const totalActiveSockets = getSocketCount(currentUserId);

  if (totalActiveSockets === 1) {
    await User.findByIdAndUpdate(currentUserId, {
      isOnline: true,
    });
  }

  await cacheService.set(
    CACHE_KEYS.ONLINE_STATUS(currentUserId),
    { isOnline: true },
    CACHE_TTL.ONLINE_STATUS
  );
  await cacheService.invalidateUserProfile(currentUserId);

  io.emit("user_status_changed", {
    userId: currentUserId,
    isOnline: true,
  });

  const onlineUserIds = getAllOnlineUserIds();
  await cacheService.set(
    CACHE_KEYS.ONLINE_USERS_LIST(),
    onlineUserIds,
    CACHE_TTL.ONLINE_STATUS
  );

  io.emit("get_online_users", onlineUserIds)
;
  socket.join(`user:${currentUserId}`);
  await deliverPendingMessages(currentUserId);
}

async function handleUserDisconnect(io: Server, socket: any, currentUserId: string) {
  logger.info(
    `Socket Disconnected: ${socket.id} (User: ${currentUserId})`
  );

  const isLastActiveSocket = removeUserSocket(
    currentUserId,
    socket.id
  );

  if (!isLastActiveSocket) return;

  try {
    const lastSeen = new Date();

    await User.findByIdAndUpdate(currentUserId, {
      isOnline: false,
      lastSeen,
    });

    await cacheService.set(
      CACHE_KEYS.ONLINE_STATUS(currentUserId),
      { isOnline: false, lastSeen },
      CACHE_TTL.ONLINE_STATUS
    );
    await cacheService.invalidateUserProfile(currentUserId);

    const onlineUserIds = getAllOnlineUserIds();
    await cacheService.set(
      CACHE_KEYS.ONLINE_USERS_LIST(),
      onlineUserIds,
      CACHE_TTL.ONLINE_STATUS
    );

    io.emit("user_status_changed", {
      userId: currentUserId,
      isOnline: false,
      lastSeen,
    });

    io.emit("get_online_users", onlineUserIds);

  } catch (error) {
    logger.error("Disconnect Error:", error);
  }
}

async function handleUserLogout(userId: string): Promise<void> {
  const uid = (userId as any)?._id?.toString() || (userId as any)?.id?.toString() || userId?.toString();
  if (!uid) return;

  logger.info(`User Logging Out & Clearing Presence: ${uid}`);

  const socketIds = getUserSockets(uid);
  if (socketIds && socketIds.size > 0 && global.io) {
    for (const sid of Array.from(socketIds)) {
      const socket = global.io.sockets.sockets.get(sid);
      if (socket) {
        socket.disconnect(true);
      }
    }
  }
  removeAllUserSockets(uid);

  try {
    const lastSeen = new Date();

    await User.findByIdAndUpdate(uid, {
      isOnline: false,
      lastSeen,
    });

    await cacheService.set(
      CACHE_KEYS.ONLINE_STATUS(uid),
      { isOnline: false, lastSeen },
      CACHE_TTL.ONLINE_STATUS
    );
    await cacheService.invalidateUserProfile(uid);

    const onlineUserIds = getAllOnlineUserIds();
    await cacheService.set(
      CACHE_KEYS.ONLINE_USERS_LIST(),
      onlineUserIds,
      CACHE_TTL.ONLINE_STATUS
    );

    if (global.io) {
      global.io.emit("user_status_changed", {
        userId: uid,
        isOnline: false,
        lastSeen,
      });

      global.io.emit("get_online_users", onlineUserIds);
    }
  } catch (error) {
    logger.error("User Logout Status Error:", error);
  }
}

function handleGetOnlineUsers(socket: any) {
  const onlineUserIds = getAllOnlineUserIds();
  socket.emit("get_online_users", onlineUserIds);
}

export { handleUserConnect, handleUserDisconnect, handleUserLogout, handleGetOnlineUsers };
