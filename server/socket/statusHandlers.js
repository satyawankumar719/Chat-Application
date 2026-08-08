import User from "../models/User.js";
import { addUserSocket, removeUserSocket, getSocketCount, getAllOnlineUserIds } from "./userManager.js";
import { deliverPendingMessages } from "./socketHelpers.js";
import { logger } from "../logger.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

async function handleUserConnect(io, socket, currentUserId) {
  addUserSocket(currentUserId, socket.id);

  const totalActiveSockets = getSocketCount(currentUserId);

  if (totalActiveSockets === 1) {
    await User.findByIdAndUpdate(currentUserId, {
      isOnline: true,
    });
  }

  io.emit("user_status_changed", {
    userId: currentUserId,
    isOnline: true,
  });

  const onlineUserIds = getAllOnlineUserIds();
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
