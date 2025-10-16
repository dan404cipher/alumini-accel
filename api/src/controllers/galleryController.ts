import { Request, Response } from "express";
import Gallery, { IGallery } from "../models/Gallery";
import { asyncHandler } from "../middleware/errorHandler";

// Get all galleries (public access)
export const getAllGalleries = asyncHandler(
  async (req: Request, res: Response) => {
    const { page = 1, limit = 10, category } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = { isActive: true };
    if (category && category !== "all") {
      filter.category = category;
    }

    const galleries = await Gallery.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
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
      tags: tags || [],
      category: category || "Other",
    });

    await gallery.save();

    // Populate the createdBy field for response
    await gallery.populate("createdBy", "firstName lastName email");

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
