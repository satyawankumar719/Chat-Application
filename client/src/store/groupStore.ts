import { create } from "zustand";
import { groupApi } from "@/api/groupApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";
import { GroupState, Chat, Invitation } from "@/types";

export const useGroupStore = create<GroupState>((set, get) => ({
  loading: false,
  error: null,

  initGroupListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("group_created");
    socket.off("group_updated");
    socket.off("group_removed");

    socket.on("group_created", (data: { group?: Chat; systemMessage?: any }) => {
      const group = data?.group;
      if (!group) return;

      const chatStore = useChatStore.getState();
      chatStore.addChat(group);
      useSocketStore.getState().joinChat(group._id);

      if (data?.systemMessage) {
        chatStore.handleIncomingMessage({ message: data.systemMessage });
      }
    });

    socket.on("group_updated", (data: { group?: Chat; systemMessage?: any }) => {
      const updatedGroup = data?.group;
      if (!updatedGroup) return;

      const chatStore = useChatStore.getState();
      chatStore.addChat(updatedGroup);

      if (data?.systemMessage) {
        chatStore.handleIncomingMessage({ message: data.systemMessage });
      }
    });

    socket.on("group_removed", (data: { groupId?: string }) => {
      const groupId = data?.groupId;
      if (!groupId) return;

      const chatStore = useChatStore.getState();
      useSocketStore.getState().leaveChat(groupId);

      const currentSelected = chatStore.selectedChatId;
      const newChats = chatStore.chats.filter((c) => c._id !== groupId);

      useChatStore.setState({
        chats: newChats,
        selectedChatId: currentSelected === groupId ? null : currentSelected,
      });
    });
  },

  createGroup: async (groupData) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.createGroup(groupData);
      const newGroup = response.data || response;

      const chatStore = useChatStore.getState();
      chatStore.addChat(newGroup);
      chatStore.setSelectedChatId(newGroup._id);

      return { success: true, group: newGroup };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to create group";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  updateGroupInfo: async (groupId, data) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.updateGroup(groupId, data);
      const updatedGroup = response.data || response;

      const chatStore = useChatStore.getState();
      chatStore.addChat(updatedGroup);

      return { success: true, group: updatedGroup };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to update group";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  addMembers: async (groupId, memberIds) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.addMembers(groupId, memberIds);
      const updatedGroup = response.data || response;

      const chatStore = useChatStore.getState();
      chatStore.addChat(updatedGroup);

      return { success: true, group: updatedGroup };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to add members";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  removeMember: async (groupId, memberId) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.removeMember(groupId, memberId);
      const updatedGroup = response.data || response;

      const chatStore = useChatStore.getState();
      chatStore.addChat(updatedGroup);

      return { success: true, group: updatedGroup };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to remove member";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  updateMemberRole: async (groupId, memberId, role) => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.updateMemberRole(groupId, memberId, role);
      const updatedGroup = response.data || response;

      const chatStore = useChatStore.getState();
      chatStore.addChat(updatedGroup);

      return { success: true, group: updatedGroup };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to update role";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  leaveGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      await groupApi.leaveGroup(groupId);

      const chatStore = useChatStore.getState();
      useSocketStore.getState().leaveChat(groupId);

      const currentSelected = chatStore.selectedChatId;
      const newChats = chatStore.chats.filter((c) => c._id !== groupId);

      useChatStore.setState({
        chats: newChats,
        selectedChatId: currentSelected === groupId ? null : currentSelected,
      });

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to leave group";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  deleteGroup: async (groupId) => {
    set({ loading: true, error: null });
    try {
      await groupApi.deleteGroup(groupId);

      const chatStore = useChatStore.getState();
      useSocketStore.getState().leaveChat(groupId);

      const currentSelected = chatStore.selectedChatId;
      const newChats = chatStore.chats.filter((c) => c._id !== groupId);

      useChatStore.setState({
        chats: newChats,
        selectedChatId: currentSelected === groupId ? null : currentSelected,
      });

      return { success: true };
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || "Failed to delete group";
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  sendGroupInvitation: async (groupId, receiverId, message = "") => {
    set({ loading: true, error: null });
    try {
      const response = await groupApi.sendGroupInvitation(groupId, receiverId, message);
      const invitation = response.data || response;

      return { success: true, invitation };
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to send group invitation";
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      set({ loading: false });
    }
  },
}));
