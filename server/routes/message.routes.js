import { Router } from "express";
import {
  handleGetUserChats,
  handleGetChatMessages,
  handleUploadFile,
  handleEditMessage,
  handleDeleteMessage,
} from "../controllers/message.controller.js";
import {
  initUpload,
  uploadChunk,
  getUploadStatus,
  interruptUpload,
} from "../controllers/upload.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateParams } from "../middlewares/validation.js";
import { chatIdParamSchema } from "../validations/message.validation.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/chats", handleGetUserChats);
router.post("/upload", upload.single("file"), handleUploadFile);
router.post("/upload/init", initUpload);
router.post("/upload/chunk", upload.single("chunk"), uploadChunk);
router.get("/upload/status/:uploadId", getUploadStatus);
router.post("/upload/interrupt", interruptUpload);

router.patch("/:messageId", handleEditMessage);
router.delete("/:messageId", handleDeleteMessage);

router.get("/:chatId", validateParams(chatIdParamSchema), handleGetChatMessages);

export default router;

