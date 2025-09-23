import { Request, Response } from "express";
import { Invitation, IInvitation } from "../models/Invitation";
import User from "../models/User";
import { emailService } from "../services/emailService";
import { logger } from "../utils/logger";
import crypto from "crypto";

export const sendInvitation = async (req: Request, res: Response) => {
  try {
    const {
      name,
      email,
      graduationYear,
      degree,
      currentRole,
      company,
      location,
      linkedinProfile,
    } = req.body;

    const invitedBy = req.user?._id;

    if (!invitedBy) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if invitation already exists and is not expired
    const existingInvitation = await Invitation.findOne({
      email,
      status: { $in: ["pending", "sent"] },
      expiresAt: { $gt: new Date() },
    });

    if (existingInvitation) {
      return res.status(400).json({
        success: false,
        message: "Invitation already sent to this email",
      });
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString("hex");

    // Set expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const invitation = new Invitation({
      name,
      email,
      graduationYear,
      degree,
      currentRole,
      company,
      location,
      linkedinProfile,
      token,
      expiresAt,
      invitedBy,
      status: "pending",
    });

    await invitation.save();

    // Get inviter's name
    const inviter = await User.findById(invitedBy);
    const inviterName = inviter
      ? `${inviter.firstName} ${inviter.lastName}`
      : "AlumniAccel Team";

    // Generate invitation link
    const invitationLink = `${process.env.FRONTEND_URL || "http://localhost:8080"}/register?token=${token}`;

    // Send email
    const emailSent = await emailService.sendAlumniInvitation({
      name,
      email,
      graduationYear,
      degree,
      currentRole,
      company,
      location,
      invitationLink,
      invitedBy: inviterName,
    });

    if (emailSent) {
      // Update invitation status
      invitation.status = "sent";
      invitation.sentAt = new Date();
      await invitation.save();

      logger.info(`Invitation sent successfully to ${email} by ${inviterName}`);

      return res.status(200).json({
        success: true,
        message: "Invitation sent successfully",
        data: {
          invitationId: invitation._id,
          email,
          expiresAt,
        },
      });
    } else {
      // Email failed to send
      logger.error(`Failed to send invitation email to ${email}`);

      return res.status(500).json({
        success: false,
        message: "Failed to send invitation email",
      });
    }
  } catch (error) {
    logger.error("Error sending invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getInvitationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: { $in: ["pending", "sent"] },
      expiresAt: { $gt: new Date() },
    }).populate("invitedBy", "firstName lastName email");

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired invitation",
      });
    }

    return res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error) {
    logger.error("Error getting invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const acceptInvitation = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    const invitation = await Invitation.findOne({
      token,
      status: { $in: ["pending", "sent"] },
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired invitation",
      });
    }

    // Mark invitation as accepted
    invitation.status = "accepted";
    invitation.acceptedAt = new Date();
    await invitation.save();

    return res.status(200).json({
      success: true,
      message: "Invitation accepted successfully",
    });
  } catch (error) {
    logger.error("Error accepting invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getInvitations = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const invitedBy = req.user?._id;

    if (!invitedBy) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const query: any = { invitedBy };
    if (status) {
      query.status = status;
    }

    const invitations = await Invitation.find(query)
      .populate("invitedBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const total = await Invitation.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        invitations,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    logger.error("Error getting invitations:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkInvitationExists = async (req: Request, res: Response) => {
  try {
    const { email } = req.params;

    const existingInvitation = await Invitation.findOne({
      email,
      status: { $in: ["pending", "sent"] },
      expiresAt: { $gt: new Date() },
    });

    return res.status(200).json({
      success: true,
      data: {
        exists: !!existingInvitation,
        invitation: existingInvitation || null,
      },
    });
  } catch (error) {
    logger.error("Error checking invitation:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
