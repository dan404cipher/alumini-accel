import mongoose from "mongoose";
import { logger } from "../utils/logger";
import Community from "../models/Community";
import CommunityMembership from "../models/CommunityMembership";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import User from "../models/User";
import MenteeRegistration from "../models/MenteeRegistration";

interface CreateMentorCommunityData {
  matchingId: string;
  programId: string;
  mentorId: string;
  menteeId: string;
  menteeRegistrationId: string;
  tenantId: string;
}

/**
 * Automatically create a mentorship community when mentor accepts mentee match
 */
export const autoCreateMentorCommunity = async (
  data: CreateMentorCommunityData
): Promise<string | null> => {
  try {
    const {
      matchingId,
      programId,
      mentorId,
      menteeId,
      menteeRegistrationId,
      tenantId,
    } = data;

    // Get mentor and mentee details
    const mentor = await User.findById(mentorId);
    const menteeRegistration = await MenteeRegistration.findById(menteeRegistrationId);
    
    if (!mentor || !menteeRegistration) {
      logger.error("Mentor or mentee not found for community creation");
      return null;
    }

    // Get mentee user if exists (by email)
    let mentee = null;
    if (menteeRegistration.personalEmail) {
      mentee = await User.findOne({ email: menteeRegistration.personalEmail });
    }

    const mentorName = `${mentor.firstName} ${mentor.lastName}`;
    const menteeName = `${menteeRegistration.firstName} ${menteeRegistration.lastName}`;

    // Check if community already exists for this match
    const existingCommunity = await Community.findOne({
      name: { $regex: new RegExp(`^${mentorName}.*Mentoring Community$`, "i") },
      "settings.mentorshipMatchId": matchingId,
    });

    if (existingCommunity) {
      logger.info(`Community already exists for match ${matchingId}`);
      return (existingCommunity._id as any).toString();
    }

    // Create community
    const community = new Community({
      name: `${mentorName} - Mentoring Community`,
      description: `Private mentoring community for ${mentorName} and ${menteeName}. All communications and resources will be shared here.`,
      type: "closed", // Private community - only members can see
      category: "mentorship_guidance",
      createdBy: mentorId,
      moderators: [mentorId],
      members: mentorId ? [mentorId] : [],
      settings: {
        allowMemberPosts: true,
        requirePostApproval: false, // Mentor can moderate but posts don't require pre-approval
        allowMediaUploads: true,
        allowComments: true,
        allowPolls: false,
        mentorshipMatchId: matchingId, // Link to matching record
        mentorshipProgramId: programId,
      },
      status: "active",
      tags: ["mentorship", "mentor-mentee"],
      memberCount: 1, // Start with mentor
      postCount: 0,
    });

    await community.save();
    
    // Update settings with mentorship IDs after save
    if (community.settings) {
      (community.settings as any).mentorshipMatchId = matchingId;
      (community.settings as any).mentorshipProgramId = programId;
      await community.save();
    }

    // Create membership for mentor (as admin)
    const mentorMembership = new CommunityMembership({
      communityId: community._id,
      userId: mentorId,
      role: "admin",
      status: "approved",
      joinedAt: new Date(),
      permissions: {
        canPost: true,
        canComment: true,
        canInvite: true,
        canModerate: true,
      },
    });
    await mentorMembership.save();

    // Add mentor to community members array
    community.members.push(new mongoose.Types.ObjectId(mentorId));
    community.memberCount = 1;

    // Add mentee if user exists
    if (mentee) {
      const menteeMembership = new CommunityMembership({
        communityId: community._id,
        userId: mentee._id,
        role: "member",
        status: "approved",
        joinedAt: new Date(),
        permissions: {
          canPost: true,
          canComment: true,
          canInvite: false,
          canModerate: false,
        },
      });
      await menteeMembership.save();

      community.members.push(new mongoose.Types.ObjectId(mentee._id));
      community.memberCount = 2;
    }

    await community.save();

    // Update matching record with community ID
    await MentorMenteeMatching.findByIdAndUpdate(matchingId, {
      $set: { mentorshipCommunityId: community._id },
    });

    logger.info(
      `Mentorship community created: ${community.name} (ID: ${community._id})`
    );

    return (community._id as any).toString();
  } catch (error) {
    logger.error("Auto-create mentor community error:", error);
    return null;
  }
};

/**
 * Add mentee to community when they register or match is accepted
 */
export const addMenteeToCommunity = async (
  communityId: string,
  menteeId: string,
  tenantId: string
): Promise<boolean> => {
  try {
    const community = await Community.findById(communityId);

    if (!community) {
      return false;
    }

    // Check if mentee already a member
    const existingMembership = await CommunityMembership.findOne({
      communityId,
      userId: menteeId,
    });

    if (existingMembership) {
      return true; // Already a member
    }

    // Create membership
    const menteeMembership = new CommunityMembership({
      communityId,
      userId: menteeId,
      role: "member",
      status: "approved",
      joinedAt: new Date(),
      permissions: {
        canPost: true,
        canComment: true,
        canInvite: false,
        canModerate: false,
      },
    });
    await menteeMembership.save();

    // Update community member count
    const menteeObjectId = new mongoose.Types.ObjectId(menteeId);
    if (!community.members.some((m: any) => m.toString() === menteeObjectId.toString())) {
      community.members.push(menteeObjectId);
      community.memberCount = (community.memberCount || 0) + 1;
      await community.save();
    }

    return true;
  } catch (error) {
    logger.error("Add mentee to community error:", error);
    return false;
  }
};

/**
 * Get community for a mentorship match
 */
export const getMentorshipCommunity = async (
  matchingId: string,
  tenantId: string
): Promise<any | null> => {
  try {
    const matching = await MentorMenteeMatching.findById(matchingId);

    if (!matching || matching.tenantId.toString() !== tenantId) {
      return null;
    }

    // Try to find by matching ID stored in settings
    const community = await Community.findOne({
      "settings.mentorshipMatchId": matchingId,
    })
      .populate("createdBy", "firstName lastName email")
      .populate("members", "firstName lastName email");

    return community;
  } catch (error) {
    logger.error("Get mentorship community error:", error);
    return null;
  }
};

