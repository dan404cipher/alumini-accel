import { Request, Response } from "express";
import Campaign from "../models/Campaign";
import Donation from "../models/Donation";
import { asyncHandler } from "../middleware/errorHandler";
import { logger } from "../utils/logger";
import { AuthenticatedRequest } from "../types";

// Get all campaigns
export const getAllCampaigns = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;

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
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Campaign.countDocuments(filter);

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
        data: {
          campaigns: campaignsWithStats,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
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
      // All admin roles (college_admin, hod, staff, super_admin) can create campaigns as "active" by default
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      
      const campaignData = {
        ...req.body,
        createdBy: req.user?.id,
        tenantId: req.user?.tenantId,
        currentAmount: 0,
        // Admin roles create as "active", others as "draft"
        status: isAdmin ? (req.body.status || "active") : "draft",
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
      // All admin roles (college_admin, hod, staff, super_admin) can update any campaign in their college
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isCreator = campaign.createdBy.toString() === req.user?.id;
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isCreator && (!isAdmin || !isSameTenant)) {
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
      // All admin roles (college_admin, hod, staff, super_admin) can delete any campaign in their college
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isCreator = campaign.createdBy.toString() === req.user?.id;
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isCreator && (!isAdmin || !isSameTenant)) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Check if campaign has donations
      const donationCount = await Donation.countDocuments({
        campaignId: campaign._id,
      });
      
      // Allow admins to delete campaigns with donations, but warn them
      if (donationCount > 0) {
        if (isAdmin && isSameTenant) {
          // Admin can delete campaigns with donations, but log a warning
          logger.warn(
            `Admin ${req.user?.id} deleted campaign ${campaign._id} with ${donationCount} donations`
          );
        } else {
          // Non-admin creators cannot delete campaigns with donations
          return res.status(400).json({
            success: false,
            message: "Cannot delete campaign with existing donations",
          });
        }
      }

      await Campaign.findByIdAndDelete(req.params.id);

      return res.status(200).json({
        success: true,
        message: donationCount > 0
          ? `Campaign deleted successfully. Warning: ${donationCount} donation(s) are still associated with this campaign.`
          : "Campaign deleted successfully",
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
      // All admin roles (college_admin, hod, staff, super_admin) can upload images for any campaign in their college
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isCreator = campaign.createdBy.toString() === req.user?.id;
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isCreator && (!isAdmin || !isSameTenant)) {
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

// Get campaign donors
export const getCampaignDonors = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user has access to view donors
      // All admin roles (college_admin, hod, staff, super_admin) can view donors for campaigns in their college
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isAdmin || !isSameTenant) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      // Get donations for this campaign
      const donations = await Donation.find({
        campaignId: campaign._id,
        paymentStatus: { $in: ["completed", "successful"] },
      })
        .populate("donor", "firstName lastName email phone profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Donation.countDocuments({
        campaignId: campaign._id,
        paymentStatus: { $in: ["completed", "successful"] },
      });

      // Format donors data
      const donors = donations.map((donation: any) => ({
        _id: donation._id,
        donorName: donation.anonymous
          ? "Anonymous"
          : donation.donorName || 
            (donation.donor ? `${donation.donor.firstName} ${donation.donor.lastName}` : null) ||
            "Anonymous",
        // Prioritize email from donation form over user profile email
        donorEmail: donation.anonymous ? null : donation.donorEmail || donation.donor?.email || null,
        // Prioritize phone from donation form over user profile phone
        donorPhone: donation.anonymous ? null : donation.donorPhone || donation.donor?.phone || null,
        donorProfile: donation.anonymous ? null : donation.donor || null,
        amount: donation.amount,
        currency: donation.currency,
        paymentMethod: donation.paymentMethod,
        transactionId: donation.transactionId,
        anonymous: donation.anonymous,
        message: donation.message,
        createdAt: donation.createdAt,
      }));

      return res.status(200).json({
        success: true,
        data: {
          donors,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (error) {
      logger.error("Error fetching campaign donors:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching campaign donors",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get campaign donor statistics
export const getCampaignDonorStats = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user has access
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isAdmin || !isSameTenant) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get donor statistics
      const stats = await Donation.aggregate([
        {
          $match: {
            campaignId: campaign._id,
            paymentStatus: { $in: ["completed", "successful"] },
          },
        },
        {
          $group: {
            _id: null,
            totalDonors: { $addToSet: "$donor" },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            averageAmount: { $avg: "$amount" },
          },
        },
      ]);

      const totalDonors = stats[0]?.totalDonors?.length || 0;
      const totalAmount = stats[0]?.totalAmount || 0;
      const totalDonations = stats[0]?.count || 0;
      const averageAmount = stats[0]?.averageAmount || 0;

      // Get top donors (non-anonymous)
      const topDonors = await Donation.aggregate([
        {
          $match: {
            campaignId: campaign._id,
            paymentStatus: { $in: ["completed", "successful"] },
            anonymous: false,
          },
        },
        {
          $group: {
            _id: "$donor",
            totalAmount: { $sum: "$amount" },
            donationCount: { $sum: 1 },
            lastDonation: { $max: "$createdAt" },
          },
        },
        { $sort: { totalAmount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "donorInfo",
          },
        },
        { $unwind: "$donorInfo" },
        {
          $project: {
            donor: {
              _id: "$donorInfo._id",
              firstName: "$donorInfo.firstName",
              lastName: "$donorInfo.lastName",
              email: "$donorInfo.email",
              profilePicture: "$donorInfo.profilePicture",
            },
            totalAmount: 1,
            donationCount: 1,
            lastDonation: 1,
          },
        },
      ]);

      return res.status(200).json({
        success: true,
        data: {
          totalDonors,
          totalAmount,
          totalDonations,
          averageAmount,
          topDonors,
        },
      });
    } catch (error) {
      logger.error("Error fetching campaign donor stats:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching campaign donor stats",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Export campaign donors
export const exportCampaignDonors = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      const campaign = await Campaign.findById(req.params.id);

      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: "Campaign not found",
        });
      }

      // Check if user has access
      const isAdmin =
        req.user?.role === "super_admin" ||
        req.user?.role === "college_admin" ||
        req.user?.role === "hod" ||
        req.user?.role === "staff";
      const isSameTenant = campaign.tenantId.toString() === req.user?.tenantId?.toString();

      if (!isAdmin || !isSameTenant) {
        return res.status(403).json({
          success: false,
          message: "Access denied",
        });
      }

      // Get all donations (non-anonymous only for export)
      const donations = await Donation.find({
        campaignId: campaign._id,
        paymentStatus: { $in: ["completed", "successful"] },
        anonymous: false,
      })
        .populate("donor", "firstName lastName email phone")
        .sort({ createdAt: -1 })
        .lean();

      // Format for CSV
      const format = req.query.format || "csv";
      const csvData = donations.map((donation: any) => ({
        "Donor Name": donation.donorName || 
          (donation.donor ? `${donation.donor.firstName} ${donation.donor.lastName}` : null) ||
          "Unknown",
        // Prioritize email from donation form over user profile email
        "Email": donation.donorEmail || donation.donor?.email || "",
        // Prioritize phone from donation form over user profile phone
        "Phone": donation.donorPhone || donation.donor?.phone || "",
        "Amount": donation.amount,
        "Currency": donation.currency,
        "Payment Method": donation.paymentMethod,
        "Transaction ID": donation.transactionId || "",
        "Date": new Date(donation.createdAt).toLocaleDateString(),
        "Message": donation.message || "",
      }));

      if (format === "json") {
        return res.status(200).json({
          success: true,
          data: csvData,
        });
      }

      // Convert to CSV
      const headers = Object.keys(csvData[0] || {});
      const csvRows = [
        headers.join(","),
        ...csvData.map((row: any) =>
          headers.map((header) => {
            const value = row[header];
            return typeof value === "string" ? `"${value.replace(/"/g, '""')}"` : value;
          }).join(",")
        ),
      ];

      const csv = csvRows.join("\n");

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="campaign-${campaign._id}-donors-${Date.now()}.csv"`
      );
      return res.status(200).send(csv);
    } catch (error) {
      logger.error("Error exporting campaign donors:", error);
      return res.status(500).json({
        success: false,
        message: "Error exporting campaign donors",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Preview target audience for campaign
export const previewTargetAudience = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { filters } = req.body;

    if (!filters) {
      return res.status(400).json({
        success: false,
        message: "Targeting filters are required",
      });
    }

    const { previewAudience } = require("../services/campaignTargetingService");

    try {
      const result = await previewAudience(filters, req.user?.tenantId?.toString());

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error("Error previewing target audience:", error);
      return res.status(500).json({
        success: false,
        message: "Error previewing target audience",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Get targeted alumni
export const getTargetedAlumni = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { filters } = req.body;

    if (!filters) {
      return res.status(400).json({
        success: false,
        message: "Targeting filters are required",
      });
    }

    const { getTargetedAlumni } = require("../services/campaignTargetingService");

    try {
      const alumni = await getTargetedAlumni(filters, req.user?.tenantId?.toString());

      return res.status(200).json({
        success: true,
        data: alumni,
        count: alumni.length,
      });
    } catch (error) {
      logger.error("Error getting targeted alumni:", error);
      return res.status(500).json({
        success: false,
        message: "Error getting targeted alumni",
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
  getCampaignDonors,
  getCampaignDonorStats,
  exportCampaignDonors,
  previewTargetAudience,
  getTargetedAlumni,
};
