import { useChatStore } from "@/store/chatStore";
import { Check, CheckCheck, FileImage, Paperclip, X, Loader2 } from "lucide-react";

function renderAttachmentList(message) {
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
        <div className="relative mb-2 overflow-hidden rounded-xl" key={key}>
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
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all">
              <div className="relative flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="h-14 w-14 -rotate-90 transform" viewBox="0 0 36 36">
                  <path
                    className="text-white/30"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-white transition-all duration-300"
                    strokeDasharray={`${progress}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                {/* Centered X Abort Button */}
                <button
                  type="button"
                  onClick={handleCancel}
                  title="Cancel Upload"
                  className="absolute rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 hover:scale-110 active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>

              <span className="mt-1 text-[11px] font-medium text-white shadow-sm">
                {progress}%
              </span>
            </div>
          )}

          {attach.fileName ? (
            <div className="px-1 pb-1 pt-1 text-[11px] opacity-80 break-all">
              <FileImage size={11} className="inline mr-1" />
              {attach.fileName}
            </div>
          ) : null}
        </div>
      );
    } else {
      attachmentElements.push(
        <div
          key={key}
          className="relative mb-2 block rounded-lg border border-white/20 bg-black/10 px-3 py-2 text-sm break-all"
        >
          <div className="flex items-center justify-between gap-2">
            <a
              href={attach.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 underline"
              onClick={(e) => isUploading && e.preventDefault()}
            >
              <Paperclip size={14} className="opacity-80 flex-shrink-0" />
              <span className="truncate">{attach.fileName || "Download attachment"}</span>
            </a>

            {isUploading && (
              <button
                type="button"
                onClick={handleCancel}
                title="Cancel Upload"
                className="rounded-full bg-black/40 p-1 text-white hover:bg-black/70 flex-shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/20">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      );
    }
  }

  return attachmentElements;
}

function MessageBubble({ message, isMine }) {
  const attachmentsBlock = renderAttachmentList(message);

  let showContent = true;

  if (
    (!message.content || message.content === "Attachment") &&
    attachmentsBlock
  ) {
    showContent = false;
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 ${
          isMine
            ? "bg-primary text-primary-foreground"
            : "bg-muted"
        }`}
      >
        {attachmentsBlock}

        {showContent ? (
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

          {isMine &&
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
}

export default MessageBubble;
