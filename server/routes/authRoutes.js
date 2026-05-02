import express from "express";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "../controllers/taskflowAuthController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getCurrentUser);
router.post("/logout", authMiddleware, logout);

export default router;
