import { Router } from "express";
import * as groupController from "../controllers/group.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", groupController.handleCreateGroup);
router.get("/", groupController.handleGetUserGroups);
router.get("/:groupId", groupController.handleGetGroupById);
router.patch("/:groupId", groupController.handleUpdateGroupInfo);
router.post("/:groupId/members", groupController.handleAddMembers);
router.delete("/:groupId/members/:memberId", groupController.handleRemoveMember);
router.patch("/:groupId/members/:memberId/role", groupController.handleChangeMemberRole);
router.post("/:groupId/leave", groupController.handleLeaveGroup);
router.delete("/:groupId", groupController.handleDeleteGroup);

export default router;
