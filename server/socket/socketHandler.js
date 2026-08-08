import { socketAuthMiddleware } from "./socketAuth.js";
import { handleJoinChat, handleLeaveChat } from "./roomHandlers.js";
import { handleMarkMessagesRead, handleSendMessage } from "./messageHandlers.js";
import { handleUserConnect, handleUserDisconnect } from "./statusHandlers.js";
import { logger } from "../logger.js";
export { getSocketByUserId } from "./userManager.js";

export const socketHandler = (io) => {
  global.io = io;

  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const currentUserId = (socket.user.id || socket.user._id || "").toString();

    logger.info(
      `Socket Connected: ${socket.id} (User: ${currentUserId})`
    );

    await handleUserConnect(io, socket, currentUserId);

    handleJoinChat(socket, currentUserId);
    handleLeaveChat(socket);
    handleMarkMessagesRead(socket, currentUserId);
    handleSendMessage(io, socket, currentUserId);

    socket.on("disconnect", async () => {
      await handleUserDisconnect(io, socket, currentUserId);
    });
  });
};
