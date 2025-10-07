import { Request, Response } from "express";
import Campaign from "../models/Campaign";
import Donation from "../models/Donation";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";

// Get all campaigns
export const getAllCampaigns = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const filter: any = { isPublic: true };

      // Multi-tenant filtering
      if (req.user?.role !== "super_admin" && req.user?.tenantId) {
        filter.tenantId = req.user.tenantId;
      }

      // Filter by status
      if (req.query.status) {
        filter.status = req.query.status;
      }

      // Filter by category
      if (req.query.category) {
        filter.category = req.query.category;
      }

      // Search by title or description
      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
        ];
      }

      const campaigns = await Campaign.find(filter)
        .populate("createdBy", "firstName lastName email")
        .populate("tenantId", "name")
        .sort({ createdAt: -1 })
        .lean();

      // Calculate additional fields for frontend
      const campaignsWithStats = campaigns.map((campaign) => ({
        ...campaign,
        raised: campaign.currentAmount,
        donors: campaign.statistics.totalDonors,
        progressPercentage: Math.round(
          (campaign.currentAmount / campaign.targetAmount) * 100
        ),
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(campaign.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        isActive:
          campaign.status === "active" &&
          new Date() >= new Date(campaign.startDate) &&
          new Date() <= new Date(campaign.endDate),
        imageUrl: campaign.images?.[0] || "/default-campaign.jpg",
      }));

      return res.status(200).json({
        success: true,
        data: campaignsWithStats,
        count: campaignsWithStats.length,
      });
    } catch (error) {
      logger.error("Error fetching campaigns:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching campaigns",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get campaign by ID
export const getCampaignById = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id)
        .populate("createdBy", "firstName lastName email")
        .populate("tenantId", "name");

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user can view this campaign
      if (
        !campaign.isPublic &&
        campaign.createdBy._id.toString() !== req.user?.id &&
        req.user?.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get recent donations for this campaign
      const recentDonations = await Donation.find({ campaignId: campaign._id })
        .populate("donor", "firstName lastName")
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();

      const campaignWithStats = {
        ...campaign.toObject(),
        raised: campaign.currentAmount,
        donors: campaign.statistics.totalDonors,
        progressPercentage: Math.round(
          (campaign.currentAmount / campaign.targetAmount) * 100
        ),
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(campaign.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        isActive:
          campaign.status === "active" &&
          new Date() >= new Date(campaign.startDate) &&
          new Date() <= new Date(campaign.endDate),
        imageUrl: campaign.images?.[0] || "/default-campaign.jpg",
        recentDonations,
      };

      return res.status(200).json({
        success: true,
        data: campaignWithStats,
      });
    } catch (error) {
      logger.error("Error fetching campaign:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching campaign",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Create new campaign
export const createCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaignData = {
        ...req.body,
        createdBy: req.user?.id,
        tenantId: req.user?.tenantId,
        currentAmount: 0,
        status: "draft",
      };

      const campaign = new Campaign(campaignData);
      await campaign.save();

      await campaign.populate("createdBy", "firstName lastName email");
      await campaign.populate("tenantId", "name");

      return res.status(201).json({
        success: true,
        message: "Campaign created successfully",
        data: campaign,
      });
    } catch (error) {
      logger.error("Error creating campaign:", error);
      return res.status(500).json({
        success: false,
        message: "Error creating campaign",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Update campaign
export const updateCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user can update this campaign
      if (
        campaign.createdBy.toString() !== req.user?.id &&
        req.user?.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Prepare update data
      const updateData = { ...req.body };

      // If updating endDate, ensure it's after startDate
      if (updateData.endDate && updateData.startDate) {
        const startDate = new Date(updateData.startDate);
        const endDate = new Date(updateData.endDate);
        if (endDate <= startDate) {
          return res.status(400).json({
            success: false,
            message: "End date must be after start date",
          });
        }
      } else if (updateData.endDate && !updateData.startDate) {
        // If only updating endDate, compare with existing startDate
        const existingCampaign = await Campaign.findById(req.params.id);
        if (existingCampaign) {
          const startDate = new Date(existingCampaign.startDate);
          const endDate = new Date(updateData.endDate);
          if (endDate <= startDate) {
            return res.status(400).json({
              success: false,
              message: "End date must be after start date",
            });
          }
        }
      }

      const updatedCampaign = await Campaign.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: false }
      )
        .populate("createdBy", "firstName lastName email")
        .populate("tenantId", "name");

      return res.status(200).json({
        success: true,
        message: "Campaign updated successfully",
        data: updatedCampaign,
      });
    } catch (error) {
      logger.error("Error updating campaign:", error);
      return res.status(500).json({
        success: false,
        message: "Error updating campaign",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Delete campaign
export const deleteCampaign = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user can delete this campaign
      const isCreator = campaign.createdBy.toString() === req.user?.id;
      const isSuperAdmin = req.user?.role === "super_admin";

      if (!isCreator && !isSuperAdmin) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if campaign has donations
      const donationCount = await Donation.countDocuments({
        campaignId: campaign._id,
      });
      if (donationCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete campaign with existing donations",
        });
      }

      await Campaign.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: "Campaign deleted successfully",
      });
    } catch (error) {
      logger.error("Error deleting campaign:", error);
      return res.status(500).json({
        success: false,
        message: "Error deleting campaign",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get my campaigns
export const getMyCampaigns = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaigns = await Campaign.find({ createdBy: req.user?.id })
        .populate("tenantId", "name")
        .sort({ createdAt: -1 });

      const campaignsWithStats = campaigns.map((campaign) => ({
        ...campaign.toObject(),
        raised: campaign.currentAmount,
        donors: campaign.statistics.totalDonors,
        progressPercentage: Math.round(
          (campaign.currentAmount / campaign.targetAmount) * 100
        ),
        daysRemaining: Math.max(
          0,
          Math.ceil(
            (new Date(campaign.endDate).getTime() - new Date().getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
        isActive:
          campaign.status === "active" &&
          new Date() >= new Date(campaign.startDate) &&
          new Date() <= new Date(campaign.endDate),
        imageUrl: campaign.images?.[0] || "/default-campaign.jpg",
      }));

      return res.status(200).json({
        success: true,
        data: campaignsWithStats,
        count: campaignsWithStats.length,
      });
    } catch (error) {
      logger.error("Error fetching my campaigns:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching my campaigns",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get campaign statistics
export const getCampaignStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const filter: any = {};

      // Multi-tenant filtering
      if (req.user?.role !== "super_admin" && req.user?.tenantId) {
        filter.tenantId = req.user.tenantId;
      }

      const totalCampaigns = await Campaign.countDocuments(filter);
      const activeCampaigns = await Campaign.countDocuments({
        ...filter,
        status: "active",
      });
      const completedCampaigns = await Campaign.countDocuments({
        ...filter,
        status: "completed",
      });

      const totalRaised = await Campaign.aggregate([
        { $match: filter },
        { $group: { _id: null, total: { $sum: "$currentAmount" } } },
      ]);

      const totalDonations = await Donation.aggregate([
        { $match: { tenantId: req.user?.tenantId } },
        {
          $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$amount" } },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalCampaigns,
          activeCampaigns,
          completedCampaigns,
          totalRaised: totalRaised[0]?.total || 0,
          totalDonations: totalDonations[0]?.count || 0,
          totalDonationAmount: totalDonations[0]?.total || 0,
        },
      });
    } catch (error) {
      logger.error("Error fetching campaign statistics:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching campaign statistics",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Upload campaign image
export const uploadCampaignImage = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user can update this campaign
      if (
        campaign.createdBy.toString() !== req.user?.id &&
        req.user?.role !== "super_admin"
      ) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image file provided",
        });
      }

      // Add image to campaign and update imageUrl to the latest image
      const imagePath = `/uploads/campaigns/${req.file.filename}`;

      // Use the same approach as updateCampaign - modify the document and save
      const campaignToUpdate = await Campaign.findById(req.params.id);
      if (!campaignToUpdate) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Replace the campaign image (set images array to contain only the new image)
      campaignToUpdate.images = [imagePath];

      // Set imageUrl to the new image
      campaignToUpdate.imageUrl = imagePath;

      // Save the campaign
      await campaignToUpdate.save();

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          imageUrl: `/uploads/campaigns/${req.file.filename}`,
        },
      });
    } catch (error) {
      logger.error("Error uploading campaign image:", error);
      return res.status(500).json({
        success: false,
        message: "Error uploading campaign image",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

export default {
  getAllCampaigns,
  getCampaignById,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getMyCampaigns,
  getCampaignStats,
  uploadCampaignImage,
};
