import { create } from "zustand";
import { invitationApi } from "@/api/invitationApi";
import { useChatStore } from "./chatStore";
import { useSocketStore } from "./socketStore";
import { toast } from "sonner";
import { InvitationState, Invitation } from "@/types";

export const useInvitationStore = create<InvitationState>((set, get) => ({
  pendingInvitations: [],
  loadingInvitations: false,
  actionLoadingId: null,
  invitationMessage: null,

  reset: () => {
    set({
      pendingInvitations: [],
      loadingInvitations: false,
      actionLoadingId: null,
      invitationMessage: null,
    });
  },

  fetchPendingInvitations: async () => {
    set({ loadingInvitations: true, invitationMessage: null });

    try {
      const response = await invitationApi.getPendingInvitations();
      const invitations = response.data?.data || response.data || [];
      set({ pendingInvitations: invitations });
    } catch (err: any) {
      set({
        invitationMessage: err.response?.data?.message || "Unable to load invitations.",
      });
    } finally {
      set({ loadingInvitations: false });
    }
  },

  handleInvitationReceived: (data: { invitation?: Invitation }) => {
    const invitation = data?.invitation;
    if (!invitation) return;

    const senderName = invitation.invitedBy?.name || "someone";
    const isGroup = invitation.type === "group";
    const groupName = invitation.group?.name;
    const desc = isGroup && groupName
      ? `${senderName} invited you to join "${groupName}"`
      : `${senderName} sent you a chat invitation`;

    toast("New Invitation", {
      description: desc,
      action: {
        label: "View",
        onClick: () => {
          if (typeof window !== "undefined") {
            window.location.href = "/invitations";
          }
        },
      },
    });

    set((state) => {
      const alreadyPresent = state.pendingInvitations.some((item) => item._id === invitation._id);

      let newList: Invitation[];
      if (alreadyPresent) {
        newList = state.pendingInvitations.map((item) => {
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
        invitationMessage: "New invitation from " + senderName,
      };
    });
  },

  handleInvitationAccepted: (data: { invitation?: Invitation; chat?: any }) => {
    const invitation = data?.invitation;
    const newChat = data?.chat;

    if (newChat) {
      const responderName = invitation?.receiver?.name || "User";
      toast.success("Invitation Accepted", {
        description: `${responderName} accepted your invitation.`,
        action: {
          label: "Open Chat",
          onClick: () => {
            useChatStore.getState().setSelectedChatId(newChat._id);
            if (typeof window !== "undefined") {
              if (window.location.pathname === "/chats") {
                window.history.pushState({}, "", `/chats?chatId=${newChat._id}`);
                window.dispatchEvent(new Event("popstate"));
              } else {
                window.location.href = `/chats?chatId=${newChat._id}`;
              }
            }
          },
        },
      });
    }

    set((state) => {
      if (newChat) {
        useChatStore.getState().addChat(newChat);
        useSocketStore.getState().joinChat(newChat._id);
      }

      return {
        pendingInvitations: state.pendingInvitations.filter((item) => item._id !== invitation?._id),
        invitationMessage: "Invitation accepted.",
      };
    });
  },

  handleInvitationRejected: (data: { invitation?: Invitation }) => {
    const invitation = data?.invitation;

    set((state) => ({
      pendingInvitations: state.pendingInvitations.filter((item) => item._id !== invitation?._id),
      invitationMessage: "Invitation declined.",
    }));
  },

  acceptInvitation: async (invitationId: string) => {
    set({ actionLoadingId: invitationId });
    try {
      const res = await invitationApi.acceptInvitation(invitationId);
      const resultData = res.data?.data || res.data;
      const newChat = resultData?.chat;

      if (newChat) {
        useChatStore.getState().addChat(newChat);
        useSocketStore.getState().joinChat(newChat._id);
      }

      set((state) => ({
        pendingInvitations: state.pendingInvitations.filter((item) => item._id !== invitationId),
        invitationMessage: res.data?.message || "Invitation accepted.",
      }));
      return res;
    } catch (err: any) {
      const message = err.response?.data?.message || "Unable to accept invitation.";
      set({ invitationMessage: message });
      throw err;
    } finally {
      set({ actionLoadingId: null });
    }
  },

  rejectInvitation: async (invitationId: string) => {
    set({ actionLoadingId: invitationId });
    try {
      const res = await invitationApi.rejectInvitation(invitationId);

      set((state) => ({
        pendingInvitations: state.pendingInvitations.filter((item) => item._id !== invitationId),
        invitationMessage: res.data?.message || "Invitation declined.",
      }));

      return res;
    } catch (err: any) {
      const message = err.response?.data?.message || "Unable to reject invitation.";
      set({ invitationMessage: message });
      throw err;
    } finally {
      set({ actionLoadingId: null });
    }
  },

  initInvitationListeners: () => {
    const socket = useSocketStore.getState().socket;
    if (!socket) return;

    socket.off("invitation_received");
    socket.off("invitation_accepted");
    socket.off("invitation_rejected");

    socket.on("invitation_received", get().handleInvitationReceived);
    socket.on("invitation_accepted", get().handleInvitationAccepted);
    socket.on("invitation_rejected", get().handleInvitationRejected);
  },
}));
