import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../types/express.js";
import {
  getUserChatsService,
  getChatMessagesService,
  editMessageService,
  deleteMessageService,
} from "../services/message.service.js";

export const handleGetUserChats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const chats = await getUserChatsService(userId);

    return res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    next(error);
  }
};

export const handleGetChatMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id || req.user?._id;
    const page = Number.parseInt((req.query.page as string) || "1", 10);
    const limit = Number.parseInt((req.query.limit as string) || "50", 10);
   if(typeof chatId !== "string"){
  return res.status(400).json({
        success: false,
        message: "Invalid  ID",
      });

    
   }
    const result = await getChatMessagesService(chatId, userId, page, limit);

    return res.status(200).json({
      success: true,
      data: result.messages,
      hasMore: result.hasMore,
    });
  } catch (error) {
    next(error);
  }
};

export const handleUploadFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    const subfolder = req.file.subfolder || (
      req.file.mimetype.startsWith("image/")
        ? "images"
        : req.file.mimetype.startsWith("video/")
        ? "videos"
        : "files"
    );

    const fileType = req.file.mimetype.startsWith("image/")
      ? "image"
      : req.file.mimetype.startsWith("video/")
      ? "video"
      : "file";

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${subfolder}/${req.file.filename}`;

    return res.status(200).json({
      success: true,
      data: {
        fileUrl,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        type: fileType,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleEditMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Content cannot be empty.",
      });
    }

    if(typeof messageId !=="string"){
  return res.status(400).json({
        success: false,
        message: "Invalid  messageID",
      });    }
    const updatedMessage = await editMessageService(messageId, userId, content);

    const io = (global as any).io;
    if (io && updatedMessage?.chat) {
      io.to(`chat:${updatedMessage.chat}`).emit("receive_edited_message", updatedMessage);
    }

    return res.status(200).json({
      success: true,
      message: "Message updated successfully.",
      data: updatedMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteMessage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || req.user?._id;
     if(typeof messageId !=="string"){
  return res.status(400).json({
        success: false,
        message: "Invalid  messageID",
      });    }
    const result = await deleteMessageService(messageId, userId);

    const io = (global as any).io;
    if (io && result?.chat) {
      io.to(`chat:${result.chat}`).emit("receive_deleted_message", result);
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
