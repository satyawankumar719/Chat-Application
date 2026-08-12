import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useInvitationStore } from "@/store/invitationStore";
import { useChatStore } from "@/store/chatStore";
import { useSocketStore } from "@/store/socketStore";
import { useAuthStore } from "@/store/authStore";
import { useGroupStore } from "@/store/groupStore";

function AppLayout() {
  const { user } = useAuthStore();
  const { connectSocket, socket } = useSocketStore();
  const { fetchPendingInvitations, initInvitationListeners } = useInvitationStore();
  const { fetchChats, initSocketListeners } = useChatStore();
  const { initGroupListeners } = useGroupStore();

  useEffect(() => {
    if (user) {
      connectSocket(user.token || null);
      fetchChats();
      fetchPendingInvitations();
    }
  }, [user, connectSocket, fetchChats, fetchPendingInvitations]);

  useEffect(() => {
    if (socket) {
      initSocketListeners();
      initInvitationListeners();
      initGroupListeners();
    }
  }, [socket, initSocketListeners, initInvitationListeners, initGroupListeners]);

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default AppLayout;
