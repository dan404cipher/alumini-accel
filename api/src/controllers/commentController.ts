import { Request, Response } from "express";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import { logger } from "@/utils/logger";
import { asyncHandler } from "@/middleware/errorHandler";

// @desc    Get comments for a post
// @route   GET /api/v1/posts/:postId/comments
// @access  Private
export const getPostComments = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const skip = (page - 1) * limit;

    const comments = await Comment.find({
      postId: postId,
      status: "active",
    })
      .populate("authorId", "firstName lastName email profilePicture")
      .populate("parentId")
      .select("-__v")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Comment.countDocuments({
      postId: postId,
      status: "active",
    });

    return res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      },
    });
  }
);

// @desc    Create new comment
// @route   POST /api/v1/posts/:postId/comments
// @access  Private
export const createComment = asyncHandler(
  async (req: Request, res: Response) => {
    const { content, parentId } = req.body;
    const postId = req.params.postId;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if comments are allowed
    if (!post.allowComments) {
      return res.status(400).json({
        success: false,
        message: "Comments are disabled for this post",
      });
    }

    const comment = new Comment({
      content,
      tenantId: req.user?.tenantId,
      postId: postId,
      authorId: req.user?.id,
      parentId: parentId || undefined,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate("authorId", "firstName lastName email profilePicture")
      .populate("parentId")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: populatedComment,
    });
  }
);

// @desc    Update comment
// @route   PUT /api/v1/comments/:id
// @access  Private (comment author or admin)
export const updateComment = asyncHandler(
  async (req: Request, res: Response) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check access
    const isAuthor = comment.authorId.toString() === req.user?.id?.toString();
    const isAdmin = [
      "super_admin",
      "admin",
      "college_admin",
      "hod",
      "staff",
    ].includes(req.user?.role);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { content } = req.body;

    // Update comment manually
    comment.content = content;
    comment.isEdited = true;
    comment.editedAt = new Date();
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate("authorId", "firstName lastName email profilePicture")
      .populate("parentId")
      .select("-__v");

    return res.json({
      success: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  }
);

// @desc    Delete comment
// @route   DELETE /api/v1/comments/:id
// @access  Private (comment author or admin)
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check access
    const isAuthor = comment.authorId.toString() === req.user?.id?.toString();
    const isAdmin = [
      "super_admin",
      "admin",
      "college_admin",
      "hod",
      "staff",
    ].includes(req.user?.role);

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Soft delete comment
    comment.status = "deleted";
    await comment.save();

    return res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  }
);

// @desc    Like comment
// @route   POST /api/v1/comments/:id/like
// @access  Private
export const likeComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: "Comment not found",
    });
  }

  // Increment likes manually
  comment.likes += 1;
  await comment.save();

  return res.json({
    success: true,
    message: "Comment liked successfully",
    data: { likes: comment.likes },
  });
});

// @desc    Hide comment (admin only)
// @route   POST /api/v1/comments/:id/hide
// @access  Private/Admin/HOD/Staff
export const hideComment = asyncHandler(async (req: Request, res: Response) => {
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({
      success: false,
      message: "Comment not found",
    });
  }

  // Check admin access
  const isAdmin = [
    "super_admin",
    "admin",
    "college_admin",
    "hod",
    "staff",
  ].includes(req.user?.role);

  if (!isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Access denied",
    });
  }

  // Hide comment manually
  comment.status = "hidden";
  await comment.save();

  return res.json({
    success: true,
    message: "Comment hidden successfully",
  });
});

export default {
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  likeComment,
  hideComment,
};
