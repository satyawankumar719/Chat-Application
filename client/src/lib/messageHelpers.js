export const createTempMessage = ({
  tempId,
  chatId,
  user,
  content,
  attachment,
}) => {
  const currentUserId = user?._id?.toString() || user?.id?.toString();

  return {
    _id: tempId,
    chat: chatId,
    content,
    type: attachment?.type || "text",
    fileUrl: attachment?.fileUrl || null,
    fileName: attachment?.fileName || null,
    fileSize: attachment?.fileSize || null,
    status: "sending",
    createdAt: new Date().toISOString(),
    sender: {
      _id: currentUserId || "",
      id: currentUserId || "",
      name: user?.name || "You",
      avatar: user?.avatar || "",
    },
  };
};