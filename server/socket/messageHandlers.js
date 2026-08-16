import redisClient from "../config/redis.js";
import { logger } from "../logger.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { verifyToken } from "../utils/index.js";
import { getTokenFromCookie } from "./socketAuth.js";
import {
  findChatForUser,
  setUserUnreadCount,
  increaseUnreadCount,
  notifyMessageSenders,
} from "./socketHelpers.js";
import { isUserOnline } from "./userManager.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "../services/cache.service.js";


async function validateSocketUser(socket, messageData, currentUserId) {
  let token;
  if (messageData && typeof messageData === "object" && "token" in messageData) {
    token = messageData.token;
  } else {
    token = socket.authToken;
    if (!token) {
      const cookieHeader = socket.request?.headers?.cookie || socket.handshake?.headers?.cookie;
      token = getTokenFromCookie(cookieHeader) || socket.handshake.auth?.token;
    }
  }

  if (!token) {
    throw new Error("UNAUTHORIZED");
  }

  const decoded = verifyToken(token);
  if (!decoded || !decoded.id || decoded.id.toString() !== currentUserId.toString()) {
    throw new Error("UNAUTHORIZED");
  }

  const dbUser = await User.findById(currentUserId);
  if (!dbUser) {
    throw new Error("UNAUTHORIZED");
  }

  return dbUser;
}

function handleMarkMessagesRead(socket, currentUserId) {
  socket.on("mark_messages_read", async ({ chatId }) => {
    try {
      if (!chatId) return;

      await validateSocketUser(socket, null, currentUserId);

      const chat = await findChatForUser(chatId, currentUserId);

      if (!chat) return;

      const unreadMessages = await Message.find({
        chat: chatId,
        sender: { $ne: currentUserId },
        status: { $ne: "read" },
      });

      setUserUnreadCount(chat, currentUserId, 0);
      await chat.save();
      await cacheService.invalidateUserConversations(currentUserId);

      if (unreadMessages.length === 0) return;

      const unreadMessageIds = unreadMessages.map(
        (message) => message._id
      );

      await Message.updateMany(
        {
          _id: { $in: unreadMessageIds },
        },
        {
          $set: {
            status: "read",
          },
          $push: {
            readBy: {
              user: currentUserId,
              readAt: new Date(),
            },
          },
        }
      );

      const senderIds = new Set(
        unreadMessages.map((message) =>
          message.sender.toString()
        )
      );

      notifyMessageSenders(senderIds, {
        chatId,
        messageIds: unreadMessageIds,
        status: "read",
      });
    } catch (error) {
      if (error.message === "UNAUTHORIZED") {
        socket.emit("auth_error", { message: "Session expired or invalid token" });
      }
      logger.error("Mark Read Error:", error);
    }
  });
}

function handleSendMessage(io, socket, currentUserId) {
  socket.on("send_message", async (messageData, acknowledge) => {
    try {
      // Security Check: Validate token and user existence before accepting message
      try {
        await validateSocketUser(socket, messageData, currentUserId);
      } catch (authErr) {
        socket.emit("auth_error", { message: "Session expired or invalid token" });
        return acknowledge?.({
          success: false,
          error: "Unauthorized: Invalid or expired token",
          code: "UNAUTHORIZED",
        });
      }


      const {
        chatId,
        content,
        type = "text",
        tempId,
        fileUrl = null,
        fileName = null,
        fileSize = null,
        attachments = [],
      } = messageData;

      const messageText =
        typeof content === "string" ? content.trim() : "";

      const hasFiles = attachments.length > 0 || fileUrl;

      if (!chatId || (!messageText && !hasFiles)) {
        return acknowledge?.({
          success: false,
          error: "Invalid message content.",
        });
      }

      const chat = await findChatForUser(chatId, currentUserId);

      if (!chat) {
        return acknowledge?.({
          success: false,
          error: "Forbidden: You are not a member of this chat.",
          code: "FORBIDDEN",
        });
      }

      const recipientMembers = chat.members.filter(
        (member) => member.user.toString() !== currentUserId
      );

      const isAnyRecipientOnline = recipientMembers.some((member) =>
        isUserOnline(member.user)
      );

      const messageStatus = isAnyRecipientOnline
        ? "delivered"
        : "sent";

      let finalType = type;
      let finalFileUrl = fileUrl;
      let finalFileName = fileName;
      let finalFileSize = fileSize;

      if (attachments.length > 0 && !finalFileUrl) {
        const firstAttach = attachments[0];
        finalFileUrl = firstAttach.fileUrl;
        finalFileName = firstAttach.fileName;
        finalFileSize = firstAttach.fileSize;

        if (!finalType || finalType === "text") {
          finalType = firstAttach.type || "file";
        }
      }

      
      const savedMessage = await Message.create({
        chat: chatId,
        sender: currentUserId,
        content: messageText || finalFileName || "Attachment",
        type: finalType,
        status: messageStatus,
        fileUrl: finalFileUrl,
        fileName: finalFileName,
        fileSize: finalFileSize,
        attachments: attachments,
      });

      chat.lastMessage = savedMessage._id;

      for (let i = 0; i < recipientMembers.length; i++) {
        const member = recipientMembers[i];
        increaseUnreadCount(chat, member.user.toString());
      }

      await chat.save();

      // --- US-13: Invalidate & Refresh Caches on New Message ---
      await cacheService.refreshChatMessages(chatId, async () => {
        const recentMessages = await Message.find({ chat: chatId })
          .populate("sender", "name email avatar")
          .sort({ _id: -1 })
          .limit(51);

        const hasMore = recentMessages.length > 50;
        if (hasMore) {
          recentMessages.pop();
        }
        recentMessages.reverse();

        return {
          messages: recentMessages,
          hasMore,
        };
      });

      chat.members.forEach((member) => {
        const memberId = (member.user?._id || member.user?.id || member.user)?.toString();
        if (memberId) {
          cacheService.invalidateUserConversations(memberId);
        }
      });

      const populatedMessage = await Message.findById(
        savedMessage._id
      ).populate("sender", "name email avatar");

      const messagePayload = {
        message: populatedMessage,
        tempId,
      };

      io.to(`chat:${chatId}`).emit(
        "receive_message",
        messagePayload
      );

      recipientMembers.forEach((member) => {
        io.to(`user:${member.user}`).emit(
          "receive_message",
          messagePayload
        );
      });

      acknowledge?.({
        success: true,
        message: populatedMessage,
        tempId,
      });
    } catch (error) {
      logger.error("Send Message Error:", error);

      acknowledge?.({
        success: false,
        error: error.message,
      });
    }
  });
}

function handleEditMessageSocket(io, socket, currentUserId) {
  socket.on("edit_message", async ({ messageId, content }, acknowledge) => {
    try {
      if (!messageId || !content || !content.trim()) {
        return acknowledge?.({ success: false, error: "Message ID and content are required." });
      }

      const { editMessageService } = await import("../services/message.service.js");
      const updatedMessage = await editMessageService(messageId, currentUserId, content);

      io.to(`chat:${updatedMessage.chat}`).emit("receive_edited_message", updatedMessage);

      acknowledge?.({ success: true, message: updatedMessage });
    } catch (error) {
      logger.error("Edit Message Error:", error);
      acknowledge?.({ success: false, error: error.message || "Failed to edit message" });
    }
  });
}

function handleDeleteMessageSocket(io, socket, currentUserId) {
  socket.on("delete_message", async ({ messageId }, acknowledge) => {
    try {
      if (!messageId) {
        return acknowledge?.({ success: false, error: "Message ID is required." });
      }

      const { deleteMessageService } = await import("../services/message.service.js");
      const result = await deleteMessageService(messageId, currentUserId);

      io.to(`chat:${result.chat}`).emit("receive_deleted_message", result);

      acknowledge?.({ success: true, message: result });
    } catch (error) {
      logger.error("Delete Message Error:", error);
      acknowledge?.({ success: false, error: error.message || "Failed to delete message" });
    }
  });
}

export { handleMarkMessagesRead, handleSendMessage, handleEditMessageSocket, handleDeleteMessageSocket };

