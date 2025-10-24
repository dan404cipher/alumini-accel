import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import {
  validateCommunityPost,
  validatePollVote,
  validateId,
  validateCommunityId,
} from "../middleware/validation";
import {
  createPost,
  getCommunityPosts,
  getPostById,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  votePoll,
  pinPost,
  unpinPost,
  approvePost,
  rejectPost,
  getTrendingPosts,
  getPopularTags,
} from "../controllers/communityPostController";

const router = express.Router();

// Public routes
router.get("/community/:communityId", validateCommunityId, getCommunityPosts);
router.get(
  "/community/:communityId/trending",
  validateCommunityId,
  getTrendingPosts
);
router.get(
  "/community/:communityId/popular-tags",
  validateCommunityId,
  getPopularTags
);
router.get("/:id", validateId, getPostById);

// Protected routes
router.use(authenticate);

// Post management
router.post(
  "/community/:communityId",
  validateCommunityId,
  validateCommunityPost,
  createPost
);
router.put("/:id", validateId, validateCommunityPost, updatePost);
router.delete("/:id", validateId, deletePost);

// Post interactions
router.post("/:id/like", validateId, likePost);
router.delete("/:id/like", validateId, unlikePost);
router.post("/:id/vote", validateId, validatePollVote, votePoll);

// Moderation actions
router.post("/:id/pin", validateId, pinPost);
router.delete("/:id/pin", validateId, unpinPost);
router.post("/:id/approve", validateId, approvePost);
router.post("/:id/reject", validateId, rejectPost);

export default router;
