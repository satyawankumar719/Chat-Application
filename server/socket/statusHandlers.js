import User from "../models/User.js";
import { addUserSocket, removeUserSocket, getSocketCount, getAllOnlineUserIds } from "./userManager.js";
import { deliverPendingMessages } from "./socketHelpers.js";
import { logger } from "../logger.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "../services/cache.service.js";

async function handleUserConnect(io, socket, currentUserId) {
  addUserSocket(currentUserId, socket.id);

  const totalActiveSockets = getSocketCount(currentUserId);

  if (totalActiveSockets === 1) {
    await User.findByIdAndUpdate(currentUserId, {
      isOnline: true,
    });
  }

  // --- US-13: Cache Online User Status ---
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

  socket.emit("get_online_users", onlineUserIds);

  socket.join(`user:${currentUserId}`);
  await deliverPendingMessages(currentUserId);
}

async function handleUserDisconnect(io, socket, currentUserId) {
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

    // --- US-13: Cache Offline User Status ---
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
    
  } catch (error) {
    logger.error("Disconnect Error:", error);
  }
}

export { handleUserConnect, handleUserDisconnect };
