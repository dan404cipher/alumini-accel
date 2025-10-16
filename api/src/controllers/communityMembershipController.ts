import { Request, Response } from "express";
import CommunityMembership from "../models/CommunityMembership";
import Community from "../models/Community";
import { IUser } from "../types";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Get membership requests for a community
export const getMembershipRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user can view membership requests
    const membership = await CommunityMembership.findOne({
      communityId: communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to view membership requests",
      });
    }

    const requests = await (CommunityMembership as any).findPendingRequests(
      communityId
    );

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching membership requests",
      error: error.message,
    });
  }
};

// Approve membership request
export const approveMembership = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership request not found",
      });
    }

    // Check if user can approve memberships
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to approve memberships",
      });
    }

    // Approve membership
    (membership as any).approveMembership(userId.toString());
    await membership.save();

    // Add to community members
    if (community) {
      (community as any).addMember(membership.userId);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Membership approved successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error approving membership",
      error: error.message,
    });
  }
};

// Reject membership request
export const rejectMembership = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership request not found",
      });
    }

    // Check if user can reject memberships
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to reject memberships",
      });
    }

    // Reject membership
    (membership as any).rejectMembership();
    await membership.save();

    return res.json({
      success: true,
      message: "Membership rejected successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error rejecting membership",
      error: error.message,
    });
  }
};

// Suspend member
export const suspendMember = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const { reason, endDate } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can suspend members
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to suspend members",
      });
    }

    // Cannot suspend yourself
    if (membership.userId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot suspend yourself",
      });
    }

    // Suspend member
    (membership as any).suspendMembership(userId.toString(), reason, endDate);
    await membership.save();

    return res.json({
      success: true,
      message: "Member suspended successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error suspending member",
      error: error.message,
    });
  }
};

// Unsuspend member
export const unsuspendMember = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can unsuspend members
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to unsuspend members",
      });
    }

    // Unsuspend member
    (membership as any).unsuspendMembership();
    await membership.save();

    return res.json({
      success: true,
      message: "Member unsuspended successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error unsuspending member",
      error: error.message,
    });
  }
};

// Promote member to moderator
export const promoteToModerator = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can promote members
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to promote members",
      });
    }

    // Promote to moderator
    (membership as any).promoteToModerator();
    await membership.save();

    // Add to community moderators
    if (community) {
      (community as any).addModerator(membership.userId);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Member promoted to moderator successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error promoting member",
      error: error.message,
    });
  }
};

// Demote moderator to member
export const demoteToMember = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can demote moderators
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to demote moderators",
      });
    }

    // Cannot demote yourself
    if (membership.userId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot demote yourself",
      });
    }

    // Demote to member
    (membership as any).demoteToMember();
    await membership.save();

    // Remove from community moderators
    if (community) {
      (community as any).removeModerator(membership.userId);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Moderator demoted to member successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error demoting moderator",
      error: error.message,
    });
  }
};

// Remove member from community
export const removeMember = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can remove members
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to remove members",
      });
    }

    // Cannot remove yourself
    if (membership.userId.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove yourself",
      });
    }

    // Remove member
    membership.status = "left";
    membership.leftAt = new Date();
    await membership.save();

    // Remove from community members
    if (community) {
      (community as any).removeMember(membership.userId);
      await community.save();
    }

    return res.json({
      success: true,
      message: "Member removed successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error removing member",
      error: error.message,
    });
  }
};

// Get moderators of a community
export const getCommunityModerators = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;

    const moderators = await (CommunityMembership as any).findModerators(
      communityId
    );

    return res.json({
      success: true,
      data: moderators,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error fetching community moderators",
      error: error.message,
    });
  }
};

// Invite user to community
export const inviteToCommunity = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const { userId: inviteeId } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!inviteeId) {
      return res.status(400).json({
        success: false,
        message: "Invitee user ID is required",
      });
    }

    // Check if user can invite others
    const membership = await CommunityMembership.findOne({
      communityId: communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canInvite = (membership as any)?.canInvite() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canInvite && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to invite users",
      });
    }

    // Check if invitee is already a member
    const existingMembership = await CommunityMembership.findOne({
      communityId: communityId,
      userId: inviteeId,
    });

    if (existingMembership) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this community",
      });
    }

    // Create invitation
    const invitation = new CommunityMembership({
      communityId: communityId,
      userId: inviteeId,
      role: "member",
      status: "pending",
      invitedBy: userId,
    });

    await invitation.save();

    return res.json({
      success: true,
      message: "User invited to community successfully",
      data: invitation,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error inviting user to community",
      error: error.message,
    });
  }
};

// Update moderator permissions
export const updateModeratorPermissions = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { membershipId } = req.params;
    const { permissions } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const membership = await CommunityMembership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({
        success: false,
        message: "Membership not found",
      });
    }

    // Check if user can update moderator permissions
    const userMembership = await CommunityMembership.findOne({
      communityId: membership.communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(membership.communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const canModerate = (userMembership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";

    if (!isCreator && !canModerate && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to update moderator permissions",
      });
    }

    // Update permissions
    if (permissions) {
      membership.permissions = { ...membership.permissions, ...permissions };
    }

    await membership.save();

    return res.json({
      success: true,
      message: "Moderator permissions updated successfully",
      data: membership,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: "Error updating moderator permissions",
      error: error.message,
    });
  }
};
