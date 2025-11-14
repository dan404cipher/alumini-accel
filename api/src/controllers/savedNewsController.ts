import { Request, Response } from "express";
import SavedNews from "../models/SavedNews";
import News from "../models/News";
import mongoose from "mongoose";

// Save a news article
export const saveNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Check if news article exists
    const news = await News.findById(newsId);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: "News article not found",
      });
    }

    // Check if already saved
    const existingSave = await SavedNews.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      newsId: new mongoose.Types.ObjectId(newsId),
    });

    if (existingSave) {
      return res.status(400).json({
        success: false,
        message: "News article already saved",
      });
    }

    // Save the news article
    const savedNews = new SavedNews({
      userId: new mongoose.Types.ObjectId(userId),
      newsId: new mongoose.Types.ObjectId(newsId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    });

    await savedNews.save();

    return res.status(201).json({
      success: true,
      message: "News article saved successfully",
      data: savedNews,
    });
  } catch (error) {
    console.error("Error saving news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unsave a news article
export const unsaveNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Find and delete the saved news
    const savedNews = await SavedNews.findOneAndDelete({
      userId: new mongoose.Types.ObjectId(userId),
      newsId: new mongoose.Types.ObjectId(newsId),
    });

    if (!savedNews) {
      return res.status(404).json({
        success: false,
        message: "News article not found in saved articles",
      });
    }

    return res.status(200).json({
      success: true,
      message: "News article unsaved successfully",
    });
  } catch (error) {
    console.error("Error unsaving news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get user's saved news articles
export const getSavedNews = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const tenantId = req.user?.tenantId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const skip = (page - 1) * limit;

    // Get saved news with populated news data - filter out null newsId (deleted news)
    const savedNewsResults = await SavedNews.find({
      userId: new mongoose.Types.ObjectId(userId),
      tenantId: new mongoose.Types.ObjectId(tenantId),
    })
      .populate({
        path: "newsId",
        populate: {
          path: "author",
          select: "firstName lastName email",
        },
      })
      .sort({ createdAt: -1 });

    // Filter out items with null/deleted newsId after population
    const savedNews = savedNewsResults
      .filter((item) => item.newsId !== null && item.newsId !== undefined)
      .slice(skip, skip + limit);

    // Get total count (excluding null newsId)
    const totalCount = savedNewsResults.filter(
      (item) => item.newsId !== null && item.newsId !== undefined
    ).length;

    return res.status(200).json({
      success: true,
      message: "Saved news retrieved successfully",
      data: {
        savedNews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error) {
    console.error("Error getting saved news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Check if a news article is saved by user
export const checkSavedNews = async (req: Request, res: Response) => {
  try {
    const { newsId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    const savedNews = await SavedNews.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      newsId: new mongoose.Types.ObjectId(newsId),
    });

    return res.status(200).json({
      success: true,
      message: "Save status retrieved successfully",
      data: {
        isSaved: !!savedNews,
      },
    });
  } catch (error) {
    console.error("Error checking saved news:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
