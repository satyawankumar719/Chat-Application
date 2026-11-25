import React, { useEffect, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/lib/theme";
import { notify } from "@/lib/notify";
import { useInvitationStore } from "@/store/invitationStore";
import { useChatStore } from "@/store/chatStore";
import { useSocketStore } from "@/store/socketStore";
import { useGroupStore } from "@/store/groupStore";

export interface AppLayoutContext {
  requestLogout: () => void;
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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

  const requestLogout = () => setShowLogoutDialog(true);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutDialog(false);
      notify.success("Logged out successfully");
      navigate("/login", { replace: true });
    } catch (err: any) {
      notify.error(err, "Failed to log out");
    } finally {
      setIsLoggingOut(false);
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
    `relative flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring ${
      isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
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
            type="button"
            variant="destructive"
            size="icon"
            onClick={requestLogout}
            aria-haspopup="dialog"
            aria-label="Log out"
            className="size-10 rounded-xl border-destructive/25"
            title="Log out"
          >
            <LogOut aria-hidden="true" className="size-[18px]" />
          </Button>
        </div>
      </aside>

      {/* Main Application Area (Edge-to-Edge full height) */}
      <main
        className={`relative flex h-full min-w-0 flex-1 flex-col overflow-hidden ${
          isChatDetailPage ? "" : "pb-[calc(3.75rem+env(safe-area-inset-bottom))] md:pb-0"
        }`}
      >
        <Outlet context={{ requestLogout } satisfies AppLayoutContext} />
      </main>

      {/* Mobile Bottom Navigation Bar (hidden on desktop or when full chat open on mobile) */}
      <nav
        aria-label="Main navigation"
        className={`fixed inset-x-0 bottom-0 z-40 h-[calc(3.75rem+env(safe-area-inset-bottom))] items-center gap-1 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden ${
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

      <AlertDialog.Root
        open={showLogoutDialog}
        onOpenChange={(open) => {
          if (!isLoggingOut) setShowLogoutDialog(open);
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" />
          <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
            <AlertDialog.Popup className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
              <div className="mb-4 grid size-11 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <LogOut aria-hidden="true" className="size-5" />
              </div>
              <AlertDialog.Title className="text-lg font-semibold">Log out?</AlertDialog.Title>
              <AlertDialog.Description className="mt-1 text-sm text-muted-foreground">
                You’ll need to sign in again to access your chats.
              </AlertDialog.Description>
              <div className="mt-5 grid grid-cols-2 gap-2.5 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoggingOut}
                  onClick={() => setShowLogoutDialog(false)}
                  className="min-h-11 rounded-xl px-3"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  className="min-h-11 gap-2 rounded-xl bg-red-700 px-3 text-white hover:bg-red-800 focus-visible:ring-red-500/50"
                >
                  {isLoggingOut ? (
                    <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <LogOut aria-hidden="true" className="size-4" />
                  )}
                  {isLoggingOut ? "Logging out…" : "Log out"}
                </Button>
              </div>
            </AlertDialog.Popup>
          </div>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </div>
  );
}

export default AppLayout;
