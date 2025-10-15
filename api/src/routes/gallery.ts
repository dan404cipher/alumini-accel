import express from "express";
import {
  getAllGalleries,
  getGalleryById,
  createGallery,
  updateGallery,
  deleteGallery,
  getUserGalleries,
} from "../controllers/galleryController";
import { authenticateToken, authorize } from "../middleware/auth";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { uploadGalleryImages } from "../config/multer";

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

// Gallery management (HOD, Staff, College Admin only)
router.post(
  "/",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  asyncHandler(createGallery)
);
router.put(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  asyncHandler(updateGallery)
);
router.delete(
  "/:id",
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  asyncHandler(deleteGallery)
);

export default router;
