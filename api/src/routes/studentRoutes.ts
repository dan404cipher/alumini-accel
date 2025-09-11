import express from "express";
import {
  getAllStudentProfiles,
  getStudentProfileById,
  createStudentProfile,
  updateStudentProfile,
  addProject,
  updateProject,
  deleteProject,
  addInternshipExperience,
  addResearchWork,
  addCertification,
  sendConnectionRequest,
  respondToConnectionRequest,
  getConnectionRequests,
  getStudentProfileStats,
} from "@/controllers/studentController";
import { authenticateToken, authorize } from "@/middleware/auth";
import { validateRequest } from "@/middleware/validation";
import {
  uploadSingleDocument,
  uploadOptionalDocument,
  uploadMixedDocuments,
} from "@/middleware/fileUpload";
import { body, param, query } from "express-validator";

const router = express.Router();

// Validation schemas
const createStudentProfileValidation = [
  // Required fields (same as alumni)
  body("university")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("University must be between 2 and 100 characters"),
  body("department")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),
  body("program")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Program must be between 2 and 100 characters"),
  body("batchYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage("Batch year must be a valid year"),
  body("graduationYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 10 })
    .withMessage("Graduation year must be a valid year"),

  // Student-specific required fields
  body("rollNumber")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Roll number is required and must be between 1 and 50 characters"
    ),
  body("studentId")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage(
      "Student ID is required and must be between 1 and 50 characters"
    ),
  body("currentYear")
    .isIn([
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
      "5th Year",
      "Final Year",
      "Graduate",
    ])
    .withMessage(
      "Current year must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year, 5th Year, Final Year, Graduate"
    ),

  // Optional fields
  body("currentCGPA")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10"),
  body("currentGPA")
    .optional()
    .isFloat({ min: 0, max: 4 })
    .withMessage("GPA must be between 0 and 4"),
  body("linkedinProfile")
    .optional()
    .isURL()
    .withMessage("Invalid LinkedIn profile URL"),
  body("githubProfile")
    .optional()
    .isURL()
    .withMessage("Invalid GitHub profile URL"),
  body("portfolioUrl").optional().isURL().withMessage("Invalid portfolio URL"),
  body("twitterHandle")
    .optional()
    .matches(/^@?[\w]{1,15}$/)
    .withMessage("Invalid Twitter handle"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("skills.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Skill name cannot exceed 50 characters"),
  body("interests")
    .optional()
    .isArray()
    .withMessage("Interests must be an array"),
  body("interests.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Interest name cannot exceed 50 characters"),
  body("careerInterests")
    .optional()
    .isArray()
    .withMessage("Career interests must be an array"),
  body("careerInterests.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Career interest name cannot exceed 50 characters"),
  body("preferredJobLocation")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Preferred job location cannot exceed 100 characters"),
  body("preferredJobTypes")
    .optional()
    .isArray()
    .withMessage("Preferred job types must be an array"),
  body("preferredJobTypes.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Job type cannot exceed 50 characters"),
  body("expectedSalary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Expected salary must be a non-negative number"),
];

const updateStudentProfileValidation = [
  body("university")
    .optional()
    .notEmpty()
    .withMessage("University cannot be empty"),
  body("department")
    .optional()
    .notEmpty()
    .withMessage("Department cannot be empty"),
  body("program").optional().notEmpty().withMessage("Program cannot be empty"),
  body("batchYear")
    .optional()
    .isNumeric()
    .withMessage("Batch year must be a number"),
  body("graduationYear")
    .optional()
    .isNumeric()
    .withMessage("Graduation year must be a number"),
  body("rollNumber")
    .optional()
    .notEmpty()
    .withMessage("Roll number cannot be empty"),
  body("currentYear")
    .optional()
    .isIn([
      "1st Year",
      "2nd Year",
      "3rd Year",
      "4th Year",
      "5th Year",
      "Final Year",
      "Graduate",
    ])
    .withMessage("Invalid current year"),
  body("currentCGPA")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("CGPA must be between 0 and 10"),
  body("currentGPA")
    .optional()
    .isFloat({ min: 0, max: 4 })
    .withMessage("GPA must be between 0 and 4"),
  body("linkedinProfile")
    .optional()
    .isURL()
    .withMessage("Invalid LinkedIn profile URL"),
  body("githubProfile")
    .optional()
    .isURL()
    .withMessage("Invalid GitHub profile URL"),
  body("portfolioUrl").optional().isURL().withMessage("Invalid portfolio URL"),
  body("twitterHandle")
    .optional()
    .matches(/^@?[\w]{1,15}$/)
    .withMessage("Invalid Twitter handle"),
];

const addProjectValidation = [
  body("title").notEmpty().withMessage("Project title is required"),
  body("description").notEmpty().withMessage("Project description is required"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("githubUrl")
    .notEmpty()
    .withMessage("GitHub URL is required")
    .isURL()
    .withMessage("Invalid GitHub URL"),
  body("liveUrl").optional().isURL().withMessage("Invalid live URL"),
  body("teamMembers")
    .isArray()
    .withMessage("Team members must be an array")
    .isLength({ min: 1 })
    .withMessage("At least one team member is required"),
];

const updateProjectValidation = [
  body("title")
    .optional()
    .notEmpty()
    .withMessage("Project title cannot be empty"),
  body("description")
    .optional()
    .notEmpty()
    .withMessage("Project description cannot be empty"),
  body("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("githubUrl").optional().isURL().withMessage("Invalid GitHub URL"),
  body("liveUrl").optional().isURL().withMessage("Invalid live URL"),
];

const addInternshipValidation = [
  body("company").notEmpty().withMessage("Company name is required"),
  body("position").notEmpty().withMessage("Position is required"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("certificateUrl")
    .optional()
    .isURL()
    .withMessage("Invalid certificate URL"),
];

const addResearchValidation = [
  body("title").notEmpty().withMessage("Research title is required"),
  body("description")
    .notEmpty()
    .withMessage("Research description is required"),
  body("startDate").isISO8601().withMessage("Start date must be a valid date"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid date"),
  body("status")
    .optional()
    .isIn(["ongoing", "completed", "published", "presented"])
    .withMessage("Invalid status"),
  body("publicationUrl")
    .optional()
    .isURL()
    .withMessage("Invalid publication URL"),
];

const addCertificationValidation = [
  body("name").notEmpty().withMessage("Certification name is required"),
  body("issuer").notEmpty().withMessage("Issuer is required"),
  body("date").isISO8601().withMessage("Date must be a valid date"),
  body("credentialUrl")
    .optional()
    .isURL()
    .withMessage("Invalid credential URL"),
];

const connectionRequestValidation = [
  body("targetUserId").isMongoId().withMessage("Invalid target user ID"),
  body("message")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Message cannot exceed 500 characters"),
];

const respondToConnectionValidation = [
  body("status")
    .isIn(["accepted", "rejected"])
    .withMessage("Status must be 'accepted' or 'rejected'"),
];

// Public routes
router.get("/", getAllStudentProfiles);
router.get("/stats", getStudentProfileStats);
router.get("/:id", getStudentProfileById);

// Protected routes
router.use(authenticateToken);

// Profile management
router.post(
  "/profile",
  validateRequest(createStudentProfileValidation),
  createStudentProfile
);
router.put(
  "/profile",
  validateRequest(updateStudentProfileValidation),
  updateStudentProfile
);

// Projects
router.post(
  "/profile/projects",
  validateRequest(addProjectValidation),
  addProject
);
router.put(
  "/profile/projects/:projectId",
  validateRequest(updateProjectValidation),
  updateProject
);
router.delete("/profile/projects/:projectId", deleteProject);

// Internship experience
router.post(
  "/profile/internships",
  uploadOptionalDocument("certificateFile"),
  validateRequest(addInternshipValidation),
  addInternshipExperience
);

// Research work
router.post(
  "/profile/research",
  uploadMixedDocuments([
    { name: "publicationFile", maxCount: 1 },
    { name: "conferenceFile", maxCount: 1 },
  ]),
  validateRequest(addResearchValidation),
  addResearchWork
);

// Certifications
router.post(
  "/profile/certifications",
  uploadOptionalDocument("credentialFile"),
  validateRequest(addCertificationValidation),
  addCertification
);

// Connections
router.post(
  "/connections/request",
  validateRequest(connectionRequestValidation),
  sendConnectionRequest
);
router.put(
  "/connections/request/:requestId",
  validateRequest(respondToConnectionValidation),
  respondToConnectionRequest
);
router.get("/connections/requests", getConnectionRequests);

export default router;
