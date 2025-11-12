import { Request, Response } from "express";
import MentorRegistration from "../models/MentorRegistration";
import MentoringProgram from "../models/MentoringProgram";
import User from "../models/User";
import { logger } from "../utils/logger";
import { MentorRegistrationStatus, UserRole } from "../types";
import { emailService } from "../services/emailService";

// Submit mentor registration
export const submitRegistration = async (req: Request, res: Response) => {
  try {
    const {
      programId,
      title,
      firstName,
      lastName,
      preferredName,
      mobileNumber,
      dateOfBirth,
      personalEmail,
      sitEmail,
      classOf,
      sitStudentId,
      sitMatricNumber,
      areasOfMentoring,
      fbPreference,
      dietaryRestrictions,
      optionToReceiveFB,
      preferredMailingAddress,
      eventSlotPreference,
      eventMeetupPreference,
      pdpaConsent,
      recaptchaToken,
    } = req.body;

    // Validate user is Alumni
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user role - verify from database to ensure accuracy
    const userId = req.user.id || req.user._id;
    const dbUser = await User.findById(userId).select("role email");
    
    if (!dbUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get user role from database (most reliable source)
    const userRole = dbUser.role;
    
    // Normalize role for comparison - handle all possible formats (enum, string, case variations)
    const normalizedRole = String(userRole || "").toLowerCase().trim();
    const expectedAlumniRole = UserRole.ALUMNI.toLowerCase(); // "alumni"
    
    // Check if user role is alumni - handle enum, string, and case variations
    const isAlumni = 
      userRole === UserRole.ALUMNI || 
      normalizedRole === "alumni" ||
      normalizedRole === expectedAlumniRole;
    
    // Debug logging
    logger.info("Mentor registration role check", {
      userId: userId,
      userEmail: dbUser.email,
      userRole: userRole,
      normalizedRole: normalizedRole,
      userRoleType: typeof userRole,
      UserRoleEnum: UserRole.ALUMNI,
      expectedAlumniRole: expectedAlumniRole,
      isAlumni: isAlumni,
      roleComparison: {
        enumMatch: userRole === UserRole.ALUMNI,
        stringMatch: normalizedRole === "alumni",
        enumStringMatch: normalizedRole === expectedAlumniRole,
      },
    });
    
    if (!isAlumni) {
      logger.error("Mentor registration rejected - user is not alumni", {
        userId: userId,
        userEmail: dbUser.email,
        actualRole: userRole,
        normalizedRole: normalizedRole,
        roleType: typeof userRole,
        expectedRole: UserRole.ALUMNI,
        reqUserRole: (req as any).user?.role,
      });
      return res.status(403).json({
        success: false,
        message: `Only alumni can register as mentors. Your current role is: ${userRole || "unknown"}`,
      });
    }

    // Check if program exists
    const program = await MentoringProgram.findById(programId);
    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Check registration closure date first (primary check)
    // Compare dates at midnight to avoid timezone issues
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endDate = new Date(program.registrationEndDateMentor);
    const endDateMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    // Registration is open if end date is today or in the future
    if (endDateMidnight < today) {
      return res.status(400).json({
        success: false,
        message: "Program registration has expired",
      });
    }

    // Check if program is published (secondary check - warn but allow if date is valid)
    if (program.status !== "published") {
      logger.warn("Registration attempt for non-published program", {
        programId,
        programStatus: program.status,
        registrationEndDate: program.registrationEndDateMentor,
        userId: req.user?.id,
      });
      // Allow registration even if not published, as long as date is valid
      // This allows staff to test registrations before publishing
    }

    // Check if user already registered for this program
    const existingRegistration = await MentorRegistration.findOne({
      programId,
      userId: req.user.id,
    });

    // If existing registration exists and status is SUBMITTED, allow update
    if (existingRegistration) {
      // Only allow updates if status is SUBMITTED (not approved/rejected)
      if (existingRegistration.status !== MentorRegistrationStatus.SUBMITTED) {
        return res.status(400).json({
          success: false,
          message: `You cannot update this registration. Current status: ${existingRegistration.status}`,
          data: { registration: existingRegistration },
        });
      }

      // Update existing registration
      existingRegistration.title = title;
      existingRegistration.firstName = firstName;
      existingRegistration.lastName = lastName;
      existingRegistration.preferredName = preferredName;
      existingRegistration.mobileNumber = mobileNumber;
      existingRegistration.dateOfBirth = new Date(dateOfBirth);
      existingRegistration.personalEmail = personalEmail.toLowerCase();
      existingRegistration.sitEmail = sitEmail ? sitEmail.toLowerCase() : undefined;
      existingRegistration.classOf = parseInt(classOf);
      existingRegistration.sitStudentId = sitStudentId || undefined;
      existingRegistration.sitMatricNumber = sitMatricNumber || undefined;
      existingRegistration.areasOfMentoring = areasOfMentoring || [];
      existingRegistration.fbPreference = fbPreference;
      existingRegistration.dietaryRestrictions = dietaryRestrictions;
      existingRegistration.optionToReceiveFB = optionToReceiveFB || false;
      existingRegistration.preferredMailingAddress = (preferredMailingAddress || req.user?.email || personalEmail).toLowerCase();
      existingRegistration.eventSlotPreference = eventSlotPreference &&
        eventSlotPreference.startDate &&
        eventSlotPreference.endDate
        ? {
            startDate: new Date(eventSlotPreference.startDate),
            endDate: new Date(eventSlotPreference.endDate),
            startTime: eventSlotPreference.startTime,
            endTime: eventSlotPreference.endTime,
          }
        : undefined;
      existingRegistration.eventMeetupPreference = eventMeetupPreference;
      existingRegistration.recaptchaToken = recaptchaToken;
      existingRegistration.submittedAt = new Date(); // Update submission time

      // Update CV if new file is uploaded
      if (req.file) {
        existingRegistration.mentorCV = `uploads/documents/${req.file.filename}`;
      }

      await existingRegistration.save();

      // Send update confirmation email
      try {
        await emailService.sendEmail({
          to: personalEmail,
          subject: `Mentor Registration Updated - ${program.name}`,
          html: `
            <h2>Mentor Registration Updated</h2>
            <p>Dear ${preferredName},</p>
            <p>Your registration for the <strong>${program.name}</strong> program has been updated successfully.</p>
            <p>Your updated registration is now awaiting approval.</p>
            <p>Best regards,<br>AlumniAccel Team</p>
          `,
        });
      } catch (emailError) {
        logger.error("Failed to send update confirmation email:", emailError);
      }

      const populatedRegistration = await MentorRegistration.findById(
        existingRegistration._id
      )
        .populate("programId", "name category")
        .populate("userId", "firstName lastName email");

      return res.status(200).json({
        success: true,
        message: "Mentor registration updated successfully",
        data: { registration: populatedRegistration },
      });
    }

    // Validate personal email and SIT email are different (if SIT email is provided)
    if (sitEmail && personalEmail.toLowerCase() === sitEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Personal email and SIT email must be different",
      });
    }

    // Validate PDPA consent
    if (!pdpaConsent) {
      return res.status(400).json({
        success: false,
        message: "PDPA consent is required",
      });
    }

    // Handle CV file upload if present
    const cvPath = req.file
      ? `uploads/documents/${req.file.filename}`
      : undefined;

    // Set default preferred mailing address if not provided
    const mailingAddress =
      preferredMailingAddress || req.user?.email || personalEmail;

    // Create registration
    const registration = new MentorRegistration({
      programId,
      userId: req.user.id,
      status: MentorRegistrationStatus.SUBMITTED,
      title,
      firstName,
      lastName,
      preferredName,
      mobileNumber,
      dateOfBirth: new Date(dateOfBirth),
      personalEmail: personalEmail.toLowerCase(),
      sitEmail: sitEmail ? sitEmail.toLowerCase() : undefined,
      classOf: parseInt(classOf),
      sitStudentId: sitStudentId || undefined,
      sitMatricNumber: sitMatricNumber || undefined,
      mentorCV: cvPath,
      areasOfMentoring: areasOfMentoring || [],
      fbPreference,
      dietaryRestrictions,
      optionToReceiveFB: optionToReceiveFB || false,
      preferredMailingAddress: mailingAddress.toLowerCase(),
      eventSlotPreference: eventSlotPreference
        ? {
            startDate: eventSlotPreference.startDate
              ? new Date(eventSlotPreference.startDate)
              : undefined,
            endDate: eventSlotPreference.endDate
              ? new Date(eventSlotPreference.endDate)
              : undefined,
            startTime: eventSlotPreference.startTime,
            endTime: eventSlotPreference.endTime,
          }
        : undefined,
      eventMeetupPreference,
      pdpaConsent: true,
      recaptchaToken,
      submittedAt: new Date(),
      tenantId: req.user.tenantId,
    });

    await registration.save();

    // Send acknowledgement email to mentor
    try {
      await emailService.sendEmail({
        to: personalEmail,
        subject: `Mentor Registration Submitted - ${program.name}`,
        html: `
          <h2>Mentor Registration Submitted Successfully</h2>
          <p>Dear ${preferredName},</p>
          <p>Thank you for registering as a mentor for the <strong>${program.name}</strong> program.</p>
          <p>Your registration has been submitted and is now awaiting approval.</p>
          <p>You will be notified once your registration is reviewed.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send acknowledgement email:", emailError);
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
          // Send email to each coordinator individually
          for (const email of coordinatorEmails) {
            await emailService.sendEmail({
              to: email,
              subject: `New Mentor Registration - ${program.name}`,
              html: `
                <h2>New Mentor Registration</h2>
                <p>A new mentor registration has been submitted for the program: <strong>${program.name}</strong></p>
                <p><strong>Mentor Details:</strong></p>
                <ul>
                  <li>Name: ${preferredName} (${title} ${firstName} ${lastName})</li>
                  <li>Email: ${personalEmail}</li>
                  <li>SIT Email: ${sitEmail}</li>
                  <li>Class Of: ${classOf}</li>
                </ul>
                <p>Please review and approve the registration.</p>
              `,
            });
          }
        }
      } catch (emailError) {
        logger.error("Failed to send coordinator notification:", emailError);
        // Don't fail registration if email fails
      }
    }

    const populatedRegistration = await MentorRegistration.findById(
      registration._id
    )
      .populate("programId", "name category")
      .populate("userId", "firstName lastName email");

    return res.status(201).json({
      success: true,
      message: "Mentor registration submitted successfully",
      data: { registration: populatedRegistration },
    });
  } catch (error: any) {
    logger.error("Submit mentor registration error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit mentor registration",
    });
  }
};

// Get my registrations
export const getMyRegistrations = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const registrations = await MentorRegistration.find({
      userId: req.user?.id,
    })
      .populate("programId", "name category status registrationEndDateMentor programDuration")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MentorRegistration.countDocuments({
      userId: req.user?.id,
    });

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
    logger.error("Get my registrations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch registrations",
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

    const registrations = await MentorRegistration.find(filter)
      .populate("userId", "firstName lastName email profilePicture")
      .populate("approvedBy", "firstName lastName email")
      .populate("rejectedBy", "firstName lastName email")
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MentorRegistration.countDocuments(filter);

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

// Get registration by ID
export const getRegistrationById = async (req: Request, res: Response) => {
  try {
    const registration = await MentorRegistration.findById(req.params.id)
      .populate("programId")
      .populate("userId", "firstName lastName email profilePicture")
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

    // Check if user is the registrant or Staff/Admin
    const isOwner =
      registration.userId.toString() === req.user?.id?.toString();
    const isStaff =
      req.user?.role === "super_admin" ||
      req.user?.role === "college_admin" ||
      req.user?.role === "hod" ||
      req.user?.role === "staff";

    if (!isOwner && !isStaff) {
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

// Approve registration
export const approveRegistration = async (req: Request, res: Response) => {
  try {
    const registration = await MentorRegistration.findById(req.params.id);

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

    if (registration.status === MentorRegistrationStatus.APPROVED) {
      return res.status(400).json({
        success: false,
        message: "Registration is already approved",
      });
    }

    registration.status = MentorRegistrationStatus.APPROVED;
    registration.approvedBy = req.user?.id;
    registration.approvedAt = new Date();
    if (registration.rejectionReason) {
      registration.rejectionReason = undefined;
    }

    await registration.save();

    // Send approval email
    try {
      const user = await User.findById(registration.userId);
      if (user) {
        await emailService.sendEmail({
          to: registration.personalEmail,
          subject: `Mentor Registration Approved - ${program.name}`,
          html: `
            <h2>Mentor Registration Approved</h2>
            
            <p>Dear ${registration.preferredName},</p>
            <p>Congratulations! Your registration as a mentor for the <strong>${program.name}</strong> program has been approved.</p>
            <p>You will be notified about the next steps in the mentoring process.</p>
            <p>Best regards,<br>AlumniAccel Team</p>
          `,
        });
      }
    } catch (emailError) {
      logger.error("Failed to send approval email:", emailError);
    }

    const updatedRegistration = await MentorRegistration.findById(
      registration._id
    )
      .populate("userId", "firstName lastName email")
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

    const registration = await MentorRegistration.findById(req.params.id);

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

    if (registration.status === MentorRegistrationStatus.REJECTED) {
      return res.status(400).json({
        success: false,
        message: "Registration is already rejected",
      });
    }

    registration.status = MentorRegistrationStatus.REJECTED;
    registration.rejectedBy = req.user?.id;
    registration.rejectedAt = new Date();
    registration.rejectionReason = reason.trim();

    await registration.save();

    // Send rejection email
    try {
      await emailService.sendEmail({
        to: registration.personalEmail,
        subject: `Mentor Registration Update - ${program.name}`,
        html: `
          <h2>Mentor Registration Update</h2>
          <p>Dear ${registration.preferredName},</p>
          <p>Unfortunately, your registration as a mentor for the <strong>${program.name}</strong> program has been rejected.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>If you have any questions, please contact the program coordinators.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send rejection email:", emailError);
    }

    const updatedRegistration = await MentorRegistration.findById(
      registration._id
    )
      .populate("userId", "firstName lastName email")
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
export const updateRegistrationOnBehalf = async (
  req: Request,
  res: Response
) => {
  try {
    const {
      programId,
      userId,
      title,
      firstName,
      lastName,
      preferredName,
      mobileNumber,
      dateOfBirth,
      personalEmail,
      sitEmail,
      classOf,
      sitStudentId,
      sitMatricNumber,
      areasOfMentoring,
      fbPreference,
      dietaryRestrictions,
      optionToReceiveFB,
      preferredMailingAddress,
      eventSlotPreference,
      eventMeetupPreference,
      pdpaConsent,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "programId",
      "userId",
      "title",
      "firstName",
      "lastName",
      "personalEmail",
      "sitEmail",
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
        message: "Only staff and administrators can create registrations on behalf of users",
      });
    }

    // Validate and check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please provide a valid user ID.",
      });
    }

    // Validate tenant access
    const tenantId = req.user?.tenantId;
    if (
      req.user?.role !== "super_admin" &&
      tenantId &&
      user.tenantId &&
      user.tenantId.toString() !== tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only create registrations for users in your tenant.",
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
    // Only validate SIT email if provided (now optional)
    if (sitEmail && !emailRegex.test(sitEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid SIT email format",
      });
    }

    // Validate personal email and SIT email are different (if SIT email is provided)
    if (sitEmail && personalEmail.toLowerCase() === sitEmail.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Personal email and SIT email must be different",
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

    // Check if registration already exists
    let registration = await MentorRegistration.findOne({
      programId,
      userId,
      tenantId: tenantId || program.tenantId,
    });

    const isUpdate = !!registration;
    const action = isUpdate ? "updated" : "created";

    if (registration) {
      // Update existing registration
      Object.assign(registration, {
        title,
        firstName,
        lastName,
        preferredName,
        mobileNumber,
        dateOfBirth: dob,
        personalEmail: personalEmail.toLowerCase(),
        sitEmail: sitEmail ? sitEmail.toLowerCase() : undefined,
        classOf: parseInt(classOf),
        sitStudentId: sitStudentId || undefined,
        sitMatricNumber: sitMatricNumber || undefined,
        areasOfMentoring: areasOfMentoring || [],
        fbPreference,
        dietaryRestrictions,
        optionToReceiveFB: optionToReceiveFB || false,
        preferredMailingAddress: (preferredMailingAddress || personalEmail).toLowerCase(),
        eventSlotPreference: eventSlotPreference
          ? {
              startDate: eventSlotPreference.startDate
                ? new Date(eventSlotPreference.startDate)
                : undefined,
              endDate: eventSlotPreference.endDate
                ? new Date(eventSlotPreference.endDate)
                : undefined,
              startTime: eventSlotPreference.startTime,
              endTime: eventSlotPreference.endTime,
            }
          : undefined,
        eventMeetupPreference,
        pdpaConsent: pdpaConsent || false,
      });

      if (req.file) {
        registration.mentorCV = `uploads/documents/${req.file.filename}`;
      }

      await registration.save();
    } else {
      // Create new registration
      const cvPath = req.file
        ? `uploads/documents/${req.file.filename}`
        : undefined;

      registration = new MentorRegistration({
        programId,
        userId,
        status: MentorRegistrationStatus.SUBMITTED,
        title,
        firstName,
        lastName,
        preferredName,
        mobileNumber,
        dateOfBirth: dob,
        personalEmail: personalEmail.toLowerCase(),
        sitEmail: sitEmail ? sitEmail.toLowerCase() : undefined,
        classOf: parseInt(classOf),
        sitStudentId: sitStudentId || undefined,
        sitMatricNumber: sitMatricNumber || undefined,
        mentorCV: cvPath,
        areasOfMentoring: areasOfMentoring || [],
        fbPreference,
        dietaryRestrictions,
        optionToReceiveFB: optionToReceiveFB || false,
        preferredMailingAddress: (preferredMailingAddress || personalEmail).toLowerCase(),
        eventSlotPreference: eventSlotPreference
          ? {
              startDate: eventSlotPreference.startDate
                ? new Date(eventSlotPreference.startDate)
                : undefined,
              endDate: eventSlotPreference.endDate
                ? new Date(eventSlotPreference.endDate)
                : undefined,
              startTime: eventSlotPreference.startTime,
              endTime: eventSlotPreference.endTime,
            }
          : undefined,
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
      `Staff ${action} mentor registration on behalf`,
      {
        action: isUpdate ? "UPDATE_REGISTRATION_ON_BEHALF" : "CREATE_REGISTRATION_ON_BEHALF",
        resource: "MentorRegistration",
        resourceId: registration._id.toString(),
        staffUserId: req.user?.id,
        staffEmail: req.user?.email,
        staffRole: req.user?.role,
        targetUserId: userId,
        targetUserEmail: user.email,
        programId: programId,
        programName: program.name,
        tenantId: tenantId || program.tenantId,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.get("user-agent"),
      }
    );

    const populatedRegistration = await MentorRegistration.findById(
      registration._id
    )
      .populate("programId", "name category")
      .populate("userId", "firstName lastName email");

    // Generate edit link for frontend
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const editLink = `${frontendUrl}/mentor-registration?programId=${programId}&editId=${registration._id}`;

    return res.status(isUpdate ? 200 : 201).json({
      success: true,
      message: isUpdate
        ? `Mentor registration updated successfully by ${req.user?.firstName || "staff"}`
        : `Mentor registration created successfully by ${req.user?.firstName || "staff"}`,
      data: {
        registration: populatedRegistration,
        registrationId: registration._id.toString(),
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
      userId: req.body.userId,
      programId: req.body.programId,
      staffUserId: req.user?.id,
      tenantId: req.user?.tenantId,
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
        message: "Duplicate registration detected. A registration already exists for this user and program.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create/update registration",
    });
  }
};

// Pre-populate previous registration data
export const prePopulatePreviousRegistration = async (
  req: Request,
  res: Response
) => {
  try {
    const { programId } = req.params;

    // Find previous registration for this user
    const previousRegistration = await MentorRegistration.findOne({
      userId: req.user?.id,
    })
      .sort({ submittedAt: -1 }) // Get most recent
      .populate("programId", "name");

    if (!previousRegistration) {
      return res.json({
        success: true,
        data: { previousData: null },
        message: "No previous registration found",
      });
    }

    // Return previous data for pre-population
    const previousData = {
      title: previousRegistration.title,
      firstName: previousRegistration.firstName,
      lastName: previousRegistration.lastName,
      preferredName: previousRegistration.preferredName,
      mobileNumber: previousRegistration.mobileNumber,
      dateOfBirth: previousRegistration.dateOfBirth,
      personalEmail: previousRegistration.personalEmail,
      sitEmail: previousRegistration.sitEmail,
      classOf: previousRegistration.classOf,
      sitStudentId: previousRegistration.sitStudentId,
      sitMatricNumber: previousRegistration.sitMatricNumber,
      areasOfMentoring: previousRegistration.areasOfMentoring,
      fbPreference: previousRegistration.fbPreference,
      dietaryRestrictions: previousRegistration.dietaryRestrictions,
      optionToReceiveFB: previousRegistration.optionToReceiveFB,
      preferredMailingAddress: previousRegistration.preferredMailingAddress,
      eventSlotPreference: previousRegistration.eventSlotPreference,
      eventMeetupPreference: previousRegistration.eventMeetupPreference,
      previousProgram: previousRegistration.programId,
    };

    return res.json({
      success: true,
      data: { previousData },
    });
  } catch (error) {
    logger.error("Pre-populate previous registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch previous registration data",
    });
  }
};

// Check registration closure date
export const checkRegistrationClosureDate = async (
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

    // Compare dates at midnight to avoid timezone issues
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const registrationEndDate = new Date(program.registrationEndDateMentor);
    const endDateMidnight = new Date(registrationEndDate.getFullYear(), registrationEndDate.getMonth(), registrationEndDate.getDate());
    
    // Registration is open if end date is today or in the future (>=)
    // Date check is primary - if date is valid, form should be open
    const isDateValid = endDateMidnight >= today;
    const isPublished = program.status === "published";
    
    // Form is open if date is valid (regardless of status for now)
    // Status check will be enforced during actual submission
    const isOpen = isDateValid;

    // Log for debugging
    logger.info("Registration closure check", {
      programId,
      programStatus: program.status,
      isPublished,
      registrationEndDate: program.registrationEndDateMentor,
      endDateMidnight: endDateMidnight.toISOString(),
      today: today.toISOString(),
      isDateValid,
      isOpen,
      note: "Form opens if date is valid, status check happens on submission",
    });

    // Check if user already registered
    let existingRegistration = null;
    if (req.user?.id) {
      existingRegistration = await MentorRegistration.findOne({
        programId,
        userId: req.user.id,
      });
    }

    return res.json({
      success: true,
      data: {
        isOpen,
        registrationEndDate: program.registrationEndDateMentor,
        programStatus: program.status,
        programName: program.name,
        existingRegistration: existingRegistration
          ? {
              id: existingRegistration._id,
              status: existingRegistration.status,
              submittedAt: existingRegistration.submittedAt,
            }
          : null,
      },
    });
  } catch (error) {
    logger.error("Check registration closure date error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check registration status",
    });
  }
};

export default {
  submitRegistration,
  getMyRegistrations,
  getRegistrationsByProgram,
  getRegistrationById,
  approveRegistration,
  rejectRegistration,
  updateRegistrationOnBehalf,
  prePopulatePreviousRegistration,
  checkRegistrationClosureDate,
};

