import { Router } from "express";
import { handleSearchUsers } from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { validateQuery } from "../middlewares/validation.js";
import { userSearchQuerySchema } from "../validations/user.validation.js";

const router = Router();

router.get("/search", authMiddleware, handleSearchUsers);

export default router;
