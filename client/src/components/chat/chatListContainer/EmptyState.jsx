import React from "react";
import { MessageCircleMore } from "lucide-react";

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
      <MessageCircleMore className="h-8 w-8" />

      <span>No chats yet</span>

      <span className="text-xs">
        Search users above to start chatting
      </span>
    </div>
  );
}

export default EmptyState;