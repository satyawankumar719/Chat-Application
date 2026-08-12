import { logger } from "../logger.js";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import { getSocketByUserId } from "./userManager.js";

async function findChatForUser(chatId, userId) {
  if (!chatId || !userId) return null;

  return Chat.findOne({
    _id: chatId,
    "members.user": userId,
  });
}

function setUserUnreadCount(chat, userId, unreadCount) {
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

function increaseUnreadCount(chat, userId) {
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

function notifyMessageSenders(senderIds, statusPayload) {
  senderIds.forEach((senderId) => {
    const senderSocket = getSocketByUserId(senderId);
  
    senderSocket?.emit("message_status_update", statusPayload);
  });
}

async function deliverPendingMessages(userId) {
  try {
    const userChats = await Chat.find({
      "members.user": userId,
      isActive: true,
    }).select("_id");

    if (userChats.length === 0) return;

    const chatIds = userChats.map((chat) => chat._id);

    const pendingMessages = await Message.find({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      status: "sent",
    });

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
