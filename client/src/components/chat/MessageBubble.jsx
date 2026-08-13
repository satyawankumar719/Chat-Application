import { useChatStore } from "@/store/chatStore";
import { useSocketStore } from "@/store/socketStore";
import { Check, CheckCheck, FileText, Image as ImageIcon, X, RotateCw, Loader2, Users } from "lucide-react";

function formatFileSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderAttachmentList(message, connected) {
  let attachments = [];

  if (message.attachments && message.attachments.length > 0) {
    attachments = message.attachments;
  } else if (message.fileUrl) {
    attachments = [
      {
        type: message.type === "image" ? "image" : "file",
        fileUrl: message.fileUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
      },
    ];
  }

  if (attachments.length === 0) {
    return null;
  }

  const isUploading = message.isUploading || message.status === "uploading";
  const progress = message.uploadProgress || 0;

  const handleCancel = (e) => {
    e.preventDefault();
    e.stopPropagation();
    useChatStore.getState().cancelUpload(message._id);
  };

  const attachmentElements = [];

  for (let i = 0; i < attachments.length; i++) {
    const attach = attachments[i];
    const key = `${i}-${attach.fileUrl || attach.fileName}`;

    if (attach.type === "image") {
      attachmentElements.push(
        <div className="relative mb-2 overflow-hidden rounded-xl bg-black/20" key={key}>
          <a
            href={attach.fileUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => isUploading && e.preventDefault()}
          >
            <img
              src={attach.fileUrl}
              alt={attach.fileName || "Shared image"}
              className={`max-h-64 w-full object-cover transition-all duration-300 ${
                isUploading ? "blur-md scale-105 filter brightness-75" : ""
              }`}
            />
          </a>

          {isUploading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-all">
              {!connected ? (
                <div className="flex flex-col items-center gap-1 text-xs text-white font-medium">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Reconnecting...</span>
                </div>
              ) : (
                <>
                  <div className="relative flex items-center justify-center">
                    <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-white/20"
                        strokeWidth="3"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-white transition-all duration-300 ease-out"
                        strokeDasharray={`${progress}, 100`}
                        strokeWidth="3"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>

                    <button
                      type="button"
                      onClick={handleCancel}
                      title="Cancel Upload"
                      className="absolute rounded-full bg-black/60 p-2 text-white transition hover:bg-black/90 hover:scale-110 active:scale-95"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <span className="mt-1.5 text-xs font-semibold text-white tracking-wider">
                    {progress}%
                  </span>
                </>
              )}
            </div>
          )}

          {attach.fileName && !isUploading ? (
            <div className="px-2 py-1 text-[11px] opacity-80 break-all flex items-center gap-1">
              <ImageIcon size={12} className="shrink-0" />
              <span className="truncate">{attach.fileName}</span>
            </div>
          ) : null}
        </div>
      );
    } else {
      attachmentElements.push(
        <div
          key={key}
          className="relative mb-2 block rounded-xl border border-white/10 bg-black/15 p-3 text-sm transition"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <FileText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <a
                  href={attach.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium truncate block hover:underline"
                  onClick={(e) => isUploading && e.preventDefault()}
                >
                  {attach.fileName || "Document"}
                </a>
                <span className="text-[10px] opacity-75">
                  {formatFileSize(attach.fileSize)}
                </span>
              </div>
            </div>

            {isUploading && (
              <button
                type="button"
                onClick={handleCancel}
                title="Cancel Upload"
                className="rounded-full bg-black/40 p-1.5 text-white hover:bg-black/70 shrink-0 transition"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mt-2.5 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/30">
                <div
                  className="h-full bg-white transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-medium opacity-80">
                <span>{connected ? "Uploading..." : "Reconnecting..."}</span>
                <span>{progress}%</span>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return attachmentElements;
}

function MessageBubble({ message, isMine }) {
  if (message.type === "system") {
    return (
      <div className="my-3 flex items-center justify-center px-4 w-full">
        <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-2xs backdrop-blur-xs text-center max-w-[85%] break-words">
          <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span>{message.content}</span>
        </div>
      </div>
    );
  }

  const connected = useSocketStore((state) => state.connected);
  const isReconnecting = message.isReconnecting || !connected;
  const attachmentsBlock = renderAttachmentList(message, connected);
  let showContent = true;

  if (
    (!message.content || message.content === "Attachment") &&
    attachmentsBlock
  ) {
    showContent = false;
  }

  const isFailed =
    message.uploadStatus === "upload_failed" ||
    message.status === "upload_failed" ||
    message.status === "failed";

  const senderName = message.sender?.name;

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-xs transition-all ${
          isMine
            ? isFailed
              ? "bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground rounded-br-xs"
            : "bg-muted rounded-bl-xs"
        }`}
      >
        {!isMine && senderName && (
          <p className="mb-1 text-[11px] font-semibold text-primary">
            {senderName}
          </p>
        )}

        {attachmentsBlock}

        {showContent ? (
          <p className="break-words text-sm leading-relaxed">
            {message.content}
          </p>
        ) : null}

        {isReconnecting && message.isUploading && (
          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-200 font-medium animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Reconnecting...</span>
          </div>
        )}

        {isFailed && (
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/20 pt-1.5 text-xs">
            <span>{message.uploadError || "Upload failed"}</span>
            <button
              type="button"
              onClick={() =>
                useChatStore
                  .getState()
                  .retryUpload(message._id)
              }
              className="flex items-center gap-1 rounded-md bg-black/30 px-2 py-1 text-[11px] font-medium hover:bg-black/50 transition cursor-pointer"
            >
              <RotateCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        )}

        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] opacity-75">
          <span>
            {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {isMine &&
            !isFailed &&
            (message.status === "read" ? (
              <CheckCheck size={14} className="text-sky-400" />
            ) : message.status === "delivered" ? (
              <CheckCheck size={14} />
            ) : (
              <Check size={14} />
            ))}
        </div>
      </div>
    </div>
  );
}


export default MessageBubble;
