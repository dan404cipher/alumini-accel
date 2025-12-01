import express from "express";
import adminAnalyticsController from "../controllers/adminAnalyticsController";
import * as departmentAnalyticsController from "../controllers/departmentAnalyticsController";
import { authenticateToken, requireAdmin } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/admin/analytics
// @desc    Get comprehensive admin analytics
// @access  Private/Admin
router.get(
  "/",
  authenticateToken,
  requireAdmin,
  asyncHandler(adminAnalyticsController.getAdminAnalytics)
);

// @route   GET /api/v1/admin/analytics/department-analytics
// @desc    Get department-wise HOD and Staff analytics
// @access  Private/Admin
router.get(
  "/department-analytics",
  authenticateToken,
  requireAdmin,
  asyncHandler(departmentAnalyticsController.getDepartmentAnalytics)
);

export default router;

