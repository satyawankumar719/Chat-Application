import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export const groupApi = {
  createGroup: async (groupData) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.BASE, groupData);
    return response.data;
  },

  getUserGroups: async () => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.GROUPS.BASE);
    return response.data;
  },

  getGroupById: async (groupId) => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId));
    return response.data;
  },

  updateGroup: async (groupId, data) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId), data);
    return response.data;
  },

  addMembers: async (groupId, memberIds) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.MEMBERS(groupId), { memberIds });
    return response.data;
  },

  removeMember: async (groupId, memberId) => {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.GROUPS.MEMBER_BY_ID(groupId, memberId));
    return response.data;
  },

  updateMemberRole: async (groupId, memberId, role) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.GROUPS.MEMBER_ROLE(groupId, memberId), { role });
    return response.data;
  },

  leaveGroup: async (groupId) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.LEAVE(groupId));
    return response.data;
  },

  deleteGroup: async (groupId) => {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId));
    return response.data;
  },
  sendGroupInvitation: async (groupId, receiverId, message = "") => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.INVITATION(groupId, receiverId), { message });
    return response.data;
  },
};
