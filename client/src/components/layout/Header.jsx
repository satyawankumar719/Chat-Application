import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageCircle, Bell, LogOut, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { toast } from 'sonner';
import { useInvitationStore } from "@/store/invitationStore";
import { useChatStore } from "@/store/chatStore";

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { pendingInvitations } = useInvitationStore();
  const chats = useChatStore((state) => state.chats) || [];

  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const totalUnreadMessages = chats.reduce((total, chat) => {
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

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${isActive
      ? "bg-primary/10 text-primary"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <NavLink to="/chats" className="flex items-center gap-2 font-semibold tracking-tight">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span>ChatApp</span>
        </NavLink>

        <nav className="flex items-center gap-1">
          <NavLink to="/chats" className={navClass}>
            <div className="relative">
              <MessageCircle className="h-4 w-4" />
              {totalUnreadMessages > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Chats</span>
          </NavLink>
          <NavLink to="/groups" className={navClass}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Groups</span>
          </NavLink>
          <NavLink to="/invitations" className={navClass}>
            <div className="relative">
              <Bell className="h-4 w-4" />

              {pendingInvitations?.length > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                  {pendingInvitations.length > 99 ? "99+" : pendingInvitations.length}
                </span>
              )}
            </div>

            <span className="hidden sm:inline">Invitations</span>
          </NavLink>
          <NavLink to="/chats/create" className={navClass}>
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Chat</span>
          </NavLink>

        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-xs font-medium leading-none">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              toast.success("logout successfully")
              navigate("/login", { replace: true });
            }}
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
