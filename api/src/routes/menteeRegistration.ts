import express from "express";
import { body } from "express-validator";
import menteeRegistrationController from "../controllers/menteeRegistrationController";
import {
  validateMenteeRegistration,
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

// @route   POST /api/v1/mentee-registrations
// @desc    Submit mentee registration (Public endpoint with token)
// @access  Public
router.post(
  "/",
  uploadOptionalDocument("menteeCV"),
  ...validateRequest(validateMenteeRegistration),
  asyncHandler(menteeRegistrationController.submitRegistration)
);

// @route   GET /api/v1/mentee-registrations/program/:programId/link
// @desc    Generate registration link (Staff/Admin)
// @access  Private/Staff/Admin
router.get(
  "/program/:programId/link",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  ...validateRequest(validateProgramId),
  asyncHandler(menteeRegistrationController.generateRegistrationLink)
);

// @route   GET /api/v1/mentee-registrations/token/:token
// @desc    Get registration form by token (Public)
// @access  Public
router.get(
  "/token/:token",
  asyncHandler(menteeRegistrationController.getRegistrationByToken)
);

// @route   POST /api/v1/mentee-registrations/token/:token/validate-student
// @desc    Validate student ID (Public)
// @access  Public
router.post(
  "/token/:token/validate-student",
  ...validateRequest([
    body("studentId")
      .trim()
      .notEmpty()
      .withMessage("Student ID is required"),
    body("programId")
      .isMongoId()
      .withMessage("Program ID must be a valid MongoDB ID"),
  ]),
  asyncHandler(menteeRegistrationController.validateStudentID)
);

// @route   GET /api/v1/mentee-registrations/program/:programId
// @desc    Get registrations by program (Staff/Admin)
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
  asyncHandler(menteeRegistrationController.getRegistrationsByProgram)
);

// @route   GET /api/v1/mentee-registrations/my
// @desc    Get my mentee registrations
// @access  Private (Alumni can view their own registrations)
// NOTE: This route must come BEFORE /:id to avoid route conflicts
router.get(
  "/my",
  authenticateToken,
  asyncHandler(menteeRegistrationController.getMyMenteeRegistrations)
);

// @route   GET /api/v1/mentee-registrations/:id
// @desc    Get registration by ID
// @access  Private/Staff/Admin
router.get(
  "/:id",
  authenticateToken,
  authorize(
    UserRole.SUPER_ADMIN,
    UserRole.COLLEGE_ADMIN,
    UserRole.HOD,
    UserRole.STAFF
  ),
  ...validateRequest(validateId),
  asyncHandler(menteeRegistrationController.getRegistrationById)
);

// @route   PUT /api/v1/mentee-registrations/:id/approve
// @desc    Approve mentee registration
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
  asyncHandler(menteeRegistrationController.approveRegistration)
);

// @route   PUT /api/v1/mentee-registrations/:id/reject
// @desc    Reject mentee registration
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
  asyncHandler(menteeRegistrationController.rejectRegistration)
);

// @route   POST /api/v1/mentee-registrations/on-behalf
// @desc    Create/update registration on behalf of mentee
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
  uploadOptionalDocument("menteeCV"),
  ...validateRequest(
    validateMenteeRegistration.filter(
      (v) => v.toString().indexOf("recaptchaToken") === -1
    ) // Skip reCAPTCHA validation for staff-created registrations
  ),
  asyncHandler(menteeRegistrationController.updateRegistrationOnBehalf)
);

// @route   GET /api/v1/mentee-registrations/program/:programId/check
// @desc    Check if current user has registered as mentee for this program
// @access  Private (Alumni can check their own registration)
router.get(
  "/program/:programId/check",
  authenticateToken,
  ...validateRequest(validateProgramId),
  asyncHandler(menteeRegistrationController.checkMyMenteeRegistration)
);

export default router;

