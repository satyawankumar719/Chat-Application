import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const messageApi = {
  getUserChats: async () => apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.CHATS),

  getChatMessages: async (chatId, page = 1, limit = 50) =>
    apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.BY_CHAT_ID(chatId, page, limit)),

  markMessagesRead: async (chatId) =>
    apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ, { chatId }),
};
