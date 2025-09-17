import express from "express";
import {
  getAllPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  sharePost,
} from "@/controllers/postController";
import {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  hideComment,
} from "@/controllers/commentController";
import { authenticateToken, requireAdmin } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/posts
// @desc    Get all posts (feed)
// @access  Private
router.get("/", authenticateToken, asyncHandler(getAllPosts));

// @route   GET /api/v1/posts/:id
// @desc    Get post by ID
// @access  Private
router.get("/:id", authenticateToken, asyncHandler(getPostById));

// @route   POST /api/v1/posts
// @desc    Create new post
// @access  Private/Admin/HOD/Staff/Alumni
router.post("/", authenticateToken, asyncHandler(createPost));

// @route   PUT /api/v1/posts/:id
// @desc    Update post
// @access  Private/Admin/HOD/Staff (or post author)
router.put("/:id", authenticateToken, asyncHandler(updatePost));

// @route   DELETE /api/v1/posts/:id
// @desc    Delete post
// @access  Private/Admin/HOD/Staff (or post author)
router.delete("/:id", authenticateToken, asyncHandler(deletePost));

// @route   POST /api/v1/posts/:id/like
// @desc    Like post
// @access  Private
router.post("/:id/like", authenticateToken, asyncHandler(likePost));

// @route   POST /api/v1/posts/:id/share
// @desc    Share post
// @access  Private
router.post("/:id/share", authenticateToken, asyncHandler(sharePost));

// Comment routes
// @route   GET /api/v1/posts/:postId/comments
// @desc    Get comments for a post
// @access  Private
router.get(
  "/:postId/comments",
  authenticateToken,
  asyncHandler(getPostComments)
);

// @route   POST /api/v1/posts/:postId/comments
// @desc    Create new comment
// @access  Private
router.post(
  "/:postId/comments",
  authenticateToken,
  asyncHandler(createComment)
);

// @route   PUT /api/v1/comments/:id
// @desc    Update comment
// @access  Private (comment author or admin)
router.put("/comments/:id", authenticateToken, asyncHandler(updateComment));

// @route   DELETE /api/v1/comments/:id
// @desc    Delete comment
// @access  Private (comment author or admin)
router.delete("/comments/:id", authenticateToken, asyncHandler(deleteComment));

// @route   POST /api/v1/comments/:id/like
// @desc    Like comment
// @access  Private
router.post("/comments/:id/like", authenticateToken, asyncHandler(likeComment));

// @route   POST /api/v1/comments/:id/hide
// @desc    Hide comment (admin only)
// @access  Private/Admin/HOD/Staff
router.post(
  "/comments/:id/hide",
  authenticateToken,
  requireAdmin,
  asyncHandler(hideComment)
);

export default router;
