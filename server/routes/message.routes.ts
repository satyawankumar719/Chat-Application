import { Router } from "express";
import {
  handleGetUserChats,
  handleGetChatMessages,
  handleEditMessage,
  handleDeleteMessage,
} from "../controllers/message.controller.js";
import { getPresignedUrl } from "../controllers/upload.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateParams } from "../middlewares/validation.js";
import { chatIdParamSchema } from "../validations/message.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/chats", handleGetUserChats);
router.post("/upload/presigned-url", getPresignedUrl);
router.post("/presigned-url", getPresignedUrl);

router.patch("/:messageId", handleEditMessage);
router.delete("/:messageId", handleDeleteMessage);

router.get("/:chatId", validateParams(chatIdParamSchema), handleGetChatMessages);

export default router;
