import { Request, Response } from "express";
import Category from "../models/Category";
import Community from "../models/Community";
import { logger } from "../utils/logger";
import { UserRole } from "../types";

// Get all categories for a tenant
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    // Multi-tenant filtering: Only show categories from same college
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (
      (req as any).user?.role !== "super_admin" &&
      (req as any).user?.tenantId
    ) {
      filter.tenantId = (req as any).user.tenantId;
    }

    // Filter by entity type if provided
    if (req.query.entityType) {
      filter.entityType = req.query.entityType;
    }

    // Filter by active status if provided
    if (req.query.isActive !== undefined) {
      filter.isActive = req.query.isActive === "true";
    }

    const categories = await Category.find(filter)
      .populate("createdBy", "firstName lastName email")
      .sort({ order: 1, createdAt: -1 });

    return res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    logger.error("Get all categories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// Create category (only college_admin, hod, staff)
export const createCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name, description, order, entityType } = req.body;

    // Validate entityType
    const validEntityTypes = [
      "community",
      "community_post_category",
      "event_type",
      "event_location",
      "event_price_range",
      "mentorship_category",
      "donation_category",
      "gallery_category",
      "job_type",
      "job_experience",
      "job_industry",
    ];
    if (!entityType || !validEntityTypes.includes(entityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid entity type. Must be one of: ${validEntityTypes.join(", ")}`,
      });
    }

    // Check permissions
    const allowedRoles = [UserRole.COLLEGE_ADMIN, UserRole.HOD, UserRole.STAFF];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to create categories",
      });
    }

    // Ensure tenantId is set from user
    const tenantId = user.tenantId || req.body.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    // Check if category with same slug exists for this tenant and entity type
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existing = await Category.findOne({
      tenantId,
      entityType,
      slug,
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A ${entityType} category with this name already exists`,
      });
    }

    const category = await Category.create({
      name,
      description,
      slug,
      entityType,
      tenantId,
      createdBy: user._id,
      order: order || 0,
      isActive: true,
    });

    const populatedCategory = await Category.findById(category._id).populate(
      "createdBy",
      "firstName lastName email"
    );

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: populatedCategory,
    });
  } catch (error: any) {
    logger.error("Create category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { name, description, isActive, order } = req.body;

    // Check permissions
    const allowedRoles = [UserRole.COLLEGE_ADMIN, UserRole.HOD, UserRole.STAFF];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update categories",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Ensure user belongs to same tenant
    if (category.tenantId.toString() !== user.tenantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only update categories from your college",
      });
    }

    // Update fields
    if (name) {
      category.name = name;
      // Regenerate slug if name changed
      category.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (order !== undefined) category.order = order;

    await category.save();

    const populatedCategory = await Category.findById(category._id).populate(
      "createdBy",
      "firstName lastName email"
    );

    return res.json({
      success: true,
      message: "Category updated successfully",
      data: populatedCategory,
    });
  } catch (error: any) {
    logger.error("Update category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check permissions - only admins and HODs can delete
    const allowedRoles = [UserRole.COLLEGE_ADMIN, UserRole.HOD];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete categories",
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Ensure user belongs to same tenant
    if (category.tenantId.toString() !== user.tenantId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete categories from your college",
      });
    }

    // Check if category is in use based on entity type
    let usageCount = 0;
    const categoryEntityType = category.entityType;

    if (categoryEntityType === "community") {
      usageCount = await Community.countDocuments({
        customCategory: id,
      });
    } else if (categoryEntityType === "event_type") {
      const Event = (await import("../models/Event")).default;
      usageCount = await Event.countDocuments({
        customEventType: id,
      });
    } else if (categoryEntityType === "job_type") {
      const JobPost = (await import("../models/JobPost")).default;
      usageCount = await JobPost.countDocuments({
        customJobType: id,
      });
    } else if (categoryEntityType === "job_experience") {
      const JobPost = (await import("../models/JobPost")).default;
      usageCount = await JobPost.countDocuments({
        customExperience: id,
      });
    } else if (categoryEntityType === "job_industry") {
      const JobPost = (await import("../models/JobPost")).default;
      usageCount = await JobPost.countDocuments({
        customIndustry: id,
      });
    }

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is used by ${usageCount} item${
          usageCount > 1 ? "s" : ""
        }.`,
      });
    }

    await Category.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error: any) {
    logger.error("Delete category error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id).populate(
      "createdBy",
      "firstName lastName email"
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    logger.error("Get category error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category",
    });
  }
};
