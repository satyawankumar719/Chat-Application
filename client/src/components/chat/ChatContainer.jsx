import React, { useEffect, useRef, useState } from "react";
import { Send, ArrowLeft, Check, CheckCheck, Paperclip } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import { useAuthStore } from "@/store/authStore";
import { useSocketStore } from "@/store/socketStore";
import { Button } from "@/components/ui/button";
import { messageApi } from "@/api/messageApi";

function ChatContainer({ chat, onBack }) {
  const [draft, setDraft] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatId = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [initialScroll, setInitialScroll] = useState(false);

  const { user} = useAuthStore();
  const { socket, connectSocket, markMessagesRead } = useSocketStore();

  const {
    messages,
    loadingMessages,
    sendingMessage,
    fetchMessages,
    sendMessage,
    loadMoreMessages,
    initSocketListeners,

  } = useChatStore();

  useEffect(() => {
    connectSocket(user?.token || null);
  }, [user?.token, connectSocket]);

  useEffect(() => {
    if (socket) initSocketListeners();
  }, [socket, initSocketListeners]);

  useEffect(() => {
    if (!chat?._id) return;

    currentChatId.current = chat._id;
    setInitialScroll(true);


    const load = async () => {
      await fetchMessages(chat._id);

      if (currentChatId.current === chat._id) {
        markMessagesRead(chat._id);
      }
    };

    load();



    return () => {
      currentChatId.current = null;
    };
  }, [chat?._id]);

useEffect(() => {
  if (!messages.length) return;

  if (loadingMoreRef.current) return;

  messagesEndRef.current?.scrollIntoView({
    behavior: initialScroll ? "auto" : "smooth",
  });

  setInitialScroll(false);
}, [messages]);
  if (!chat) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Select a conversation to start chatting
      </div>
    );
  }

  const handleSend = async (e) => {
    e.preventDefault();

    const content = draft.trim();
    if (!content) return;

    await sendMessage(chat._id, content);
    setDraft("");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !chat?._id) return;

    try {
      setUploadingFile(true);
      const response = await messageApi.uploadFile(file);
      const uploadedFile = response.data?.data || response.data;

      if (!uploadedFile?.fileUrl) {
        throw new Error("File upload did not return a valid URL.");
      }

      await sendMessage(chat._id, uploadedFile.fileName || "Attachment", {
        type: uploadedFile.type || "image",
        fileUrl: uploadedFile.fileUrl,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
      });
    } catch (error) {
      console.error("File upload error:", error);
      setDraft("Unable to upload file.");
    } finally {
      setUploadingFile(false);
      event.target.value = "";
    }
  };

  
    const handleScroll = async () => {
  const container = messagesContainerRef.current;

  if (!container || loadingMoreRef.current) return;

  if (container.scrollTop <= 50) {
    loadingMoreRef.current = true;

    const previousHeight = container.scrollHeight;

    await loadMoreMessages(chat._id);

    requestAnimationFrame(() => {
      const newHeight = container.scrollHeight;
      container.scrollTop = newHeight - previousHeight;
      loadingMoreRef.current = false;
    });
  }
};

  const otherMember = chat.members?.find(
    (m) => m.user?._id !== user?._id
  );

  const displayUser = otherMember?.user || chat.members?.[0]?.user;

  return (
    <div className="flex h-full w-full flex-col bg-background">
      <header className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full p-2 hover:bg-muted md:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary">
            {displayUser?.name?.[0]?.toUpperCase() || "U"}
          </div>

          <div>
            <h3 className="font-semibold">
              {displayUser?.name || "Conversation"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {socket?.connected ? "Online" : "Offline"}
            </p>
          </div>
        </div>

      
      </header>

      <main className="flex-1 overflow-y-auto p-4"     ref={messagesContainerRef}
  onScroll={handleScroll}>
        <div className="py-2 text-center text-xs text-muted-foreground">
  Loading older messages...
</div>
        {loadingMessages ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Loading messages...
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => {
              const mine =
                message.sender?._id === user?._id ||
                message.sender?.id === user?.id;

              return (
                <div
                  key={message._id || message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.type === "image" && message.fileUrl ? (
                      <div className="mb-2 overflow-hidden rounded-xl">
                        <img
                          src={message.fileUrl}
                          alt={message.fileName || "Shared image"}
                          className="max-h-64 w-full object-cover"
                        />
                      </div>
                    ) : message.type === "file" && message.fileUrl ? (
                      <a
                        href={message.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mb-2 block rounded-lg border border-white/20 bg-black/10 px-2 py-2 text-sm underline"
                      >
                        {message.fileName || "Download attachment"}
                      </a>
                    ) : null}

                    {message.content && message.content !== "Attachment" ? (
                      <p className="break-words text-sm">
                        {message.content}
                      </p>
                    ) : null}

                    <div className="mt-1 flex justify-end gap-1 text-[11px] opacity-80">
                      <span>
                        {new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      {mine &&
                        (message.status === "read" ? (
                          <CheckCheck size={14} className="text-blue-500" />
                        ) : message.status === "delivered" ? (
                          <CheckCheck size={14} />
                        ) : (
                          <Check size={14} />
                        ))}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      <form onSubmit={handleSend} className="border-t p-4">
        <div className="flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile || sendingMessage}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message"
            className="flex-1 bg-transparent text-sm outline-none"
          />

          <button
            type="submit"
            disabled={sendingMessage || uploadingFile}
            className="rounded-full bg-primary p-2 text-primary-foreground disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default ChatContainer;