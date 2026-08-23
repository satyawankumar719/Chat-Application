import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const invitationApi = {
  sendInvitation: async (receiverId: string, message: string = "") =>
    apiClient.post(API_CONFIG.ENDPOINTS.INVITATIONS.SEND, { receiverId, message }),

  acceptInvitation: async (id: string) =>
    apiClient.post(API_CONFIG.ENDPOINTS.INVITATIONS.ACCEPT(id)),

  rejectInvitation: async (id: string) =>
    apiClient.post(API_CONFIG.ENDPOINTS.INVITATIONS.REJECT(id)),

  getPendingInvitations: async () =>
    apiClient.get(API_CONFIG.ENDPOINTS.INVITATIONS.PENDING),
};
