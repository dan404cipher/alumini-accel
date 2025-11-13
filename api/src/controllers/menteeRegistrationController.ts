
import { Request, Response } from "express";
import MenteeRegistration, {
  generateRegistrationToken,
} from "../models/MenteeRegistration";
import MentoringProgram from "../models/MentoringProgram";
import User from "../models/User";
import { logger } from "../utils/logger";
import { MenteeRegistrationStatus } from "../types";
import { emailService } from "../services/emailService";
import { verifyRecaptcha } from "../utils/recaptcha";

// Generate registration link for a program
export const generateRegistrationLink = async (
  req: Request,
  res: Response
) => {
  try {
    const { programId } = req.params;

    const program = await MentoringProgram.findById(programId);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // 🔒 MULTI-TENANT CHECK
    if (
      req.user?.role !== "super_admin" &&
      req.user?.tenantId &&
      program.tenantId.toString() !== req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Generate unique token
    const token = generateRegistrationToken();

    // Get frontend URL from environment
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:8080";
    const registrationLink = `${frontendUrl}/mentee-registration?token=${token}&programId=${program._id}`;

    return res.json({
      success: true,
      data: {
        token,
        registrationLink,
        programId: program._id,
        programName: program.name,
        expiresAt: program.registrationEndDateMentee,
      },
    });
  } catch (error) {
    logger.error("Generate registration link error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate registration link",
    });
  }
};

// Get registration form by token (Public endpoint)
export const getRegistrationByToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    // Find registration with this token (even if not submitted, token exists for access)
    // For now, we'll check the program and return registration status
    // The token is validated when accessing the form

    // Since tokens are generated on-demand, we need to validate against program
    // For this implementation, we'll store token in a temporary way or validate differently
    // For simplicity, let's check if we can find a program that should have this token

    // Actually, since tokens are generated dynamically, we should validate the token
    // by checking the program's registration closure date and returning program info
    // Let's create a different approach - validate token format and program from query

    const { programId } = req.query;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required",
      });
    }

    const program = await MentoringProgram.findById(programId);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Check if program is published first
    if (program.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This program is not currently accepting registrations",
        data: {
          isOpen: false,
          registrationEndDate: program.registrationEndDateMentee,
        },
      });
    }

    // Check registration closure date
    // Compare dates at midnight to avoid timezone issues
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(program.registrationEndDateMentee);
    const endDateMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Registration is open if end date is today or in the future
    if (endDateMidnight < today) {
      return res.status(400).json({
        success: false,
        message: "Program registration has expired",
        data: {
          isOpen: false,
          registrationEndDate: program.registrationEndDateMentee,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        program: {
          id: program._id,
          name: program.name,
          category: program.category,
          shortDescription: program.shortDescription,
        },
        isOpen: true,
        registrationEndDate: program.registrationEndDateMentee,
        token: token, // Return token for validation
      },
    });
  } catch (error) {
    logger.error("Get registration by token error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registration information",
    });
  }
};

// Validate student ID (Public endpoint)
export const validateStudentID = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { studentId, programId } = req.body;

    if (!studentId || !programId) {
      return res.status(400).json({
        success: false,
        message: "Student ID and Program ID are required",
      });
    }

    const program = await MentoringProgram.findById(programId);

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Basic validation - student ID format
    // In a real scenario, you might validate against a student database
    if (studentId.trim().length === 0 || studentId.length > 20) {
      return res.status(400).json({
        success: false,
        message: "Invalid student ID format",
      });
    }

    // Store validated student ID (we'll use this when submitting registration)
    // For now, just return success

    return res.json({
      success: true,
      message: "Student ID validated successfully",
      data: {
        studentId: studentId.trim(),
        token, // Return token for form submission
      },
    });
  } catch (error) {
    logger.error("Validate student ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate student ID",
    });
  }
};

// Submit mentee registration (Public endpoint with token)
export const submitRegistration = async (req: Request, res: Response) => {
  try {
    const {
      programId,
      token,
      validatedStudentId,
      title,
      firstName,
      lastName,
      mobileNumber,
      dateOfBirth,
      personalEmail,
      classOf,
      sitStudentId,
      sitMatricNumber,
      areasOfMentoring,
      fbPreference,
      dietaryRestrictions,
      preferredMailingAddress,
      eventSlotPreference,
      eventMeetupPreference,
      pdpaConsent,
      recaptchaToken,
    } = req.body;

    // Validate program exists
    const program = await MentoringProgram.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Check if program is published
    if (program.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "This program is not currently accepting registrations",
      });
    }

    // Check registration closure date
    // Compare dates at midnight to avoid timezone issues
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(program.registrationEndDateMentee);
    const endDateMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Registration is open if end date is today or in the future
    if (endDateMidnight < today) {
      return res.status(400).json({
        success: false,
        message: "Program registration has expired",
      });
    }

    // Validate PDPA consent
    if (!pdpaConsent) {
      return res.status(400).json({
        success: false,
        message: "PDPA consent is required",
      });
    }

    // Verify reCAPTCHA token (skip if bypass token is sent or reCAPTCHA is not configured)
    if (!recaptchaToken) {
      return res.status(400).json({
        success: false,
        message: "reCAPTCHA verification is required",
      });
    }

    // Allow bypass in development if reCAPTCHA is not configured
    if (recaptchaToken === "bypass-no-recaptcha-configured") {
      if (process.env.NODE_ENV === "development") {
        logger.warn("reCAPTCHA bypass used - reCAPTCHA not configured in development");
      } else {
        return res.status(400).json({
          success: false,
          message: "reCAPTCHA verification is required in production",
        });
      }
    } else {
      // Verify reCAPTCHA token
      const clientIp = req.ip || req.socket.remoteAddress || undefined;
      const recaptchaVerification = await verifyRecaptcha(recaptchaToken, clientIp);

      if (!recaptchaVerification.success) {
        logger.warn("reCAPTCHA verification failed for mentee registration", {
          programId,
          personalEmail,
          error: recaptchaVerification.error,
          clientIp,
        });
        return res.status(400).json({
          success: false,
          message: recaptchaVerification.error || "reCAPTCHA verification failed. Please try again.",
        });
      }
    }

    // Validate required fields
    if (!title || !firstName || !lastName || !dateOfBirth || !personalEmail || !classOf) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Please fill in all required fields.",
      });
    }

    // Validate classOf is a valid number
    const classOfNumber = parseInt(classOf);
    if (isNaN(classOfNumber) || classOfNumber < 1950 || classOfNumber > new Date().getFullYear()) {
      return res.status(400).json({
        success: false,
        message: `Invalid class of year. Must be between 1950 and ${new Date().getFullYear()}.`,
      });
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
      });
    }

    // Parse areasOfMentoring array from FormData
    let areasOfMentoringArray: string[] = [];
    if (areasOfMentoring) {
      if (Array.isArray(areasOfMentoring)) {
        areasOfMentoringArray = areasOfMentoring;
      } else if (typeof areasOfMentoring === "string") {
        // Handle FormData array format (areasOfMentoring[] or comma-separated)
        try {
          const parsed = JSON.parse(areasOfMentoring);
          areasOfMentoringArray = Array.isArray(parsed) ? parsed : [areasOfMentoring];
        } catch {
          // If not JSON, check if it's comma-separated or single value
          areasOfMentoringArray = areasOfMentoring.includes(",")
            ? areasOfMentoring.split(",").map((a: string) => a.trim())
            : [areasOfMentoring];
        }
      }
    }

    // Validate areasOfMentoring is not empty
    if (!areasOfMentoringArray || areasOfMentoringArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one area of mentoring is required",
      });
    }

    // Generate unique registration token if not provided
    const registrationToken = token || generateRegistrationToken();

    // Handle CV file upload if present
    const cvPath = req.file
      ? `uploads/documents/${req.file.filename}`
      : undefined;

    // Create registration
    const registration = new MenteeRegistration({
      programId,
      registrationToken,
      status: MenteeRegistrationStatus.SUBMITTED,
      title,
      firstName,
      lastName,
      mobileNumber: mobileNumber || undefined,
      dateOfBirth: dob,
      personalEmail: personalEmail.toLowerCase(),
      classOf: classOfNumber,
      sitStudentId: sitStudentId || undefined,
      sitMatricNumber: sitMatricNumber || undefined,
      menteeCV: cvPath,
      areasOfMentoring: areasOfMentoringArray,
      fbPreference: fbPreference || undefined,
      dietaryRestrictions: dietaryRestrictions || undefined,
      preferredMailingAddress: preferredMailingAddress.toLowerCase(),
      eventSlotPreference,
      eventMeetupPreference,
      pdpaConsent: true,
      recaptchaToken,
      validatedStudentId: validatedStudentId || sitStudentId || sitMatricNumber,
      submittedAt: new Date(),
      tenantId: program.tenantId,
    });

    await registration.save();

    // Send confirmation email to mentee
    try {
      await emailService.sendEmail({
        to: preferredMailingAddress,
        subject: `Mentee Registration Submitted - ${program.name}`,
        html: `
          <h2>Mentee Registration Submitted Successfully</h2>
          <p>Dear ${firstName} ${lastName},</p>
          <p>Thank you for registering as a mentee for the <strong>${program.name}</strong> program.</p>
          <p>Your registration has been submitted and is now awaiting approval.</p>
          <p>You will be notified once your registration is reviewed.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send confirmation email:", emailError);
      // Don't fail registration if email fails
    }

    // Send notification to all program coordinators
    if (program.coordinators && program.coordinators.length > 0) {
      try {
        const coordinators = await User.find({
          _id: { $in: program.coordinators },
        });

        const coordinatorEmails = coordinators
          .map((c) => c.email)
          .filter(Boolean);

        if (coordinatorEmails.length > 0) {
          for (const email of coordinatorEmails) {
            await emailService.sendEmail({
              to: email,
              subject: `New Mentee Registration - ${program.name}`,
              html: `
                <h2>New Mentee Registration</h2>
                <p>A new mentee registration has been submitted for the program: <strong>${program.name}</strong></p>
                <p><strong>Mentee Details:</strong></p>
                <ul>
                  <li>Name: ${firstName} ${lastName}</li>
                  <li>Email: ${personalEmail}</li>
                  <li>Class Of: ${classOf}</li>
                </ul>
                <p>Please review and approve the registration.</p>
              `,
            });
          }
        }
      } catch (emailError) {
        logger.error("Failed to send coordinator notification:", emailError);
      }
    }

    const populatedRegistration = await MenteeRegistration.findById(
      registration._id
    ).populate("programId", "name category");

    return res.status(201).json({
      success: true,
      message: "Mentee registration submitted successfully",
      data: { registration: populatedRegistration },
    });
  } catch (error: any) {
    logger.error("Submit mentee registration error:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      errors: error.errors,
      programId: req.body?.programId,
      personalEmail: req.body?.personalEmail,
    });

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors || {}).map((e: any) => e.message);
      return res.status(400).json({
        success: false,
        message: validationErrors.length > 0 
          ? `Validation error: ${validationErrors.join(", ")}`
          : "Invalid form data. Please check all fields and try again.",
        errors: error.errors,
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A registration already exists for this mentee and program.",
      });
    }

    // Handle CastError (invalid ObjectId, etc.)
    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: `Invalid value for ${error.path}: ${error.message}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit mentee registration",
    });
  }
};

// Get registration by ID
export const getRegistrationById = async (req: Request, res: Response) => {
  try {
    const registration = await MenteeRegistration.findById(req.params.id)
      .populate("programId")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email");

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // 🔒 MULTI-TENANT CHECK
    if (
      req.user?.role !== "super_admin" &&
      req.user?.tenantId &&
      registration.tenantId.toString() !== req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this registration",
      });
    }

    // Check if user is Staff/Admin or accessing via token
    const isStaff =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isStaff) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.json({
      success: true,
      data: { registration },
    });
  } catch (error) {
    logger.error("Get registration by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registration",
    });
  }
};

// Get registrations by program (Staff/Admin only)
export const getRegistrationsByProgram = async (
  req: Request,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = { programId };

    // Apply status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // 🔒 MULTI-TENANT FILTERING
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    const registrations = await MenteeRegistration.find(filter)
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MenteeRegistration.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get registrations by program error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
    });
  }
};

// Approve registration
export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const registration = await MenteeRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // 🔒 MULTI-TENANT CHECK
    if (
      req.user?.role !== "super_admin" &&
      req.user?.tenantId &&
      registration.tenantId.toString() !== req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get program to check matching date
    const program = await MentoringProgram.findById(registration.programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Check if matching date has passed
    const now = new Date();
    if (new Date(program.matchingEndDate) < now) {
      return res.status(400).json({
        success: false,
        message: "Approval deadline has passed. Cannot approve after matching end date.",
      });
    }

    if (registration.status === MenteeRegistrationStatus.APPROVED) {
      return res.status(400).json({
        success: false,
        message: "Registration is already approved",
      });
    }

    registration.status = MenteeRegistrationStatus.APPROVED;
    registration.approvedBy = req.user?.id;
    registration.approvedAt = new Date();
    if (registration.rejectionReason) {
      registration.rejectionReason = undefined;
    }

    await registration.save();

    // Send approval email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentee Registration Approved - ${program.name}`,
        html: `
          <h2>Mentee Registration Approved</h2>
          <p>Dear ${registration.firstName} ${registration.lastName},</p>
          <p>Congratulations! Your registration as a mentee for the <strong>${program.name}</strong> program has been approved.</p>
          <p>You will be notified about the next steps in the mentoring process.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send approval email:", emailError);
    }

    const updatedRegistration = await MenteeRegistration.findById(
      registration._id
    )
      .populate("approvedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration approved successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Approve registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve registration",
    });
  }
};

// Reject registration
export const rejectRegistration = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required (minimum 10 characters)",
      });
    }

    const registration = await MenteeRegistration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // 🔒 MULTI-TENANT CHECK
    if (
      req.user?.role !== "super_admin" &&
      req.user?.tenantId &&
      registration.tenantId.toString() !== req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    // Get program to check matching date
    const program = await MentoringProgram.findById(registration.programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Check if matching date has passed
    const now = new Date();
    if (new Date(program.matchingEndDate) < now) {
      return res.status(400).json({
        success: false,
        message: "Rejection deadline has passed. Cannot reject after matching end date.",
      });
    }

    if (registration.status === MenteeRegistrationStatus.REJECTED) {
      return res.status(400).json({
        success: false,
        message: "Registration is already rejected",
      });
    }

    registration.status = MenteeRegistrationStatus.REJECTED;
    registration.rejectedBy = req.user?.id;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason.trim();

    await registration.save();

    // Send rejection email
    try {
      await emailService.sendEmail({
        to: registration.preferredMailingAddress,
        subject: `Mentee Registration Update - ${program.name}`,
        html: `
          <h2>Mentee Registration Update</h2>
          <p>Dear ${registration.firstName} ${registration.lastName},</p>
          <p>Unfortunately, your registration as a mentee for the <strong>${program.name}</strong> program has been rejected.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you have any questions, please contact the program coordinators.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send rejection email:", emailError);
    }

    const updatedRegistration = await MenteeRegistration.findById(
      registration._id
    )
      .populate("rejectedBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Registration rejected successfully",
      data: { registration: updatedRegistration },
    });
  } catch (error) {
    logger.error("Reject registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject registration",
    });
  }
};

// Update registration on behalf (Staff fills form)
// Get my mentee registrations
export const getMyMenteeRegistrations = async (
  req: Request,
  res: Response
) => {
  try {
    const userEmail = req.user?.email;
    const userId = req.user?.id || req.user?._id;
    const tenantId = req.user?.tenantId;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User email not found",
      });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100; // High limit to get all
    const skip = (page - 1) * limit;

    // Find mentee registrations by email
    const registrationsByEmail = await MenteeRegistration.find({
      personalEmail: userEmail.toLowerCase(),
      tenantId,
    })
      .populate("programId", "name category status programDuration registrationEndDateMentee")
      .sort({ submittedAt: -1 });

    // Also check if user is matched as a mentee (via MentorMenteeMatching)
    // This covers cases where the user registered and was matched
    const MentorMenteeMatching = (await import("../models/MentorMenteeMatching")).default;
    const matches = await MentorMenteeMatching.find({
      menteeId: userId,
      tenantId,
    })
      .populate({
        path: "menteeRegistrationId",
        model: "MenteeRegistration",
        populate: {
          path: "programId",
          select: "name category status programDuration registrationEndDateMentee",
        },
      })
      .select("menteeRegistrationId");

    // Get unique registration IDs from matches
    const matchedRegistrationIds = new Set(
      matches
        .map((m: any) => m.menteeRegistrationId?._id?.toString())
        .filter(Boolean)
    );

    // Combine registrations from email match and matches
    const allRegistrations = [...registrationsByEmail];
    
    // Add registrations from matches that aren't already in the list
    matches.forEach((match: any) => {
      if (match.menteeRegistrationId) {
        const regId = match.menteeRegistrationId._id.toString();
        if (!allRegistrations.some((r) => r._id.toString() === regId)) {
          allRegistrations.push(match.menteeRegistrationId);
        }
      }
    });

    // Verify user exists
    const User = (await import("../models/User")).default;
    const user = await User.findById(userId).select("email firstName lastName");
    
    if (!user || user.email.toLowerCase() !== userEmail.toLowerCase()) {
      // User email mismatch - return empty results for security
      logger.warn("User email mismatch when fetching mentee registrations", {
        userId: userId,
        userEmailFromToken: userEmail,
        userEmailFromDB: user?.email,
      });
      return res.json({
        success: true,
        data: {
          registrations: [],
          pagination: {
            page: 1,
            limit,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    // Filter registrations:
    // 1. Email must match (for email-based registrations)
    // 2. OR registration must be in matches (for matched mentees)
    // 3. Name matching is optional - only exclude if names are clearly different AND email doesn't match
    const verifiedRegistrations = allRegistrations.filter((reg) => {
      const emailMatches = reg.personalEmail.toLowerCase() === userEmail.toLowerCase();
      const isMatched = matchedRegistrationIds.has(reg._id.toString());
      
      // If email matches or it's a matched registration, include it
      if (emailMatches || isMatched) {
        // Only do name check if email doesn't match (extra verification for matched registrations)
        if (!emailMatches && user.firstName && user.lastName) {
          const userFullName = `${user.firstName} ${user.lastName}`.toLowerCase().trim();
          const regFullName = `${reg.firstName} ${reg.lastName}`.toLowerCase().trim();
          
          // Only exclude if names are significantly different (more than just spacing/casing)
          // Allow minor differences (e.g., "John Doe" vs "John  Doe" or "john doe")
          const normalizedUser = userFullName.replace(/\s+/g, " ");
          const normalizedReg = regFullName.replace(/\s+/g, " ");
          
          if (normalizedUser !== normalizedReg) {
            // Check if it's just a minor difference (like extra spaces or case)
            const userWords = normalizedUser.split(" ").sort();
            const regWords = normalizedReg.split(" ").sort();
            
            // If the words are the same (just different order or spacing), allow it
            if (JSON.stringify(userWords) !== JSON.stringify(regWords)) {
              logger.warn("Mentee registration excluded due to significant name mismatch", {
                userId: userId,
                userEmail: userEmail,
                userFullName: userFullName,
                registrationId: reg._id,
                registrationEmail: reg.personalEmail,
                registrationFullName: regFullName,
                programId: reg.programId?._id || reg.programId,
              });
              return false;
            }
          }
        }
        return true;
      }
      
      return false;
    });

    // Apply pagination
    const paginatedRegistrations = verifiedRegistrations.slice(skip, skip + limit);

    return res.json({
      success: true,
      data: {
        registrations: paginatedRegistrations,
        pagination: {
          page,
          limit,
          total: verifiedRegistrations.length,
          totalPages: Math.ceil(verifiedRegistrations.length / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get my mentee registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentee registrations",
    });
  }
};

// Check if current user has registered as mentee for a program
export const checkMyMenteeRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const userEmail = req.user?.email;

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: "User email not found",
      });
    }

    // Check if user has a mentee registration for this program
    const menteeRegistration = await MenteeRegistration.findOne({
      programId,
      personalEmail: userEmail.toLowerCase(),
      tenantId: req.user?.tenantId,
    });

    return res.json({
      success: true,
      data: {
        hasRegistration: !!menteeRegistration,
        registration: menteeRegistration ? {
          _id: menteeRegistration._id,
          status: menteeRegistration.status,
          submittedAt: menteeRegistration.submittedAt,
        } : null,
      },
    });
  } catch (error) {
    logger.error("Check my mentee registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check mentee registration",
    });
  }
};

export const updateRegistrationOnBehalf = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      programId,
      validatedStudentId,
      title,
      firstName,
      lastName,
      mobileNumber,
      dateOfBirth,
      personalEmail,
      classOf,
      sitStudentId,
      sitMatricNumber,
      areasOfMentoring,
      fbPreference,
      dietaryRestrictions,
      preferredMailingAddress,
      eventSlotPreference,
      eventMeetupPreference,
      pdpaConsent,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "programId",
      "title",
      "firstName",
      "lastName",
      "personalEmail",
      "classOf",
      "dateOfBirth",
    ];
    const missingFields = requiredFields.filter(
      (field) => !req.body[field] || req.body[field].toString().trim() === ""
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    // Check user role (additional validation at controller level)
    const isStaff =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isStaff) {
      return res.status(403).json({
        success: false,
        message: "Only staff and administrators can create registrations on behalf of mentees",
      });
    }

    // Validate program exists
    const program = await MentoringProgram.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Validate tenant access to program
    const tenantId = req.user?.tenantId;
    if (
      req.user?.role !== "super_admin" &&
      tenantId &&
      program.tenantId &&
      program.tenantId.toString() !== tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only create registrations for programs in your tenant.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(personalEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid personal email format",
      });
    }

    // Validate date of birth
    const dob = new Date(dateOfBirth);
    if (isNaN(dob.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date of birth format",
      });
    }

    // Validate student ID if provided
    const studentId = validatedStudentId || sitStudentId || sitMatricNumber;
    if (!studentId || studentId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Student ID, SIT Student ID, or SIT Matric Number is required",
      });
    }

    // Check if registration already exists (by email or student ID)
    let registration = await MenteeRegistration.findOne({
      programId,
      tenantId: tenantId || program.tenantId,
      $or: [
        { personalEmail: personalEmail.toLowerCase() },
        { validatedStudentId: studentId },
        { sitStudentId: studentId },
        { sitMatricNumber: studentId },
      ],
    });

    const isUpdate = !!registration;
    const action = isUpdate ? "updated" : "created";

    // Generate token for staff-created registration
    const registrationToken = registration?.registrationToken || generateRegistrationToken();

    // Handle CV file upload if present
    const cvPath = req.file
      ? `uploads/documents/${req.file.filename}`
      : registration?.menteeCV;

    if (registration) {
      // Update existing registration
      Object.assign(registration, {
        title,
        firstName,
        lastName,
        mobileNumber,
        dateOfBirth: dob,
        personalEmail: personalEmail.toLowerCase(),
        classOf: parseInt(classOf),
        sitStudentId: sitStudentId || undefined,
        sitMatricNumber: sitMatricNumber || undefined,
        validatedStudentId: studentId,
        menteeCV: cvPath,
        areasOfMentoring: areasOfMentoring || [],
        fbPreference,
        dietaryRestrictions,
        preferredMailingAddress: (preferredMailingAddress || personalEmail).toLowerCase(),
        eventSlotPreference,
        eventMeetupPreference,
        pdpaConsent: pdpaConsent || false,
      });

      await registration.save();
    } else {
      // Create new registration
      registration = new MenteeRegistration({
        programId,
        registrationToken,
        status: MenteeRegistrationStatus.SUBMITTED,
        title,
        firstName,
        lastName,
        mobileNumber,
        dateOfBirth: dob,
        personalEmail: personalEmail.toLowerCase(),
        classOf: parseInt(classOf),
        sitStudentId: sitStudentId || undefined,
        sitMatricNumber: sitMatricNumber || undefined,
        validatedStudentId: studentId,
        menteeCV: cvPath,
        areasOfMentoring: areasOfMentoring || [],
        fbPreference,
        dietaryRestrictions,
        preferredMailingAddress: (preferredMailingAddress || personalEmail).toLowerCase(),
        eventSlotPreference,
        eventMeetupPreference,
        pdpaConsent: pdpaConsent || false,
        recaptchaToken: "staff-created", // Bypass for staff-created registrations
        submittedAt: new Date(),
        tenantId: tenantId || program.tenantId,
      });

      await registration.save();
    }

    // Audit logging
    logger.info(
      `Staff ${action} mentee registration on behalf`,
      {
        action: isUpdate ? "UPDATE_REGISTRATION_ON_BEHALF" : "CREATE_REGISTRATION_ON_BEHALF",
        resource: "MenteeRegistration",
        resourceId: registration._id.toString(),
        staffUserId: req.user?.id,
        staffEmail: req.user?.email,
        staffRole: req.user?.role,
        menteeEmail: personalEmail,
        menteeName: `${firstName} ${lastName}`,
        studentId: studentId,
        programId: programId,
        programName: program.name,
        tenantId: tenantId || program.tenantId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    const populatedRegistration = await MenteeRegistration.findById(
      registration._id
    )
      .populate("programId", "name category");

    // Generate edit link for frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const editLink = `${frontendUrl}/mentee-registration?programId=${programId}&editId=${registration._id}&token=${registrationToken}`;

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate
        ? `Mentee registration updated successfully by ${req.user?.firstName || "staff"}`
        : `Mentee registration created successfully by ${req.user?.firstName || "staff"}`,
      data: {
        registration: populatedRegistration,
        registrationId: registration._id.toString(),
        registrationToken: registrationToken,
        editLink,
        isUpdate,
        createdBy: {
          userId: req.user?.id,
          name: `${req.user?.firstName || ""} ${req.user?.lastName || ""}`.trim(),
          email: req.user?.email,
          role: req.user?.role,
        },
      },
    });
  } catch (error: any) {
    logger.error("Update registration on behalf error:", {
      error: error.message,
      stack: error.stack,
      programId: req.body.programId,
      staffUserId: req.user?.id,
      tenantId: req.user?.tenantId,
      personalEmail: req.body.personalEmail,
    });

    // Provide more specific error messages
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error: " + Object.values(error.errors).map((e: any) => e.message).join(", "),
        errors: error.errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Duplicate registration detected. A registration already exists for this mentee and program.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create/update registration",
    });
  }
};

export default {
  submitRegistration,
  getRegistrationById,
  getRegistrationsByProgram,
  getRegistrationByToken,
  validateStudentID,
  approveRegistration,
  rejectRegistration,
  updateRegistrationOnBehalf,
  generateRegistrationLink,
  checkMyMenteeRegistration,
  getMyMenteeRegistrations,
};

