import { Request, Response } from "express";
import Comment from "../models/Comment";
import CommunityPost from "../models/CommunityPost";
import { AuthenticatedRequest } from "../types";

export class CommentController {
  /**
   * Get comments for a post
   * GET /api/v1/posts/:postId/comments
   */
  static async getComments(req: Request, res: Response) {
    try {
      const { postId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination parameters",
        });
      }

      // Check if post exists
      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const comments = await Comment.getCommentsForPost(postId, page, limit);
      const totalCount = await Comment.getCommentCount(postId);

      return res.json({
        success: true,
        data: {
          comments,
          pagination: {
            current: page,
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            hasNext: (page - 1) * limit + comments.length < totalCount,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error getting comments:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Create a new comment
   * POST /api/v1/posts/:postId/comments
   */
  static async createComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { content, parentCommentId } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment content is too long (max 1000 characters)",
        });
      }

      // Check if post exists
      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // If parentCommentId is provided, validate it
      if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (!parentComment || parentComment.postId.toString() !== postId) {
          return res.status(400).json({
            success: false,
            message: "Invalid parent comment",
          });
        }
      }

      const comment = new Comment({
        postId,
        userId,
        content: content.trim(),
        parentCommentId: parentCommentId || null,
      });

      await comment.save();
      await comment.populate("user", "firstName lastName profilePicture");

      // Update post comments array
      await CommunityPost.findByIdAndUpdate(postId, {
        $addToSet: { comments: comment._id },
      });

      // Get updated comment count
      const commentCount = await Comment.getCommentCount(postId);

      return res.status(201).json({
        success: true,
        data: {
          comment,
          commentCount,
        },
      });
    } catch (error) {
      console.error("Error creating comment:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Update a comment
   * PUT /api/v1/comments/:commentId
   */
  static async updateComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const { content } = req.body;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: "Comment content is required",
        });
      }

      if (content.length > 1000) {
        return res.status(400).json({
          success: false,
          message: "Comment content is too long (max 1000 characters)",
        });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check if user owns the comment
      if (comment.userId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only edit your own comments",
        });
      }

      comment.content = content.trim();
      await comment.save();
      await comment.populate("user", "firstName lastName profilePicture");

      return res.json({
        success: true,
        data: {
          comment,
        },
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Delete a comment
   * DELETE /api/v1/comments/:commentId
   */
  static async deleteComment(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      // Check if user owns the comment or is admin
      const isOwner = comment.userId.toString() === userId.toString();
      const isAdmin =
        req.user?.role === "college_admin" || req.user?.role === "super_admin";

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own comments",
        });
      }

      await comment.softDelete();

      // Update post comment count
      const commentCount = await Comment.getCommentCount(comment.postId);
      await CommunityPost.findByIdAndUpdate(comment.postId, {
        $set: { comments: commentCount },
      });

      return res.json({
        success: true,
        message: "Comment deleted successfully",
        data: {
          commentCount,
        },
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get replies for a comment
   * GET /api/v1/comments/:commentId/replies
   */
  static async getReplies(req: Request, res: Response) {
    try {
      const { commentId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 5;

      if (page < 1 || limit < 1 || limit > 20) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination parameters",
        });
      }

      // Check if parent comment exists
      const parentComment = await Comment.findById(commentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const replies = await Comment.getReplies(commentId, page, limit);
      const totalCount = await Comment.countDocuments({
        parentCommentId: commentId,
        isDeleted: false,
      });

      return res.json({
        success: true,
        data: {
          replies,
          pagination: {
            current: page,
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            hasNext: (page - 1) * limit + replies.length < totalCount,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error getting replies:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Toggle like on a comment
   * POST /api/v1/comments/:commentId/like
   */
  static async toggleCommentLike(req: AuthenticatedRequest, res: Response) {
    try {
      const { commentId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      const comment = await Comment.findById(commentId);
      if (!comment) {
        return res.status(404).json({
          success: false,
          message: "Comment not found",
        });
      }

      const result = await comment.toggleLike(userId);

      return res.json({
        success: true,
        data: {
          liked: result.liked,
          likeCount: result.likeCount,
        },
      });
    } catch (error) {
      console.error("Error toggling comment like:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
