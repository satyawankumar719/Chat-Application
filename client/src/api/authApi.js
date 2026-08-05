
import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const authApi = {
  login: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGIN, data),
  logout: async () => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT),
  me: async () => apiClient.get(API_CONFIG.ENDPOINTS.AUTH.ME),
  sendOtp: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SEND_OTP, data),
  verifyOtp: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.VERIFY_OTP, data),
  signup: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.SIGNUP, data),
  forgotPassword: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.FORGOT_PASSWORD, data),
  resetPassword: async (data) => apiClient.post(API_CONFIG.ENDPOINTS.AUTH.RESET_PASSWORD, data),
};