import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  sendProgramChatMessage,
  getProgramChatMessages,
  getProgramChatMembers,
} from "../controllers/programChatController";

const router = express.Router();

// Get all members for a program chat
router.get(
  "/:programId/members",
  authenticateToken,
  getProgramChatMembers
);

// Send a message to program chat
router.post(
  "/:programId/messages",
  authenticateToken,
  sendProgramChatMessage
);

// Get messages for a program chat
router.get(
  "/:programId/messages",
  authenticateToken,
  getProgramChatMessages
);

export default router;

