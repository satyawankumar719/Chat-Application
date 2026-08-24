import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const messageApi = {
  getUserChats: async () => apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.CHATS),

  getPresignedUrl: async (data: { fileName: string; fileType: string; folder?: string }) =>
    apiClient.post("/messages/presigned-url", data),

  getChatMessages: async (chatId: string, page: number = 1, limit: number = 50) =>
    apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.BY_CHAT_ID(chatId, page, limit)),

  markMessagesRead: async (chatId: string) =>
    apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ, { chatId }),

  editMessage: async (messageId: string, content: string) =>
    apiClient.patch(API_CONFIG.ENDPOINTS.MESSAGES.EDIT(messageId), { content }),

  deleteMessage: async (messageId: string) =>
    apiClient.delete(API_CONFIG.ENDPOINTS.MESSAGES.DELETE(messageId)),
};
