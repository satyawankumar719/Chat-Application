import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ChatList from "@/components/chat/chatListContainer/ChatList";
import ChatContainer from "@/components/chat/ChatContainer";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useInvitationStore } from "@/store/invitationStore";

function ChatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [mobileViewChat, setMobileViewChat] = useState(false);
  const { user, checkingAuth } = useAuthStore();

  const {
    chats,
    selectedChatId,
    loadingChats,
    setSelectedChatId,
    fetchChats,
  } = useChatStore();

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
    }
  }, [searchParams, selectedChatId, setSelectedChatId]);

  const selectedChat = chats.find((chat) => chat._id === selectedChatId) || null;

  const handleSelectChat = (chatId) => {
    setSelectedChatId(chatId);
    setMobileViewChat(true);
  };

  const handleBack = () => setMobileViewChat(false);

  if (checkingAuth || !user) {
    return null;
  }

  return (
    <div className="h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      <div className="flex h-full w-full">
        <aside
          className={`${mobileViewChat ? "hidden" : "flex"
            } md:flex h-full w-full flex-col md:w-[360px] md:flex-shrink-0 md:border-r md:border-border`}
        >
          <div className="border-b border-border p-4">
            <h2 className="text-lg font-semibold">Chats</h2>
            <p className="text-sm text-muted-foreground">Your contacts</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatList
              chats={chats}
              selectedChatId={selectedChatId}
              onSelectChat={handleSelectChat}
              loading={loadingChats}
            />
          </div>
        </aside>

        <section
          className={`${mobileViewChat ? "flex" : "hidden"
            } md:flex h-full flex-1`}
        >
          <ChatContainer chat={selectedChat} onBack={handleBack} />
        </section>
      </div>
    </div>
  );
}

export default ChatsPage;
