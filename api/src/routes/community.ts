import express from "express";
import {
  getCommunities,
  getCommunity,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  approveJoinRequest,
  getCommunityPosts,
  createCommunityPost,
  togglePostLike,
  getCommunityStats,
  removeMember,
  promoteToAdmin,
  togglePostPin,
  deletePost,
  togglePostAnnouncement,
} from "@/controllers/communityController";
import {
  authenticateToken as authenticate,
  optionalAuth,
} from "@/middleware/auth";

const router = express.Router();

// Public routes (no authentication required)
router.get("/stats", optionalAuth, getCommunityStats);
router.get("/", optionalAuth, getCommunities);

// Protected routes (authentication required)
router.post("/", authenticate, createCommunity);
router.get("/:id", optionalAuth, getCommunity);
router.post("/:id/join", authenticate, joinCommunity);
router.post("/:id/leave", authenticate, leaveCommunity);
router.post("/:id/approve", authenticate, approveJoinRequest);
router.post("/:id/remove-member", authenticate, removeMember);
router.post("/:id/promote-admin", authenticate, promoteToAdmin);
router.get("/:id/posts", optionalAuth, getCommunityPosts);
router.post("/:id/posts", authenticate, createCommunityPost);
router.post("/posts/:postId/like", authenticate, togglePostLike);
router.post("/posts/:postId/pin", authenticate, togglePostPin);
router.post(
  "/posts/:postId/announcement",
  authenticate,
  togglePostAnnouncement
);
router.delete("/posts/:postId", authenticate, deletePost);

export default router;
