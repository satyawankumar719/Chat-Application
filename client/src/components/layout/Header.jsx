import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { MessageCircle, UserPlus, LogOut, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import {toast} from 'sonner'
function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
      isActive
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
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chats</span>
          </NavLink>
          <NavLink to="/invitations" className={navClass}>
            <UserPlus className="h-4 w-4" />
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
