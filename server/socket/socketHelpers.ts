import { logger } from "../logger.js";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getSocketByUserId } from "./userManager.js";

async function findChatForUser(chatId: string, userId: string) {
  if (!chatId || !userId) return null;

  return Chat.findOne({
    _id: chatId,
    "members.user": userId,
  });
}

function setUserUnreadCount(chat: any, userId: string, unreadCount: number): void {
  if (!chat) return;

  if (chat.unreadCount && typeof chat.unreadCount.set === "function") {
    chat.unreadCount.set(userId, unreadCount);
  } else {
    if (!chat.unreadCount) {
      chat.unreadCount = {};
    }

    chat.unreadCount[userId] = unreadCount;
  }
}

function increaseUnreadCount(chat: any, userId: string): number {
  if (!chat) return 0;

  let currentUnreadCount = 0;

  if (chat.unreadCount && typeof chat.unreadCount.get === "function") {
    currentUnreadCount = chat.unreadCount.get(userId) || 0;
  } else {
    currentUnreadCount = chat.unreadCount?.[userId] || 0;
  }

  const updatedUnreadCount = currentUnreadCount + 1;
  setUserUnreadCount(chat, userId, updatedUnreadCount);

  return updatedUnreadCount;
}

function notifyMessageSenders(senderIds: string[], statusPayload: any): void {
  senderIds.forEach((senderId) => {
    const uid = senderId.toString();
    global.io?.to(`user:${uid}`).emit("message_status_update", statusPayload);
  });

  if (statusPayload?.chatId) {
    global.io?.to(`chat:${statusPayload.chatId}`).emit("message_status_update", statusPayload);
  }
}

async function deliverPendingMessages(userId: string): Promise<void> {
  try {
    const userChats = await Chat.find({
      "members.user": userId,
      isActive: true,
    })
      .select("_id")
      .lean();

    if (userChats.length === 0) return;

    const chatIds = userChats.map((chat) => chat._id);

    const pendingMessages = await Message.find({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      status: "sent",
    })
      .select("_id chat sender")
      .lean();

    if (pendingMessages.length === 0) return;

    const pendingMessageIds = pendingMessages.map(
      (message) => message._id
    );

    await Message.updateMany(
      {
        _id: { $in: pendingMessageIds },
      },
      {
        status: "delivered",
      }
    );

    pendingMessages.forEach((message) => {
      const senderSocket = getSocketByUserId(message.sender);

      senderSocket?.emit("message_status_update", {
        messageId: message._id,
        chatId: message.chat,
        status: "delivered",
      });
    });
  } catch (error) {
    logger.error("Pending Message Sync Error:", error);
  }
}

export {
  findChatForUser,
  setUserUnreadCount,
  increaseUnreadCount,
  notifyMessageSenders,
  deliverPendingMessages,
};
