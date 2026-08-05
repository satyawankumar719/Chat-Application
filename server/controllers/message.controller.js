import {
  getUserChatsService,
  getChatMessagesService,
  
} from "../services/message.service.js";

export const handleGetUserChats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const chats = await getUserChatsService(userId);

    return res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};


export const handleGetChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;
    const page = Number.parseInt(req.query.page || "1", 10);
    const limit = Number.parseInt(req.query.limit || "50", 10);

    const result = await getChatMessagesService(chatId, userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.messages,
      hasMore: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
};

