import { Request, Response } from "express";
import mongoose from "mongoose";
import Community from "@/models/Community";
import CommunityPost from "@/models/CommunityPost";
import CommunityComment from "@/models/CommunityComment";
import User from "@/models/User";
import { AuthenticatedRequest } from "@/types";

// Get all communities
export const getCommunities = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    const tenantId = req.tenantId;

    // If no tenantId, return empty communities (for public access)
    if (!tenantId) {
      res.json({
        success: true,
        data: {
          communities: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
          },
        },
      });
      return;
    }

    const query: any = { tenantId, isActive: true };

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const communities = await Community.find(query)
      .populate("owner", "firstName lastName profileImage")
      .populate("admins", "firstName lastName profileImage")
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Community.countDocuments(query);

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch communities",
    });
  }
};

// Get single community
export const getCommunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    })
      .populate("owner", "firstName lastName profileImage email")
      .populate("admins", "firstName lastName profileImage email")
      .populate("members", "firstName lastName profileImage email")
      .populate("pendingRequests", "firstName lastName profileImage email");

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    res.json({
      success: true,
      data: { community },
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch community",
    });
  }
};

// Create community
export const createCommunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      name,
      description,
      category,
      banner,
      logo,
      isPublic = true,
      rules = [],
      tags = [],
    } = req.body;

    const tenantId = req.tenantId;
    const userId = req.userId;

    if (!tenantId || !userId) {
      res.status(400).json({
        success: false,
        message: "Tenant ID and User ID are required",
      });
      return;
    }

    // Check if community name already exists in this tenant
    const existingCommunity = await Community.findOne({
      name,
      tenantId,
      isActive: true,
    });

    if (existingCommunity) {
      res.status(400).json({
        success: false,
        message: "A community with this name already exists",
      });
      return;
    }

    const community = new Community({
      name,
      description,
      category,
      banner,
      logo,
      isPublic,
      owner: userId,
      admins: [userId],
      members: [userId], // Owner is automatically a member
      rules,
      tags,
      tenantId,
    });

    await community.save();

    // Populate the created community
    await community.populate([
      { path: "owner", select: "firstName lastName profileImage" },
      { path: "admins", select: "firstName lastName profileImage" },
      { path: "members", select: "firstName lastName profileImage" },
    ]);

    res.status(201).json({
      success: true,
      data: { community },
      message: "Community created successfully",
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create community",
    });
  }
};

// Join community
export const joinCommunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    // Check if user is already a member
    if ((community as any).isMember(userId)) {
      res.status(400).json({
        success: false,
        message: "You are already a member of this community",
      });
      return;
    }

    if (community.isPublic) {
      // Public community - join directly
      (community as any).addMember(new mongoose.Types.ObjectId(userId));
      await community.save();

      res.json({
        success: true,
        message: "Successfully joined the community",
      });
    } else {
      // Private community - add to pending requests
      const userIdObj = new mongoose.Types.ObjectId(userId);
      if (!community.pendingRequests.includes(userIdObj)) {
        community.pendingRequests.push(userIdObj);
        await community.save();
      }

      res.json({
        success: true,
        message: "Join request sent. Waiting for approval.",
      });
    }
  } catch (error) {
    console.error("Error joining community:", error);
    res.status(500).json({
      success: false,
      message: "Failed to join community",
    });
  }
};

// Leave community
export const leaveCommunity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    // Check if user is the owner
    if (community.owner.equals(userId)) {
      res.status(400).json({
        success: false,
        message: "Community owner cannot leave the community",
      });
      return;
    }

    // Check if user is a member
    if (!(community as any).isMember(userId)) {
      res.status(400).json({
        success: false,
        message: "You are not a member of this community",
      });
      return;
    }

    (community as any).removeMember(new mongoose.Types.ObjectId(userId));
    await community.save();

    res.json({
      success: true,
      message: "Successfully left the community",
    });
  } catch (error) {
    console.error("Error leaving community:", error);
    res.status(500).json({
      success: false,
      message: "Failed to leave community",
    });
  }
};

// Approve join request
export const approveJoinRequest = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const adminUserId = req.userId;
    const tenantId = req.tenantId;

    if (!adminUserId || !tenantId || !targetUserId) {
      res.status(400).json({
        success: false,
        message: "Admin User ID, Tenant ID, and Target User ID are required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    // Check if user is admin or owner
    if (!(community as any).isAdmin(adminUserId)) {
      res.status(403).json({
        success: false,
        message: "Only community admins can approve join requests",
      });
      return;
    }

    // Check if user has a pending request
    if (!community.pendingRequests.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        message: "User does not have a pending join request",
      });
      return;
    }

    (community as any).addMember(targetUserId);
    await community.save();

    res.json({
      success: true,
      message: "Join request approved successfully",
    });
  } catch (error) {
    console.error("Error approving join request:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve join request",
    });
  }
};

// Get community posts
export const getCommunityPosts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, type } = req.query;
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
      return;
    }

    const query: any = { community: id, tenantId, isActive: true };

    if (type && type !== "all") {
      query.type = type;
    }

    const posts = await CommunityPost.find(query)
      .populate("author", "firstName lastName profileImage")
      .populate("likes", "firstName lastName")
      .populate("comments", "content author createdAt")
      .sort({ isPinned: -1, createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await CommunityPost.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch community posts",
    });
  }
};

// Create community post
export const createCommunityPost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      type = "text",
      attachments = [],
      poll,
      event,
      tags = [],
    } = req.body;

    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    // Check if community exists and user is a member
    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    if (!(community as any).isMember(userId)) {
      res.status(403).json({
        success: false,
        message: "Only community members can create posts",
      });
      return;
    }

    const post = new CommunityPost({
      title,
      content,
      type,
      attachments,
      poll,
      event,
      author: userId,
      community: id,
      tags,
      tenantId,
    });

    await post.save();

    // Update community post count
    community.postCount += 1;
    await community.save();

    // Populate the created post
    await post.populate("author", "firstName lastName profileImage");

    res.status(201).json({
      success: true,
      data: { post },
      message: "Post created successfully",
    });
  } catch (error) {
    console.error("Error creating community post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create post",
    });
  }
};

// Like/Unlike post
export const togglePostLike = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const post = await CommunityPost.findOne({
      _id: postId,
      tenantId,
      isActive: true,
    });

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    const isLiked = (post as any).like(userId);
    await post.save();

    res.json({
      success: true,
      data: {
        isLiked,
        likeCount: post.likes.length,
      },
      message: isLiked ? "Post liked" : "Post unliked",
    });
  } catch (error) {
    console.error("Error toggling post like:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle like",
    });
  }
};

// Get community stats
export const getCommunityStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const tenantId = req.tenantId;

    if (!tenantId) {
      res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
      return;
    }

    const totalCommunities = await Community.countDocuments({
      tenantId,
      isActive: true,
    });
    const totalPosts = await CommunityPost.countDocuments({
      tenantId,
      isActive: true,
    });
    const totalComments = await CommunityComment.countDocuments({
      tenantId,
      isActive: true,
    });

    res.json({
      success: true,
      data: {
        totalCommunities,
        totalPosts,
        totalComments,
      },
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch community stats",
    });
  }
};

// Remove member from community
export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const adminUserId = req.userId;
    const tenantId = req.tenantId;

    if (!adminUserId || !tenantId || !targetUserId) {
      res.status(400).json({
        success: false,
        message: "Admin User ID, Tenant ID, and Target User ID are required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    // Check if user is admin or owner
    if (!(community as any).isAdmin(adminUserId)) {
      res.status(403).json({
        success: false,
        message: "Only community admins can remove members",
      });
      return;
    }

    // Check if trying to remove owner
    if (community.owner.equals(targetUserId)) {
      res.status(400).json({
        success: false,
        message: "Cannot remove community owner",
      });
      return;
    }

    (community as any).removeMember(targetUserId);
    await community.save();

    res.json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
};

// Promote member to admin
export const promoteToAdmin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const adminUserId = req.userId;
    const tenantId = req.tenantId;

    if (!adminUserId || !tenantId || !targetUserId) {
      res.status(400).json({
        success: false,
        message: "Admin User ID, Tenant ID, and Target User ID are required",
      });
      return;
    }

    const community = await Community.findOne({
      _id: id,
      tenantId,
      isActive: true,
    });

    if (!community) {
      res.status(404).json({
        success: false,
        message: "Community not found",
      });
      return;
    }

    // Check if user is owner (only owner can promote to admin)
    if (!community.owner.equals(adminUserId)) {
      res.status(403).json({
        success: false,
        message: "Only community owner can promote members to admin",
      });
      return;
    }

    // Check if user is already an admin
    if (community.admins.includes(targetUserId)) {
      res.status(400).json({
        success: false,
        message: "User is already an admin",
      });
      return;
    }

    // Check if user is a member
    if (!(community as any).isMember(targetUserId)) {
      res.status(400).json({
        success: false,
        message: "User is not a member of this community",
      });
      return;
    }

    community.admins.push(targetUserId);
    await community.save();

    res.json({
      success: true,
      message: "Member promoted to admin successfully",
    });
  } catch (error) {
    console.error("Error promoting member:", error);
    res.status(500).json({
      success: false,
      message: "Failed to promote member",
    });
  }
};

// Pin/Unpin post
export const togglePostPin = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const post = await CommunityPost.findOne({
      _id: postId,
      tenantId,
      isActive: true,
    }).populate("community", "owner admins");

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // Check if user is admin or owner of the community
    const community = post.community as any;
    if (!community.isAdmin(userId)) {
      res.status(403).json({
        success: false,
        message: "Only community admins can pin/unpin posts",
      });
      return;
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({
      success: true,
      data: {
        isPinned: post.isPinned,
      },
      message: post.isPinned
        ? "Post pinned successfully"
        : "Post unpinned successfully",
    });
  } catch (error) {
    console.error("Error toggling post pin:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle post pin",
    });
  }
};

// Delete post
export const deletePost = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const post = await CommunityPost.findOne({
      _id: postId,
      tenantId,
      isActive: true,
    }).populate("community", "owner admins");

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // Check if user is the author, admin, or owner of the community
    const community = post.community as any;
    const isAuthor = post.author.equals(userId);
    const isAdmin = community.isAdmin(userId);

    if (!isAuthor && !isAdmin) {
      res.status(403).json({
        success: false,
        message: "Only post authors and community admins can delete posts",
      });
      return;
    }

    post.isActive = false;
    await post.save();

    // Update community post count
    const communityDoc = await Community.findById(post.community._id);
    if (communityDoc) {
      communityDoc.postCount = Math.max(0, communityDoc.postCount - 1);
      await communityDoc.save();
    }

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
    });
  }
};

// Mark post as announcement
export const togglePostAnnouncement = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { postId } = req.params;
    const userId = req.userId;
    const tenantId = req.tenantId;

    if (!userId || !tenantId) {
      res.status(400).json({
        success: false,
        message: "User ID and Tenant ID are required",
      });
      return;
    }

    const post = await CommunityPost.findOne({
      _id: postId,
      tenantId,
      isActive: true,
    }).populate("community", "owner admins");

    if (!post) {
      res.status(404).json({
        success: false,
        message: "Post not found",
      });
      return;
    }

    // Check if user is admin or owner of the community
    const community = post.community as any;
    if (!community.isAdmin(userId)) {
      res.status(403).json({
        success: false,
        message: "Only community admins can mark posts as announcements",
      });
      return;
    }

    post.isAnnouncement = !post.isAnnouncement;
    await post.save();

    res.json({
      success: true,
      data: {
        isAnnouncement: post.isAnnouncement,
      },
      message: post.isAnnouncement
        ? "Post marked as announcement"
        : "Post unmarked as announcement",
    });
  } catch (error) {
    console.error("Error toggling post announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to toggle post announcement",
    });
  }
};
