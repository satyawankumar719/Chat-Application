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
}) => {
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  let finalAttachment = attachment;
  if (!finalAttachment && attachments.length > 0) {
    finalAttachment = attachments[0];
  }

  return {
    _id: tempId,
    chat: chatId,
    content,
    type: finalAttachment?.type || "text",
    fileUrl: finalAttachment?.fileUrl || null,
    fileName: finalAttachment?.fileName || null,
    fileSize: finalAttachment?.fileSize || null,
    attachments: attachments,
    isUploading: isUploading,
    uploadProgress: uploadProgress,
    abortController: abortController,
    status: isUploading ? "uploading" : "sending",
    createdAt: new Date().toISOString(),
    sender: {
      _id: currentUserId || "",
      id: currentUserId || "",
      name: user?.name || "You",
      avatar: user?.avatar || "",
    },
  };
};
