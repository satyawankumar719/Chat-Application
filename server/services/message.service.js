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

    return chats.map((chat) => chat.toObject());
  };

  const chats = await cacheService.getOrSet(
    cacheKey,
    fetchChatsFromDb,
    CACHE_TTL.CONVERSATIONS
  );

  // Dynamically overlay live online status
  return chats.map((chatObj) => {
    if (chatObj.members) {
      const updatedMembers = chatObj.members.map((member) => {
        if (member.user && member.user._id) {
          const onlineNow = isUserOnline(member.user._id);
          return {
            ...member,
            user: {
              ...member.user,
              isOnline: onlineNow || Boolean(member.user.isOnline),
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