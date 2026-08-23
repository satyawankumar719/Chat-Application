import { Router } from "express";
import {
  handleSearchUsers,
  handleGetProfile,
  handleUpdateProfile,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = Router();

router.use(authMiddleware);

router.get("/search", handleSearchUsers);
router.get("/profile", handleGetProfile);
router.put("/profile", upload.single("avatar"), handleUpdateProfile);

export default router;
