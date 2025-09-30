import express from "express";
import { authenticateToken as authenticate } from "../middleware/auth";
import {
  uploadSingle,
  getFileUrl,
  getRelativeFileUrl,
} from "../utils/fileUpload";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload community cover image
router.post(
  "/community/cover",
  uploadSingle("coverImage") as any,
  (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      const fileUrl = getFileUrl(req.file.filename);

      return res.json({
        success: true,
        message: "File uploaded successfully",
        data: {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "File upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);

// Upload community logo
router.post("/community/logo", uploadSingle("logo") as any, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = getFileUrl(req.file.filename);

    return res.json({
      success: true,
      message: "File uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "File upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

// Upload general image (for posts, etc.)
router.post("/image", uploadSingle("image") as any, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const fileUrl = getFileUrl(req.file.filename);
    const relativeUrl = getRelativeFileUrl(req.file.filename);

    return res.json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        url: fileUrl,
        relativeUrl: relativeUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
