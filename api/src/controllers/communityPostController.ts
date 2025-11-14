import { Request, Response } from "express";
import CommunityPost from "../models/CommunityPost";
import Community from "../models/Community";
import CommunityMembership from "../models/CommunityMembership";
import CommunityComment from "../models/CommunityComment";
import { IUser } from "../types";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Create a new post in community
export const createPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { communityId } = req.params;
    const {
      title,
      content,
      type,
      mediaUrls,
      pollOptions,
      pollEndDate,
      tags,
      isAnnouncement,
      priority,
      category,
    } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user is a member
    const membership = await CommunityMembership.findOne({
      communityId: communityId,
      userId: userId,
      status: "approved",
    });

    if (!membership) {
      return res.status(403).json({
        success: false,
        message: "Not a member of this community",
      });
    }

    // Check if user can post
    if (!(community as any).canPost(userId.toString())) {
      return res.status(403).json({
        success: false,
        message: "Not allowed to post in this community",
      });
    }

    // Determine post status based on community settings
    let status = "approved";
    if (
      community.settings.requirePostApproval &&
      !(membership as any).canModerate()
    ) {
      status = "pending";
    }

    const post = new CommunityPost({
      communityId: communityId,
      authorId: userId,
      title,
      content,
      type: type || "text",
      mediaUrls: mediaUrls || [],
      pollOptions: pollOptions || [],
      pollEndDate: pollEndDate || null,
      tags: tags || [],
      isAnnouncement: isAnnouncement || false,
      priority: priority || "medium",
      category: category || null,
      status,
    });

    await post.save();

    // Update community post count
    community.postCount += 1;
    await community.save();

    // Populate author info
    await post.populate("authorId", "firstName lastName profilePicture");

    return res.status(201).json({
      success: true,
      message:
        status === "pending"
          ? "Post submitted for approval"
          : "Post created successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating post",
      error: error.message,
    });
  }
};

// Get all posts in a community
export const getCommunityPosts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const {
      page = 1,
      limit = 20,
      type,
      authorId,
      status = "approved",
      category,
    } = req.query;
    const userId = req.user?._id;

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user can view posts
    if (
      (community.type === "hidden" || community.type === "closed") &&
      userId
    ) {
      const membership = await CommunityMembership.findOne({
        communityId: communityId,
        userId: userId,
        status: "approved",
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: `Access denied to ${community.type} community posts. You must be a member to view this content.`,
        });
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await (CommunityPost as any).findByCommunity(communityId, {
      type,
      authorId,
      status,
      category,
      limit: Number(limit),
      skip,
    });

    const total = await CommunityPost.countDocuments({
      communityId: communityId,
      status,
      ...(type && { type }),
      ...(authorId && { authorId }),
      ...(category && { category }),
    });

    return res.json({
      success: true,
      data: {
        posts,
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
      message: "Error fetching community posts",
      error: error.message,
    });
  }
};

// Get post by ID
export const getPostById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const post = await CommunityPost.findById(id)
      .populate("authorId", "firstName lastName profilePicture email")
      .populate("likes", "firstName lastName profilePicture")
      .populate("communityId", "name type settings");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can view this post
    const community = post.communityId as any;
    if (community.type === "hidden" && userId) {
      const membership = await CommunityMembership.findOne({
        communityId: community._id,
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

    // Increment view count
    post.viewCount += 1;
    await post.save();

    // Get comments
    const comments = await (CommunityComment as any).findByPost(id, {
      limit: 50,
    });

    return res.json({
      success: true,
      data: {
        post,
        comments,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching post",
      error: error.message,
    });
  }
};

// Update post
export const updatePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;
    const updates = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can update this post
    const isAuthor = post.authorId.toString() === userId.toString();
    const community = await Community.findById(post.communityId);
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isAuthor && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update this post",
      });
    }

    // Update post
    Object.keys(updates).forEach((key) => {
      if (
        key in post &&
        key !== "_id" &&
        key !== "authorId" &&
        key !== "communityId"
      ) {
        (post as any)[key] = updates[key];
      }
    });

    await post.save();

    return res.json({
      success: true,
      message: "Post updated successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating post",
      error: error.message,
    });
  }
};

// Delete post
export const deletePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can delete this post
    const isAuthor = post.authorId.toString() === userId.toString();
    const community = await Community.findById(post.communityId);
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isAuthor && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to delete this post",
      });
    }

    // Soft delete
    post.status = "deleted";
    await post.save();

    // Update community post count
    if (community) {
      community.postCount = Math.max(0, community.postCount - 1);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting post",
      error: error.message,
    });
  }
};

// Like post
export const likePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can interact with this post
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

    (post as any).likePost(userId.toString());
    await post.save();

    return res.json({
      success: true,
      message: "Post liked successfully",
      data: { likeCount: (post as any).likeCount },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error liking post",
      error: error.message,
    });
  }
};

// Unlike post
export const unlikePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    (post as any).unlikePost(userId.toString());
    await post.save();

    return res.json({
      success: true,
      message: "Post unliked successfully",
      data: { likeCount: (post as any).likeCount },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error unliking post",
      error: error.message,
    });
  }
};

// Vote on poll
export const votePoll = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { optionIndex } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.type !== "poll") {
      return res.status(400).json({
        success: false,
        message: "This post is not a poll",
      });
    }

    (post as any).votePoll(userId.toString(), optionIndex);
    await post.save();

    return res.json({
      success: true,
      message: "Vote recorded successfully",
      data: {
        pollOptions: post.pollOptions,
        totalVotes: (post as any).pollTotalVotes,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error voting on poll",
      error: error.message,
    });
  }
};

// Pin post
export const pinPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can pin posts
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to pin posts",
      });
    }

    (post as any).pinPost();
    await post.save();

    return res.json({
      success: true,
      message: "Post pinned successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error pinning post",
      error: error.message,
    });
  }
};

// Unpin post
export const unpinPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can unpin posts
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to unpin posts",
      });
    }

    (post as any).unpinPost();
    await post.save();

    return res.json({
      success: true,
      message: "Post unpinned successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error unpinning post",
      error: error.message,
    });
  }
};

// Approve post (for moderators)
export const approvePost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can moderate
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to approve posts",
      });
    }

    (post as any).approvePost();
    await post.save();

    return res.json({
      success: true,
      message: "Post approved successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error approving post",
      error: error.message,
    });
  }
};

// Reject post (for moderators)
export const rejectPost = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const post = await CommunityPost.findById(id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Check if user can moderate
    const membership = await CommunityMembership.findOne({
      communityId: post.communityId,
      userId: userId,
      status: "approved",
    });

    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to reject posts",
      });
    }

    (post as any).rejectPost();
    await post.save();

    return res.json({
      success: true,
      message: "Post rejected successfully",
      data: post,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting post",
      error: error.message,
    });
  }
};

// Get trending posts for a community
export const getTrendingPosts = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const { limit = 5 } = req.query;

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Get trending posts based on engagement (likes + comments + views)
    const trendingPosts = await CommunityPost.find({ communityId })
      .populate("authorId", "firstName lastName profilePicture")
      .sort({
        // Sort by engagement score: likes + comments + views
        likeCount: -1,
        commentCount: -1,
        viewCount: -1,
        createdAt: -1,
      })
      .limit(parseInt(limit as string))
      .select("title likeCount commentCount viewCount authorId createdAt");

    return res.json({
      success: true,
      data: trendingPosts,
    });
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch trending posts",
    });
  }
};

// Get popular tags for a community
export const getPopularTags = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const { limit = 8 } = req.query;

    // Check if community exists
    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Aggregate tags from posts in this community
    const tagStats = await CommunityPost.aggregate([
      { $match: { communityId: community._id } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit as string) },
      { $project: { name: "$_id", count: 1, _id: 0 } },
    ]);

    return res.json({
      success: true,
      data: tagStats,
    });
  } catch (error) {
    console.error("Error fetching popular tags:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch popular tags",
    });
  }
};
