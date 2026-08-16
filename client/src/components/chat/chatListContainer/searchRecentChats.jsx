import React, { useState } from "react";
import { Search } from "lucide-react";

function SearchRecentUsers({
  setSearchResults,
  chats = [],
  setSearching,
  currentUserId,
}) {
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

    const currentId = currentUserId?.toString();

    const filtered = chats.filter((chat) => {
      // GROUP CHAT
      if (chat.type === "group") {
        const groupName = (chat.name || "").toLowerCase();

        return groupName.includes(query);
      }

      // ONE-TO-ONE CHAT
      if (chat.type === "direct" || chat.type === "private") {
        const otherMember = chat.members?.find((member) => {
          const user = member.user;

          if (!user) return false;

          const memberId = (
            user._id ||
            user.id ||
            ""
          ).toString();

          return memberId !== currentId;
        });

        const userName = (
          otherMember?.user?.name || ""
        ).toLowerCase();

        return userName.includes(query);
      }

      return false;
    });

    setSearching(true);
    setSearchResults(filtered);
  };

  return (
    <div className="relative w-full">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4
        -translate-y-1/2 text-muted-foreground"
      />

      <input
        type="text"
        value={searchText}
        onChange={handleSearch}
        placeholder="Search chats..."
        className="h-10 w-full rounded-lg border bg-background
        pl-10 pr-4 text-sm outline-none
        focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default SearchRecentUsers;