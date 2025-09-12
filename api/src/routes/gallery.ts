import express from "express";
import {
  getAllGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  getUserGalleries,
} from "@/controllers/galleryController";
import { authenticateToken } from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import { uploadGalleryImages } from "@/config/multer";

const router = express.Router();

// Public routes
router.get("/", asyncHandler(getAllGalleries));
router.get("/:id", asyncHandler(getGalleryById));

// Protected routes (require authentication)
router.use(authenticateToken);

// User's own galleries
router.get("/user/my-galleries", asyncHandler(getUserGalleries));

// Gallery image upload
router.post(
  "/upload-images",
  uploadGalleryImages.array("images", 10) as any,
  asyncHandler(async (req: any, res: any) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded",
      });
    }

    const imageUrls = req.files.map(
      (file: any) => `/uploads/gallery/${file.filename}`
    );

    res.json({
      success: true,
      message: "Images uploaded successfully",
      data: {
        images: imageUrls,
      },
    });
  })
);

// Gallery management (admin/coordinator only)
router.post("/", asyncHandler(createGallery));
router.put("/:id", asyncHandler(updateGallery));
router.delete("/:id", asyncHandler(deleteGallery));

export default router;
