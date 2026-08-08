import React, { useState } from "react";
import { Search } from "lucide-react";

function SearchRecentUsers({ setSearchResults, chats = [], setSearching, currentUserId }) {
  const [searchText, setSearchText] = useState("");

  const handleSearch = (e) => {
    const text = e.target.value;
    setSearchText(text);

    const query = text.toLowerCase().trim();

    if (query === "") {
      setSearchResults(chats);
      setSearching(false);
      return;
    }

    const currentId = currentUserId ? currentUserId.toString() : "";

    const filtered = chats.filter(function (chat) {
      // Check if chat has a group/chat name
      if (chat.name && chat.name.toLowerCase().includes(query)) {
        return true;
      }

      // Check member names
      if (chat.members && Array.isArray(chat.members)) {
        for (let i = 0; i < chat.members.length; i++) {
          const member = chat.members[i];
          const user = member.user;

          if (user) {
            const memberId = (user._id || user.id || "").toString();

            // Skip checking myself
            if (memberId !== currentId) {
              const name = (user.name || "").toLowerCase();
              const email = (user.email || "").toLowerCase();

              if (name.includes(query) || email.includes(query)) {
                return true;
              }
            }
          }
        }
      }

      return false;
    });

    setSearching(true);
    setSearchResults(filtered);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <input
        type="text"
        value={searchText}
        onChange={handleSearch}
        placeholder="Search users..."
        className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default SearchRecentUsers;
