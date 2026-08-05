import Chat from "../models/Conversation.js";
import Message from "../models/Message.js";

export const getUserChatsService = async (userId) => {
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

  return chats;
};export const getChatMessagesService = async (chatId, userId, page = 1, limit = 50) => {
  const query = { chat: chatId };
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 50);
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

  return {
    messages,
    hasMore,
  };
};