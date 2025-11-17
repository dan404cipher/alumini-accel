import { Request, Response } from "express";
import mongoose from "mongoose";
import Tenant from "../models/Tenant";
import User from "../models/User";
import { UserRole, UserStatus } from "../types";
import { logger } from "../utils/logger";
import { asyncHandler } from "../middleware/errorHandler";

// @desc    Get all tenants (Super Admin only)
// @route   GET /api/v1/tenants
// @access  Private/Super Admin
export const getAllTenants = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { domain: { $regex: search, $options: "i" } },
        { "contactInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    if (status) {
      query.isActive = status === "active";
    }

    const skip = (page - 1) * limit;

    const tenants = await Tenant.find(query)
      .populate("superAdminId", "firstName lastName email role")
      .select("-__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Tenant.countDocuments(query);

    res.json({
      success: true,
      data: {
        tenants,
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

// @desc    Get tenant by ID
// @route   GET /api/v1/tenants/:id
// @access  Private
export const getTenantById = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id)
      .populate("superAdminId", "firstName lastName email role")
      .select("-__v");

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Get tenant statistics manually
    const User = require("@/models/User").default;
    const AlumniProfile = require("@/models/AlumniProfile").default;

    const totalUsers = await User.countDocuments({ tenantId: tenant._id });
    const totalAlumni = await AlumniProfile.countDocuments({
      userId: {
        $in: await User.find({ tenantId: tenant._id }).distinct("_id"),
      },
    });
    const activeUsers = await User.countDocuments({
      tenantId: tenant._id,
      status: { $in: ["active", "verified"] },
    });

    const stats = {
      totalUsers,
      totalAlumni,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
    };

    return res.json({
      success: true,
      data: {
        tenant,
        stats,
      },
    });
  }
);

// @desc    Create new tenant
// @route   POST /api/v1/tenants
// @access  Private/Super Admin
export const createTenant = asyncHandler(
  async (req: Request, res: Response) => {
    console.log(
      "Create tenant request body:",
      JSON.stringify(req.body, null, 2)
    );

    const {
      name,
      domain,
      about,
      superAdminEmail,
      superAdminFirstName,
      superAdminLastName,
      contactInfo,
      settings,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !domain ||
      !superAdminEmail ||
      !superAdminFirstName ||
      !superAdminLastName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, domain, superAdminEmail, superAdminFirstName, superAdminLastName",
      });
    }

    if (!contactInfo || !contactInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Missing required contactInfo.email",
      });
    }

    // Check if domain already exists
    const existingTenant = await Tenant.findOne({ domain });
    if (existingTenant) {
      return res.status(400).json({
        success: false,
        message: "Domain already exists",
      });
    }

    // Check if super admin email already exists
    const existingUser = await User.findOne({ email: superAdminEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Super admin email already exists",
      });
    }

    // Create tenant first (with temporary superAdminId)
    const tempSuperAdminId = new mongoose.Types.ObjectId();
    const tenant = new Tenant({
      name,
      domain,
      about,
      superAdminId: tempSuperAdminId, // Temporary ID
      contactInfo: {
        email: contactInfo.email,
        phone: contactInfo.phone,
        address: contactInfo.address,
        website: contactInfo.website,
      },
      settings: {
        allowAlumniRegistration: settings?.allowAlumniRegistration ?? true,
        requireApproval: settings?.requireApproval ?? true,
        allowJobPosting: settings?.allowJobPosting ?? true,
        allowFundraising: settings?.allowFundraising ?? true,
        allowMentorship: settings?.allowMentorship ?? true,
        allowEvents: settings?.allowEvents ?? true,
        emailNotifications: settings?.emailNotifications ?? true,
        whatsappNotifications: settings?.whatsappNotifications ?? false,
        customBranding: settings?.customBranding ?? false,
      },
    });

    await tenant.save();

    // Create super admin user with tenantId
    const superAdmin = new User({
      email: superAdminEmail,
      firstName: superAdminFirstName,
      lastName: superAdminLastName,
      role: UserRole.COLLEGE_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      password: "TempPassword123!", // Will be changed on first login
      tenantId: tenant._id, // Now we have the tenant ID
    });

    await superAdmin.save();

    // Update tenant with actual super admin ID
    tenant.superAdminId = superAdmin._id as any;
    await tenant.save();

    const populatedTenant = await Tenant.findById(tenant._id)
      .populate("superAdminId", "firstName lastName email role")
      .select("-__v");

    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: populatedTenant,
    });
  }
);

// @desc    Update tenant
// @route   PUT /api/v1/tenants/:id
// @access  Private/Super Admin or College Admin
export const updateTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    const {
      name,
      domain,
      about,
      logo,
      banner,
      contactInfo,
      settings,
      subscription,
    } = req.body;

    // Check if domain is being changed and if it already exists
    if (domain && domain !== tenant.domain) {
      const existingTenant = await Tenant.findOne({ domain });
      if (existingTenant) {
        return res.status(400).json({
          success: false,
          message: "Domain already exists",
        });
      }
    }

    // Update fields
    if (name) tenant.name = name;
    if (domain) tenant.domain = domain;
    if (about !== undefined) tenant.about = about;
    if (logo !== undefined) tenant.logo = logo;
    if (banner !== undefined) tenant.banner = banner;

    if (contactInfo) {
      tenant.contactInfo = { ...tenant.contactInfo, ...contactInfo };
    }

    if (settings) {
      tenant.settings = { ...tenant.settings, ...settings };
    }

    if (subscription) {
      tenant.subscription = { ...tenant.subscription, ...subscription };
    }

    await tenant.save();

    const populatedTenant = await Tenant.findById(tenant._id)
      .populate("superAdminId", "firstName lastName email role")
      .select("-__v");

    return res.json({
      success: true,
      message: "Tenant updated successfully",
      data: populatedTenant,
    });
  }
);

// @desc    Delete tenant
// @route   DELETE /api/v1/tenants/:id
// @access  Private/Super Admin
export const deleteTenant = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Soft delete - mark as inactive
    tenant.isActive = false;
    await tenant.save();

    return res.json({
      success: true,
      message: "Tenant deleted successfully",
    });
  }
);

// @desc    Get tenant users
// @route   GET /api/v1/tenants/:id/users
// @access  Private
export const getTenantUsers = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: any = { tenantId: req.params.id };

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select("-password -__v")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(query);

    return res.json({
      success: true,
      data: {
        users,
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

// @desc    Get tenant statistics
// @route   GET /api/v1/tenants/:id/stats
// @access  Private
export const getTenantStats = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Get tenant statistics manually
    const User = require("@/models/User").default;
    const AlumniProfile = require("@/models/AlumniProfile").default;
    const JobPost = require("@/models/JobPost").default;
    const Event = require("@/models/Event").default;

    const totalUsers = await User.countDocuments({ tenantId: tenant._id });
    const totalAlumni = await AlumniProfile.countDocuments({
      userId: {
        $in: await User.find({ tenantId: tenant._id }).distinct("_id"),
      },
    });
    const activeUsers = await User.countDocuments({
      tenantId: tenant._id,
      status: { $in: ["active", "verified"] },
    });

    const alumniProfiles = await AlumniProfile.countDocuments({
      userId: {
        $in: await User.find({ tenantId: tenant._id }).distinct("_id"),
      },
    });

    const jobPosts = await JobPost.countDocuments({
      postedBy: {
        $in: await User.find({ tenantId: tenant._id }).distinct("_id"),
      },
    });

    const events = await Event.countDocuments({
      organizer: {
        $in: await User.find({ tenantId: tenant._id }).distinct("_id"),
      },
    });

    const stats = {
      totalUsers,
      totalAlumni,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
    };

    return res.json({
      success: true,
      data: {
        ...stats,
        alumniProfiles,
        jobPosts,
        events,
      },
    });
  }
);

// @desc    Upload tenant logo
// @route   POST /api/v1/tenants/:id/logo
// @access  Private/Super Admin or College Admin
export const uploadTenantLogo = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No logo file provided",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      });
    }

    // Validate file size (2MB max for logos)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 2MB for logos.",
      });
    }

    // Find tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Update tenant logo
    tenant.logo = `/uploads/tenant-logos/${req.file.filename}`;
    await tenant.save();

    return res.json({
      success: true,
      message: "Logo uploaded successfully",
      data: {
        logo: tenant.logo,
      },
    });
  }
);

// @desc    Get tenant logo
// @route   GET /api/v1/tenants/:id/logo
// @access  Private
export const getTenantLogo = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!tenant.logo) {
      return res.status(404).json({
        success: false,
        message: "No logo found for this tenant",
      });
    }

    // Return the logo URL as-is (relative or absolute)
    // Frontend will handle URL construction using getImageUrl utility
    return res.status(200).json({
      success: true,
      data: {
        logo: tenant.logo,
      },
    });
  }
);

// @desc    Upload tenant banner
// @route   POST /api/v1/tenants/:id/banner
// @access  Private/Super Admin or College Admin
export const uploadTenantBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const tenantId = req.params.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No banner file provided",
      });
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.",
      });
    }

    // Validate file size (5MB max for banners)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: "File too large. Maximum size is 5MB for banners.",
      });
    }

    // Find tenant
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // Update tenant banner
    tenant.banner = `/uploads/tenant-banners/${req.file.filename}`;
    await tenant.save();

    return res.json({
      success: true,
      message: "Banner uploaded successfully",
      data: {
        banner: tenant.banner,
      },
    });
  }
);

// @desc    Get tenant banner
// @route   GET /api/v1/tenants/:id/banner
// @access  Private
export const getTenantBanner = asyncHandler(
  async (req: Request, res: Response) => {
    const tenant = await Tenant.findById(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    if (!tenant.banner) {
      return res.status(404).json({
        success: false,
        message: "No banner found for this tenant",
      });
    }

    // Return the banner URL as-is (relative or absolute)
    // Frontend will handle URL construction using getImageUrl utility
    return res.status(200).json({
      success: true,
      data: {
        banner: tenant.banner,
      },
    });
  }
);

// @desc    Get public college information
// @route   GET /api/v1/college/public-info
// @access  Public
export const getPublicCollegeInfo = asyncHandler(
  async (req: Request, res: Response) => {
    try {
      // Get the first tenant (college) for public display
      const tenant = await Tenant.findOne({ isActive: true })
        .select("name about logo banner contactInfo settings")
        .lean();

      if (!tenant) {
        return res.status(404).json({
          success: false,
          message: "College information not found",
        });
      }

      // Construct full URLs for logo and banner
      const baseUrl = `${req.protocol}://${req.get("host")}`;

      const collegeInfo = {
        name: tenant.name,
        about: tenant.about,
        logo: tenant.logo
          ? tenant.logo.startsWith("http://") ||
            tenant.logo.startsWith("https://")
            ? tenant.logo
            : `${baseUrl}${tenant.logo}`
          : null,
        banner: tenant.banner
          ? tenant.banner.startsWith("http://") ||
            tenant.banner.startsWith("https://")
            ? tenant.banner
            : `${baseUrl}${tenant.banner}`
          : null,
        contactInfo: tenant.contactInfo,
        settings: tenant.settings,
      };

      return res.status(200).json({
        success: true,
        data: collegeInfo,
      });
    } catch (error: any) {
      logger.error("Get public college info error:", error);
      return res.status(500).json({
        success: false,
        message: "Error fetching college information",
        error: error.message,
      });
    }
  }
);

export default {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantStats,
  uploadTenantLogo,
  getTenantLogo,
  uploadTenantBanner,
  getTenantBanner,
  getPublicCollegeInfo,
};
