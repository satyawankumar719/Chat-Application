import mongoose from "mongoose";
import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";
import { isUserOnline } from "../socket/userManager.js";
import cacheService, { CACHE_KEYS, CACHE_TTL } from "./cache.service.js";

export const getUserChatsService = async (userId) => {
  const cacheKey = CACHE_KEYS.USER_CONVERSATIONS(userId);

  const fetchChatsFromDb = async () => {
    const chats = await Chat.find({
      "members.user": userId,
      isActive: true
    })
      .populate("members.user", "name email avatar isOnline lastSeen phoneNumber bio")
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender",
          select: "name avatar"
        }
      })
      .sort({ updatedAt: -1 });

    return chats.map((chat) => {
      const chatObj = chat.toObject({ flattenMaps: true });
      if (chat.unreadCount && typeof chat.unreadCount.get === "function") {
        chatObj.unreadCount = Object.fromEntries(chat.unreadCount);
      }
      return chatObj;
    });
  };

  const chats = await cacheService.getOrSet(
    cacheKey,
    fetchChatsFromDb,
    CACHE_TTL.CONVERSATIONS
  );

  return chats.map((chatObj) => {
    if (chatObj.members) {
      const updatedMembers = chatObj.members.map((member) => {
        if (member.user && member.user._id) {
          const onlineNow = isUserOnline(member.user._id);
          return {
            ...member,
            user: {
              ...member.user,
              isOnline: onlineNow,
            },
          };
        }
        return member;
      });
      return {
        ...chatObj,
        members: updatedMembers,
      };
    }
    return chatObj;
  });
};

export const getChatMessagesService = async (chatId, userId, page = 1, limit = 50) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 50);

  const isRecentMessagesQuery = safePage === 1 && safeLimit === 50;
  const cacheKey = isRecentMessagesQuery ? CACHE_KEYS.CHAT_MESSAGES(chatId) : null;

  if (isRecentMessagesQuery) {
    const cachedData = await cacheService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const chat = await Chat.findOne({ _id: chatId, "members.user": userId, isActive: true });
  if (!chat) {
    throw { status: 403, message: "Forbidden: You are not authorized to view messages in this chat." };
  }

  const query = { chat: chatId };

  if (chat.type === "group") {
    const memberObj = chat.members.find(
      (m) => (m.user?._id || m.user?.id || m.user).toString() === userId.toString()
    );
    if (memberObj && memberObj.joinedAt) {
      query.createdAt = { $gte: memberObj.joinedAt };
    }
  }

  const skip = (safePage - 1) * safeLimit;

  const messages = await Message.find(query)
    .populate("sender", "name email avatar")
    .sort({ _id: -1 })
    .skip(skip)
    .limit(safeLimit + 1);

  const hasMore = messages.length > safeLimit;

  if (hasMore) {
    messages.pop();
  }

  messages.reverse();

  const result = {
    messages,
    hasMore,
  };

  if (isRecentMessagesQuery) {
    await cacheService.set(cacheKey, result, CACHE_TTL.MESSAGES);
  }

  return result;
};

export const editMessageService = async (messageId, userId, newContent) => {
  if (!messageId || typeof messageId !== "string" || !mongoose.Types.ObjectId.isValid(messageId) || messageId.startsWith("temp-")) {
    throw { status: 400, message: "Invalid message ID." };
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw { status: 404, message: "Message not found." };
  }

  if (message.sender.toString() !== userId.toString()) {
    throw { status: 403, message: "Forbidden: You can only edit your own messages." };
  }

  if (message.isDeleted) {
    throw { status: 400, message: "Cannot edit a deleted message." };
  }

  message.content = newContent.trim();
  message.edited = true;
  message.editedAt = new Date();
  await message.save();

  await cacheService.del(CACHE_KEYS.CHAT_MESSAGES(message.chat));

  return Message.findById(message._id).populate("sender", "name email avatar");
};

export const deleteMessageService = async (messageId, userId) => {
  if (!messageId || typeof messageId !== "string" || !mongoose.Types.ObjectId.isValid(messageId) || messageId.startsWith("temp-")) {
    throw { status: 400, message: "Invalid message ID." };
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw { status: 404, message: "Message not found." };
  }

  if (message.sender.toString() !== userId.toString()) {
    throw { status: 403, message: "Forbidden: You can only delete your own messages." };
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  message.content = "This message was deleted";
  await message.save();

  await cacheService.del(CACHE_KEYS.CHAT_MESSAGES(message.chat));

  return {
    _id: message._id,
    chat: message.chat,
    isDeleted: true,
    content: message.content,
  };
};