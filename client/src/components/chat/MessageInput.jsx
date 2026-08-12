import React, { useRef, useState } from "react";
import { Send, Paperclip, X, Loader2 } from "lucide-react";
import { messageApi } from "@/api/messageApi";
import { useSocketStore } from "@/store/socketStore";

function MessageInput({
  chat,
  onSendMessage,

}) {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [error, setError] = useState("");

  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { socket } = useSocketStore();


  const handleTyping = () => {
    if (!socket || !chat?._id) return;

    socket.emit("typing", {
      chatId: chat._id,
      typing: true,
    });

    clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("typing", {
        chatId: chat._id,
        typing: false,
      });
    }, 1000);
  };


  const handleInput = (e) => {
    handleTyping();
    setDraft(e.target.value);
  };


  const MAX_FILE_SIZE = 60 * 1024 * 1024; // 50 MB

  const isVideoFile = (file) => {
    return file.type.startsWith("video")
  };

  const isImageFile = (file) => {
    return file.type.startsWith("image")
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      const isVid = isVideoFile(file);
      const isImg = isImageFile(file);
      const isDoc = file.type.startsWith("application/") || file.type.startsWith("text/") || Boolean(file.name.match(/\.(pdf|doc|docx|txt|xls|xlsx|ppt|pptx|zip)$/i));

      if (!isVid && !isImg && !isDoc) {
        errors.push(`${file.name}: File type not supported`);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 50MB`);
        return;
      }

      validFiles.push({
        file,
        preview: URL.createObjectURL(file),
        isVideo: isVid,
        isImage: isImg,
      });
    });

    if (errors.length > 0) {
      setError(errors.join("\n"));
    } else {
      setError("");
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
    }

    e.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSend = async (e) => {
    e.preventDefault();

    if (!chat?._id) return;
    if (!draft.trim() && files.length === 0) return;

    const currentDraft = draft.trim();
    const currentFiles = [...files];

    setDraft("");
    setFiles([]);
    setError("");

    try {
      await onSendMessage(chat._id, currentDraft, currentFiles);
    } catch (error) {
      console.error("Message sending error:", error);
    }
  };

  return (
    <form onSubmit={handleSend} className="border-t p-4">
      {/* Error display */}
      {error && (
        <div className="mb-2 rounded-lg bg-destructive/10 p-2 text-xs text-destructive font-medium whitespace-pre-line">
          {error}
        </div>
      )}

      {/* File Preview */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {files.map((item, index) => {
            const isVid = item.isVideo || isVideoFile(item.file);
            const isImg = item.isImage || isImageFile(item.file);

            return (
              <div
                key={index}
                className="relative h-20 w-20 overflow-hidden rounded-xl border border-border bg-muted/30 shadow-xs"
              >
                {isImg ? (
                  <img
                    src={item.preview}
                    alt="preview"
                    className="h-full w-full object-cover"
                  />
                ) : isVid ? (
                  <div className="relative h-full w-full bg-black">
                    <video
                      src={item.preview}
                      className="h-full w-full object-cover opacity-80"
                      muted
                      onLoadedMetadata={(e) => {
                        e.target.currentTime = 0.1;
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <span className="rounded-full bg-black/60 p-1 text-white">
                        <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                          <polygon points="5,3 19,12 5,21" />
                        </svg>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-2 text-[10px] text-center font-medium break-all text-muted-foreground">
                    {item.file.name}
                  </div>
                )}

                {/* Upload Loader */}
                {uploadingFile && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="animate-spin text-white" size={20} />
                  </div>
                )}

                {/* Remove Button */}
                {!uploadingFile && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-black/90 transition"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.mov,.mkv,.avi"
          onChange={handleFileSelect}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
          title="Attach file or video"
        >
          <Paperclip size={18} />
        </button>

        <input
          value={draft}
          onChange={handleInput}
          placeholder="Type a message"
          className="flex-1 bg-transparent outline-none text-sm"
        />

        <button
          type="submit"
          disabled={!draft.trim() && files.length === 0}
          className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </div>
    </form>







  );
}


export default MessageInput;