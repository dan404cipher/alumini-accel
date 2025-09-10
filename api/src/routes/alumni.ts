import express from "express";
import alumniController from "@/controllers/alumniController";
import {
  validateAlumniProfile,
  validateAlumniSkillsInterests,
  validateId,
  validateRequest,
} from "@/middleware/validation";
import {
  authenticateToken,
  requireAlumni,
  requireAdmin,
} from "@/middleware/auth";
import { asyncHandler } from "@/middleware/errorHandler";

const router = express.Router();

// @route   GET /api/v1/alumni/public
// @desc    Get public alumni directory data
// @access  Public
router.get("/public", asyncHandler(alumniController.getPublicAlumniDirectory));

// @route   GET /api/v1/alumni
// @desc    Get all alumni profiles
// @access  Private (Alumni or Admin)
router.get("/", authenticateToken, asyncHandler(alumniController.getAllAlumni));

// @route   GET /api/v1/alumni/:id
// @desc    Get alumni profile by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(alumniController.getAlumniById)
);

// @route   POST /api/v1/alumni/profile
// @desc    Create alumni profile
// @access  Private/Alumni
router.post(
  "/profile",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniProfile),
  asyncHandler(alumniController.createProfile)
);

// @route   PUT /api/v1/alumni/profile
// @desc    Update alumni profile
// @access  Private/Alumni
router.put(
  "/profile",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniProfile),
  asyncHandler(alumniController.updateProfile)
);

// @route   PUT /api/v1/alumni/profile/skills-interests
// @desc    Update alumni skills and interests only
// @access  Private/Alumni
router.put(
  "/profile/skills-interests",
  authenticateToken,
  requireAlumni,
  ...validateRequest(validateAlumniSkillsInterests),
  asyncHandler(alumniController.updateSkillsInterests)
);

// @route   GET /api/v1/alumni/search
// @desc    Search alumni
// @access  Private
router.get(
  "/search",
  authenticateToken,
  asyncHandler(alumniController.searchAlumni)
);

// @route   GET /api/v1/alumni/batch/:year
// @desc    Get alumni by batch year
// @access  Private
router.get(
  "/batch/:year",
  authenticateToken,
  asyncHandler(alumniController.getAlumniByBatch)
);

// @route   GET /api/v1/alumni/hiring
// @desc    Get alumni who are hiring
// @access  Private
router.get(
  "/hiring",
  authenticateToken,
  asyncHandler(alumniController.getHiringAlumni)
);

// @route   GET /api/v1/alumni/mentors
// @desc    Get alumni mentors
// @access  Private
router.get(
  "/mentors",
  authenticateToken,
  asyncHandler(alumniController.getMentors)
);

export default router;
