import React, { useState } from "react";
import { useAuthStore } from "@/store/authStore";

import ChatCard from "./ChatCard";
import SearchRecentUsers from "./searchRecentChats";
import EmptyState from "./EmptyState";
import { Chat } from "@/types";

export interface ChatListProps {
  chats?: Chat[];
  selectedChatId?: string | null;
  onSelectChat: (chatId: string) => void;
  loading?: boolean;
}

function ChatList({
  chats = [],
  selectedChatId,
  onSelectChat,
  loading,
}: ChatListProps) {
  const { user } = useAuthStore();

  const currentUserId =
    user?._id?.toString() || user?.id?.toString();

  const [searchResults, setSearchResults] = useState<Chat[]>([]);
  const [searching, setSearching] = useState(false);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chats...
      </div>
    );
  }
  const list = searching ? searchResults : chats;

  return (
    <div className="flex h-full flex-col gap-2 overflow-hidden p-2">
      <SearchRecentUsers
        setSearching={setSearching}
        setSearchResults={setSearchResults}
        chats={chats}
        currentUserId={currentUserId}
      />

      {!list.length ? (
        <EmptyState />
      ) : (
        <div className="flex h-full flex-col gap-2 overflow-y-auto">
          {list.map((chat) => (
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
