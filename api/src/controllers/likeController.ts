import { Request, Response } from "express";
import Like from "../models/Like";
import CommunityPost from "../models/CommunityPost";
import { AuthenticatedRequest } from "../types";

export class LikeController {
  /**
   * Like or unlike a post
   * POST /api/v1/posts/:postId/like
   */
  static async toggleLike(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const userId = req.user?._id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
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

      // Toggle like
      const result = await Like.toggleLike(postId, userId);

      // Update post likes array
      if (result.liked) {
        // Add user to likes array
        await CommunityPost.findByIdAndUpdate(postId, {
          $addToSet: { likes: userId },
        });
      } else {
        // Remove user from likes array
        await CommunityPost.findByIdAndUpdate(postId, {
          $pull: { likes: userId },
        });
      }

      return res.json({
        success: true,
        data: {
          liked: result.liked,
          likeCount: result.likeCount,
        },
      });
    } catch (error) {
      console.error("Error toggling like:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get like count for a post
   * GET /api/v1/posts/:postId/likes
   */
  static async getLikeCount(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      const likeCount = await Like.getLikeCount(postId);
      const hasUserLiked = req.user
        ? await Like.hasUserLiked(postId, req.user._id)
        : false;

      return res.json({
        success: true,
        data: {
          likeCount,
          isLiked: !!hasUserLiked,
        },
      });
    } catch (error) {
      console.error("Error getting like count:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get users who liked a post
   * GET /api/v1/posts/:postId/likes/users
   */
  static async getLikesWithUsers(req: Request, res: Response) {
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

      const skip = (page - 1) * limit;
      const likes = await Like.getLikesWithUsers(postId, limit, skip);
      const totalCount = await Like.getLikeCount(postId);

      return res.json({
        success: true,
        data: {
          likes,
          pagination: {
            current: page,
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            hasNext: skip + limit < totalCount,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error getting likes with users:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get posts liked by current user
   * GET /api/v1/users/me/liked-posts
   */
  static async getUserLikedPosts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?._id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required",
        });
      }

      if (page < 1 || limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: "Invalid pagination parameters",
        });
      }

      const skip = (page - 1) * limit;

      const likes = await Like.find({ userId })
        .populate({
          path: "postId",
          populate: {
            path: "authorId",
            select: "firstName lastName profileImage",
          },
        })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .lean();

      const totalCount = await Like.countDocuments({ userId });

      // Filter out null posts (in case post was deleted)
      const validLikes = likes.filter((like) => like.postId);

      return res.json({
        success: true,
        data: {
          likedPosts: validLikes.map((like) => ({
            ...like.postId,
            likedAt: like.createdAt,
          })),
          pagination: {
            current: page,
            pages: Math.ceil(totalCount / limit),
            total: totalCount,
            hasNext: skip + limit < totalCount,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Error getting user liked posts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
