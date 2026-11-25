import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Users, MessageSquarePlus } from "lucide-react";
import ChatList from "@/components/chat/chatListContainer/ChatList";
import ChatContainer from "@/components/chat/ChatContainer";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";

function ChatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileViewChat, setMobileViewChat] = useState(false);
  const { user, checkingAuth } = useAuthStore();

  const { chats, selectedChatId, loadingChats, setSelectedChatId } = useChatStore();

  useEffect(() => {
    if (!checkingAuth && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, checkingAuth, navigate]);

  useEffect(() => {
    const queryChatId = searchParams.get("chatId");
    if (queryChatId) {
      if (selectedChatId !== queryChatId) {
        setSelectedChatId(queryChatId);
      }
      setMobileViewChat(true);
    } else {
      setSelectedChatId(null);
      setMobileViewChat(false);
    }
  }, [searchParams]);

  const selectedChat = chats.find((chat) => chat._id === selectedChatId) || null;

  const handleSelectChat = (chatId: string) => {
    setSelectedChatId(chatId);
    setMobileViewChat(true);
  };

  const handleBack = () => {
    setMobileViewChat(false);
    setSelectedChatId(null);
  };

  if (checkingAuth || !user) {
    return null;
  }

  return (
    <div className="h-full w-full flex overflow-hidden bg-background">
      {/* WhatsApp Left Sidebar: Chats List */}
      <aside
        className={`${
          mobileViewChat ? "hidden" : "flex"
        } md:flex h-full w-full md:w-[380px] lg:w-[420px] flex-col shrink-0 border-r border-border bg-card/30`}
      >
        {/* WhatsApp Sidebar Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3.5">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Chats</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              to="/chats/create"
              title="New Chat"
              className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring"
              aria-label="New chat"
            >
              <MessageSquarePlus aria-hidden="true" className="size-5" />
            </Link>

            <Link
              to="/groups"
              title="Groups"
              className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted text-foreground/80 hover:text-foreground transition-colors cursor-pointer"
            >
              <Users className="size-6 shrink-0" />
            </Link>
          </div>
        </div>

        {/* WhatsApp Chat List with Search & Filter Chips */}
        <div className="flex-1 overflow-hidden">
          <ChatList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={handleSelectChat}
            loading={loadingChats}
          />
        </div>
      </aside>

      {/* WhatsApp Right Chat Conversation / Empty State Area */}
      <section
        className={`${
          mobileViewChat ? "flex" : "hidden"
        } md:flex h-full flex-1 flex-col overflow-hidden bg-background`}
      >
        <ChatContainer chat={selectedChat} onBack={handleBack} />
      </section>
    </div>
  );
}

export default ChatsPage;
