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
    const firstError = errors.array()[0]?.msg || "Validation failed";
    return res.status(400).json({
      success: false,
      message: firstError,
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
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
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
  body("phone")
    .optional()
    .trim()
    .isLength({ min: 10, max: 15 })
    .withMessage("Phone number must be between 10 and 15 characters"),
  body("role")
    .optional()
    .isIn(["student", "alumni", "admin", "coordinator"])
    .withMessage("Invalid role"),
  handleValidationErrors,
];

// User creation validation (for admin-created users)
export const validateUserCreation = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage(
      "Password must contain at least one uppercase letter, one number, and one special character"
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
    .isIn(["super_admin", "college_admin", "hod", "staff", "student", "alumni"])
    .withMessage("Invalid role"),
  body("graduationYear")
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 5 })
    .withMessage("Graduation year must be a valid year"),
  body("graduationYear").custom((value, { req }) => {
    const role = req.body.role;
    // If role is "student", graduationYear is required
    if (role === "student" && !value) {
      throw new Error("Graduation year is required when role is student");
    }
    return true;
  }),
  body("tenantId").custom((value, { req }) => {
    const role = req.body.role;
    if (role && role !== "super_admin") {
      if (!value) {
        throw new Error("tenantId is required for non-super-admin users");
      }
      // Validate that tenantId is a valid MongoDB ObjectId format (24 hex characters)
      if (typeof value === "string" && !/^[0-9a-fA-F]{24}$/.test(value)) {
        throw new Error("tenantId must be a valid ObjectId");
      }
    }
    return true;
  }),
  body("department")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),
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

// Alumni profile validation for skills and interests updates
export const validateAlumniSkillsInterests = [
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("careerInterests")
    .optional()
    .isArray()
    .withMessage("Career interests must be an array"),
  handleValidationErrors,
];

// Alumni profile validation (for creation)
export const validateAlumniProfile = [
  body("program")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Program must be between 2 and 100 characters"),
  body("batchYear")
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage(
      `Batch year must be between 1950 and ${new Date().getFullYear() + 1}`
    ),
  body("graduationYear")
    .isInt({ min: 2020, max: new Date().getFullYear() + 5 })
    .withMessage(
      `Graduation year must be between 2020 and ${new Date().getFullYear() + 5}`
    ),
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

// Alumni profile update validation (all fields optional)
export const validateAlumniProfileUpdate = [
  body("program")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Program must be between 2 and 100 characters"),
  body("batchYear")
    .optional()
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage(
      `Batch year must be between 1950 and ${new Date().getFullYear() + 1}`
    ),
  body("graduationYear")
    .optional()
    .isInt({ min: 2020, max: new Date().getFullYear() + 5 })
    .withMessage(
      `Graduation year must be between 2020 and ${new Date().getFullYear() + 5}`
    ),
  body("department")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department must be between 2 and 100 characters"),
  body("rollNumber")
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage("Roll number must be between 1 and 20 characters"),
  body("studentId")
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage("Student ID cannot exceed 20 characters"),
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
  body("salary")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Salary must be a non-negative number"),
  body("currency")
    .optional()
    .isIn(["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CHF", "CNY"])
    .withMessage("Currency must be a valid currency code"),
  body("skills").optional().isArray().withMessage("Skills must be an array"),
  body("skills.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Skill name cannot exceed 50 characters"),
  body("achievements")
    .optional()
    .isArray()
    .withMessage("Achievements must be an array"),
  body("achievements.*")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Achievement cannot exceed 200 characters"),
  body("isHiring")
    .optional()
    .isBoolean()
    .withMessage("isHiring must be a boolean"),
  body("availableForMentorship")
    .optional()
    .isBoolean()
    .withMessage("availableForMentorship must be a boolean"),
  body("mentorshipDomains")
    .optional()
    .isArray()
    .withMessage("Mentorship domains must be an array"),
  body("mentorshipDomains.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Mentorship domain cannot exceed 50 characters"),
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
    .custom((value) => {
      // Check if it's a valid enum value
      const validEnums = ["full-time", "part-time", "internship", "contract"];
      if (validEnums.includes(value)) {
        return true;
      }
      // Check if it's a valid ObjectId (24 hex characters)
      if (typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      throw new Error("Job type must be a valid enum value or ObjectId");
    })
    .withMessage("Invalid job type"),
  body("experience")
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Check if it's a valid enum value
      const validEnums = ["entry", "mid", "senior", "lead"];
      if (validEnums.includes(value)) {
        return true;
      }
      // Check if it's a valid ObjectId (24 hex characters)
      if (typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      throw new Error(
        "Experience level must be a valid enum value or ObjectId"
      );
    })
    .withMessage("Invalid experience level"),
  body("industry")
    .optional()
    .custom((value) => {
      if (!value) return true; // Optional field
      // Check if it's a valid enum value
      const validEnums = [
        "technology",
        "finance",
        "healthcare",
        "education",
        "consulting",
        "marketing",
        "sales",
        "operations",
        "other",
      ];
      if (validEnums.includes(value)) {
        return true;
      }
      // Check if it's a valid ObjectId (24 hex characters)
      if (typeof value === "string" && /^[0-9a-fA-F]{24}$/.test(value)) {
        return true;
      }
      throw new Error("Industry must be a valid enum value or ObjectId");
    })
    .withMessage("Invalid industry"),
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
  body("requiredSkills")
    .optional()
    .isArray()
    .withMessage("Required skills must be an array"),
  body("requiredSkills.*")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Required skill cannot exceed 100 characters"),
  handleValidationErrors,
];

// Job application validation
export const validateJobApplication = [
  body("skills")
    .isArray({ min: 1 })
    .withMessage("At least one skill is required"),
  body("skills.*")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Skill must be between 1 and 100 characters"),
  body("experience")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Experience must be between 10 and 1000 characters"),
  body("contactDetails.name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  body("contactDetails.email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email address"),
  body("contactDetails.phone")
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),
  body("message")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Message must be less than 1000 characters"),
  body("resume")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Resume path must be less than 500 characters"),
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

// Mentoring Program validation
export const validateMentoringProgram = [
  body("category")
    .trim()
    .notEmpty()
    .withMessage("Program category is required"),
  body("name")
    .trim()
    .isLength({ min: 1, max: 75 })
    .withMessage("Name must be between 1 and 75 characters")
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage("Name can only contain letters, numbers, spaces, and hyphens"),
  body("shortDescription")
    .trim()
    .isLength({ min: 1, max: 250 })
    .withMessage("Short description must be between 1 and 250 characters")
    .matches(/^[a-zA-Z0-9\s\-.,!?()]+$/)
    .withMessage("Short description contains invalid characters"),
  body("longDescription").optional().trim(),
  body("programSchedule")
    .isIn(["One-time", "Recurring"])
    .withMessage("Program schedule must be either 'One-time' or 'Recurring'"),
  body("programDuration.startDate")
    .isISO8601()
    .withMessage("Program start date must be a valid date"),
  body("programDuration.endDate")
    .isISO8601()
    .withMessage("Program end date must be a valid date")
    .custom((value, { req }) => {
      const startDate = new Date(req.body.programDuration?.startDate);
      const endDate = new Date(value);
      if (endDate <= startDate) {
        throw new Error("Program end date must be after start date");
      }
      return true;
    }),
  body("skillsRequired")
    .optional()
    .isArray()
    .withMessage("Skills required must be an array"),
  body("areasOfMentoring.mentor")
    .optional()
    .isArray()
    .withMessage("Mentor areas must be an array"),
  body("areasOfMentoring.mentee")
    .optional()
    .isArray()
    .withMessage("Mentee areas must be an array"),
  body("areasOfMentoring")
    .custom((value) => {
      if (!value) {
        throw new Error("Areas of mentoring is required");
      }
      const mentorAreas = value.mentor || [];
      const menteeAreas = value.mentee || [];
      if (mentorAreas.length === 0 && menteeAreas.length === 0) {
        throw new Error(
          "At least one area of mentoring is required for mentor or mentee"
        );
      }
      return true;
    })
    .withMessage(
      "At least one area of mentoring is required for mentor or mentee"
    ),
  body("entryCriteriaRules")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Entry criteria rules cannot exceed 2000 characters")
    .custom((value) => {
      if (!value || value.trim().length === 0) {
        return true; // Optional field
      }
      // Basic XSS prevention - check for script tags and dangerous patterns
      const dangerousPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
      ];
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          throw new Error(
            "Entry criteria contains invalid characters or potentially unsafe content"
          );
        }
      }
      return true;
    })
    .withMessage("Entry criteria contains invalid characters"),
  body("registrationEndDateMentee")
    .isISO8601()
    .withMessage("Mentee registration end date must be a valid date")
    .custom((value, { req }) => {
      const date = new Date(value);
      const programStart = req.body.programDuration?.startDate
        ? new Date(req.body.programDuration.startDate)
        : null;

      if (programStart && date <= programStart) {
        throw new Error(
          "Mentee registration end date must be after program start date"
        );
      }
      return true;
    }),
  body("registrationEndDateMentor")
    .isISO8601()
    .withMessage("Mentor registration end date must be a valid date")
    .custom((value, { req }) => {
      const date = new Date(value);
      const programStart = req.body.programDuration?.startDate
        ? new Date(req.body.programDuration.startDate)
        : null;

      if (programStart && date <= programStart) {
        throw new Error(
          "Mentor registration end date must be after program start date"
        );
      }
      return true;
    }),
  body("matchingEndDate")
    .isISO8601()
    .withMessage("Matching end date must be a valid date")
    .custom((value, { req }) => {
      const menteeRegEnd = new Date(req.body.registrationEndDateMentee);
      const mentorRegEnd = new Date(req.body.registrationEndDateMentor);
      const matchEnd = new Date(value);
      if (matchEnd <= menteeRegEnd || matchEnd <= mentorRegEnd) {
        throw new Error(
          "Matching end date must be after both registration end dates"
        );
      }
      return true;
    }),
  body("manager").isMongoId().withMessage("Manager must be a valid user ID"),
  body("coordinators")
    .optional()
    .isArray()
    .withMessage("Coordinators must be an array"),
  body("coordinators.*")
    .optional()
    .isMongoId()
    .withMessage("Each coordinator must be a valid user ID"),
  body("reportsEscalationsTo")
    .optional()
    .isArray()
    .withMessage("Reports/Escalations to must be an array"),
  body("reportsEscalationsTo.*")
    .optional()
    .isMongoId()
    .withMessage("Each reports/escalations user must be a valid user ID"),
  body("registrationApprovalBy")
    .isMongoId()
    .withMessage("Registration approval by must be a valid user ID"),
  body("emailTemplateMentorInvitation")
    .optional()
    .isMongoId()
    .withMessage("Email template for mentor invitation must be a valid ID"),
  body("emailTemplateMenteeInvitation")
    .optional()
    .isMongoId()
    .withMessage("Email template for mentee invitation must be a valid ID"),
  handleValidationErrors,
];

// Mentor Registration validation
export const validateMentorRegistration = [
  body("programId")
    .isMongoId()
    .withMessage("Program ID must be a valid MongoDB ID"),
  body("title")
    .isIn(["Mr", "Mrs", "Ms", "Dr"])
    .withMessage("Title must be one of: Mr, Mrs, Ms, Dr"),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("First name must be between 1 and 30 characters")
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      "First name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Last name must be between 1 and 30 characters")
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      "Last name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  body("preferredName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Preferred name must be between 1 and 100 characters")
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage(
      "Preferred name can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
  body("mobileNumber")
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true;
      // Basic phone validation
      return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(
        value
      );
    })
    .withMessage("Please enter a valid phone number with country code"),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const minDate = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate()
      );
      if (dob > minDate) {
        throw new Error("You must be at least 16 years old");
      }
      return true;
    }),
  body("personalEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Personal email must be a valid email address"),
  body("sitEmail")
    .optional()
    .isEmail()
    .normalizeEmail()
    .custom((value) => {
      // Only validate if provided (removed from form)
      if (!value) return true;
      const sitDomains = [
        "@sit.edu",
        "@sit.sg",
        process.env.SIT_EMAIL_DOMAIN || "@sit.edu",
      ];
      return sitDomains.some((domain) => value.toLowerCase().endsWith(domain));
    })
    .withMessage("SIT email must be a valid email with SIT domain"),
  body("classOf")
    .isInt({ min: 1950, max: new Date().getFullYear() })
    .withMessage(
      "Class of year must be a valid year between 1950 and current year"
    ),
  body("sitStudentId")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("SIT Student ID cannot exceed 10 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("SIT Student ID must be alphanumeric"),
  body("sitMatricNumber")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("SIT Matric Number cannot exceed 10 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("SIT Matric Number must be alphanumeric"),
  body("areasOfMentoring")
    .isArray({ min: 1 })
    .withMessage("At least one area of mentoring is required"),
  body("areasOfMentoring.*")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Each area of mentoring must be between 1 and 100 characters"),
  body("fbPreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("F&B Preference cannot exceed 100 characters"),
  body("dietaryRestrictions")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Dietary restrictions cannot exceed 100 characters"),
  body("optionToReceiveFB").optional().isBoolean(),
  body("preferredMailingAddress")
    .isEmail()
    .normalizeEmail()
    .withMessage("Preferred mailing address must be a valid email address"),
  body("eventSlotPreference.startDate")
    .optional()
    .isISO8601()
    .withMessage("Event slot start date must be a valid date"),
  body("eventSlotPreference.endDate")
    .optional()
    .isISO8601()
    .withMessage("Event slot end date must be a valid date"),
  body("eventSlotPreference")
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (value.endDate && value.startDate) {
        const start = new Date(value.startDate);
        const end = new Date(value.endDate);
        if (end <= start) {
          throw new Error("Event slot end date must be after start date");
        }
      }
      return true;
    }),
  body("eventMeetupPreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Event meetup preference cannot exceed 100 characters"),
  body("pdpaConsent").custom((value) => {
    if (value !== true && value !== "true") {
      throw new Error("PDPA consent must be accepted");
    }
    return true;
  }),
  body("recaptchaToken")
    .trim()
    .notEmpty()
    .withMessage("reCAPTCHA token is required"),
  handleValidationErrors,
];

// Mentee Registration validation
export const validateMenteeRegistration = [
  body("programId")
    .isMongoId()
    .withMessage("Program ID must be a valid MongoDB ID"),
  body("title")
    .isIn(["Mr", "Mrs", "Ms"])
    .withMessage("Title must be one of: Mr, Mrs, Ms"),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("First name must be between 1 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("First name can only contain letters (a-z, A-Z) and spaces"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage("Last name must be between 1 and 30 characters")
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage("Last name can only contain letters (a-z, A-Z) and spaces"),
  body("mobileNumber")
    .optional()
    .trim()
    .custom((value) => {
      if (!value || !value.trim()) return true;

      // Remove all spaces, dashes, and parentheses for validation
      const cleanedNumber = value.replace(/[\s\-\(\)]/g, "");

      // Indian mobile number validation: 10 digits starting with 9, 8, 7, or 6
      let digits = cleanedNumber;

      // Remove country code if present (+91 or 91)
      if (cleanedNumber.startsWith("+91")) {
        digits = cleanedNumber.substring(3);
      } else if (
        cleanedNumber.startsWith("91") &&
        cleanedNumber.length === 12
      ) {
        digits = cleanedNumber.substring(2);
      }

      // Validate: exactly 10 digits starting with 9, 8, 7, or 6
      const indianMobileRegex = /^[6789]\d{9}$/;

      if (!indianMobileRegex.test(digits)) {
        throw new Error(
          "Please enter a valid Indian mobile number (10 digits starting with 9, 8, 7, or 6). Example: 9876543210 or +91 9876543210"
        );
      }

      return true;
    }),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("Date of birth must be a valid date")
    .custom((value) => {
      const dob = new Date(value);
      const today = new Date();
      const minDate = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate()
      );
      if (dob > minDate) {
        throw new Error("You must be at least 16 years old");
      }
      return true;
    }),
  body("personalEmail")
    .isEmail()
    .normalizeEmail()
    .withMessage("Personal email must be a valid email address"),
  body("classOf")
    .custom((value) => {
      const classOfNumber = parseInt(value);
      if (
        isNaN(classOfNumber) ||
        classOfNumber < 1950 ||
        classOfNumber > new Date().getFullYear()
      ) {
        throw new Error(
          `Class of year must be a valid year between 1950 and ${new Date().getFullYear()}`
        );
      }
      return true;
    })
    .withMessage(
      "Class of year must be a valid year between 1950 and current year"
    ),
  body("sitStudentId")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("SIT Student ID cannot exceed 10 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("SIT Student ID must be alphanumeric"),
  body("sitMatricNumber")
    .optional()
    .trim()
    .isLength({ max: 10 })
    .withMessage("SIT Matric Number cannot exceed 10 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("SIT Matric Number must be alphanumeric"),
  body("areasOfMentoring")
    .custom((value) => {
      // Handle FormData array format (areasOfMentoring[] or comma-separated)
      let areasArray: string[] = [];
      if (Array.isArray(value)) {
        areasArray = value;
      } else if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          areasArray = Array.isArray(parsed) ? parsed : [value];
        } catch {
          areasArray = value.includes(",")
            ? value.split(",").map((a: string) => a.trim())
            : [value];
        }
      }

      if (!areasArray || areasArray.length === 0) {
        throw new Error("At least one area of mentoring is required");
      }

      // Validate each area
      for (const area of areasArray) {
        const trimmed = String(area).trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new Error(
            "Each area of mentoring must be between 1 and 100 characters"
          );
        }
      }

      return true;
    })
    .withMessage("At least one area of mentoring is required"),
  body("fbPreference")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("F&B Preference cannot exceed 100 characters"),
  body("dietaryRestrictions")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Dietary restrictions cannot exceed 100 characters"),
  body("preferredMailingAddress")
    .isEmail()
    .normalizeEmail()
    .withMessage("Preferred mailing address must be a valid email address"),
  body("eventSlotPreference")
    .isIn(["Weekend afternoon", "Weekday evenings"])
    .withMessage(
      "Event slot preference must be either 'Weekend afternoon' or 'Weekday evenings'"
    ),
  body("eventMeetupPreference")
    .isIn(["Virtual", "Physical"])
    .withMessage(
      "Event meetup preference must be either 'Virtual' or 'Physical'"
    ),
  body("pdpaConsent").custom((value) => {
    if (value !== true && value !== "true") {
      throw new Error("PDPA consent must be accepted");
    }
    return true;
  }),
  body("recaptchaToken")
    .trim()
    .notEmpty()
    .withMessage("reCAPTCHA token is required"),
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

// Membership ID parameter validation
export const validateMembershipId = [
  param("membershipId").isMongoId().withMessage("Invalid membership ID format"),
  handleValidationErrors,
];

// Community ID parameter validation
export const validateCommunityId = [
  param("communityId").isMongoId().withMessage("Invalid ID format"),
  handleValidationErrors,
];

// Post ID parameter validation
export const validatePostId = [
  param("postId").isMongoId().withMessage("Invalid post ID format"),
  handleValidationErrors,
];

// Comment ID parameter validation
export const validateCommentId = [
  param("commentId").isMongoId().withMessage("Invalid comment ID format"),
  handleValidationErrors,
];

// Program ID parameter validation
export const validateProgramId = [
  param("programId").isMongoId().withMessage("Invalid ID format"),
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
  body("token")
    .isString()
    .isLength({ min: 1 })
    .withMessage("Token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/
    )
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
  body("dateOfBirth")
    .optional()
    .isISO8601()
    .withMessage("Date of birth must be a valid date"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),
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

// Internship validation
export const addInternshipValidation = [
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

// Research validation
export const addResearchValidation = [
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

// Certification validation
export const addCertificationValidation = [
  body("name").notEmpty().withMessage("Certification name is required"),
  body("issuer").notEmpty().withMessage("Issuer is required"),
  body("date").isISO8601().withMessage("Date must be a valid date"),
  body("credentialUrl")
    .optional()
    .isURL()
    .withMessage("Invalid credential URL"),
];

// Community validation
export const validateCommunity = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Community name must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters"),
  body("type")
    .isIn(["open", "closed", "hidden"])
    .withMessage("Community type must be open, closed, or hidden"),
  body("coverImage")
    .optional()
    .custom((value) => {
      // Allow null, undefined, empty string, or valid URL
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "null"
      ) {
        return true;
      }
      // Check if it's a relative path (starts with /uploads/)
      if (typeof value === "string" && value.startsWith("/uploads/")) {
        return true;
      }
      // Check if it's a valid absolute URL
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage("Cover image must be a valid URL or relative path"),
  body("logo")
    .optional()
    .custom((value) => {
      // Allow null, undefined, empty string, or valid URL
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        value === "null"
      ) {
        return true;
      }
      // Check if it's a relative path (starts with /uploads/)
      if (typeof value === "string" && value.startsWith("/uploads/")) {
        return true;
      }
      // Check if it's a valid absolute URL
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
    .withMessage("Logo must be a valid URL or relative path"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tag cannot exceed 50 characters"),
  body("rules").optional().isArray().withMessage("Rules must be an array"),
  body("rules.*")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Rule cannot exceed 200 characters"),
  body("externalLinks.website")
    .optional()
    .isURL()
    .withMessage("Website must be a valid URL"),
  body("externalLinks.github")
    .optional()
    .isURL()
    .withMessage("GitHub must be a valid URL"),
  body("externalLinks.slack")
    .optional()
    .isURL()
    .withMessage("Slack must be a valid URL"),
  body("externalLinks.discord")
    .optional()
    .isURL()
    .withMessage("Discord must be a valid URL"),
  body("externalLinks.other")
    .optional()
    .isURL()
    .withMessage("Other link must be a valid URL"),
  body("invitedUsers")
    .optional()
    .isArray()
    .withMessage("Invited users must be an array"),
  body("invitedUsers.*")
    .optional()
    .isMongoId()
    .withMessage("Invited user ID must be a valid MongoDB ObjectId"),
  body("settings.allowMemberPosts")
    .optional()
    .isBoolean()
    .withMessage("allowMemberPosts must be a boolean"),
  body("settings.requirePostApproval")
    .optional()
    .isBoolean()
    .withMessage("requirePostApproval must be a boolean"),
  body("settings.allowMediaUploads")
    .optional()
    .isBoolean()
    .withMessage("allowMediaUploads must be a boolean"),
  body("settings.allowComments")
    .optional()
    .isBoolean()
    .withMessage("allowComments must be a boolean"),
  body("settings.allowPolls")
    .optional()
    .isBoolean()
    .withMessage("allowPolls must be a boolean"),
  handleValidationErrors,
];

// Community post validation
export const validateCommunityPost = [
  body("title")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Title must be between 1 and 100 characters"),
  body("content")
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage("Content must be between 1 and 2000 characters"),
  body("type")
    .isIn(["text", "image", "video", "poll", "announcement"])
    .withMessage("Post type must be text, image, video, poll, or announcement"),
  body("mediaUrls")
    .optional()
    .isArray()
    .withMessage("Media URLs must be an array"),
  body("mediaUrls.*")
    .optional()
    .custom((value) => {
      // Allow localhost URLs and standard URLs
      const urlPattern =
        /^https?:\/\/(localhost|127\.0\.0\.1|[\w.-]+)(:\d+)?\/.+$/i;
      if (!urlPattern.test(value)) {
        throw new Error("Media URL must be a valid URL");
      }
      return true;
    }),
  body("pollOptions")
    .optional()
    .isArray()
    .withMessage("Poll options must be an array"),
  body("pollOptions.*.option")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Poll option must be between 1 and 100 characters"),
  body("pollEndDate")
    .optional()
    .isISO8601()
    .withMessage("Poll end date must be a valid date"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Tag cannot exceed 50 characters"),
  body("isAnnouncement")
    .optional()
    .isBoolean()
    .withMessage("isAnnouncement must be a boolean"),
  body("priority")
    .optional()
    .isIn(["high", "medium", "low"])
    .withMessage("Priority must be high, medium, or low"),
  body("category")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Category cannot exceed 50 characters"),
  handleValidationErrors,
];

// Community comment validation
export const validateCommunityComment = [
  body("content")
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage("Comment content must be between 1 and 500 characters"),
  body("parentCommentId")
    .optional()
    .isMongoId()
    .withMessage("Parent comment ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

// Community membership validation
export const validateCommunityMembership = [
  body("userId")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("role")
    .optional()
    .isIn(["member", "moderator", "admin"])
    .withMessage("Role must be member, moderator, or admin"),
  handleValidationErrors,
];

// Community membership suspension validation
export const validateCommunityMembershipSuspension = [
  body("reason")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Suspension reason must be between 1 and 200 characters"),
  body("endDate")
    .optional()
    .isISO8601()
    .withMessage("Suspension end date must be a valid date"),
  handleValidationErrors,
];

// Community search validation
export const validateCommunitySearch = [
  ...validatePagination,
  query("q")
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage("Search query must not be empty"),
  query("type")
    .optional()
    .isIn(["open", "closed", "hidden"])
    .withMessage("Community type must be open, closed, or hidden"),
  query("tags").optional().isString().withMessage("Tags must be a string"),
  handleValidationErrors,
];

// Poll vote validation
export const validatePollVote = [
  body("optionIndex")
    .isInt({ min: 0 })
    .withMessage("Option index must be a non-negative integer"),
  handleValidationErrors,
];

export default {
  handleValidationErrors,
  validateUserRegistration,
  validateUserCreation,
  validateUserLogin,
  validateAlumniProfile,
  validateAlumniProfileUpdate,
  validateJobPost,
  validateJobApplication,
  validateEvent,
  validateMentorship,
  validatePagination,
  validateSearch,
  validateId,
  validateMembershipId,
  validateCommunityId,
  validatePostId,
  validateCommentId,
  validateEmail,
  validatePasswordReset,
  validateProfileUpdate,
  addInternshipValidation,
  addResearchValidation,
  addCertificationValidation,
  validateCommunity,
  validateCommunityPost,
  validateCommunityComment,
  validateCommunityMembership,
  validateCommunityMembershipSuspension,
  validateCommunitySearch,
  validatePollVote,
};
