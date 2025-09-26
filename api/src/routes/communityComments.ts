import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import { validateCommunityComment, validateId } from "../middleware/validation";
import {
  createComment,
  getPostComments,
  getCommentReplies,
  updateComment,
  deleteComment,
  likeComment,
  unlikeComment,
  approveComment,
  rejectComment,
} from "../controllers/communityCommentController";

const router = express.Router();

// Public routes
router.get("/post/:postId", validateId, getPostComments);
router.get("/:commentId/replies", validateId, getCommentReplies);

// Protected routes
router.use(authenticate);

// Comment management
router.post(
  "/post/:postId",
  validateId,
  validateCommunityComment,
  createComment
);
router.put("/:commentId", validateId, validateCommunityComment, updateComment);
router.delete("/:commentId", validateId, deleteComment);

// Comment interactions
router.post("/:commentId/like", validateId, likeComment);
router.delete("/:commentId/like", validateId, unlikeComment);

// Moderation actions
router.post("/:commentId/approve", validateId, approveComment);
router.post("/:commentId/reject", validateId, rejectComment);

export default router;
