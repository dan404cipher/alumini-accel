import express from "express";
import { CommentController } from "../controllers/commentController";
import authMiddleware from "../middleware/auth";
import validationMiddleware from "../middleware/validation";
import { body } from "express-validator";

const router = express.Router();

// Get comments for a post
router.get(
  "/posts/:postId/comments",
  ...validationMiddleware.validatePostId,
  CommentController.getComments
);

// Create a new comment on a post
router.post(
  "/posts/:postId/comments",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validatePostId,
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required")
      .isLength({ max: 1000 })
      .withMessage("Comment content must be less than 1000 characters"),
    body("parentCommentId")
      .optional()
      .isMongoId()
      .withMessage("Invalid parent comment ID"),
  ],
  CommentController.createComment
);

// Update a comment
router.put(
  "/comments/:commentId",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validateCommentId,
  [
    body("content")
      .trim()
      .notEmpty()
      .withMessage("Comment content is required")
      .isLength({ max: 1000 })
      .withMessage("Comment content must be less than 1000 characters"),
  ],
  CommentController.updateComment
);

// Delete a comment
router.delete(
  "/comments/:commentId",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validateCommentId,
  CommentController.deleteComment
);

// Get replies for a comment
router.get(
  "/comments/:commentId/replies",
  ...validationMiddleware.validateCommentId,
  CommentController.getReplies
);

// Toggle like on a comment
router.post(
  "/comments/:commentId/like",
  authMiddleware.authenticateToken,
  ...validationMiddleware.validateCommentId,
  CommentController.toggleCommentLike
);

export default router;
