import { Router } from "express";
import {
  handleGetUserChats,
  handleGetChatMessages
} from "../controllers/message.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateParams, validateBody } from "../middlewares/validation.js";
import { chatIdParamSchema, markReadSchema } from "../validations/message.validation.js";

const router = Router();

router.use(authMiddleware);

router.get("/chats", handleGetUserChats);
router.get("/:chatId", validateParams(chatIdParamSchema), handleGetChatMessages);


export default router;
