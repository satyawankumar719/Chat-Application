import type { User, Attachment, ChatMessage, RawFileItem } from "@/types";

export interface CreateTempMessageOptions {
  tempId: string;
  chatId: string;
  user: User | null;
  content: string;
  attachment?: Attachment | null;
  attachments?: Attachment[];
  isUploading?: boolean;
  uploadProgress?: number;
  abortController?: AbortController | null;
  uploadStatus?: string;
  rawFileItems?: RawFileItem[];
}

export const createTempMessage = ({
  tempId,
  chatId,
  user,
  content,
  attachment,
  attachments = [],
  isUploading = false,
  uploadProgress = 0,
  abortController = null,
  uploadStatus,
  rawFileItems,
}: CreateTempMessageOptions): ChatMessage => {
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  let finalAttachment = attachment;
  if (!finalAttachment && attachments.length > 0) {
    finalAttachment = attachments[0];
  }

  return {
    _id: tempId,
    tempId,
    chat: chatId,
    content,
    type: finalAttachment?.type || "text",
    fileUrl: finalAttachment?.fileUrl || null,
    fileName: finalAttachment?.fileName || null,
    fileSize: finalAttachment?.fileSize || null,
    attachments,
    isUploading,
    uploadProgress,
    uploadStatus: uploadStatus || (isUploading ? "uploading" : "upload_completed"),
    abortController,
    rawFileItems,
    status: isUploading ? "uploading" : "sending",
    createdAt: new Date().toISOString(),
    sender: {
      _id: currentUserId || "",
      id: currentUserId || "",
      name: user?.name || "You",
      avatar: user?.avatar || "",
      email: user?.email || "",
    },
  };
};
