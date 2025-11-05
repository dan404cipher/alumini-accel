import express from "express";
import {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById,
} from "../controllers/categoryController";
import { authenticateToken as authenticate } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/v1/categories
// @desc    Get all categories
// @access  Protected
router.get("/", asyncHandler(getAllCategories));

// @route   GET /api/v1/categories/:id
// @desc    Get category by ID
// @access  Protected
router.get("/:id", asyncHandler(getCategoryById));

// @route   POST /api/v1/categories
// @desc    Create category (college_admin, hod, staff only)
// @access  Protected
router.post("/", asyncHandler(createCategory));

// @route   PUT /api/v1/categories/:id
// @desc    Update category (college_admin, hod, staff only)
// @access  Protected
router.put("/:id", asyncHandler(updateCategory));

// @route   DELETE /api/v1/categories/:id
// @desc    Delete category (college_admin, hod only)
// @access  Protected
router.delete("/:id", asyncHandler(deleteCategory));

export default router;
