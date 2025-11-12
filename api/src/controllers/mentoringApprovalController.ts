import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import MentoringProgram from "../models/MentoringProgram";
import User from "../models/User";
import { MentorRegistrationStatus, MenteeRegistrationStatus } from "../types";
import { logger } from "../utils/logger";
import { emailService } from "../services/emailService";

// Get approval queue with filters (Submitted/Approved/Rejected)
export const getApprovalQueue = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { stage, type, programId, page = 1, limit = 20, search } = req.query;
    const tenantId = req.tenantId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { tenantId };

    if (stage) {
      query.status = stage;
    }

    if (programId) {
      query.programId = programId;
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: "i" };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { personalEmail: searchRegex },
        { sitEmail: searchRegex },
      ];
    }

    let mentors: any[] = [];
    let mentees: any[] = [];
    let mentorTotal = 0;
    let menteeTotal = 0;

    // Fetch mentors and mentees
    if (!type || type === "mentor") {
      const mentorQuery = MentorRegistration.find(query)
        .populate("programId", "name category")
        .populate("userId", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("rejectedBy", "firstName lastName email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      mentors = await mentorQuery.exec();
      mentorTotal = await MentorRegistration.countDocuments(query);
    }

    if (!type || type === "mentee") {
      const menteeQuery = MenteeRegistration.find(query)
        .populate("programId", "name category")
        .populate("approvedBy", "firstName lastName email")
        .populate("rejectedBy", "firstName lastName email")
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limitNum);

      mentees = await menteeQuery.exec();
      menteeTotal = await MenteeRegistration.countDocuments(query);
    }

    return res.json({
      success: true,
      data: {
        mentors: mentors || [],
        mentees: mentees || [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          mentorTotal,
          menteeTotal,
          mentorPages: Math.ceil(mentorTotal / limitNum),
          menteePages: Math.ceil(menteeTotal / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get approval queue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approval queue",
    });
  }
};

// Get mentor approvals only
export const getMentorApprovals = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { status, programId, page = 1, limit = 20, search } = req.query;
    const tenantId = req.tenantId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (programId) {
      query.programId = programId;
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: "i" };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { preferredName: searchRegex },
        { personalEmail: searchRegex },
        { sitEmail: searchRegex },
      ];
    }

    const registrations = await MentorRegistration.find(query)
      .populate("programId", "name category")
      .populate("userId", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MentorRegistration.countDocuments(query);

    return res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get mentor approvals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor approvals",
    });
  }
};

// Get mentee approvals only
export const getMenteeApprovals = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { status, programId, page = 1, limit = 20, search } = req.query;
    const tenantId = req.tenantId;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const query: any = { tenantId };

    if (status) {
      query.status = status;
    }

    if (programId) {
      query.programId = programId;
    }

    if (search) {
      const searchRegex = { $regex: search as string, $options: "i" };
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { personalEmail: searchRegex },
        { sitEmail: searchRegex },
      ];
    }

    const registrations = await MenteeRegistration.find(query)
      .populate("programId", "name category")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await MenteeRegistration.countDocuments(query);

    return res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get mentee approvals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentee approvals",
    });
  }
};

// Approve mentor registration
export const approveMentorRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?._id || req.userId;

    const registration = await MentorRegistration.findById(id).populate(
      "programId"
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check matching date deadline
    const program = registration.programId as any;
    if (program && program.matchingEndDate) {
      const matchingEndDate = new Date(program.matchingEndDate);
      const now = new Date();

      if (now > matchingEndDate) {
        return res.status(400).json({
          success: false,
          message: "Approval deadline has passed",
        });
      }
    }

    // Update registration
    registration.status = MentorRegistrationStatus.APPROVED;
    registration.approvedBy = userId as any;
    registration.approvedAt = new Date();
    registration.rejectedBy = undefined;
    registration.rejectedAt = undefined;
    registration.rejectionReason = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "approve",
      performedBy: userId as any,
      performedAt: new Date(),
      notes: notes || undefined,
    });

    await registration.save();

    // Send approval email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentor Registration Approved - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Congratulations! Your Mentor Registration Has Been Approved</h2>
          <p>Dear ${registration.preferredName},</p>
          <p>We are pleased to inform you that your registration as a mentor for the <strong>${program?.name || "Mentoring Program"}</strong> has been approved.</p>
          <p>You will be notified about the next steps in the mentoring process, including when mentees will be able to select you as their preferred mentor.</p>
          <p>Thank you for your commitment to mentoring.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send approval email:", emailError);
    }

    const updatedRegistration = await MentorRegistration.findById(id)
      .populate("programId", "name category")
      .populate("userId", "firstName lastName email")
      .populate("approvedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration approved successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Approve mentor registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve registration",
    });
  }
};

// Reject mentor registration
export const rejectMentorRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const userId = req.user?._id || req.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required and must be at least 10 characters",
      });
    }

    const registration = await MentorRegistration.findById(id).populate(
      "programId"
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check matching date deadline
    const program = registration.programId as any;
    if (program && program.matchingEndDate) {
      const matchingEndDate = new Date(program.matchingEndDate);
      const now = new Date();

      if (now > matchingEndDate) {
        return res.status(400).json({
          success: false,
          message: "Approval deadline has passed",
        });
      }
    }

    // Update registration
    registration.status = MentorRegistrationStatus.REJECTED;
    registration.rejectedBy = userId as any;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason;
    registration.approvedBy = undefined;
    registration.approvedAt = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "reject",
      performedBy: userId as any,
      performedAt: new Date(),
      reason: reason,
      notes: notes || undefined,
    });

    await registration.save();

    // Send rejection email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentor Registration Update - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Mentor Registration Status Update</h2>
          <p>Dear ${registration.preferredName},</p>
          <p>We regret to inform you that your registration as a mentor for the <strong>${program?.name || "Mentoring Program"}</strong> has not been approved at this time.</p>
          <p><strong>Reason:</strong></p>
          <p>${reason}</p>
          <p>If you have any questions or concerns, please feel free to contact us.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send rejection email:", emailError);
    }

    const updatedRegistration = await MentorRegistration.findById(id)
      .populate("programId", "name category")
      .populate("userId", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration rejected successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Reject mentor registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject registration",
    });
  }
};

// Approve mentee registration
export const approveMenteeRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user?._id || req.userId;

    const registration = await MenteeRegistration.findById(id).populate(
      "programId"
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check matching date deadline
    const program = registration.programId as any;
    if (program && program.matchingEndDate) {
      const matchingEndDate = new Date(program.matchingEndDate);
      const now = new Date();

      if (now > matchingEndDate) {
        return res.status(400).json({
          success: false,
          message: "Approval deadline has passed",
        });
      }
    }

    // Update registration
    registration.status = MenteeRegistrationStatus.APPROVED;
    registration.approvedBy = userId as any;
    registration.approvedAt = new Date();
    registration.rejectedBy = undefined;
    registration.rejectedAt = undefined;
    registration.rejectionReason = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "approve",
      performedBy: userId as any,
      performedAt: new Date(),
      notes: notes || undefined,
    });

    await registration.save();

    // Send approval email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentee Registration Approved - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Congratulations! Your Mentee Registration Has Been Approved</h2>
          <p>Dear ${registration.firstName} ${registration.lastName},</p>
          <p>We are pleased to inform you that your registration as a mentee for the <strong>${program?.name || "Mentoring Program"}</strong> has been approved.</p>
          <p>You will be notified about the next steps in the mentoring process, including when you can select your preferred mentors.</p>
          <p>Thank you for your interest in our mentoring program.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send approval email:", emailError);
    }

    const updatedRegistration = await MenteeRegistration.findById(id)
      .populate("programId", "name category")
      .populate("approvedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration approved successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Approve mentee registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve registration",
    });
  }
};

// Reject mentee registration
export const rejectMenteeRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;
    const userId = req.user?._id || req.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required and must be at least 10 characters",
      });
    }

    const registration = await MenteeRegistration.findById(id).populate(
      "programId"
    );

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Check matching date deadline
    const program = registration.programId as any;
    if (program && program.matchingEndDate) {
      const matchingEndDate = new Date(program.matchingEndDate);
      const now = new Date();

      if (now > matchingEndDate) {
        return res.status(400).json({
          success: false,
          message: "Approval deadline has passed",
        });
      }
    }

    // Update registration
    registration.status = MenteeRegistrationStatus.REJECTED;
    registration.rejectedBy = userId as any;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason;
    registration.approvedBy = undefined;
    registration.approvedAt = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "reject",
      performedBy: userId as any,
      performedAt: new Date(),
      reason: reason,
      notes: notes || undefined,
    });

    await registration.save();

    // Send rejection email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentee Registration Update - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Mentee Registration Status Update</h2>
          <p>Dear ${registration.firstName} ${registration.lastName},</p>
          <p>We regret to inform you that your registration as a mentee for the <strong>${program?.name || "Mentoring Program"}</strong> has not been approved at this time.</p>
          <p><strong>Reason:</strong></p>
          <p>${reason}</p>
          <p>If you have any questions or concerns, please feel free to contact us.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send rejection email:", emailError);
    }

    const updatedRegistration = await MenteeRegistration.findById(id)
      .populate("programId", "name category")
      .populate("rejectedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration rejected successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Reject mentee registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject registration",
    });
  }
};

// Reconsider registration (change rejected to submitted)
export const reconsiderRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { type, notes } = req.body; // type: "mentor" | "mentee"
    const userId = req.user?._id || req.userId;

    let registration: any;

    if (type === "mentor") {
      registration = await MentorRegistration.findById(id).populate(
        "programId"
      );
    } else {
      registration = await MenteeRegistration.findById(id).populate(
        "programId"
      );
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only rejected registrations can be reconsidered
    if (
      registration.status !== MentorRegistrationStatus.REJECTED &&
      registration.status !== MenteeRegistrationStatus.REJECTED
    ) {
      return res.status(400).json({
        success: false,
        message: "Only rejected registrations can be reconsidered",
      });
    }

    // Update registration
    if (type === "mentor") {
      registration.status = MentorRegistrationStatus.SUBMITTED;
    } else {
      registration.status = MenteeRegistrationStatus.SUBMITTED;
    }

    registration.rejectedBy = undefined;
    registration.rejectedAt = undefined;
    registration.rejectionReason = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "reconsider",
      performedBy: userId as any,
      performedAt: new Date(),
      notes: notes || undefined,
    });

    await registration.save();

    // Send reconsideration email
    const program = registration.programId as any;
    const recipientEmail =
      type === "mentor"
        ? (registration as any).preferredMailingAddress
        : registration.preferredMailingAddress;
    const recipientName =
      type === "mentor"
        ? (registration as any).preferredName
        : `${registration.firstName} ${registration.lastName}`;

    try {
      await emailService.sendEmail({
        to: recipientEmail,
        subject: `Registration Reconsidered - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Registration Reconsidered</h2>
          <p>Dear ${recipientName},</p>
          <p>Your registration for the <strong>${program?.name || "Mentoring Program"}</strong> has been reconsidered and is now back in review.</p>
          <p>You will be notified once a decision has been made.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send reconsideration email:", emailError);
    }

    return res.json({
      success: true,
      message: "Registration reconsidered successfully",
      data: { registration },
    });
  } catch (error) {
    logger.error("Reconsider registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reconsider registration",
    });
  }
};

// Disapprove registration (change approved to rejected)
export const disapproveRegistration = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { type, reason, notes } = req.body; // type: "mentor" | "mentee"
    const userId = req.user?._id || req.userId;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Reason is required and must be at least 10 characters",
      });
    }

    let registration: any;

    if (type === "mentor") {
      registration = await MentorRegistration.findById(id).populate(
        "programId"
      );
    } else {
      registration = await MenteeRegistration.findById(id).populate(
        "programId"
      );
    }

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Check tenant
    if (registration.tenantId.toString() !== req.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Only approved registrations can be disapproved
    if (
      registration.status !== MentorRegistrationStatus.APPROVED &&
      registration.status !== MenteeRegistrationStatus.APPROVED
    ) {
      return res.status(400).json({
        success: false,
        message: "Only approved registrations can be disapproved",
      });
    }

    // Update registration
    if (type === "mentor") {
      registration.status = MentorRegistrationStatus.REJECTED;
    } else {
      registration.status = MenteeRegistrationStatus.REJECTED;
    }

    registration.rejectedBy = userId as any;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason;
    registration.approvedBy = undefined;
    registration.approvedAt = undefined;

    // Add to approval history
    if (!registration.approvalHistory) {
      registration.approvalHistory = [];
    }
    registration.approvalHistory.push({
      action: "disapprove",
      performedBy: userId as any,
      performedAt: new Date(),
      reason: reason,
      notes: notes || undefined,
    });

    await registration.save();

    // Send disapproval email
    const program = registration.programId as any;
    const recipientEmail =
      type === "mentor"
        ? (registration as any).preferredMailingAddress
        : registration.preferredMailingAddress;
    const recipientName =
      type === "mentor"
        ? (registration as any).preferredName
        : `${registration.firstName} ${registration.lastName}`;

    try {
      await emailService.sendEmail({
        to: recipientEmail,
        subject: `Registration Status Update - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Registration Status Update</h2>
          <p>Dear ${recipientName},</p>
          <p>We regret to inform you that your previously approved registration for the <strong>${program?.name || "Mentoring Program"}</strong> has been disapproved.</p>
          <p><strong>Reason:</strong></p>
          <p>${reason}</p>
          <p>If you have any questions or concerns, please feel free to contact us.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send disapproval email:", emailError);
    }

    return res.json({
      success: true,
      message: "Registration disapproved successfully",
      data: { registration },
    });
  } catch (error) {
    logger.error("Disapprove registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disapprove registration",
    });
  }
};

// Fill form on behalf (create/edit registration)
export const fillFormOnBehalf = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { type, registrationId, ...formData } = req.body; // type: "mentor" | "mentee"

    // This will reuse the existing submit/update endpoints
    // For now, return a message indicating this should be handled via the registration endpoints
    return res.json({
      success: true,
      message:
        "Please use the registration endpoints to create or update registrations on behalf of users",
      data: {
        endpoints: {
          mentor: {
            create: "POST /api/v1/mentor-registrations/on-behalf",
            update: "PUT /api/v1/mentor-registrations/:id",
          },
          mentee: {
            create: "POST /api/v1/mentee-registrations/on-behalf",
            update: "PUT /api/v1/mentee-registrations/:id",
          },
        },
      },
    });
  } catch (error) {
    logger.error("Fill form on behalf error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process request",
    });
  }
};

// Get approval statistics
export const getApprovalStatistics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.query;
    const tenantId = req.tenantId;

    const query: any = { tenantId };
    if (programId) {
      query.programId = programId;
    }

    // Mentor statistics
    const mentorStats = {
      pending: await MentorRegistration.countDocuments({
        ...query,
        status: MentorRegistrationStatus.SUBMITTED,
      }),
      approved: await MentorRegistration.countDocuments({
        ...query,
        status: MentorRegistrationStatus.APPROVED,
      }),
      rejected: await MentorRegistration.countDocuments({
        ...query,
        status: MentorRegistrationStatus.REJECTED,
      }),
    };

    // Mentee statistics
    const menteeStats = {
      pending: await MenteeRegistration.countDocuments({
        ...query,
        status: MenteeRegistrationStatus.SUBMITTED,
      }),
      approved: await MenteeRegistration.countDocuments({
        ...query,
        status: MenteeRegistrationStatus.APPROVED,
      }),
      rejected: await MenteeRegistration.countDocuments({
        ...query,
        status: MenteeRegistrationStatus.REJECTED,
      }),
    };

    return res.json({
      success: true,
      data: {
        mentors: mentorStats,
        mentees: menteeStats,
        total: {
          pending: mentorStats.pending + menteeStats.pending,
          approved: mentorStats.approved + menteeStats.approved,
          rejected: mentorStats.rejected + menteeStats.rejected,
        },
      },
    });
  } catch (error) {
    logger.error("Get approval statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch approval statistics",
    });
  }
};

