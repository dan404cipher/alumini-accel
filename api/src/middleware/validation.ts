import { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import { AppError } from "./errorHandler";

// Validation result handler
export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }
  return next();
};

// Generic validation request handler
export const validateRequest = (validations: any[]) => {
  return [...validations, handleValidationErrors];
};

// User registration validation
export const validateUserRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("role")
    .optional()
    .isIn(["student", "alumni", "admin", "coordinator"])
    .withMessage("Invalid role"),
  handleValidationErrors,
];

// User login validation
export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Alumni profile validation
export const validateAlumniProfile = [
  body("batchYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage("Batch year must be a valid year"),
  body("graduationYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage("Graduation year must be a valid year"),
  body("department")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),
  body("specialization")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Specialization cannot exceed 100 characters"),
  body("currentCompany")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company name cannot exceed 100 characters"),
  body("currentPosition")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Position cannot exceed 100 characters"),
  body("currentLocation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
  body("experience")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Experience must be a non-negative number"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("skills.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Skill name cannot exceed 50 characters"),
  handleValidationErrors,
];

// Job post validation
export const validateJobPost = [
  body("company")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("position")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Position must be between 2 and 100 characters"),
  body("location")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Location must be between 2 and 100 characters"),
  body("type")
    .isIn(["full-time", "part-time", "internship", "contract"])
    .withMessage("Invalid job type"),
  body("remote").optional().isBoolean().withMessage("Remote must be a boolean"),
  body("salary.min")
    .isFloat({ min: 0 })
    .withMessage("Minimum salary must be a non-negative number"),
  body("salary.max")
    .isFloat({ min: 0 })
    .withMessage("Maximum salary must be a non-negative number"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("requirements")
    .optional()
    .isArray()
    .withMessage("Requirements must be an array"),
  body("requirements.*")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Requirement cannot exceed 200 characters"),
  body("benefits")
    .optional()
    .isArray()
    .withMessage("Benefits must be an array"),
  body("benefits.*")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Benefit cannot exceed 200 characters"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tag cannot exceed 50 characters"),
  body("deadline")
    .optional()
    .isISO8601()
    .withMessage("Deadline must be a valid date"),
  body("companyWebsite")
    .optional()
    .isURL()
    .withMessage("Company website must be a valid URL"),
  body("applicationUrl")
    .optional()
    .isURL()
    .withMessage("Application URL must be a valid URL"),
  body("contactEmail")
    .optional()
    .isEmail()
    .withMessage("Contact email must be a valid email address"),
  handleValidationErrors,
];

// Event validation
export const validateEvent = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters"),
  body("type")
    .isIn([
      "reunion",
      "workshop",
      "webinar",
      "meetup",
      "conference",
      "career_fair",
    ])
    .withMessage("Invalid event type"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate").isISO8601().withMessage("End date must be a valid date"),
  body("location")
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Location must be between 2 and 200 characters"),
  body("isOnline")
    .optional()
    .isBoolean()
    .withMessage("isOnline must be a boolean"),
  body("meetingLink")
    .optional()
    .isURL()
    .withMessage("Meeting link must be a valid URL"),
  body("maxAttendees")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Maximum attendees must be at least 1"),
  body("registrationDeadline")
    .optional()
    .isISO8601()
    .withMessage("Registration deadline must be a valid date"),
  handleValidationErrors,
];

// Mentorship validation
export const validateMentorship = [
  body("mentorId").isMongoId().withMessage("Invalid mentor ID"),
  body("domain")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Domain must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("goals").optional().isArray().withMessage("Goals must be an array"),
  body("goals.*")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Goal cannot exceed 200 characters"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  handleValidationErrors,
];

// Pagination validation
export const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort").optional().isString().withMessage("Sort must be a string"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Order must be either asc or desc"),
  handleValidationErrors,
];

// Search validation
export const validateSearch = [
  ...validatePagination,
  query("q")
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage("Search query must not be empty"),
  handleValidationErrors,
];

// ID parameter validation
export const validateId = [
  param("id").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Email validation
export const validateEmail = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  handleValidationErrors,
];

// Password reset validation
export const validatePasswordReset = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("token")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    ),
  handleValidationErrors,
];

// Profile update validation
export const validateProfileUpdate = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s-()]+$/)
    .withMessage("Please provide a valid phone number"),
  body("bio")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Bio cannot exceed 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location cannot exceed 100 characters"),
  body("linkedinProfile")
    .optional()
    .isURL()
    .withMessage("LinkedIn profile must be a valid URL"),
  body("twitterHandle")
    .optional()
    .matches(/^@?[\w]{1,15}$/)
    .withMessage("Please provide a valid Twitter handle"),
  body("githubProfile")
    .optional()
    .isURL()
    .withMessage("GitHub profile must be a valid URL"),
  body("website").optional().isURL().withMessage("Website must be a valid URL"),
  handleValidationErrors,
];

// Invitation validation
export const validateInvitation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("graduationYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 5 })
    .withMessage("Graduation year must be a valid year"),
  body("degree")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Degree must be less than 100 characters"),
  body("currentRole")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Current role must be less than 100 characters"),
  body("company")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Company must be less than 100 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Location must be less than 100 characters"),
  body("linkedinProfile")
    .optional()
    .isURL()
    .withMessage("LinkedIn profile must be a valid URL"),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateAlumniProfile,
  validateJobPost,
  validateEvent,
  validateMentorship,
  validatePagination,
  validateSearch,
  validateId,
  validateEmail,
  validatePasswordReset,
  validateProfileUpdate,
};
