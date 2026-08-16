import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const queryApi = {
  searchUsers: async (q) =>
    apiClient.get(`${API_CONFIG.ENDPOINTS.USERS.SEARCH}?q=${encodeURIComponent(q)}`),
  getProfile: async () =>
    apiClient.get(API_CONFIG.ENDPOINTS.USERS.PROFILE),
  updateProfile: async (formData) =>
    apiClient.put(API_CONFIG.ENDPOINTS.USERS.PROFILE, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
};
