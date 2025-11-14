import express from "express";
import newsController from "../controllers/newsController";
import {
  authenticateToken,
  requireCoordinator,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import multer from "multer";

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/news/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname +
        "-" +
        uniqueSuffix +
        "." +
        file.originalname.split(".").pop()
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// @route   GET /api/v1/news
// @desc    Get all news
// @access  Private
router.get("/", authenticateToken, asyncHandler(newsController.getAllNews));

// @route   GET /api/v1/news/:id
// @desc    Get news by ID
// @access  Private
router.get("/:id", authenticateToken, asyncHandler(newsController.getNewsById));

// @route   POST /api/v1/news
// @desc    Create news
// @access  Private/Coordinator
router.post(
  "/",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  asyncHandler(newsController.createNews)
);

// @route   POST /api/v1/news/with-image
// @desc    Create news with image upload
// @access  Private/Coordinator
router.post(
  "/with-image",
  upload.single("image") as any,
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  asyncHandler(newsController.createNewsWithImage)
);

// @route   PUT /api/v1/news/:id
// @desc    Update news
// @access  Private/Coordinator
router.put(
  "/:id",
  authenticateToken,
  requireCoordinator,
  asyncHandler(newsController.updateNews)
);

// @route   PUT /api/v1/news/:id/with-image
// @desc    Update news with image upload
// @access  Private/Coordinator
router.put(
  "/:id/with-image",
  upload.single("image") as any,
  authenticateToken,
  requireCoordinator,
  asyncHandler(newsController.updateNewsWithImage)
);

// @route   DELETE /api/v1/news/:id
// @desc    Delete news
// @access  Private/Coordinator
router.delete(
  "/:id",
  authenticateToken,
  requireCoordinator,
  asyncHandler(newsController.deleteNews)
);

// @route   GET /api/v1/news/my/news
// @desc    Get my news (for authors)
// @access  Private
router.get(
  "/my/news",
  authenticateToken,
  asyncHandler(newsController.getMyNews)
);

export default router;
