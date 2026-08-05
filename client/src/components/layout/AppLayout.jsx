import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import { useChatStore } from "@/store/chatStore";
import { useEffect } from "react";

function AppLayout() {
  const { fetchChats, fetchPendingInvitations } = useChatStore();

  useEffect(() => {
    fetchChats();
    fetchPendingInvitations();
  }, [fetchChats, fetchPendingInvitations]);

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
