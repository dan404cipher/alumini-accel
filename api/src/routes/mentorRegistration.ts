import express from "express";
import { body } from "express-validator";
import mentorRegistrationController from "../controllers/mentorRegistrationController";
import {
  validateMentorRegistration,
  validateId,
  validateProgramId,
  validateRequest,
} from "../middleware/validation";
import {
  authenticateToken,
  authorize,
} from "../middleware/auth";
import { UserRole } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { uploadOptionalDocument } from "../middleware/fileUpload";

const router = express.Router();

// @route   POST /api/v1/mentor-registrations
// @desc    Submit mentor registration
// @access  Private/Alumni
router.post(
  "/",
  authenticateToken,
  uploadOptionalDocument("mentorCV"),
  ...validateRequest(validateMentorRegistration),
  asyncHandler(mentorRegistrationController.submitRegistration)
);

// @route   GET /api/v1/mentor-registrations/my
// @desc    Get my registrations
// @access  Private/Alumni
router.get(
  "/my",
  authenticateToken,
  asyncHandler(mentorRegistrationController.getMyRegistrations)
);

// @route   GET /api/v1/mentor-registrations/program/:programId
// @desc    Get registrations by program
// @access  Private/Staff/Admin
router.get(
  "/program/:programId",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  ...validateRequest(validateProgramId),
  asyncHandler(mentorRegistrationController.getRegistrationsByProgram)
);

// @route   GET /api/v1/mentor-registrations/:id
// @desc    Get registration by ID
// @access  Private
router.get(
  "/:id",
  authenticateToken,
  ...validateRequest(validateId),
  asyncHandler(mentorRegistrationController.getRegistrationById)
);

// @route   PUT /api/v1/mentor-registrations/:id/approve
// @desc    Approve mentor registration
// @access  Private/Staff/Admin
router.put(
  "/:id/approve",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  ...validateRequest(validateId),
  asyncHandler(mentorRegistrationController.approveRegistration)
);

// @route   PUT /api/v1/mentor-registrations/:id/reject
// @desc    Reject mentor registration
// @access  Private/Staff/Admin
router.put(
  "/:id/reject",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  ...validateRequest([
    validateId[0],
    body("reason")
      .trim()
      .isLength({ min: 10 })
      .withMessage("Rejection reason is required (minimum 10 characters)"),
  ]),
  asyncHandler(mentorRegistrationController.rejectRegistration)
);

// @route   POST /api/v1/mentor-registrations/on-behalf
// @desc    Create/update registration on behalf of mentor
// @access  Private/Staff/Admin
router.post(
  "/on-behalf",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  uploadOptionalDocument("mentorCV"),
  ...validateRequest([
    ...validateMentorRegistration.filter(
      (v) => v.toString().indexOf("recaptchaToken") === -1
    ), // Skip reCAPTCHA validation for staff-created registrations
    body("userId")
      .isMongoId()
      .withMessage("User ID must be a valid MongoDB ID"),
  ]),
  asyncHandler(mentorRegistrationController.updateRegistrationOnBehalf)
);

// @route   GET /api/v1/mentor-registrations/pre-populate/:programId
// @desc    Get previous registration data for pre-population
// @access  Private/Alumni
router.get(
  "/pre-populate/:programId",
  authenticateToken,
  ...validateRequest(validateProgramId),
  asyncHandler(
    mentorRegistrationController.prePopulatePreviousRegistration
  )
);

// @route   GET /api/v1/mentor-registrations/check-closure/:programId
// @desc    Check if registration is still open for a program
// @access  Private/Alumni
router.get(
  "/check-closure/:programId",
  authenticateToken,
  ...validateRequest(validateProgramId),
  asyncHandler(mentorRegistrationController.checkRegistrationClosureDate)
);

export default router;

