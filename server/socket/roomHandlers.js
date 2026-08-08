import { locales } from "zod";
import Chat from "../models/Conversation.js";
import { isUserOnline } from "./userManager.js";
import { logger } from "../logger.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

function handleJoinChat(socket, currentUserId) {
  socket.on("join_chat", async (chatId) => {
    if (!chatId) return;

    try {
      const isChatMember = await Chat.exists({
        _id: chatId,
        "members.user": currentUserId,
      });

      if (!isChatMember) return;

      socket.join(`chat:${chatId}`);
    
    } catch (error) {
      logger.error("Join Chat Error:", error);
    }
  });
}

function handleLeaveChat(socket) {
  socket.on("leave_chat", (chatId) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });
}

export { handleJoinChat, handleLeaveChat };
