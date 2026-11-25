import React, { useState, useMemo } from "react";
import { useAuthStore } from "@/store/authStore";
import ChatCard from "./ChatCard";
import SearchRecentUsers from "./searchRecentChats";
import EmptyState from "./EmptyState";
import { Chat } from "@/types";
import { ChatListSkeleton } from "@/components/ui/skeleton";
import { SearchLoader } from "@/components/ui/search-loader";
import { getOtherUser } from "@/lib/chatHelpers";
import { useDebouncedSearchQuery } from "@/lib/searchDebounce";

export interface ChatListProps {
  chats?: Chat[];
  selectedChatId?: string | null;
  onSelectChat: (chatId: string) => void;
  loading?: boolean;
}

function ChatList({ chats = [], selectedChatId, onSelectChat, loading }: ChatListProps) {
  const { user } = useAuthStore();
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const [searchText, setSearchText] = useState("");
  const [searchQuery, searching] = useDebouncedSearchQuery(searchText);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "groups">("all");

  // Apply WhatsApp filter pills with memoization to prevent unnecessary recalculations
  // NOTE: Must run before any early return to adhere to React Rules of Hooks
  const filteredList = useMemo(() => {
    return chats.filter((chat) => {
      if (searchQuery) {
        let name = "";
        if (chat.type === "group") {
          name = chat.name || "";
        } else if (chat.type === "direct" || chat.type === "private") {
          name = getOtherUser(chat, currentUserId)?.name || "";
        }
        if (!name.toLowerCase().includes(searchQuery)) return false;
      }
      if (activeFilter === "groups") {
        return chat.type === "group";
      }
      if (activeFilter === "unread") {
        let unread = 0;
        if (chat.unreadCount && currentUserId) {
          if (typeof chat.unreadCount.get === "function") {
            unread = chat.unreadCount.get(currentUserId) || 0;
          } else if (typeof chat.unreadCount === "object") {
            unread = chat.unreadCount[currentUserId] || 0;
          }
        }
        return unread > 0;
      }
      return true;
    });
  }, [chats, activeFilter, currentUserId, searchQuery]);

  if (loading && (!chats || chats.length === 0)) {
    return (
      <div className="flex h-full flex-col overflow-hidden p-2">
        <ChatListSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card/20">
      {/* WhatsApp Search Bar & Filter Chips Header */}
      <div className="p-2.5 pb-2 space-y-2 border-b border-border/60 bg-card/40">
        <SearchRecentUsers value={searchText} onChange={setSearchText} />

        {/* WhatsApp Signature Filter Chips */}
        <div className="flex items-center gap-1.5 px-0.5">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === "all"
                ? "bg-primary/15 text-primary font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unread")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === "unread"
                ? "bg-primary/15 text-primary font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Unread
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("groups")}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              activeFilter === "groups"
                ? "bg-primary/15 text-primary font-semibold"
                : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            Groups
          </button>
        </div>
      </div>

      {/* WhatsApp Chat Rows List */}
      {searching ? (
        <SearchLoader />
      ) : !filteredList.length ? (
        <EmptyState />
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {filteredList.map((chat) => (
            <ChatCard
              key={chat._id}
              chat={chat}
              currentUserId={currentUserId}
              selectedChatId={selectedChatId}
              onSelectChat={onSelectChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ChatList;
