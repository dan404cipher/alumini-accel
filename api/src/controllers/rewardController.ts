import { Request, Response } from "express";
import mongoose from "mongoose";
import RewardType from "../models/RewardType";
import PointsEntry from "../models/PointsEntry";
import AlumniPoints from "../models/AlumniPoints";
import RedeemRequest from "../models/RedeemRequest";
import User from "../models/User";
import { logger } from "../utils/logger";
import {
  RewardTriggerEvent,
  RewardTypeStatus,
  RedeemRequestStatus,
  PointsEntryStatus,
} from "../types";
import { awardPointsForTrigger } from "../services/pointsService";
import { emailService } from "../services/emailService";

// Helper function to award points (used by addManualPoints)
const awardPoints = async (
  alumniId: mongoose.Types.ObjectId,
  points: number,
  activity: string,
  source: string,
  notes?: string,
  rewardTypeId?: mongoose.Types.ObjectId,
  tenantId?: mongoose.Types.ObjectId
): Promise<{ success: boolean; message?: string }> => {
  try {
    const pointsEntry = new PointsEntry({
      alumniId,
      points,
      activity,
      date: new Date(),
      source,
      status: PointsEntryStatus.AWARDED,
      notes,
      rewardTypeId,
      tenantId,
    });

    await pointsEntry.save();

    let alumniPoints = await AlumniPoints.findOne({ alumniId });
    if (!alumniPoints) {
      alumniPoints = new AlumniPoints({
        alumniId,
        totalPoints: 0,
        redeemedPoints: 0,
        availablePoints: 0,
        tenantId,
      });
    }

    alumniPoints.totalPoints += points;
    await alumniPoints.save();

    return { success: true };
  } catch (error: any) {
    logger.error("Error awarding points:", error);
    return { success: false, message: error.message || "Failed to award points" };
  }
};

export const createRewardType = async (req: Request, res: Response) => {
  try {
    const { name, description, points, triggerEvent, status } = req.body;
    const tenantId = req.user?.tenantId;

    const existingRewardType = await RewardType.findOne({
      triggerEvent,
      tenantId: tenantId || { $exists: false },
    });

    if (existingRewardType) {
      return res.status(400).json({
        success: false,
        message: `A reward type for ${triggerEvent} already exists for this tenant`,
      });
    }

    const rewardType = new RewardType({
      name,
      description,
      points,
      triggerEvent,
      status: status || RewardTypeStatus.ACTIVE,
      tenantId,
    });

    await rewardType.save();

    return res.status(201).json({
      success: true,
      message: "Reward type created successfully",
      data: { rewardType },
    });
  } catch (error: any) {
    logger.error("Create reward type error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create reward type",
    });
  }
};

export const getAllRewardTypes = async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;
    const tenantId = req.user?.tenantId;

    const filter: any = {};
    if (tenantId) {
      filter.tenantId = tenantId;
    } else {
      filter.tenantId = { $exists: false };
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const rewardTypes = await RewardType.find(filter).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { rewardTypes },
    });
  } catch (error: any) {
    logger.error("Get all reward types error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reward types",
    });
  }
};

export const updateRewardType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, points, triggerEvent, status } = req.body;
    const tenantId = req.user?.tenantId;

    const rewardType = await RewardType.findById(id);
    if (!rewardType) {
      return res.status(404).json({
        success: false,
        message: "Reward type not found",
      });
    }

    if (tenantId && rewardType.tenantId?.toString() !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (triggerEvent && triggerEvent !== rewardType.triggerEvent) {
      const existingRewardType = await RewardType.findOne({
        triggerEvent,
        tenantId: tenantId || { $exists: false },
        _id: { $ne: id },
      });

      if (existingRewardType) {
        return res.status(400).json({
          success: false,
          message: `A reward type for ${triggerEvent} already exists for this tenant`,
        });
      }
    }

    if (name !== undefined) rewardType.name = name;
    if (description !== undefined) rewardType.description = description;
    if (points !== undefined) rewardType.points = points;
    if (triggerEvent !== undefined) rewardType.triggerEvent = triggerEvent;
    if (status !== undefined) rewardType.status = status;

    await rewardType.save();

    return res.json({
      success: true,
      message: "Reward type updated successfully",
      data: { rewardType },
    });
  } catch (error: any) {
    logger.error("Update reward type error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update reward type",
    });
  }
};

export const deleteRewardType = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const rewardType = await RewardType.findById(id);
    if (!rewardType) {
      return res.status(404).json({
        success: false,
        message: "Reward type not found",
      });
    }

    if (tenantId && rewardType.tenantId?.toString() !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await RewardType.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Reward type deleted successfully",
    });
  } catch (error: any) {
    logger.error("Delete reward type error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete reward type",
    });
  }
};

export const getAlumniPoints = async (req: Request, res: Response) => {
  try {
    const { alumniId } = req.params;

    const alumniPoints = await AlumniPoints.findOne({ alumniId }).populate(
      "alumniId",
      "firstName lastName email"
    );

    if (!alumniPoints) {
      return res.json({
        success: true,
        data: {
          alumniPoints: {
            alumniId,
            totalPoints: 0,
            redeemedPoints: 0,
            availablePoints: 0,
          },
        },
      });
    }

    return res.json({
      success: true,
      data: { alumniPoints },
    });
  } catch (error: any) {
    logger.error("Get alumni points error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch alumni points",
    });
  }
};

export const getAllAlumniPoints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const tenantId = req.user?.tenantId;

    const filter: any = {};
    if (tenantId) {
      filter.tenantId = tenantId;
    }

    const query = AlumniPoints.find(filter).populate(
      "alumniId",
      "firstName lastName email"
    );

    if (search) {
      query.find({
        $or: [
          { "alumniId.firstName": { $regex: search, $options: "i" } },
          { "alumniId.lastName": { $regex: search, $options: "i" } },
          { "alumniId.email": { $regex: search, $options: "i" } },
        ],
      });
    }

    const [alumniPoints, total] = await Promise.all([
      query.skip(skip).limit(limit).sort({ totalPoints: -1 }),
      AlumniPoints.countDocuments(filter),
    ]);

    const formattedPoints = alumniPoints.map((ap: any) => ({
      _id: ap._id,
      alumniId: ap.alumniId._id || ap.alumniId,
      alumniName: ap.alumniId
        ? `${ap.alumniId.firstName || ""} ${ap.alumniId.lastName || ""}`.trim() ||
          ap.alumniId.email ||
          "Unknown"
        : "Unknown",
      email: ap.alumniId?.email || "",
      totalPoints: ap.totalPoints || 0,
      redeemedPoints: ap.redeemedPoints || 0,
      availablePoints: ap.availablePoints || 0,
      updatedAt: ap.updatedAt,
    }));

    return res.json({
      success: true,
      data: {
        alumniPoints: formattedPoints,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get all alumni points error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch alumni points",
    });
  }
};

export const addManualPoints = async (req: Request, res: Response) => {
  try {
    const { alumniId, points, activity, notes } = req.body;
    const tenantId = req.user?.tenantId;

    if (!alumniId || !points || !activity) {
      return res.status(400).json({
        success: false,
        message: "Alumni ID, points, and activity are required",
      });
    }

    if (points < 1) {
      return res.status(400).json({
        success: false,
        message: "Points must be at least 1",
      });
    }

    const alumni = await User.findById(alumniId);
    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: "Alumni not found",
      });
    }

    const result = await awardPointsForTrigger(
      alumniId,
      RewardTriggerEvent.MANUAL_ADJUSTMENT,
      {
        activity,
      },
      tenantId || alumni.tenantId
    );

    if (!result.success) {
      const awardResult = await awardPoints(
        new mongoose.Types.ObjectId(alumniId),
        points,
        activity,
        "Manual Adjustment",
        notes,
        undefined,
        tenantId || alumni.tenantId
      );

      if (!awardResult.success) {
        return res.status(500).json({
          success: false,
          message: awardResult.message || "Failed to add points",
        });
      }

      try {
        await emailService.sendRewardEarnedEmail(alumni.email, points, activity);
      } catch (emailError) {
        logger.error("Failed to send points earned email:", emailError);
      }

      return res.json({
        success: true,
        message: `Successfully added ${points} points to ${alumni.firstName || "alumni"}`,
        data: { pointsAwarded: points },
      });
    }

    return res.json({
      success: true,
      message: result.message || `Successfully added ${result.pointsAwarded} points`,
      data: { pointsAwarded: result.pointsAwarded },
    });
  } catch (error: any) {
    logger.error("Add manual points error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add points",
    });
  }
};

export const getAlumniPointsHistory = async (req: Request, res: Response) => {
  try {
    const { alumniId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { alumniId };

    const [pointsHistory, total] = await Promise.all([
      PointsEntry.find(filter)
        .populate("rewardTypeId", "name points")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      PointsEntry.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        pointsHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get alumni points history error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch points history",
    });
  }
};

// Get my points (for authenticated alumni)
export const getMyPoints = async (req: Request, res: Response) => {
  try {
    const alumniId = req.user?.id || req.user?._id;

    if (!alumniId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const alumniPoints = await AlumniPoints.findOne({ alumniId }).populate(
      "alumniId",
      "firstName lastName email"
    );

    if (!alumniPoints) {
      return res.json({
        success: true,
        data: {
          alumniPoints: {
            alumniId,
            totalPoints: 0,
            redeemedPoints: 0,
            availablePoints: 0,
          },
        },
      });
    }

    return res.json({
      success: true,
      data: { alumniPoints },
    });
  } catch (error: any) {
    logger.error("Get my points error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch points",
    });
  }
};

// Get my points history (for authenticated alumni)
export const getMyPointsHistory = async (req: Request, res: Response) => {
  try {
    const alumniId = req.user?.id || req.user?._id;

    if (!alumniId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = { alumniId };

    const [pointsHistory, total] = await Promise.all([
      PointsEntry.find(filter)
        .populate("rewardTypeId", "name points")
        .sort({ date: -1 })
        .skip(skip)
        .limit(limit),
      PointsEntry.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        pointsHistory,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get my points history error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch points history",
    });
  }
};

export const createRedeemRequest = async (req: Request, res: Response) => {
  try {
    const { rewardOption, pointsUsed, deliveryEmail, notes } = req.body;
    const alumniId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!alumniId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!rewardOption || !pointsUsed || !deliveryEmail) {
      return res.status(400).json({
        success: false,
        message: "Reward option, points used, and delivery email are required",
      });
    }

    let alumniPoints = await AlumniPoints.findOne({ alumniId });
    if (!alumniPoints) {
      alumniPoints = new AlumniPoints({
        alumniId: new mongoose.Types.ObjectId(alumniId),
        totalPoints: 0,
        redeemedPoints: 0,
        availablePoints: 0,
        tenantId,
      });
      await alumniPoints.save();
    }

    if (alumniPoints.availablePoints < pointsUsed) {
      return res.status(400).json({
        success: false,
        message: `Insufficient points. You have ${alumniPoints.availablePoints} available points, but need ${pointsUsed}`,
      });
    }

    const redeemRequest = new RedeemRequest({
      alumniId: new mongoose.Types.ObjectId(alumniId),
      rewardOption,
      pointsUsed,
      status: RedeemRequestStatus.PENDING,
      deliveryEmail,
      notes,
      tenantId,
    });

    await redeemRequest.save();

    alumniPoints.redeemedPoints += pointsUsed;
    await alumniPoints.save();

    try {
      await emailService.sendRedeemRequestSubmittedEmail(
        deliveryEmail,
        rewardOption,
        pointsUsed
      );
    } catch (emailError) {
      logger.error("Failed to send redemption request submitted email:", emailError);
    }

    return res.status(201).json({
      success: true,
      message: "Redemption request submitted successfully",
      data: { redeemRequest },
    });
  } catch (error: any) {
    logger.error("Create redeem request error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create redemption request",
    });
  }
};

export const getRedeemRequests = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const tenantId = req.user?.tenantId;

    const filter: any = {};
    if (tenantId) {
      filter.tenantId = tenantId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    const [redeemRequests, total] = await Promise.all([
      RedeemRequest.find(filter)
        .populate("alumniId", "firstName lastName email")
        .populate("approvedBy", "firstName lastName email")
        .populate("rejectedBy", "firstName lastName email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      RedeemRequest.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        redeemRequests,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error: any) {
    logger.error("Get redeem requests error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch redemption requests",
    });
  }
};

export const approveRedeemRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const approverId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    const redeemRequest = await RedeemRequest.findById(id).populate(
      "alumniId",
      "email firstName lastName"
    );

    if (!redeemRequest) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found",
      });
    }

    if (tenantId && redeemRequest.tenantId?.toString() !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (redeemRequest.status !== RedeemRequestStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Request is already ${redeemRequest.status}`,
      });
    }

    redeemRequest.status = RedeemRequestStatus.APPROVED;
    redeemRequest.approvedBy = new mongoose.Types.ObjectId(approverId as string);
    redeemRequest.approvedAt = new Date();
    await redeemRequest.save();

    try {
      await emailService.sendRedeemRequestApprovedEmail(
        redeemRequest.deliveryEmail,
        redeemRequest.rewardOption,
        redeemRequest.pointsUsed
      );
    } catch (emailError) {
      logger.error("Failed to send redemption approval email:", emailError);
    }

    return res.json({
      success: true,
      message: "Redemption request approved successfully",
      data: { redeemRequest },
    });
  } catch (error: any) {
    logger.error("Approve redeem request error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to approve redemption request",
    });
  }
};

export const rejectRedeemRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const rejectorId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!rejectionReason || rejectionReason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required and must be at least 10 characters",
      });
    }

    const redeemRequest = await RedeemRequest.findById(id).populate(
      "alumniId",
      "email firstName lastName"
    );

    if (!redeemRequest) {
      return res.status(404).json({
        success: false,
        message: "Redemption request not found",
      });
    }

    if (tenantId && redeemRequest.tenantId?.toString() !== tenantId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    if (redeemRequest.status !== RedeemRequestStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: `Request is already ${redeemRequest.status}`,
      });
    }

    redeemRequest.status = RedeemRequestStatus.REJECTED;
    redeemRequest.rejectedBy = new mongoose.Types.ObjectId(rejectorId as string);
    redeemRequest.rejectedAt = new Date();
    redeemRequest.rejectionReason = rejectionReason.trim();
    await redeemRequest.save();

    const alumniPoints = await AlumniPoints.findOne({
      alumniId: redeemRequest.alumniId,
    });

    if (alumniPoints) {
      alumniPoints.redeemedPoints = Math.max(
        0,
        alumniPoints.redeemedPoints - redeemRequest.pointsUsed
      );
      await alumniPoints.save();
    }

    try {
      const refundEntry = new PointsEntry({
        alumniId: redeemRequest.alumniId,
        points: redeemRequest.pointsUsed,
        activity: `Refund for rejected redemption: ${redeemRequest.rewardOption}`,
        date: new Date(),
        source: "Redemption Refund",
        status: PointsEntryStatus.AWARDED,
        notes: `Points refunded due to rejection of redemption request`,
        tenantId: redeemRequest.tenantId,
      });
      await refundEntry.save();

      if (alumniPoints) {
        alumniPoints.totalPoints += redeemRequest.pointsUsed;
        await alumniPoints.save();
      }
    } catch (refundError) {
      logger.error("Failed to create refund points entry:", refundError);
    }

    try {
      await emailService.sendRedeemRequestRejectedEmail(
        redeemRequest.deliveryEmail,
        redeemRequest.rewardOption,
        rejectionReason.trim()
      );
    } catch (emailError) {
      logger.error("Failed to send redemption rejection email:", emailError);
    }

    return res.json({
      success: true,
      message: "Redemption request rejected successfully. Points have been refunded.",
      data: { redeemRequest },
    });
  } catch (error: any) {
    logger.error("Reject redeem request error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to reject redemption request",
    });
  }
};

export default {
  createRewardType,
  getAllRewardTypes,
  updateRewardType,
  deleteRewardType,
  getAlumniPoints,
  getAllAlumniPoints,
  addManualPoints,
  getAlumniPointsHistory,
  getMyPoints,
  getMyPointsHistory,
  createRedeemRequest,
  getRedeemRequests,
  approveRedeemRequest,
  rejectRedeemRequest,
};
