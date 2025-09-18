import express from "express";
import {
  getAllTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
  getTenantUsers,
  getTenantStats,
  uploadTenantLogo,
  getTenantLogo,
  uploadTenantBanner,
  getTenantBanner,
} from "@/controllers/tenantController";
import {
  authenticateToken,
  requireSuperAdmin,
  requireAdmin,
} from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";
import {
  uploadTenantLogo as multerUploadLogo,
  uploadTenantBanner as multerUploadBanner,
} from "@/config/multer";

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

// @route   POST /api/v1/tenants/:id/logo
// @desc    Upload tenant logo
// @access  Private/Super Admin or College Admin
router.post(
  "/:id/logo",
  authenticateToken,
  multerUploadLogo.single("logo") as any,
  asyncHandler(uploadTenantLogo)
);

// @route   GET /api/v1/tenants/:id/logo
// @desc    Get tenant logo
// @access  Private
router.get("/:id/logo", authenticateToken, asyncHandler(getTenantLogo));

// @route   POST /api/v1/tenants/:id/banner
// @desc    Upload tenant banner
// @access  Private/Super Admin or College Admin
router.post(
  "/:id/banner",
  authenticateToken,
  multerUploadBanner.single("banner") as any,
  asyncHandler(uploadTenantBanner)
);

// @route   GET /api/v1/tenants/:id/banner
// @desc    Get tenant banner
// @access  Private
router.get("/:id/banner", authenticateToken, asyncHandler(getTenantBanner));

export default router;
