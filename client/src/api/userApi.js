import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const queryApi = {
  searchUsers: async (q) =>
    apiClient.get(`${API_CONFIG.ENDPOINTS.USERS.SEARCH}?q=${encodeURIComponent(q)}`),
};
