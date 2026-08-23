import { Socket } from "socket.io";
import Chat from "../models/Conversation.js";
import { logger } from "../logger.js";

function handleJoinChat(socket: Socket, currentUserId: string): void {
  socket.on("join_chat", async (chatId: string) => {
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

function handleLeaveChat(socket: Socket): void {
  socket.on("leave_chat", (chatId: string) => {
    if (!chatId) return;
    socket.leave(`chat:${chatId}`);
  });
}

function handleTyping(socket: Socket, currentUserId: string): void {
  socket.on("typing", ({ chatId, typing }: { chatId: string; typing: boolean }) => {
    if (!chatId) return;
    socket.to(`chat:${chatId}`).emit("typing", {
      chatId,
      userId: currentUserId,
      typing,
    });
  });
}

export { handleJoinChat, handleLeaveChat, handleTyping };
