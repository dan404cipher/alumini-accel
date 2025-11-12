import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import MentorshipCommunication from "../models/MentorshipCommunication";
import Community from "../models/Community";
import CommunityPost from "../models/CommunityPost";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import User from "../models/User";
import MenteeRegistration from "../models/MenteeRegistration";
import { logger } from "../utils/logger";
import { emailService } from "../services/emailService";

// Send email to mentee (from mentor)
export const sendEmailToMentee = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId, menteeId, subject, body, attachments, replyToId } =
      req.body;
    const fromUserId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    if (!communityId || !menteeId || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Community ID, mentee ID, subject, and body are required",
      });
    }

    // Verify community exists and user has access
    const community = await Community.findById(communityId);
    if (!community || (community as any).tenantId?.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Verify sender is mentor (admin of community)
    const isMentor = community.moderators.some(
      (id) => id.toString() === fromUserId?.toString()
    );
    if (!isMentor) {
      return res.status(403).json({
        success: false,
        message: "Only mentors can send emails to mentees",
      });
    }

    // Get matching record
    const matching = await MentorMenteeMatching.findOne({
      mentorshipCommunityId: communityId,
      mentorId: fromUserId,
      status: "accepted",
      tenantId,
    });

    if (!matching) {
      return res.status(404).json({
        success: false,
        message: "Mentorship match not found",
      });
    }

    // Get recipient (mentee) user
    let toUser;
    if (matching.menteeId) {
      toUser = await User.findById(matching.menteeId);
    }

    // If mentee doesn't exist as user, get from registration
    if (!toUser && matching.menteeRegistrationId) {
      const menteeReg = await MenteeRegistration.findById(
        matching.menteeRegistrationId
      );
      if (menteeReg?.personalEmail) {
        toUser = await User.findOne({ email: menteeReg.personalEmail });
      }
    }

    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "Mentee user not found",
      });
    }

    // Create communication record
    const communication = new MentorshipCommunication({
      communityId,
      fromUserId,
      toUserId: toUser._id,
      subject,
      body,
      attachments: req.files
        ? (req.files as Express.Multer.File[]).map(
            (file) => file.path || file.filename
          )
        : attachments || [],
      relatedMentorshipId: matching._id,
      relatedProgramId: matching.programId,
      replyToId: replyToId || undefined,
      tenantId,
    });

    await communication.save();

    // Send actual email
    try {
      await emailService.sendEmail({
        to: toUser.email,
        subject,
        html: body,
      });
    } catch (emailError) {
      logger.error("Failed to send email notification:", emailError);
      // Continue even if email fails
    }

    // Create community post automatically
    const fromUser = await User.findById(fromUserId);
    const communityPost = new CommunityPost({
      communityId,
      authorId: fromUserId,
      content: `<div><strong>Subject:</strong> ${subject}</div><div>${body}</div>`,
      type: "text",
      status: "approved",
      isAnnouncement: false,
      isPinned: false,
      tags: ["mentorship-communication", "email"],
    });
    await communityPost.save();

    // Update community post count
    community.postCount = (community.postCount || 0) + 1;
    await community.save();

    return res.json({
      success: true,
      message: "Email sent successfully",
      data: { communication },
    });
  } catch (error) {
    logger.error("Send email to mentee error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};

// Send email to mentor (from mentee)
export const sendEmailToMentor = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId, mentorId, subject, body, attachments, replyToId } =
      req.body;
    const fromUserId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    if (!communityId || !mentorId || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: "Community ID, mentor ID, subject, and body are required",
      });
    }

    // Verify community exists
    const community = await Community.findById(communityId);
    if (!community || (community as any).tenantId?.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Verify sender is mentee (member of community)
    const isMember = community.members.some(
      (id) => id.toString() === fromUserId?.toString()
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Only mentees can send emails to mentors",
      });
    }

    // Get matching record
    const matching = await MentorMenteeMatching.findOne({
      mentorshipCommunityId: communityId,
      menteeId: fromUserId,
      status: "accepted",
      tenantId,
    });

    if (!matching) {
      return res.status(404).json({
        success: false,
        message: "Mentorship match not found",
      });
    }

    // Get recipient (mentor) user
    const toUser = await User.findById(mentorId);
    if (!toUser) {
      return res.status(404).json({
        success: false,
        message: "Mentor user not found",
      });
    }

    // Create communication record
    const communication = new MentorshipCommunication({
      communityId,
      fromUserId,
      toUserId: toUser._id,
      subject,
      body,
      attachments: req.files
        ? (req.files as Express.Multer.File[]).map(
            (file) => file.path || file.filename
          )
        : attachments || [],
      relatedMentorshipId: matching._id,
      relatedProgramId: matching.programId,
      replyToId: replyToId || undefined,
      tenantId,
    });

    await communication.save();

    // Send actual email
    try {
      await emailService.sendEmail({
        to: toUser.email,
        subject,
        html: body,
      });
    } catch (emailError) {
      logger.error("Failed to send email notification:", emailError);
      // Continue even if email fails
    }

    // Create community post automatically
    const fromUser = await User.findById(fromUserId);
    const communityPost = new CommunityPost({
      communityId,
      authorId: fromUserId,
      content: `<div><strong>Subject:</strong> ${subject}</div><div>${body}</div>`,
      type: "text",
      status: "approved",
      isAnnouncement: false,
      isPinned: false,
      tags: ["mentorship-communication", "email"],
    });
    await communityPost.save();

    // Update community post count
    community.postCount = (community.postCount || 0) + 1;
    await community.save();

    return res.json({
      success: true,
      message: "Email sent successfully",
      data: { communication },
    });
  } catch (error) {
    logger.error("Send email to mentor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send email",
    });
  }
};

// Get communication history for community
export const getCommunicationHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { communityId } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    // Verify community access
    const community = await Community.findById(communityId);
    if (!community || (community as any).tenantId?.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Verify user is member
    const isMember =
      community.members.some((id) => id.toString() === userId?.toString()) ||
      community.moderators.some((id) => id.toString() === userId?.toString());

    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this community",
      });
    }

    // Get communications
    const communications = await MentorshipCommunication.find({
      communityId,
      tenantId,
    })
      .populate("fromUserId", "firstName lastName email")
      .populate("toUserId", "firstName lastName email")
      .populate("replyToId")
      .sort({ sentAt: -1 });

    return res.json({
      success: true,
      data: { communications },
    });
  } catch (error) {
    logger.error("Get communication history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communication history",
    });
  }
};

// Get mentee communication history
export const getMenteeCommunicationHistory = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { menteeId } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    // Get matching records for this mentee
    const matchings = await MentorMenteeMatching.find({
      menteeId: menteeId || userId,
      status: "accepted",
      tenantId,
    }).select("_id mentorshipCommunityId");

    const communityIds = matchings
      .map((m) => m.mentorshipCommunityId)
      .filter(Boolean);

    if (communityIds.length === 0) {
      return res.json({
        success: true,
        data: { communications: [] },
      });
    }

    // Get communications for all communities
    const communications = await MentorshipCommunication.find({
      communityId: { $in: communityIds },
      $or: [{ fromUserId: userId }, { toUserId: userId }],
      tenantId,
    })
      .populate("fromUserId", "firstName lastName email")
      .populate("toUserId", "firstName lastName email")
      .populate("replyToId")
      .populate("communityId", "name")
      .sort({ sentAt: -1 });

    return res.json({
      success: true,
      data: { communications },
    });
  } catch (error) {
    logger.error("Get mentee communication history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communication history",
    });
  }
};

// Mark communication as read
export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const communication = await MentorshipCommunication.findOne({
      _id: id,
      toUserId: userId,
      tenantId,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: "Communication not found",
      });
    }

    communication.isRead = true;
    communication.readAt = new Date();
    await communication.save();

    return res.json({
      success: true,
      message: "Communication marked as read",
      data: { communication },
    });
  } catch (error) {
    logger.error("Mark as read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark as read",
    });
  }
};

// Delete communication (sender only)
export const deleteCommunication = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const communication = await MentorshipCommunication.findOne({
      _id: id,
      fromUserId: userId, // Only sender can delete
      tenantId,
    });

    if (!communication) {
      return res.status(404).json({
        success: false,
        message: "Communication not found or you don't have permission",
      });
    }

    await MentorshipCommunication.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Communication deleted successfully",
    });
  } catch (error) {
    logger.error("Delete communication error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete communication",
    });
  }
};

// Get unread count
export const getUnreadCount = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const count = await MentorshipCommunication.countDocuments({
      toUserId: userId,
      isRead: false,
      tenantId,
    });

    return res.json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    logger.error("Get unread count error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count",
    });
  }
};

