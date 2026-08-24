import React, { useState } from "react";
import { Search } from "lucide-react";
import { Chat } from "@/types";
import { getOtherUser, getResolvedCurrentUserId } from "@/lib/chatHelpers";

export interface SearchRecentUsersProps {
  setSearchResults: (results: Chat[]) => void;
  chats?: Chat[];
  setSearching: (searching: boolean) => void;
  currentUserId?: string | null;
}

function SearchRecentUsers({
  setSearchResults,
  chats = [],
  setSearching,
  currentUserId: currentUserIdProp,
}: SearchRecentUsersProps) {
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setSearchText(text);

    const query = text.toLowerCase().trim();

    if (query === "") {
      setSearchResults(chats);
      setSearching(false);
      return;
    }

    const currentId = getResolvedCurrentUserId(currentUserIdProp);

    const filtered = chats.filter((chat) => {
      if (chat.type === "group") {
        const groupName = (chat.name || "").toLowerCase();
        return groupName.includes(query);
      }

      if (chat.type === "direct" || chat.type === "private") {
        const otherUser = getOtherUser(chat, currentId);
        const userName = (otherUser?.name || "").toLowerCase();
       

         return userName.includes(query) 
   
      }

      return false;
    });

    setSearching(true);
    setSearchResults(filtered);
  };

  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="text"
        value={searchText}
        onChange={handleSearch}
        placeholder="Search chats..."
        className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default SearchRecentUsers;
