import { Request, Response } from "express";
import Share from "../models/Share";
import CommunityPost from "../models/CommunityPost";
import { AuthenticatedRequest } from "../types";

export class ShareController {
  /**
   * Track a share
   * POST /api/v1/posts/:postId/share
   */
  static async trackShare(req: AuthenticatedRequest, res: Response) {
    try {
      const { postId } = req.params;
      const { platform } = req.body;
      const userId = req.user?._id;

      // Validate platform
      const validPlatforms = [
        "internal",
        "facebook",
        "twitter",
        "linkedin",
        "copy_link",
        "whatsapp",
        "telegram",
      ];
      if (!platform || !validPlatforms.includes(platform)) {
        return res.status(400).json({
          success: false,
          message: "Valid platform is required",
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

      // Extract metadata from request
      const metadata = {
        userAgent: req.get("User-Agent"),
        referrer: req.get("Referer"),
        ipAddress: req.ip,
        ...req.body.metadata,
      };

      const result = await Share.trackShare(postId, platform, userId, metadata);

      // Update post share count
      await CommunityPost.findByIdAndUpdate(postId, {
        $set: { shares: result.shareCount },
      });

      return res.json({
        success: true,
        data: {
          shareCount: result.shareCount,
          platform,
        },
      });
    } catch (error) {
      console.error("Error tracking share:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get share count for a post
   * GET /api/v1/posts/:postId/shares
   */
  static async getShareCount(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      const shareCount = await Share.getShareCount(postId);

      return res.json({
        success: true,
        data: {
          shareCount,
        },
      });
    } catch (error) {
      console.error("Error getting share count:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get share analytics for a post
   * GET /api/v1/posts/:postId/shares/analytics
   */
  static async getShareAnalytics(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      // Check if post exists
      const post = await CommunityPost.findById(postId);
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const analytics = await Share.getShareAnalytics(postId);
      const recentShares = await Share.getRecentShares(postId, 5);

      return res.json({
        success: true,
        data: {
          analytics,
          recentShares,
        },
      });
    } catch (error) {
      console.error("Error getting share analytics:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get trending posts by shares
   * GET /api/v1/shares/trending
   */
  static async getTrendingPosts(req: Request, res: Response) {
    try {
      const timeRange = (req.query.timeRange as string) || "week";
      const limit = parseInt(req.query.limit as string) || 10;

      const validTimeRanges = ["day", "week", "month"];
      if (!validTimeRanges.includes(timeRange)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time range. Must be one of: day, week, month",
        });
      }

      if (limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          message: "Invalid limit. Must be between 1 and 50",
        });
      }

      const trendingPosts = await Share.getTrendingByShares(
        timeRange as "day" | "week" | "month",
        limit
      );

      return res.json({
        success: true,
        data: {
          trendingPosts,
          timeRange,
          limit,
        },
      });
    } catch (error) {
      console.error("Error getting trending posts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get posts shared by current user
   * GET /api/v1/users/me/shared-posts
   */
  static async getUserSharedPosts(req: AuthenticatedRequest, res: Response) {
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

      const shares = await Share.find({ userId })
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

      const totalCount = await Share.countDocuments({ userId });

      // Filter out null posts (in case post was deleted)
      const validShares = shares.filter((share) => share.postId);

      return res.json({
        success: true,
        data: {
          sharedPosts: validShares.map((share) => ({
            ...share.postId,
            sharedAt: share.createdAt,
            sharePlatform: share.platform,
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
      console.error("Error getting user shared posts:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  /**
   * Get share URLs for different platforms
   * GET /api/v1/posts/:postId/share-urls
   */
  static async getShareUrls(req: Request, res: Response) {
    try {
      const { postId } = req.params;

      // Check if post exists
      const post = await CommunityPost.findById(postId).populate(
        "authorId",
        "firstName lastName"
      );
      if (!post) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      const baseUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      const postUrl = `${baseUrl}/community/${postId}`;
      const title = encodeURIComponent(post.title || "Check out this post");
      const description = encodeURIComponent(
        post.content?.substring(0, 200) || ""
      );
      const author =
        post.authorId &&
        typeof post.authorId === "object" &&
        "firstName" in post.authorId
          ? `${(post.authorId as any).firstName} ${(post.authorId as any).lastName}`
          : "Alumni";

      const shareUrls = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${title}&url=${encodeURIComponent(postUrl)}`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${postUrl}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${title}`,
        copy_link: postUrl,
      };

      return res.json({
        success: true,
        data: {
          shareUrls,
          postUrl,
          title: post.title,
          description: post.content?.substring(0, 200),
          author,
        },
      });
    } catch (error) {
      console.error("Error getting share URLs:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
}
