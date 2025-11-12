import express from "express";
import mentoringProgramController from "../controllers/mentoringProgramController";
import {
  validateMentoringProgram,
  validateId,
  validateRequest,
} from "../middleware/validation";
import {
  authenticateToken,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { uploadOptionalDocument } from "../middleware/fileUpload";
import { parseFormDataJson } from "../middleware/parseFormData";

const router = express.Router();

// @route   POST /api/v1/mentoring-programs
// @desc    Create new mentoring program
// @access  Private/Staff/HOD/College Admin
router.post(
  "/",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  uploadOptionalDocument("mentoringAgreementForm"),
  parseFormDataJson,
  ...validateRequest(validateMentoringProgram),
  asyncHandler(mentoringProgramController.createProgram)
);

// @route   GET /api/v1/mentoring-programs
// @desc    Get all mentoring programs with filters
// @access  Private
router.get(
  "/",
  authenticateToken,
  asyncHandler(mentoringProgramController.getAllPrograms)
);

// @route   GET /api/v1/mentoring-programs/:id
// @desc    Get mentoring program by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.getProgramById)
);

// @route   PUT /api/v1/mentoring-programs/:id
// @desc    Update mentoring program
// @access  Private/Staff/HOD/College Admin
router.put(
  "/:id",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  uploadOptionalDocument("mentoringAgreementForm"),
  parseFormDataJson,
  ...validateRequest([...validateId, ...validateMentoringProgram]),
  asyncHandler(mentoringProgramController.updateProgram)
);

// @route   PUT /api/v1/mentoring-programs/:id/publish
// @desc    Publish mentoring program
// @access  Private/Staff/HOD/College Admin
router.put(
  "/:id/publish",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.publishProgram)
);

// @route   PUT /api/v1/mentoring-programs/:id/unpublish
// @desc    Unpublish mentoring program
// @access  Private/Staff/HOD/College Admin
router.put(
  "/:id/unpublish",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.unpublishProgram)
);

// @route   DELETE /api/v1/mentoring-programs/:id
// @desc    Delete mentoring program
// @access  Private/Staff/HOD/College Admin
router.delete(
  "/:id",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.deleteProgram)
);

// @route   GET /api/v1/mentoring-programs/:id/statistics
// @desc    Get mentoring program statistics
// @access  Private
router.get(
  "/:id/statistics",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.getProgramStatistics)
);

// @route   PUT /api/v1/mentoring-programs/:id/publish-mentors
// @desc    Publish approved mentors list
// @access  Private/Staff/HOD/College Admin
router.put(
  "/:id/publish-mentors",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.publishApprovedMentors)
);

// @route   PUT /api/v1/mentoring-programs/:id/unpublish-mentors
// @desc    Unpublish mentors list
// @access  Private/Staff/HOD/College Admin
router.put(
  "/:id/unpublish-mentors",
  authenticateToken,
  authorize(UserRole.STAFF, UserRole.HOD, UserRole.COLLEGE_ADMIN),
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.unpublishApprovedMentors)
);

// @route   GET /api/v1/mentoring-programs/:id/published-mentors
// @desc    Get published mentors for a program (Public)
// @access  Public (No auth required)
router.get(
  "/:id/published-mentors",
  ...validateRequest(validateId),
  asyncHandler(mentoringProgramController.getPublishedMentors)
);

export default router;

