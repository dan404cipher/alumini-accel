import express from "express";
import { LikeController } from "../controllers/likeController";
import authMiddleware from "../middleware/auth";
import validationMiddleware from "../middleware/validation";

const router = express.Router();

// Toggle like on a post (like/unlike)
router.post(
  "/posts/:postId/like",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validatePostId,
  LikeController.toggleLike
);

// Get like count and user's like status for a post
router.get(
  "/posts/:postId/likes",
  ...validationMiddleware.validatePostId,
  LikeController.getLikeCount
);

// Get users who liked a post (with pagination)
router.get(
  "/posts/:postId/likes/users",
  ...validationMiddleware.validatePostId,
  LikeController.getLikesWithUsers
);

// Get posts liked by current user
router.get(
  "/users/me/liked-posts",
  authMiddleware.authenticateToken,
  LikeController.getUserLikedPosts
);

export default router;
