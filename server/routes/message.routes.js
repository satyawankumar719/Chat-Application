import { Router } from "express";
import {
  handleGetUserChats,
  handleGetChatMessages,
  handleUploadFile
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateParams } from "../middlewares/validation.js";
import { chatIdParamSchema } from "../validations/message.validation.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/chats", handleGetUserChats);
router.post("/upload", upload.single("file"), handleUploadFile);
router.get("/:chatId", validateParams(chatIdParamSchema), handleGetChatMessages);

export default router;
