import { Router } from "express";
import {
  handleSendInvitation,
  handleAcceptInvitation,
  handleRejectInvitation,
  handleGetPendingInvitations
} from "../controllers/invitation.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateBody, validateParams } from "../middlewares/validation.js";
import { sendInvitationSchema, invitationIdParamSchema } from "../validations/invitation.validation.js";

const router = Router();

router.use(authMiddleware);

router.post("/send", validateBody(sendInvitationSchema), handleSendInvitation);
router.post("/:id/accept", validateParams(invitationIdParamSchema), handleAcceptInvitation);
router.post("/:id/reject", validateParams(invitationIdParamSchema), handleRejectInvitation);
router.get("/pending", handleGetPendingInvitations);

export default router;