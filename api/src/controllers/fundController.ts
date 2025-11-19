import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import Fund from "../models/Fund";
import Campaign from "../models/Campaign";
import { logger } from "../utils/logger";
import { asyncHandler } from "../middleware/errorHandler";

// Create new fund
export const createFund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { name, description, status } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "Name and description are required",
      });
    }

    const fund = new Fund({
      name,
      description,
      tenantId: req.user?.tenantId,
      createdBy: req.user?.id,
      status: status || "active",
      totalRaised: 0,
      campaigns: [],
    });

    await fund.save();

    return res.status(201).json({
      success: true,
      message: "Fund created successfully",
      data: fund,
    });
  }
);

// Get all funds
export const getAllFunds = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter: any = {};

    // Multi-tenant filtering
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    } else if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    }

    if (status) {
      filter.status = status;
    }

    const funds = await Fund.find(filter)
      .populate("createdBy", "firstName lastName email")
      .populate("campaigns", "title currentAmount targetAmount status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Fund.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: funds,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  }
);

// Get fund by ID
export const getFundById = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const fund = await Fund.findById(id)
      .populate("createdBy", "firstName lastName email")
      .populate("campaigns", "title currentAmount targetAmount status startDate endDate");

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: "Fund not found",
      });
    }

    // Check tenant access
    if (
      req.user?.role !== "super_admin" &&
      fund.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this fund",
      });
    }

    return res.status(200).json({
      success: true,
      data: fund,
    });
  }
);

// Update fund
export const updateFund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { name, description, status } = req.body;

    const fund = await Fund.findById(id);

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: "Fund not found",
      });
    }

    // Check tenant access
    if (
      req.user?.role !== "super_admin" &&
      fund.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this fund",
      });
    }

    if (name) fund.name = name;
    if (description) fund.description = description;
    if (status) fund.status = status;

    await fund.save();

    return res.status(200).json({
      success: true,
      message: "Fund updated successfully",
      data: fund,
    });
  }
);

// Delete fund (soft delete - set status to archived)
export const deleteFund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const fund = await Fund.findById(id);

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: "Fund not found",
      });
    }

    // Check tenant access
    if (
      req.user?.role !== "super_admin" &&
      fund.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this fund",
      });
    }

    // Check if fund has active campaigns
    const activeCampaigns = await Campaign.countDocuments({
      fundId: id,
      status: { $in: ["active", "draft"] },
    });

    if (activeCampaigns > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete fund with ${activeCampaigns} active campaign(s). Please archive or complete campaigns first.`,
      });
    }

    // Soft delete - set status to archived
    fund.status = "archived";
    await fund.save();

    return res.status(200).json({
      success: true,
      message: "Fund archived successfully",
      data: fund,
    });
  }
);

// Get fund statistics
export const getFundStats = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const fund = await Fund.findById(id);

    if (!fund) {
      return res.status(404).json({
        success: false,
        message: "Fund not found",
      });
    }

    // Check tenant access
    if (
      req.user?.role !== "super_admin" &&
      fund.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this fund",
      });
    }

    // Update total raised from campaigns
    await fund.updateTotalRaised();

    // Get campaign statistics
    const campaigns = await Campaign.find({ fundId: id });
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;

    return res.status(200).json({
      success: true,
      data: {
        fund: {
          id: fund._id,
          name: fund.name,
          totalRaised: fund.totalRaised,
          campaignCount: fund.campaigns.length,
        },
        campaigns: {
          total: campaigns.length,
          active: activeCampaigns,
          completed: completedCampaigns,
        },
      },
    });
  }
);

