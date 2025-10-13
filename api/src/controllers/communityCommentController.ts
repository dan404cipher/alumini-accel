import { Request, Response } from "express";
import CommunityComment from "../models/CommunityComment";
import CommunityPost from "../models/CommunityPost";
import Community from "../models/Community";
import CommunityMembership from "../models/CommunityMembership";
import { IUser } from "../types";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Create a comment on a post
export const createComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
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

    // Check if user can comment
    const community = await Community.findById(post.communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user is a member
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this community",
      });
    }

    // Check if community allows comments
    if (!community.settings.allowComments) {
      return res.status(403).json({
        success: false,
        message: "Comments are disabled in this community",
      });
    }

    // Check if parent comment exists (for replies)
    if (parentCommentId) {
      const parentComment = await CommunityComment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    const comment = new CommunityComment({
      postId: postId,
      authorId: userId,
      content,
      parentCommentId: parentCommentId || null,
    });

    await comment.save();

    // Add comment to post
    post.comments.push(comment._id as any);
    await post.save();

    // If it's a reply, add to parent comment
    if (parentCommentId) {
      const parentComment = await CommunityComment.findById(parentCommentId);
      if (parentComment) {
        (parentComment as any).addReply(comment._id);
        await parentComment.save();
      }
    }

    // Populate author info
    await comment.populate("authorId", "firstName lastName profilePicture");

    return res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: comment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating comment",
      error: error.message,
    });
  }
};

// Get comments for a post
export const getPostComments = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { postId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?._id;

    // Check if post exists
    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can view comments
    const community = await Community.findById(post.communityId);
    if (community?.type === "hidden" && userId) {
      const membership = await CommunityMembership.findOne({
        communityId: post.communityId,
        userId: userId,
        status: "approved",
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "Access denied to hidden community post",
        });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const comments = await (CommunityComment as any).findByPost(postId, {
      limit: Number(limit),
      skip,
    });

    const total = await CommunityComment.countDocuments({
      postId: postId,
      parentCommentId: null,
      status: "approved",
    });

    return res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: Number(page),
          pages: Math.ceil(total / Number(limit)),
          total,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching comments",
      error: error.message,
    });
  }
};

// Get replies to a comment
export const getCommentReplies = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    // Check if comment exists
    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can view replies
    const post = await CommunityPost.findById(comment.postId);
    if (post) {
      const community = await Community.findById(post.communityId);
      if (community?.type === "hidden" && userId) {
        const membership = await CommunityMembership.findOne({
          communityId: post.communityId,
          userId: userId,
          status: "approved",
        });

        if (!membership) {
          return res.status(403).json({
            success: false,
            message: "Access denied to hidden community post",
          });
        }
      }
    }

    const replies = await (CommunityComment as any).findReplies(commentId);

    return res.json({
      success: true,
      data: replies,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching comment replies",
      error: error.message,
    });
  }
};

// Update comment
export const updateComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can update this comment
    const isAuthor = comment.authorId.toString() === userId.toString();
    const post = await CommunityPost.findById(comment.postId);
    const membership = await CommunityMembership.findOne({
      communityId: post?.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isAuthor && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update this comment",
      });
    }

    // Update comment
    comment.content = content;
    await comment.save();

    return res.json({
      success: true,
      message: "Comment updated successfully",
      data: comment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating comment",
      error: error.message,
    });
  }
};

// Delete comment
export const deleteComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can delete this comment
    const isAuthor = comment.authorId.toString() === userId.toString();
    const post = await CommunityPost.findById(comment.postId);
    const membership = await CommunityMembership.findOne({
      communityId: post?.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isAuthor && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to delete this comment",
      });
    }

    // Soft delete comment
    (comment as any).deleteComment();
    await comment.save();

    // Remove from post comments
    if (post) {
      post.comments = post.comments.filter((id) => id.toString() !== commentId);
      await post.save();
    }

    // Remove from parent comment replies if it's a reply
    if (comment.parentCommentId) {
      const parentComment = await CommunityComment.findById(
        comment.parentCommentId
      );
      if (parentComment) {
        parentComment.replies = parentComment.replies.filter(
          (id) => id.toString() !== commentId
        );
        await parentComment.save();
      }
    }

    return res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting comment",
      error: error.message,
    });
  }
};

// Like comment
export const likeComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can interact with this comment
    const post = await CommunityPost.findById(comment.postId);
    if (post) {
      const community = await Community.findById(post.communityId);
      if (community?.type === "hidden") {
        const membership = await CommunityMembership.findOne({
          communityId: post.communityId,
          userId: userId,
          status: "approved",
        });

        if (!membership) {
          return res.status(403).json({
            success: false,
            message: "Access denied to hidden community post",
          });
        }
      }
    }

    (comment as any).likeComment(userId.toString());
    await comment.save();

    return res.json({
      success: true,
      message: "Comment liked successfully",
      data: { likeCount: (comment as any).likeCount },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error liking comment",
      error: error.message,
    });
  }
};

// Unlike comment
export const unlikeComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    (comment as any).unlikeComment(userId.toString());
    await comment.save();

    return res.json({
      success: true,
      message: "Comment unliked successfully",
      data: { likeCount: (comment as any).likeCount },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error unliking comment",
      error: error.message,
    });
  }
};

// Approve comment (for moderators)
export const approveComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can moderate
    const post = await CommunityPost.findById(comment.postId);
    const membership = await CommunityMembership.findOne({
      communityId: post?.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to approve comments",
      });
    }

    (comment as any).approveComment();
    await comment.save();

    return res.json({
      success: true,
      message: "Comment approved successfully",
      data: comment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error approving comment",
      error: error.message,
    });
  }
};

// Reject comment (for moderators)
export const rejectComment = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { commentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const comment = await CommunityComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can moderate
    const post = await CommunityPost.findById(comment.postId);
    const membership = await CommunityMembership.findOne({
      communityId: post?.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to reject comments",
      });
    }

    (comment as any).rejectComment();
    await comment.save();

    return res.json({
      success: true,
      message: "Comment rejected successfully",
      data: comment,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting comment",
      error: error.message,
    });
  }
};
