import { Request, Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { Report } from "../models/Report";
import CommunityPost from "../models/CommunityPost";
import CommunityComment from "../models/CommunityComment";
import CommunityMembership from "../models/CommunityMembership";
import Community from "../models/Community";
import { IUser } from "../types";

interface AuthenticatedRequest extends Request {
  user?: IUser;
}

// Create a report
export const createReport = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { entityId, entityType, reason, description } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate required fields
    if (!entityId || !entityType || !reason) {
      return res.status(400).json({
        success: false,
        message: "Entity ID, entity type, and reason are required",
      });
    }

    // Validate entity type
    if (!["post", "comment"].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity type. Must be 'post' or 'comment'",
      });
    }

    // Validate reason
    const validReasons = [
      "spam",
      "harassment",
      "inappropriate_content",
      "hate_speech",
      "violence",
      "misinformation",
      "copyright_violation",
      "other",
    ];

    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: "Invalid reason",
      });
    }

    // Check if entity exists
    let entity;
    if (entityType === "post") {
      entity = await CommunityPost.findById(entityId);
    } else {
      entity = await CommunityComment.findById(entityId);
    }

    if (!entity) {
      return res.status(404).json({
        success: false,
        message: `${entityType} not found`,
      });
    }

    // Check if user has already reported this entity
    const existingReport = await Report.findOne({
      reporterId: userId,
      reportedEntityId: entityId,
      reportedEntityType: entityType,
    });

    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: "You have already reported this content",
      });
    }

    // Check if user is trying to report their own content
    if (entityType === "post") {
      if ((entity as any).authorId.toString() === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot report your own post",
        });
      }
    } else {
      if ((entity as any).authorId.toString() === userId.toString()) {
        return res.status(400).json({
          success: false,
          message: "You cannot report your own comment",
        });
      }
    }

    // Create the report
    const report = new Report({
      reporterId: userId,
      reportedEntityId: entityId,
      reportedEntityType: entityType,
      reason,
      description: description?.trim(),
    });

    await report.save();
    await report.populate("reporterId", "firstName lastName email");

    logger.info(
      `Report created: ${entityType} ${entityId} reported by user ${userId}`
    );

    return res.status(201).json({
      success: true,
      message: "Report submitted successfully",
      data: report,
    });
  }
);

// Get reports for a specific entity
export const getEntityReports = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { entityId, entityType } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate entity type
    if (!["post", "comment"].includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid entity type",
      });
    }

    // Check if user has permission to view reports (moderator/admin)
    let hasPermission = false;

    if (entityType === "post") {
      const post = await CommunityPost.findById(entityId);
      if (post) {
        const membership = await CommunityMembership.findOne({
          communityId: post.communityId,
          userId: userId,
          status: "approved",
        });
        hasPermission =
          (membership as any)?.canModerate() ||
          req.user?.role === "super_admin";
      }
    } else {
      const comment = await CommunityComment.findById(entityId);
      if (comment) {
        const post = await CommunityPost.findById(comment.postId);
        if (post) {
          const membership = await CommunityMembership.findOne({
            communityId: post.communityId,
            userId: userId,
            status: "approved",
          });
          hasPermission =
            (membership as any)?.canModerate() ||
            req.user?.role === "super_admin";
        }
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to view reports",
      });
    }

    const reports = await Report.getReportsByEntity(
      entityId,
      entityType as "post" | "comment"
    );

    return res.json({
      success: true,
      data: reports,
    });
  }
);

// Get all pending reports (admin/moderator only)
export const getPendingReports = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user is super_admin or college_admin
    const isSuperAdmin = req.user?.role === "super_admin";
    const isCollegeAdmin = req.user?.role === "college_admin";

    if (!isSuperAdmin && !isCollegeAdmin) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to view all pending reports",
      });
    }

    const reports = await Report.getReportsByStatus("pending");

    return res.json({
      success: true,
      data: reports,
    });
  }
);

// Get reports for a specific community (moderators can use this)
export const getCommunityReports = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { communityId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if user can moderate this community
    const membership = await CommunityMembership.findOne({
      communityId: communityId,
      userId: userId,
      status: "approved",
    });

    const community = await Community.findById(communityId);
    const isCreator = community?.createdBy.toString() === userId.toString();
    const isAdmin = membership?.role === "admin";
    const canModerate = (membership as any)?.canModerate() || false;
    const isSuperAdmin = req.user?.role === "super_admin";
    const isCollegeAdmin = req.user?.role === "college_admin";

    if (
      !isCreator &&
      !isAdmin &&
      !canModerate &&
      !isSuperAdmin &&
      !isCollegeAdmin
    ) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions to view community reports",
      });
    }

    // Get all reports for posts and comments in this community
    const communityPosts = await CommunityPost.find({ communityId }).select(
      "_id"
    );
    const postIds = communityPosts.map((post) => post._id);

    const communityComments = await CommunityComment.find({
      postId: { $in: postIds },
    }).select("_id");
    const commentIds = communityComments.map((comment) => comment._id);

    const reports = await Report.find({
      $or: [
        { reportedEntityId: { $in: postIds }, reportedEntityType: "post" },
        {
          reportedEntityId: { $in: commentIds },
          reportedEntityType: "comment",
        },
      ],
    })
      .populate("reporterId", "firstName lastName email")
      .populate("reviewedBy", "firstName lastName")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: reports,
    });
  }
);

// Update report status (admin/moderator only)
export const updateReportStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { reportId } = req.params;
    const { status, resolution } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Only super admins can update report status
    if (req.user?.role !== "super_admin") {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const validStatuses = ["pending", "reviewed", "resolved", "dismissed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;
    report.reviewedBy = userId as any;
    report.reviewedAt = new Date();
    if (resolution) {
      report.resolution = resolution.trim();
    }

    await report.save();

    logger.info(
      `Report ${reportId} status updated to ${status} by user ${userId}`
    );

    return res.json({
      success: true,
      message: "Report status updated successfully",
      data: report,
    });
  }
);

// Get user's own reports
export const getUserReports = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const reports = await Report.getReportsByReporter(userId.toString());

    return res.json({
      success: true,
      data: reports,
    });
  }
);
