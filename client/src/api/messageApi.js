import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const messageApi = {
  getUserChats: async () => apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.CHATS),

  uploadFile: async (file, onUploadProgress, signal) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.UPLOAD, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
      signal,
    });
  },

  uploadMultipleFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.UPLOAD_MULTIPLE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  initUpload: async (data) => apiClient.post("/messages/upload/init", data),

  uploadChunk: async (formData, onUploadProgress, signal) =>
    apiClient.post("/messages/upload/chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
      signal,
    }),

  getUploadStatus: async (uploadId) => apiClient.get(`/messages/upload/status/${uploadId}`),

  interruptUpload: async (uploadId) => apiClient.post("/messages/upload/interrupt", { uploadId }),

  getChatMessages: async (chatId, page = 1, limit = 50) =>
    apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.BY_CHAT_ID(chatId, page, limit)),

  markMessagesRead: async (chatId) =>
    apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ, { chatId }),
};

