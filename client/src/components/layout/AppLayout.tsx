import React, { useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  MessageCircle,
  Users,
  Bell,
  PlusCircle,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/lib/theme";
import { notify } from "@/lib/notify";
import { useInvitationStore } from "@/store/invitationStore";
import { useChatStore } from "@/store/chatStore";
import { useSocketStore } from "@/store/socketStore";
import { useGroupStore } from "@/store/groupStore";

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const { connectSocket, socket } = useSocketStore();
  const { pendingInvitations, fetchPendingInvitations, initInvitationListeners } =
    useInvitationStore();
  const { chats, fetchChats, initSocketListeners } = useChatStore();
  const { initGroupListeners } = useGroupStore();

  useEffect(() => {
    if (user) {
      connectSocket();
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

  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const totalUnreadMessages = (chats || []).reduce((total, chat) => {
    let unread = 0;
    if (chat.unreadCount && currentUserId) {
      if (typeof chat.unreadCount.get === "function") {
        unread = chat.unreadCount.get(currentUserId) || 0;
      } else if (typeof chat.unreadCount === "object") {
        unread = chat.unreadCount[currentUserId] || 0;
      }
    }
    return total + unread;
  }, 0);

  const handleLogout = async () => {
    try {
      await logout();
      notify.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err: any) {
      notify.error(err, "Failed to log out");
    }
  };

  const avatarUrl = typeof user?.avatar === "string" ? user.avatar : user?.avatar?.url;

  const railNavClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 group ${
      isActive
        ? "bg-primary/15 text-primary font-bold shadow-xs"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  const mobileNavClass = ({ isActive }: { isActive: boolean }) =>
    `relative flex flex-col items-center justify-center py-1 px-3 text-xs font-medium transition-colors ${
      isActive ? "text-primary" : "text-muted-foreground"
    }`;

  const isChatDetailPage =
    location.pathname.startsWith("/chats") &&
    Boolean(new URLSearchParams(location.search).get("chatId"));

  return (
    <div className="h-screen h-dvh w-screen overflow-hidden flex bg-background text-foreground transition-colors duration-200">
      {/* WhatsApp Web Left Slim Navigation Rail (Desktop) */}
      <aside className="hidden md:flex w-16 h-full flex-col justify-between items-center py-3.5 border-r border-border bg-card/60 backdrop-blur-md shrink-0 z-30 select-none">
        {/* Top: Branding Logo & Main App Navigation */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Logo Icon */}
          <NavLink
            to="/chats"
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105 mb-1"
            title="ChatApp"
          >
            <MessageCircle className="h-5 w-5" />
          </NavLink>

          {/* Nav Items */}
          <div className="flex flex-col items-center gap-1.5 w-full">
            {/* Chats */}
            <NavLink to="/chats" className={railNavClass} title="Chats">
              <MessageCircle className="size-6" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-pulse">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </NavLink>

            {/* Groups */}
            <NavLink to="/groups" className={railNavClass} title="Groups">
              <Users className="size-6" />
            </NavLink>

            {/* Invitations */}
            <NavLink to="/invitations" className={railNavClass} title="Invitations">
              <Bell className="size-6" />
              {pendingInvitations?.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-xs">
                  {pendingInvitations.length > 99 ? "99+" : pendingInvitations.length}
                </span>
              )}
            </NavLink>

            {/* New Chat */}
            <NavLink to="/chats/create" className={railNavClass} title="New Chat">
              <PlusCircle className="size-6" />
            </NavLink>
          </div>
        </div>

        {/* Bottom: Theme Toggle, User Profile, Logout */}
        <div className="flex flex-col items-center gap-2.5 w-full">
          {/* Theme Switcher */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </Button>

          {/* Profile Avatar */}
          <NavLink
            to="/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-xs text-primary overflow-hidden border border-primary/20 hover:ring-2 hover:ring-primary/40 transition-all"
            title="Profile & Settings"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name} className="h-full w-full object-cover" />
            ) : (
              <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
            )}
          </NavLink>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Application Area (Edge-to-Edge full height) */}
      <main className="flex-1 h-full overflow-hidden flex flex-col relative pb-14 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar (hidden on desktop or when full chat open on mobile) */}
      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 h-14 bg-card/95 backdrop-blur-lg border-t border-border z-40 flex items-center justify-around px-2 ${
          isChatDetailPage ? "hidden" : "flex"
        }`}
      >
        <NavLink to="/chats" className={mobileNavClass}>
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                {totalUnreadMessages}
              </span>
            )}
          </div>
          <span>Chats</span>
        </NavLink>

        <NavLink to="/groups" className={mobileNavClass}>
          <Users className="h-5 w-5" />
          <span>Groups</span>
        </NavLink>

        <NavLink to="/invitations" className={mobileNavClass}>
          <div className="relative">
            <Bell className="h-5 w-5" />
            {pendingInvitations?.length > 0 && (
              <span className="absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                {pendingInvitations.length}
              </span>
            )}
          </div>
          <span>Invites</span>
        </NavLink>

        <NavLink to="/profile" className={mobileNavClass}>
          <UserIcon className="h-5 w-5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default AppLayout;
