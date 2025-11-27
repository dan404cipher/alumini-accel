import { Request, Response } from "express";
import { Types } from "mongoose";
import Gallery, { IGallery } from "../models/Gallery";
import { asyncHandler } from "../middleware/errorHandler";
import notificationService from "../services/notificationService";
import { UserRole } from "../types";

// Get all galleries (public access)
export const getAllGalleries = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, category, search, dateRange, sortBy } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { isActive: true };

    // 🔒 MULTI-TENANT FILTERING: Only show galleries from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (
      (req as any).user?.role !== "super_admin" &&
      (req as any).user?.tenantId
    ) {
      filter.tenantId = (req as any).user.tenantId;
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    // Search filter
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Date range filter
    if (dateRange && dateRange !== "all") {
      const now = new Date();
      const today = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(thisWeekStart.getDate() - 7);
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      );
      const thisYearStart = new Date(today.getFullYear(), 0, 1);

      switch (dateRange) {
        case "today":
          filter.createdAt = { $gte: today };
          break;
        case "yesterday":
          filter.createdAt = { $gte: yesterday, $lt: today };
          break;
        case "this_week":
          filter.createdAt = { $gte: thisWeekStart };
          break;
        case "last_week":
          filter.createdAt = { $gte: lastWeekStart, $lt: thisWeekStart };
          break;
        case "this_month":
          filter.createdAt = { $gte: thisMonthStart };
          break;
        case "last_month":
          filter.createdAt = { $gte: lastMonthStart, $lt: thisMonthStart };
          break;
        case "this_year":
          filter.createdAt = { $gte: thisYearStart };
          break;
      }
    }

    // Build sort query
    let sortQuery: any = { createdAt: -1 }; // default: newest
    if (sortBy) {
      switch (sortBy) {
        case "oldest":
          sortQuery = { createdAt: 1 };
          break;
        case "title":
          sortQuery = { title: 1 };
          break;
        case "popular":
          sortQuery = { viewCount: -1 };
          break;
        default: // newest
          sortQuery = { createdAt: -1 };
      }
    }

    const galleries = await Gallery.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort(sortQuery)
      .skip(skip)
      .limit(Number(limit));

    const total = await Gallery.countDocuments(filter);

    res.json({
      success: true,
      data: {
        galleries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);

// Get single gallery by ID (public access)
export const getGalleryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const gallery = await Gallery.findOne({ _id: id, isActive: true }).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    return res.json({
      success: true,
      data: gallery,
    });
  }
);

// Create new gallery (admin/coordinator only)
export const createGallery = asyncHandler(
  async (req: Request, res: Response) => {
    const { title, description, images, tags, category } = req.body;
    const userId = (req as any).user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Validate required fields
    if (!title || !images || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Title and at least one image are required",
      });
    }

    const gallery = new Gallery({
      title,
      description,
      images,
      createdBy: userId,
      tenantId: (req as any).user?.tenantId, // Add tenantId for multi-tenant support
      tags: tags || [],
      category: category || "Other",
    });

    await gallery.save();

    // Populate the createdBy field for response
    await gallery.populate("createdBy", "firstName lastName email");

    try {
      const galleryId = (gallery._id as Types.ObjectId).toString();
      await notificationService.sendToRoles({
        event: "gallery.album",
        roles: [UserRole.ALUMNI, UserRole.STUDENT],
        tenantId: (req as any).user?.tenantId,
        data: {
          albumId: galleryId,
          title: gallery.title,
        },
      });
    } catch (notifyError) {
      console.error("Failed to send gallery notification:", notifyError);
    }

    return res.status(201).json({
      success: true,
      message: "Gallery created successfully",
      data: gallery,
    });
  }
);

// Update gallery (admin/coordinator only - creator or admin)
export const updateGallery = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, images, tags, category } = req.body;
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    // Check permissions: creator or has appropriate role
    if (
      gallery.createdBy.toString() !== userId &&
      !["super_admin", "college_admin", "hod", "staff"].includes(userRole)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this gallery",
      });
    }

    // Update fields
    if (title) gallery.title = title;
    if (description !== undefined) gallery.description = description;
    if (images) gallery.images = images;
    if (tags) gallery.tags = tags;
    if (category) gallery.category = category;

    await gallery.save();

    // Populate the createdBy field for response
    await gallery.populate("createdBy", "firstName lastName email");

    if (images && Array.isArray(images) && images.length > 0) {
      try {
        const galleryId = (gallery._id as Types.ObjectId).toString();
        await notificationService.sendToRoles({
          event: "gallery.media",
          roles: [UserRole.ALUMNI, UserRole.STUDENT],
          tenantId: (req as any).user?.tenantId,
          data: {
            albumId: galleryId,
            albumTitle: gallery.title,
            count: images.length,
          },
        });
      } catch (notifyError) {
        console.error(
          "Failed to send gallery media notification:",
          notifyError
        );
      }
    }

    return res.json({
      success: true,
      message: "Gallery updated successfully",
      data: gallery,
    });
  }
);

// Delete gallery (admin/coordinator only - creator or admin)
export const deleteGallery = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user?._id;
    const userRole = (req as any).user?.role;

    const gallery = await Gallery.findById(id);

    if (!gallery) {
      return res.status(404).json({
        success: false,
        message: "Gallery not found",
      });
    }

    // Check permissions: creator or has appropriate role
    if (
      gallery.createdBy.toString() !== userId &&
      !["super_admin", "college_admin", "hod", "staff"].includes(userRole)
    ) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this gallery",
      });
    }

    // Soft delete by setting isActive to false
    gallery.isActive = false;
    await gallery.save();

    return res.json({
      success: true,
      message: "Gallery deleted successfully",
    });
  }
);

// Get user's galleries (for management)
export const getUserGalleries = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as any).user?._id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const galleries = await Gallery.find({ createdBy: userId })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Gallery.countDocuments({ createdBy: userId });

    res.json({
      success: true,
      data: {
        galleries,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  }
);
