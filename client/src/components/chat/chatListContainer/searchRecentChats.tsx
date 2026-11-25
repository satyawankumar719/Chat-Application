import { Search } from "lucide-react";

interface SearchRecentUsersProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchRecentUsers({ value, onChange }: SearchRecentUsersProps) {
  return (
    <div className="relative w-full">
      <Search
        aria-hidden="true"
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        aria-label="Search chats"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search chats..."
        className="h-11 w-full rounded-xl border border-input bg-background pr-4 pl-10 text-base focus-visible:outline-2 focus-visible:outline-ring md:text-sm"
      />
    </div>
  );
}
