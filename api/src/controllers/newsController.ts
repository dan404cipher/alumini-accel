import { Request, Response } from "express";
import News from "@/models/News";
import { logger } from "@/utils/logger";

// Get all news
export const getAllNews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show news from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    // Apply filters
    if (req.query.isShared !== undefined) {
      filter.isShared = req.query.isShared === "true";
    }

    const news = await News.find(filter)
      .populate("author", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        news,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    logger.error("Get all news error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};

// Get news by ID
export const getNewsById = async (req: Request, res: Response) => {
  try {
    const news = await News.findById(req.params.id).populate(
      "author",
      "firstName lastName email profilePicture"
    );

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    return res.json({
      success: true,
      data: { news },
    });
  } catch (error) {
    logger.error("Get news by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};

// Create news
export const createNews = async (req: Request, res: Response) => {
  try {
    const { title, summary, isShared } = req.body;

    const news = new News({
      title,
      summary,
      isShared: isShared || false,
      author: req.user.id,
      tenantId: req.user.tenantId, // Add tenantId for multi-tenant filtering
    });

    await news.save();

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: { news },
    });
  } catch (error) {
    logger.error("Create news error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create news",
    });
  }
};

// Create news with image upload
export const createNewsWithImage = async (req: Request, res: Response) => {
  try {
    const { newsData } = req.body;
    const newsInfo = JSON.parse(newsData);
    const imageFile = req.file;

    const { title, summary, isShared } = newsInfo;

    // Handle image upload
    let imageUrl = "";
    if (imageFile) {
      imageUrl = `/uploads/news/${imageFile.filename}`;
    }

    const news = new News({
      title,
      summary,
      image: imageUrl,
      isShared: isShared || false,
      author: req.user.id,
      tenantId: req.user.tenantId, // Add tenantId for multi-tenant filtering
    });

    await news.save();

    return res.status(201).json({
      success: true,
      message: "News created successfully",
      data: { news },
    });
  } catch (error) {
    logger.error("Create news with image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create news",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update news
export const updateNews = async (req: Request, res: Response) => {
  try {
    const { title, summary, isShared } = req.body;

    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    // Check if user is the author or admin
    if (
      news.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this news",
      });
    }

    // Update fields
    if (title !== undefined) news.title = title;
    if (summary !== undefined) news.summary = summary;
    if (isShared !== undefined) news.isShared = isShared;

    await news.save();

    return res.json({
      success: true,
      message: "News updated successfully",
      data: { news },
    });
  } catch (error) {
    logger.error("Update news error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update news",
    });
  }
};

// Update news with image upload
export const updateNewsWithImage = async (req: Request, res: Response) => {
  try {
    const { newsData } = req.body;
    const newsInfo = JSON.parse(newsData);
    const imageFile = req.file;

    const { title, summary, isShared } = newsInfo;

    // Find the existing news
    const news = await News.findById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    // Check if user is the author or admin
    if (
      news.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this news",
      });
    }

    // Handle image upload
    let imageUrl = news.image; // Keep existing image by default
    if (imageFile) {
      imageUrl = `/uploads/news/${imageFile.filename}`;
    }

    // Update fields
    if (title !== undefined) news.title = title;
    if (summary !== undefined) news.summary = summary;
    if (isShared !== undefined) news.isShared = isShared;
    if (imageUrl !== undefined) news.image = imageUrl;

    await news.save();

    return res.json({
      success: true,
      message: "News updated successfully",
      data: { news },
    });
  } catch (error) {
    logger.error("Update news with image error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update news",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete news
export const deleteNews = async (req: Request, res: Response) => {
  try {
    const news = await News.findById(req.params.id);

    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News not found",
      });
    }

    // Check if user is the author or admin
    if (
      news.author.toString() !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this news",
      });
    }

    await News.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "News deleted successfully",
    });
  } catch (error) {
    logger.error("Delete news error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete news",
    });
  }
};

// Get my news (for authors)
export const getMyNews = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const news = await News.find({ author: req.user.id })
      .populate("author", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await News.countDocuments({ author: req.user.id });

    return res.json({
      success: true,
      data: {
        news,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    logger.error("Get my news error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch news",
    });
  }
};

export default {
  getAllNews,
  getNewsById,
  createNews,
  createNewsWithImage,
  updateNews,
  updateNewsWithImage,
  deleteNews,
  getMyNews,
};
