import express from "express";
import leaderboardController from "../controllers/leaderboardController";
import { authenticateToken } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// Leaderboard routes are accessible to all authenticated users
router.get(
  "/",
  authenticateToken,
  asyncHandler(leaderboardController.getLeaderboard)
);

export default router;

