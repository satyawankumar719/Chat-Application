import { logger } from "../logger.js";
import Message from "../models/Message.js";
import {
  findChatForUser,
  setUserUnreadCount,
  increaseUnreadCount,
  notifyMessageSenders,
} from "./socketHelpers.js";
import { isUserOnline } from "./userManager.js";
import { getTokenFromCookie } from "./socketAuth.js";
import { verifyToken } from "../utils/index.js";

function handleMarkMessagesRead(socket, currentUserId) {
  socket.on("mark_messages_read", async ({ chatId }) => {
    try {
      if (!chatId) return;

      const chat = await findChatForUser(chatId, currentUserId);

      if (!chat) return;

      const unreadMessages = await Message.find({
        chat: chatId,
        sender: { $ne: currentUserId },
        status: { $ne: "read" },
      });

      setUserUnreadCount(chat, currentUserId, 0);
      await chat.save();

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
      logger.error("Mark Read Error:", error);
    }
  });
}

function handleSendMessage(io, socket, currentUserId) {
  socket.on("send_message", async (messageData, acknowledge) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const cookieHeader = socket.request?.headers?.cookie || socket.handshake?.headers?.cookie;
        token = getTokenFromCookie(cookieHeader);
      }

      if (!token) {
        socket.disconnect();
        return acknowledge?.({
          success: false,
          error: "Unauthorized access. Token missing.",
        });
      }

      try {
        verifyToken(token);
      } catch (authErr) {
        socket.disconnect();
        return acknowledge?.({
          success: false,
          error: "Unauthorized access. Invalid token.",
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
          error: "Chat not found.",
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

export { handleMarkMessagesRead, handleSendMessage };
