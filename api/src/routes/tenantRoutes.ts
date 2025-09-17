import express from "express";
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantStats,
} from "@/controllers/tenantController";
import {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
} from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/tenants
// @desc    Get all tenants (Super Admin only)
// @access  Private/Super Admin
router.get(
  "/",
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(getAllTenants)
);

// @route   GET /api/v1/tenants/:id
// @desc    Get tenant by ID
// @access  Private
router.get("/:id", authenticateToken, asyncHandler(getTenantById));

// @route   POST /api/v1/tenants
// @desc    Create new tenant
// @access  Private/Super Admin
router.post(
  "/",
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(createTenant)
);

// @route   PUT /api/v1/tenants/:id
// @desc    Update tenant
// @access  Private/Super Admin or College Admin
router.put("/:id", authenticateToken, asyncHandler(updateTenant));

// @route   DELETE /api/v1/tenants/:id
// @desc    Delete tenant
// @access  Private/Super Admin
router.delete(
  "/:id",
  authenticateToken,
  requireSuperAdmin,
  asyncHandler(deleteTenant)
);

// @route   GET /api/v1/tenants/:id/users
// @desc    Get tenant users
// @access  Private
router.get("/:id/users", authenticateToken, asyncHandler(getTenantUsers));

// @route   GET /api/v1/tenants/:id/stats
// @desc    Get tenant statistics
// @access  Private
router.get("/:id/stats", authenticateToken, asyncHandler(getTenantStats));

export default router;
