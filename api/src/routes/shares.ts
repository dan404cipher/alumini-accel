import express from "express";
import { ShareController } from "../controllers/shareController";
import authMiddleware from "../middleware/auth";
import validationMiddleware from "../middleware/validation";
import { body } from "express-validator";

const router = express.Router();

// Track a share
router.post(
  "/posts/:postId/share",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validatePostId,
  [
    body("platform")
      .isIn([
        "internal",
        "facebook",
        "twitter",
        "linkedin",
        "copy_link",
        "whatsapp",
        "telegram",
      ])
      .withMessage("Valid platform is required"),
  ],
  ShareController.trackShare
);

// Get share count for a post
router.get(
  "/posts/:postId/shares",
  ...validationMiddleware.validatePostId,
  ShareController.getShareCount
);

// Get share analytics for a post
router.get(
  "/posts/:postId/shares/analytics",
  ...validationMiddleware.validatePostId,
  ShareController.getShareAnalytics
);

// Get share URLs for different platforms
router.get(
  "/posts/:postId/share-urls",
  ...validationMiddleware.validatePostId,
  ShareController.getShareUrls
);

// Get trending posts by shares
router.get("/shares/trending", ShareController.getTrendingPosts);

// Get posts shared by current user
router.get(
  "/users/me/shared-posts",
  authMiddleware.authenticateToken,
  ShareController.getUserSharedPosts
);

export default router;
