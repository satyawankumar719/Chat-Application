import apiClient from "./apiClient";
import { API_CONFIG } from "./apiConfig";

export interface CreateGroupData {
  name: string;
  description?: string;
  members?: string[];
  [key: string]: any;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  avatar?: string;
  [key: string]: any;
}

export const groupApi = {
  createGroup: async (groupData: CreateGroupData) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.BASE, groupData);
    return response.data;
  },

  getUserGroups: async () => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.GROUPS.BASE);
    return response.data;
  },

  getGroupById: async (groupId: string) => {
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId));
    return response.data;
  },

  updateGroup: async (groupId: string, data: UpdateGroupData) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId), data);
    return response.data;
  },

  addMembers: async (groupId: string, memberIds: string[]) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.MEMBERS(groupId), { memberIds });
    return response.data;
  },

  removeMember: async (groupId: string, memberId: string) => {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.GROUPS.MEMBER_BY_ID(groupId, memberId));
    return response.data;
  },

  updateMemberRole: async (groupId: string, memberId: string, role: string) => {
    const response = await apiClient.patch(API_CONFIG.ENDPOINTS.GROUPS.MEMBER_ROLE(groupId, memberId), { role });
    return response.data;
  },

  leaveGroup: async (groupId: string) => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.LEAVE(groupId));
    return response.data;
  },

  deleteGroup: async (groupId: string) => {
    const response = await apiClient.delete(API_CONFIG.ENDPOINTS.GROUPS.BY_ID(groupId));
    return response.data;
  },

  sendGroupInvitation: async (groupId: string, receiverId: string, message: string = "") => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.GROUPS.INVITATION(groupId, receiverId), { message });
    return response.data;
  },
};
