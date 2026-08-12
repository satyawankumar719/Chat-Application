import Chat from "../models/Conversation.js";
import { logger } from "../logger.js";

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

function handleTyping(socket, currentUserId) {
  socket.on("typing", ({ chatId, typing }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit("typing", {
      chatId,
      userId: currentUserId,
      typing,
    });
  });
}

export { handleJoinChat, handleLeaveChat, handleTyping };
