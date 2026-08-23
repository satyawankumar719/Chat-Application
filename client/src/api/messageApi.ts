import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";
import type { AxiosProgressEvent } from "axios";

export interface InitUploadData {
  fileName: string;
  fileSize: number;
  fileType: string;
  chatId?: string;
  [key: string]: any;
}

export const messageApi = {
  getUserChats: async () => apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.CHATS),

  uploadFile: async (
    file: File | Blob,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
    signal?: AbortSignal
  ) => {
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

  uploadMultipleFile: async (file: File | Blob) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.UPLOAD_MULTIPLE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  initUpload: async (data: InitUploadData) => apiClient.post("/messages/upload/init", data),

  uploadChunk: async (
    formData: FormData,
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void,
    signal?: AbortSignal
  ) =>
    apiClient.post("/messages/upload/chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
      signal,
    }),

  getUploadStatus: async (uploadId: string) => apiClient.get(`/messages/upload/status/${uploadId}`),

  interruptUpload: async (uploadId: string) => apiClient.post("/messages/upload/interrupt", { uploadId }),

  getChatMessages: async (chatId: string, page: number = 1, limit: number = 50) =>
    apiClient.get(API_CONFIG.ENDPOINTS.MESSAGES.BY_CHAT_ID(chatId, page, limit)),

  markMessagesRead: async (chatId: string) =>
    apiClient.post(API_CONFIG.ENDPOINTS.MESSAGES.MARK_READ, { chatId }),

  editMessage: async (messageId: string, content: string) =>
    apiClient.patch(API_CONFIG.ENDPOINTS.MESSAGES.EDIT(messageId), { content }),

  deleteMessage: async (messageId: string) =>
    apiClient.delete(API_CONFIG.ENDPOINTS.MESSAGES.DELETE(messageId)),
};
