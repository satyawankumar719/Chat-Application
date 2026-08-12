import { create } from "zustand";
import { invitationApi } from "@/api/invitationApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";

export const useInvitationStore = create(function (set, get) {
  return {
    pendingInvitations: [],
    loadingInvitations: false,
    invitationMessage: null,

    reset: function () {
      set({
        pendingInvitations: [],
        loadingInvitations: false,
        invitationMessage: null,
      });
    },

    fetchPendingInvitations: async function () {
      set({ loadingInvitations: true, invitationMessage: null });

      try {
        const response = await invitationApi.getPendingInvitations();
        const invitations = response.data?.data || response.data || [];
        set({ pendingInvitations: invitations });
      } catch (err) {
        set({
          invitationMessage: err.response?.data?.message || "Unable to load invitations.",
        });
      } finally {
        set({ loadingInvitations: false });
      }
    },

    handleInvitationReceived: function (data) {
      const invitation = data?.invitation;
      if (!invitation) return;

      set(function (state) {
        const alreadyPresent = state.pendingInvitations.some(function (item) {
          return item._id === invitation._id;
        });

        let newList;
        if (alreadyPresent) {
          newList = state.pendingInvitations.map(function (item) {
            if (item._id === invitation._id) {
              return invitation;
            } else {
              return item;
            }
          });
        } else {
          newList = [invitation, ...state.pendingInvitations];
        }

        return {
          pendingInvitations: newList,
          invitationMessage: "New invitation from " + (invitation.invitedBy?.name || "someone"),
        };
      });
    },

    handleInvitationAccepted: function (data) {
      const invitation = data?.invitation;
      const newChat = data?.chat;

      set(function (state) {
        if (newChat) {
          useChatStore.getState().addChat(newChat);
          useSocketStore.getState().joinChat(newChat._id);
        }

        return {
          pendingInvitations: state.pendingInvitations.filter(function (item) {
            return item._id !== invitation?._id;
          }),
          invitationMessage: "Invitation accepted.",
        };
      });
    },

    handleInvitationRejected: function (data) {
      const invitation = data?.invitation;

      set(function (state) {
        return {
          pendingInvitations: state.pendingInvitations.filter(function (item) {
            return item._id !== invitation?._id;
          }),
          invitationMessage: "Invitation declined.",
        };
      });
    },

    acceptInvitation: async function (invitationId) {
      try {
        const res = await invitationApi.acceptInvitation(invitationId);
        const resultData = res.data?.data || res.data;
        const newChat = resultData?.chat;

        if (newChat) {
          useChatStore.getState().addChat(newChat);
          useSocketStore.getState().joinChat(newChat._id);
        }

        set(function (state) {
          return {
            pendingInvitations: state.pendingInvitations.filter(function (item) {
              return item._id !== invitationId;
            }),
            invitationMessage: res.data?.message || "Invitation accepted.",
          };
        });
        return res;
      } catch (err) {
        const message = err.response?.data?.message || "Unable to accept invitation.";
        set({ invitationMessage: message });
        throw err;
      }
    },

    rejectInvitation: async function (invitationId) {
      try {
        const res = await invitationApi.rejectInvitation(invitationId);

        set(function (state) {
          return {
            pendingInvitations: state.pendingInvitations.filter(function (item) {
              return item._id !== invitationId;
            }),
            invitationMessage: res.data?.message || "Invitation declined.",
          };
        });

        return res;
      } catch (err) {
        const message = err.response?.data?.message || "Unable to reject invitation.";
        set({ invitationMessage: message });
        throw err;
      }
    },

    initInvitationListeners: function () {
      const socket = useSocketStore.getState().socket;
      if (!socket) return;

      socket.off("invitation_received");
      socket.off("invitation_accepted");
      socket.off("invitation_rejected");

      socket.on("invitation_received", get().handleInvitationReceived);
      socket.on("invitation_accepted", get().handleInvitationAccepted);
      socket.on("invitation_rejected", get().handleInvitationRejected);
    },
  };
});
