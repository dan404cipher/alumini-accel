import { Request, Response } from "express";
import Campaign from "@/models/Campaign";
import Donation from "@/models/Donation";
import { logger } from "@/utils/logger";
import { asyncHandler } from "@/middleware/errorHandler";

// @desc    Get all campaigns
// @route   GET /api/v1/campaigns
// @access  Private
export const getAllCampaigns = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const featured = req.query.featured as string;
    const tenantId = req.user?.tenantId;

    const query: any = {};

    // Filter by tenant if not super admin
    if (req.user?.role !== "super_admin") {
      query.tenantId = tenantId;
    }

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (featured === "true") {
      query.featured = true;
    }

    const skip = (page - 1) * limit;

    const campaigns = await Campaign.find(query)
      .populate("createdBy", "firstName lastName email")
      .populate("tenantId", "name domain")
      .select("-__v")
      .sort({ featured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Campaign.countDocuments(query);

    return res.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      },
    });
  }
);

// @desc    Get campaign by ID
// @route   GET /api/v1/campaigns/:id
// @access  Private
export const getCampaignById = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id)
      .populate("createdBy", "firstName lastName email")
      .populate("tenantId", "name domain")
      .populate("statistics.topDonor.userId", "firstName lastName")
      .select("-__v");

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check tenant access
    if (
      req.user?.role !== "super_admin" &&
      campaign.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get recent donations
    const recentDonations = await Donation.find({
      campaignId: campaign._id,
      status: "completed",
    })
      .populate("donor", "firstName lastName")
      .select("amount anonymous createdAt message")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({
      success: true,
      data: {
        campaign,
        recentDonations,
      },
    });
  }
);

// @desc    Create new campaign
// @route   POST /api/v1/campaigns
// @access  Private/Admin/HOD/Staff
export const createCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      title,
      description,
      category,
      targetAmount,
      currency,
      startDate,
      endDate,
      images,
      documents,
      allowAnonymous,
      featured,
      tags,
      location,
      contactInfo,
    } = req.body;

    const campaign = new Campaign({
      title,
      description,
      tenantId: req.user?.tenantId,
      createdBy: req.user?.id,
      category,
      targetAmount,
      currency: currency || "INR",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      images: images || [],
      documents: documents || [],
      allowAnonymous: allowAnonymous ?? true,
      featured: featured ?? false,
      tags: tags || [],
      location,
      contactInfo: {
        email: contactInfo.email,
        phone: contactInfo.phone,
        person: contactInfo.person,
      },
    });

    await campaign.save();

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate("createdBy", "firstName lastName email")
      .populate("tenantId", "name domain")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Campaign created successfully",
      data: populatedCampaign,
    });
  }
);

// @desc    Update campaign
// @route   PUT /api/v1/campaigns/:id
// @access  Private/Admin/HOD/Staff
export const updateCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check access
    if (
      req.user?.role !== "super_admin" &&
      campaign.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const {
      title,
      description,
      category,
      targetAmount,
      currency,
      startDate,
      endDate,
      images,
      documents,
      allowAnonymous,
      featured,
      tags,
      location,
      contactInfo,
      status,
    } = req.body;

    // Update fields
    if (title) campaign.title = title;
    if (description) campaign.description = description;
    if (category) campaign.category = category;
    if (targetAmount) campaign.targetAmount = targetAmount;
    if (currency) campaign.currency = currency;
    if (startDate) campaign.startDate = new Date(startDate);
    if (endDate) campaign.endDate = new Date(endDate);
    if (images) campaign.images = images;
    if (documents) campaign.documents = documents;
    if (allowAnonymous !== undefined) campaign.allowAnonymous = allowAnonymous;
    if (featured !== undefined) campaign.featured = featured;
    if (tags) campaign.tags = tags;
    if (location !== undefined) campaign.location = location;
    if (contactInfo)
      campaign.contactInfo = { ...campaign.contactInfo, ...contactInfo };
    if (status) campaign.status = status;

    await campaign.save();

    const populatedCampaign = await Campaign.findById(campaign._id)
      .populate("createdBy", "firstName lastName email")
      .populate("tenantId", "name domain")
      .select("-__v");

    return res.json({
      success: true,
      message: "Campaign updated successfully",
      data: populatedCampaign,
    });
  }
);

// @desc    Delete campaign
// @route   DELETE /api/v1/campaigns/:id
// @access  Private/Admin/HOD/Staff
export const deleteCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check access
    if (
      req.user?.role !== "super_admin" &&
      campaign.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    await Campaign.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Campaign deleted successfully",
    });
  }
);

// @desc    Add campaign update
// @route   POST /api/v1/campaigns/:id/updates
// @access  Private/Admin/HOD/Staff
export const addCampaignUpdate = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check access
    if (
      req.user?.role !== "super_admin" &&
      campaign.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const { title, description } = req.body;

    campaign.updates.push({
      title,
      description,
      createdAt: new Date(),
      createdBy: req.user?.id,
    });

    await campaign.save();

    return res.json({
      success: true,
      message: "Campaign update added successfully",
      data: campaign.updates[campaign.updates.length - 1],
    });
  }
);

// @desc    Get campaign donations
// @route   GET /api/v1/campaigns/:id/donations
// @access  Private
export const getCampaignDonations = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Check access
    if (
      req.user?.role !== "super_admin" &&
      campaign.tenantId.toString() !== req.user?.tenantId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const query: any = { campaignId: req.params.id };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const donations = await Donation.find(query)
      .populate("donor", "firstName lastName email")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments(query);

    return res.json({
      success: true,
      data: {
        donations,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit,
        },
      },
    });
  }
);

// @desc    Update campaign statistics
// @route   PUT /api/v1/campaigns/:id/stats
// @access  Private
export const updateCampaignStats = asyncHandler(
  async (req: Request, res: Response) => {
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }

    // Update campaign statistics manually
    const donations = await Donation.find({
      campaignId: campaign._id,
      paymentStatus: "completed",
    });

    campaign.currentAmount = donations.reduce(
      (sum, donation) => sum + donation.amount,
      0
    );
    campaign.statistics.totalDonations = donations.length;
    campaign.statistics.totalDonors = new Set(
      donations.map((d) => d.donor.toString())
    ).size;
    campaign.statistics.averageDonation =
      donations.length > 0 ? campaign.currentAmount / donations.length : 0;

    await campaign.save();

    return res.json({
      success: true,
      message: "Campaign statistics updated successfully",
      data: campaign.statistics,
    });
  }
);

export default {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  addCampaignUpdate,
  getCampaignDonations,
  updateCampaignStats,
};
