import { Request, Response } from "express";
import Community from "../models/Community";
import CommunityMembership from "../models/CommunityMembership";
import CommunityPost from "../models/CommunityPost";
import { IUser } from "@/types";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Create a new community
export const createCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      name,
      description,
      type,
      coverImage,
      logo,
      tags,
      rules,
      externalLinks,
      invitedUsers,
      settings,
    } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user has permission to create communities
    const userRole = req.user?.role;
    if (
      !["super_admin", "college_admin", "hod", "staff"].includes(userRole || "")
    ) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to create communities",
      });
    }

    // Check if community name already exists
    const existingCommunity = await Community.findOne({ name });
    if (existingCommunity) {
      return res.status(400).json({
        success: false,
        message: "Community name already exists",
      });
    }

    const community = new Community({
      name,
      description,
      type: type || "open",
      coverImage,
      logo,
      createdBy: userId,
      moderators: [userId], // Creator becomes first moderator
      members: [userId], // Creator becomes first member
      invitedUsers: invitedUsers || [],
      tags: tags || [],
      rules: rules || [],
      externalLinks: externalLinks || {},
      settings: {
        allowMemberPosts: settings?.allowMemberPosts ?? true,
        requirePostApproval: settings?.requirePostApproval ?? false,
        allowMediaUploads: settings?.allowMediaUploads ?? true,
        allowComments: settings?.allowComments ?? true,
        allowPolls: settings?.allowPolls ?? true,
      },
    });

    await community.save();

    // Create membership record for creator
    const membership = new CommunityMembership({
      communityId: community._id,
      userId: userId,
      role: "admin",
      status: "approved",
      joinedAt: new Date(),
    });

    await membership.save();

    return res.status(201).json({
      success: true,
      message: "Community created successfully",
      data: community,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error creating community",
      error: error.message,
    });
  }
};

// Get all communities with pagination and filters
export const getAllCommunities = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status = "active",
      search,
      tags,
    } = req.query;

    const query: any = { status };

    if (type) {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const communities = await Community.find(query)
      .populate("createdBy", "firstName lastName profileImage")
      .populate("moderators", "firstName lastName profileImage")
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Community.countDocuments(query);

    return res.json({
      success: true,
      data: {
        communities,
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
      message: "Error fetching communities",
      error: error.message,
    });
  }
};

// Get community by ID
export const getCommunityById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const community = await Community.findById(id)
      .populate("createdBy", "firstName lastName profileImage email")
      .populate("moderators", "firstName lastName profileImage email")
      .populate("members", "firstName lastName profileImage email");

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user can view this community
    if (community.type === "hidden" && userId) {
      const membership = await CommunityMembership.findOne({
        communityId: id,
        userId: userId,
        status: "approved",
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: "Access denied to hidden community",
        });
      }
    }

    // Get recent posts
    const recentPosts = await (CommunityPost as any).findByCommunity(id, {
      limit: 10,
    });

    return res.json({
      success: true,
      data: {
        community,
        recentPosts,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching community",
      error: error.message,
    });
  }
};

// Update community
export const updateCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
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

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user has permission to update
    const membership = await CommunityMembership.findOne({
      communityId: id,
      userId: userId,
      status: "approved",
    });

    const isCreator = community.createdBy.toString() === userId.toString();
    const isModerator =
      membership?.role === "moderator" || membership?.role === "admin";
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !isModerator && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update community",
      });
    }

    // Update community
    Object.keys(updates).forEach((key) => {
      if (key in community && key !== "_id" && key !== "createdBy") {
        (community as any)[key] = updates[key];
      }
    });

    await community.save();

    return res.json({
      success: true,
      message: "Community updated successfully",
      data: community,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating community",
      error: error.message,
    });
  }
};

// Delete community
export const deleteCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user has permission to delete
    const isCreator = community.createdBy.toString() === userId.toString();
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to delete community",
      });
    }

    // Soft delete by changing status
    community.status = "archived";
    await community.save();

    return res.json({
      success: true,
      message: "Community deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error deleting community",
      error: error.message,
    });
  }
};

// Join community
export const joinCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const community = await Community.findById(id);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Check if user is already a member
    const existingMembership = await CommunityMembership.findOne({
      communityId: id,
      userId: userId,
    });

    if (existingMembership) {
      if (existingMembership.status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Already a member of this community",
        });
      } else if (existingMembership.status === "pending") {
        return res.status(400).json({
          success: false,
          message: "Membership request already pending",
        });
      }
    }

    let membership;

    if (community.type === "open") {
      // Direct join for open communities
      membership = new CommunityMembership({
        communityId: id,
        userId: userId,
        role: "member",
        status: "approved",
        joinedAt: new Date(),
      });

      await membership.save();

      // Add to community members
      (community as any).addMember(userId);
      await community.save();

      return res.json({
        success: true,
        message: "Successfully joined community",
        data: membership,
      });
    } else {
      // Request to join for closed/hidden communities
      membership = new CommunityMembership({
        communityId: id,
        userId: userId,
        role: "member",
        status: "pending",
      });

      await membership.save();

      return res.json({
        success: true,
        message: "Membership request sent",
        data: membership,
      });
    }
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error joining community",
      error: error.message,
    });
  }
};

// Leave community
export const leaveCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findOne({
      communityId: id,
      userId: userId,
      status: "approved",
    });

    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Not a member of this community",
      });
    }

    // Leave community
    (membership as any).leaveCommunity();
    await membership.save();

    // Remove from community members
    const community = await Community.findById(id);
    if (community) {
      (community as any).removeMember(userId);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Successfully left community",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error leaving community",
      error: error.message,
    });
  }
};

// Get community members
export const getCommunityMembers = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50, role, status = "approved" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const members = await (CommunityMembership as any).findByCommunity(id, {
      status,
      role,
      limit: Number(limit),
      skip,
    });

    const total = await CommunityMembership.countDocuments({
      communityId: id,
      status,
      ...(role && { role }),
    });

    return res.json({
      success: true,
      data: {
        members,
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
      message: "Error fetching community members",
      error: error.message,
    });
  }
};

// Get user's communities
export const getUserCommunities = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id;
    const { page = 1, limit = 20, status = "approved" } = req.query;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const memberships = await (CommunityMembership as any).findByUser(
      userId.toString(),
      {
        status,
        limit: Number(limit),
        skip,
      }
    );

    const total = await CommunityMembership.countDocuments({
      userId: userId,
      status,
    });

    return res.json({
      success: true,
      data: {
        communities: memberships,
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
      message: "Error fetching user communities",
      error: error.message,
    });
  }
};

// Search communities
export const searchCommunities = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { q, type, tags, page = 1, limit = 20 } = req.query;

    if (!q && !type && !tags) {
      return res.status(400).json({
        success: false,
        message: "Search query, type, or tags required",
      });
    }

    const query: any = { status: "active" };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }

    if (type) {
      query.type = type;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagArray };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const communities = await Community.find(query)
      .populate("createdBy", "firstName lastName profileImage")
      .populate("moderators", "firstName lastName profileImage")
      .sort({ memberCount: -1, createdAt: -1 })
      .limit(Number(limit))
      .skip(skip);

    const total = await Community.countDocuments(query);

    return res.json({
      success: true,
      data: {
        communities,
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
      message: "Error searching communities",
      error: error.message,
    });
  }
};
