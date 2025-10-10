import express from "express";
import {
  saveNews,
  unsaveNews,
  getSavedNews,
  checkSavedNews,
} from "../controllers/savedNewsController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Save a news article
router.post("/:newsId/save", authenticateToken, saveNews);

// Unsave a news article
router.delete("/:newsId/save", authenticateToken, unsaveNews);

// Get user's saved news articles
router.get("/saved", authenticateToken, getSavedNews);

// Check if a news article is saved by user
router.get("/:newsId/saved", authenticateToken, checkSavedNews);

export default router;
