import React, { useState } from "react";
import { Search } from "lucide-react";
import { useChatStore } from "../../../store/chatStore";

function SearchRecentUsers({ setFilteredChats }) {
  const [search, setSearch] = useState("");

  const { chats } = useChatStore();

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);

    if (!value.trim()) {
      setFilteredChats(chats);
      return;
    }

    const filtered = chats.filter((chat) =>
      (chat.name || "")
        .toLowerCase()
        .includes(value.toLowerCase())
    );

    setFilteredChats(filtered);
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <input
        type="text"
        value={search}
        onChange={handleSearch}
        placeholder="Search users..."
        className="h-10 w-full rounded-lg border bg-background pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export default SearchRecentUsers;