import { Request, Response } from "express";
import Mentorship from "../models/Mentorship";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import { logger } from "../utils/logger";
import { MentorshipStatus } from "../types";

// Get all mentorships
export const getAllMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.domain)
      filter.domain = { $regex: req.query.domain, $options: "i" };

    // 🔒 MULTI-TENANT FILTERING: Only show mentorships from same college (unless super admin)
    if (req.query.tenantId) {
      // Get users from the specified tenant
      const tenantUsers = await User.find({
        tenantId: req.query.tenantId,
      }).select("_id");
      const tenantUserIds = tenantUsers.map((user) => user._id);

      // Filter mentorships by users from the same tenant
      filter.$or = [
        { mentorId: { $in: tenantUserIds } },
        { menteeId: { $in: tenantUserIds } },
      ];
    } else if (
      (req as any).user?.role !== "super_admin" &&
      (req as any).user?.tenantId
    ) {
      // Get users from the current user's tenant
      const tenantUsers = await User.find({
        tenantId: (req as any).user.tenantId,
      }).select("_id");
      const tenantUserIds = tenantUsers.map((user) => user._id);

      // Filter mentorships by users from the same tenant
      filter.$or = [
        { mentorId: { $in: tenantUserIds } },
        { menteeId: { $in: tenantUserIds } },
      ];
    }

    const mentorships = await Mentorship.find(filter)
      .populate("mentor", "firstName lastName email profilePicture")
      .populate("mentee", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments(filter);

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all mentorships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentorships",
    });
  }
};

// Get mentorship by ID
export const getMentorshipById = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate("mentor", "firstName lastName email profilePicture")
      .populate("mentee", "firstName lastName email profilePicture");

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    return res.json({
      success: true,
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Get mentorship by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentorship",
    });
  }
};

// Create mentorship request
export const createMentorship = async (req: Request, res: Response) => {
  try {
    const {
      mentorId,
      domain,
      description,
      goals,
      background,
      expectations,
      specificQuestions,
      timeCommitment,
      communicationMethod,
      preferredSchedule,
      duration,
    } = req.body;

    // Check if mentor exists and is available for mentorship
    const mentorProfile = await AlumniProfile.findOne({
      userId: mentorId,
      availableForMentorship: true,
    });

    if (!mentorProfile) {
      return res.status(400).json({
        success: false,
        message: "Mentor is not available for mentorship",
      });
    }

    // Check if there's already a pending or active mentorship between these users
    const existingMentorship = await Mentorship.findOne({
      $or: [
        { mentorId: mentorId, menteeId: req.user.id },
        { mentorId: req.user.id, menteeId: mentorId },
      ],
      status: { $in: [MentorshipStatus.PENDING, MentorshipStatus.ACTIVE] },
    });

    if (existingMentorship) {
      return res.status(400).json({
        success: false,
        message:
          "A mentorship request already exists between you and this mentor",
      });
    }

    const mentorship = new Mentorship({
      mentorId: mentorId,
      menteeId: req.user.id,
      domain,
      description,
      goals: goals || [],
      background,
      expectations,
      specificQuestions,
      timeCommitment,
      communicationMethod,
      preferredSchedule,
      duration: duration || 3, // Default 3 months
      startDate: new Date(), // Add required startDate
      status: MentorshipStatus.PENDING,
    });

    await mentorship.save();

    return res.status(201).json({
      success: true,
      message: "Mentorship request created successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Create mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create mentorship request",
    });
  }
};

// Accept mentorship
export const acceptMentorship = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is the mentor
    if (mentorship.mentorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can accept the mentorship",
      });
    }

    if (mentorship.status !== MentorshipStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Mentorship is not in pending status",
      });
    }

    mentorship.status = MentorshipStatus.ACTIVE;
    mentorship.acceptedAt = new Date();
    await mentorship.save();

    return res.json({
      success: true,
      message: "Mentorship accepted successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Accept mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept mentorship",
    });
  }
};

// Reject mentorship
export const rejectMentorship = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is the mentor
    if (mentorship.mentorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can reject the mentorship",
      });
    }

    if (mentorship.status !== MentorshipStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: "Mentorship is not in pending status",
      });
    }

    mentorship.status = MentorshipStatus.REJECTED;
    mentorship.rejectedAt = new Date();
    mentorship.rejectionReason = reason;
    await mentorship.save();

    return res.json({
      success: true,
      message: "Mentorship rejected successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Reject mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject mentorship",
    });
  }
};

// Complete mentorship
export const completeMentorship = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is the mentor or mentee
    if (
      mentorship.mentorId.toString() !== req.user.id &&
      mentorship.menteeId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to complete this mentorship",
      });
    }

    if (mentorship.status !== MentorshipStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Mentorship is not active",
      });
    }

    mentorship.status = MentorshipStatus.COMPLETED;
    mentorship.completedAt = new Date();
    await mentorship.save();

    return res.json({
      success: true,
      message: "Mentorship completed successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Complete mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete mentorship",
    });
  }
};

// Add mentorship session
export const addSession = async (req: Request, res: Response) => {
  try {
    const { date, duration, topic, notes, meetingLink } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is the mentor
    if (mentorship.mentorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can add sessions",
      });
    }

    if (mentorship.status !== MentorshipStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: "Mentorship is not active",
      });
    }

    mentorship.sessions.push({
      date: new Date(date),
      duration,
      topic,
      notes,
      meetingLink,
      status: "scheduled",
    });

    await mentorship.save();

    return res.json({
      success: true,
      message: "Session added successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Add session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add session",
    });
  }
};

// Update mentorship session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { date, duration, topic, notes, meetingLink, status } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is the mentor
    if (mentorship.mentorId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Only the mentor can update sessions",
      });
    }

    const session = mentorship.sessions.find(
      (s) => s._id?.toString() === sessionId
    );
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found",
      });
    }

    // Update session fields
    if (date !== undefined) session.date = new Date(date);
    if (duration !== undefined) session.duration = duration;
    if (topic !== undefined) session.topic = topic;
    if (notes !== undefined) session.notes = notes;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (status !== undefined) session.status = status;

    await mentorship.save();

    return res.json({
      success: true,
      message: "Session updated successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Update session error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update session",
    });
  }
};

// Update mentorship details
export const updateMentorship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { domain, goals, duration, startDate, endDate, notes } = req.body;
    const userId = req.user?.id;

    const mentorship = await Mentorship.findById(id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check permissions: mentor or mentee can update
    if (
      mentorship.mentorId.toString() !== userId &&
      mentorship.menteeId.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this mentorship",
      });
    }

    // Only allow updates for pending or active mentorships
    // But admins can update any mentorship
    const isAdmin = [
      "super_admin",
      "college_admin",
      "admin",
      "moderator",
      "hod",
      "staff",
    ].includes(req.user?.role);
    if (!["pending", "active"].includes(mentorship.status) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cannot update completed or rejected mentorships",
      });
    }

    // Update fields
    if (domain !== undefined) mentorship.domain = domain;
    if (goals !== undefined) mentorship.goals = goals;
    if (duration !== undefined) mentorship.duration = duration;
    if (startDate !== undefined) mentorship.startDate = new Date(startDate);
    if (endDate !== undefined) mentorship.endDate = new Date(endDate);
    if (notes !== undefined) mentorship.notes = notes;

    await mentorship.save();

    // Populate the response
    await mentorship.populate([
      { path: "mentor", select: "firstName lastName email profilePicture" },
      { path: "mentee", select: "firstName lastName email profilePicture" },
    ]);

    return res.json({
      success: true,
      message: "Mentorship updated successfully",
      data: mentorship,
    });
  } catch (error) {
    logger.error("Update mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update mentorship",
    });
  }
};

// Delete/Cancel mentorship
export const deleteMentorship = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    const mentorship = await Mentorship.findById(id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check permissions: mentor, mentee, or admin can delete
    const isMentor = mentorship.mentorId.toString() === userId;
    const isMentee = mentorship.menteeId.toString() === userId;
    const isAdmin = [
      "super_admin",
      "college_admin",
      "admin",
      "moderator",
      "hod",
      "staff",
    ].includes(userRole);

    if (!isMentor && !isMentee && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this mentorship",
      });
    }

    // Only allow deletion for pending or active mentorships
    // But admins can delete any mentorship
    if (!["pending", "active"].includes(mentorship.status) && !isAdmin) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed or rejected mentorships",
      });
    }

    // Soft delete by setting status to cancelled
    mentorship.status = MentorshipStatus.CANCELLED;
    mentorship.cancelledAt = new Date();
    mentorship.cancelledBy = userId;
    await mentorship.save();

    return res.json({
      success: true,
      message: "Mentorship cancelled successfully",
    });
  } catch (error) {
    logger.error("Delete mentorship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete mentorship",
    });
  }
};

// Submit mentorship feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, comment, type } = req.body; // type: 'mentor' or 'mentee'

    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: "Mentorship not found",
      });
    }

    // Check if user is part of the mentorship
    if (
      mentorship.mentorId.toString() !== req.user.id &&
      mentorship.menteeId.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to submit feedback for this mentorship",
      });
    }

    // Check if mentorship is completed
    if (mentorship.status !== MentorshipStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: "Mentorship must be completed to submit feedback",
      });
    }

    // Check if user already submitted feedback
    const existingFeedback = mentorship.feedback.find(
      (feedback) =>
        feedback.user.toString() === req.user.id && feedback.type === type
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted feedback for this mentorship",
      });
    }

    mentorship.feedback.push({
      from: type as "mentor" | "mentee",
      user: req.user.id,
      type,
      rating,
      comment,
      date: new Date(),
    });

    await mentorship.save();

    return res.json({
      success: true,
      message: "Feedback submitted successfully",
      data: { mentorship },
    });
  } catch (error) {
    logger.error("Submit feedback error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit feedback",
    });
  }
};

// Get my mentorships
export const getMyMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      $or: [{ mentorId: req.user.id }, { menteeId: req.user.id }],
    })
      .populate("mentor", "firstName lastName email profilePicture")
      .populate("mentee", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      $or: [{ mentorId: req.user.id }, { menteeId: req.user.id }],
    });

    return res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get my mentorships error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch your mentorships",
    });
  }
};

// Get active mentorships
export const getActiveMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      status: MentorshipStatus.ACTIVE,
      $or: [{ mentorId: req.user.id }, { menteeId: req.user.id }],
    })
      .populate("mentor", "firstName lastName email profilePicture")
      .populate("mentee", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      status: MentorshipStatus.ACTIVE,
      $or: [{ mentorId: req.user.id }, { menteeId: req.user.id }],
    });

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get active mentorships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active mentorships",
    });
  }
};

// Get pending mentorships
export const getPendingMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      status: MentorshipStatus.PENDING,
      mentorId: req.user.id,
    })
      .populate("mentor", "firstName lastName email profilePicture")
      .populate("mentee", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      status: MentorshipStatus.PENDING,
      mentorId: req.user.id,
    });

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get pending mentorships error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch pending mentorships",
    });
  }
};

// Get mentorship statistics
export const getMentorshipStats = async (req: Request, res: Response) => {
  try {
    const totalMentorships = await Mentorship.countDocuments();
    const activeMentorships = await Mentorship.countDocuments({
      status: MentorshipStatus.ACTIVE,
    });
    const completedMentorships = await Mentorship.countDocuments({
      status: MentorshipStatus.COMPLETED,
    });
    const pendingMentorships = await Mentorship.countDocuments({
      status: MentorshipStatus.PENDING,
    });

    const domainStats = await Mentorship.aggregate([
      {
        $group: {
          _id: "$domain",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const monthlyStats = await Mentorship.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    res.json({
      success: true,
      data: {
        totalMentorships,
        activeMentorships,
        completedMentorships,
        pendingMentorships,
        domainStats,
        monthlyStats,
      },
    });
  } catch (error) {
    logger.error("Get mentorship stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentorship statistics",
    });
  }
};

export default {
  getAllMentorships,
  getMentorshipById,
  createMentorship,
  acceptMentorship,
  rejectMentorship,
  completeMentorship,
  updateMentorship,
  deleteMentorship,
  addSession,
  updateSession,
  submitFeedback,
  getMyMentorships,
  getActiveMentorships,
  getPendingMentorships,
  getMentorshipStats,
};
