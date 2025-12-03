import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types";
import MentoringProgram from "../models/MentoringProgram";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import { logger } from "../utils/logger";
import { MentoringProgramStatus, MatchingStatus } from "../types";
import { sanitizeHtml } from "../utils/sanitize";
import { generateRegistrationToken } from "../models/MenteeRegistration";

// Create new mentoring program
export const createProgram = async (req: Request, res: Response) => {
  try {
    const {
      category,
      name,
      shortDescription,
      longDescription,
      programSchedule,
      programDuration,
      skillsRequired,
      areasOfMentoring,
      entryCriteriaRules,
      registrationEndDateMentee,
      registrationEndDateMentor,
      matchingEndDate,
      manager,
      coordinators,
      reportsEscalationsTo,
      registrationApprovalBy,
      emailTemplateMentorInvitation,
      emailTemplateMenteeInvitation,
    } = req.body;

    // Validate dates
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const menteeRegEnd = new Date(registrationEndDateMentee);
    menteeRegEnd.setHours(0, 0, 0, 0);
    const mentorRegEnd = new Date(registrationEndDateMentor);
    mentorRegEnd.setHours(0, 0, 0, 0);
    const matchEnd = new Date(matchingEndDate);
    matchEnd.setHours(0, 0, 0, 0);
    const progStart = new Date(programDuration.startDate);
    progStart.setHours(0, 0, 0, 0);
    const progEnd = new Date(programDuration.endDate);
    progEnd.setHours(0, 0, 0, 0);

    // Validate that start date is in the future
    if (progStart <= now) {
      return res.status(400).json({
        success: false,
        message: "Program start date must be in the future",
      });
    }

    // Validate that end date is in the future
    if (progEnd <= now) {
      return res.status(400).json({
        success: false,
        message: "Program end date must be in the future",
      });
    }

    // Validate that end date is after start date
    if (progEnd <= progStart) {
      return res.status(400).json({
        success: false,
        message: "Program end date must be after start date",
      });
    }

    // Validate that matching end date is before start date
    if (matchEnd >= progStart) {
      return res.status(400).json({
        success: false,
        message: "Matching end date must be before program start date",
      });
    }

    // Validate that mentor registration end date is before matching end date
    if (mentorRegEnd >= matchEnd) {
      return res.status(400).json({
        success: false,
        message: "Mentor registration end date must be before matching end date",
      });
    }

    // Validate that mentee registration end date is before matching end date
    if (menteeRegEnd >= matchEnd) {
      return res.status(400).json({
        success: false,
        message: "Mentee registration end date must be before matching end date",
      });
    }

    // Handle file upload if present
    const agreementFormPath = req.file
      ? `uploads/documents/${req.file.filename}`
      : undefined;

    // Sanitize entry criteria rules
    const sanitizedEntryCriteria = entryCriteriaRules
      ? sanitizeHtml(entryCriteriaRules)
      : undefined;

    const program = new MentoringProgram({
      category,
      name,
      shortDescription,
      longDescription,
      programSchedule,
      programDuration: {
        startDate: progStart,
        endDate: progEnd,
      },
      skillsRequired: skillsRequired || [],
      areasOfMentoring: {
        mentor: areasOfMentoring?.mentor || [],
        mentee: areasOfMentoring?.mentee || [],
      },
      entryCriteriaRules: sanitizedEntryCriteria,
      registrationEndDateMentee: menteeRegEnd,
      registrationEndDateMentor: mentorRegEnd,
      matchingEndDate: matchEnd,
      mentoringAgreementForm: agreementFormPath,
      manager,
      coordinators: coordinators || [],
      reportsEscalationsTo: reportsEscalationsTo || [],
      registrationApprovalBy,
      emailTemplateMentorInvitation,
      emailTemplateMenteeInvitation,
      status: MentoringProgramStatus.DRAFT,
      createdBy: req.user?.id,
      tenantId: req.user?.tenantId,
    });

    await program.save();

    // Generate mentee registration link automatically
    const registrationToken = generateRegistrationToken();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const menteeRegistrationLink = `${frontendUrl}/mentee-registration?token=${registrationToken}&programId=${program._id}`;

    const populatedProgram = await MentoringProgram.findById(program._id)
      .populate("manager", "firstName lastName email")
      .populate("coordinators", "firstName lastName email")
      .populate("reportsEscalationsTo", "firstName lastName email")
      .populate("registrationApprovalBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");

    return res.status(201).json({
      success: true,
      message: "Mentoring program created successfully",
      data: { 
        program: populatedProgram,
        menteeRegistrationLink: menteeRegistrationLink,
        registrationToken: registrationToken,
        registrationLinkExpiresAt: menteeRegEnd,
      },
    });
  } catch (error: any) {
    logger.error("Create mentoring program error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create mentoring program",
    });
  }
};

// Get all programs with filters
export const getAllPrograms = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show programs from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    // Apply filters
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.category) {
      filter.category = { $regex: req.query.category, $options: "i" };
    }

    // Apply search filter - search in name, shortDescription, and longDescription
    if (req.query.search) {
      const searchTerm = req.query.search as string;
      filter.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { shortDescription: { $regex: searchTerm, $options: "i" } },
        { longDescription: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    const programs = await MentoringProgram.find(filter)
      .populate("manager", "firstName lastName email")
      .populate("coordinators", "firstName lastName email")
      .populate("reportsEscalationsTo", "firstName lastName email")
      .populate("registrationApprovalBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await MentoringProgram.countDocuments(filter);

    return res.json({
      success: true,
      data: {
        programs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all mentoring programs error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentoring programs",
    });
  }
};

// Get program by ID
export const getProgramById = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id)
      .populate("manager", "firstName lastName email")
      .populate("coordinators", "firstName lastName email")
      .populate("reportsEscalationsTo", "firstName lastName email")
      .populate("registrationApprovalBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email")
      .populate("emailTemplateMentorInvitation")
      .populate("emailTemplateMenteeInvitation");

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // 🔒 MULTI-TENANT CHECK: Verify user has access to this tenant's program
    if (
      req.user?.role !== "super_admin" &&
      req.user?.tenantId &&
      program.tenantId.toString() !== req.user.tenantId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this mentoring program",
      });
    }

    // Generate mentee registration link for display (if program is published or draft)
    let menteeRegistrationLink = null;
    let registrationToken = null;
    try {
      registrationToken = generateRegistrationToken();
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
      menteeRegistrationLink = `${frontendUrl}/mentee-registration?token=${registrationToken}&programId=${program._id}`;
    } catch (error) {
      logger.warn("Failed to generate registration link for program display:", error);
    }

    return res.json({
      success: true,
      data: { 
        program,
        menteeRegistrationLink: menteeRegistrationLink,
        registrationToken: registrationToken,
        registrationLinkExpiresAt: program.registrationEndDateMentee,
      },
    });
  } catch (error) {
    logger.error("Get mentoring program by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentoring program",
    });
  }
};

// Update program
export const updateProgram = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id);

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
        message: "Access denied to this mentoring program",
      });
    }

    const {
      category,
      name,
      shortDescription,
      longDescription,
      programSchedule,
      programDuration,
      skillsRequired,
      areasOfMentoring,
      entryCriteriaRules,
      registrationEndDateMentee,
      registrationEndDateMentor,
      matchingEndDate,
      manager,
      coordinators,
      reportsEscalationsTo,
      registrationApprovalBy,
      emailTemplateMentorInvitation,
      emailTemplateMenteeInvitation,
    } = req.body;

    // Validate dates if provided
    if (registrationEndDateMentee || registrationEndDateMentor || matchingEndDate || programDuration) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const menteeRegEnd = registrationEndDateMentee
        ? (() => {
            const date = new Date(registrationEndDateMentee);
            date.setHours(0, 0, 0, 0);
            return date;
          })()
        : (() => {
            const date = new Date(program.registrationEndDateMentee);
            date.setHours(0, 0, 0, 0);
            return date;
          })();
      
      const mentorRegEnd = registrationEndDateMentor
        ? (() => {
            const date = new Date(registrationEndDateMentor);
            date.setHours(0, 0, 0, 0);
            return date;
          })()
        : (() => {
            const date = new Date(program.registrationEndDateMentor);
            date.setHours(0, 0, 0, 0);
            return date;
          })();
      
      const matchEnd = matchingEndDate
        ? (() => {
            const date = new Date(matchingEndDate);
            date.setHours(0, 0, 0, 0);
            return date;
          })()
        : (() => {
            const date = new Date(program.matchingEndDate);
            date.setHours(0, 0, 0, 0);
            return date;
          })();
      
      // Get program start date (from update or existing)
      const progStart = programDuration?.startDate
        ? (() => {
            const date = new Date(programDuration.startDate);
            date.setHours(0, 0, 0, 0);
            return date;
          })()
        : (() => {
            const date = new Date(program.programDuration.startDate);
            date.setHours(0, 0, 0, 0);
            return date;
          })();

      // Validate that start date is in the future (if being updated)
      if (programDuration?.startDate && progStart <= now) {
        return res.status(400).json({
          success: false,
          message: "Program start date must be in the future",
        });
      }

      // Validate that matching end date is before start date
      if (matchingEndDate && matchEnd >= progStart) {
        return res.status(400).json({
          success: false,
          message: "Matching end date must be before program start date",
        });
      }

      // Validate that mentor registration end date is before matching end date
      if (registrationEndDateMentor && mentorRegEnd >= matchEnd) {
        return res.status(400).json({
          success: false,
          message: "Mentor registration end date must be before matching end date",
        });
      }

      // Validate that mentee registration end date is before matching end date
      if (registrationEndDateMentee && menteeRegEnd >= matchEnd) {
        return res.status(400).json({
          success: false,
          message: "Mentee registration end date must be before matching end date",
        });
      }
    }

    if (programDuration) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const progStart = new Date(programDuration.startDate);
      progStart.setHours(0, 0, 0, 0);
      const progEnd = new Date(programDuration.endDate);
      progEnd.setHours(0, 0, 0, 0);
      
      // Validate that start date is in the future
      if (progStart <= now) {
        return res.status(400).json({
          success: false,
          message: "Program start date must be in the future",
        });
      }
      
      // Validate that end date is in the future
      if (progEnd <= now) {
        return res.status(400).json({
          success: false,
          message: "Program end date must be in the future",
        });
      }
      
      // Validate that end date is after start date
      if (progEnd <= progStart) {
        return res.status(400).json({
          success: false,
          message: "Program end date must be after start date",
        });
      }
    }

    // Handle file upload if present
    if (req.file) {
      program.mentoringAgreementForm = `uploads/documents/${req.file.filename}`;
    }

    // Update fields
    if (category !== undefined) program.category = category;
    if (name !== undefined) program.name = name;
    if (shortDescription !== undefined)
      program.shortDescription = shortDescription;
    if (longDescription !== undefined)
      program.longDescription = longDescription;
    if (programSchedule !== undefined)
      program.programSchedule = programSchedule;
    if (programDuration !== undefined)
      program.programDuration = programDuration;
    if (skillsRequired !== undefined)
      program.skillsRequired = skillsRequired;
    if (areasOfMentoring !== undefined)
      program.areasOfMentoring = areasOfMentoring;
    if (entryCriteriaRules !== undefined)
      program.entryCriteriaRules = sanitizeHtml(entryCriteriaRules);
    if (registrationEndDateMentee !== undefined)
      program.registrationEndDateMentee = new Date(registrationEndDateMentee);
    if (registrationEndDateMentor !== undefined)
      program.registrationEndDateMentor = new Date(registrationEndDateMentor);
    if (matchingEndDate !== undefined)
      program.matchingEndDate = new Date(matchingEndDate);
    if (manager !== undefined) program.manager = manager;
    if (coordinators !== undefined) program.coordinators = coordinators;
    if (reportsEscalationsTo !== undefined)
      program.reportsEscalationsTo = reportsEscalationsTo;
    if (registrationApprovalBy !== undefined)
      program.registrationApprovalBy = registrationApprovalBy;
    if (emailTemplateMentorInvitation !== undefined)
      program.emailTemplateMentorInvitation = emailTemplateMentorInvitation;
    if (emailTemplateMenteeInvitation !== undefined)
      program.emailTemplateMenteeInvitation = emailTemplateMenteeInvitation;

    await program.save();

    const updatedProgram = await MentoringProgram.findById(program._id)
      .populate("manager", "firstName lastName email")
      .populate("coordinators", "firstName lastName email")
      .populate("reportsEscalationsTo", "firstName lastName email")
      .populate("registrationApprovalBy", "firstName lastName email")
      .populate("createdBy", "firstName lastName email");

    return res.json({
      success: true,
      message: "Mentoring program updated successfully",
      data: { program: updatedProgram },
    });
  } catch (error: any) {
    logger.error("Update mentoring program error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update mentoring program",
    });
  }
};

// Publish program
export const publishProgram = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id);

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
        message: "Access denied to this mentoring program",
      });
    }

    if (program.status === MentoringProgramStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: "Program is already published",
      });
    }

    program.status = MentoringProgramStatus.PUBLISHED;
    await program.save();

    return res.json({
      success: true,
      message: "Mentoring program published successfully",
      data: { program },
    });
  } catch (error) {
    logger.error("Publish mentoring program error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish mentoring program",
    });
  }
};

// Unpublish program
export const unpublishProgram = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id);

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
        message: "Access denied to this mentoring program",
      });
    }

    if (program.status !== MentoringProgramStatus.PUBLISHED) {
      return res.status(400).json({
        success: false,
        message: "Program is not published",
      });
    }

    program.status = MentoringProgramStatus.DRAFT;
    await program.save();

    return res.json({
      success: true,
      message: "Mentoring program unpublished successfully",
      data: { program },
    });
  } catch (error) {
    logger.error("Unpublish mentoring program error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unpublish mentoring program",
    });
  }
};

// Delete program
export const deleteProgram = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id);

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
        message: "Access denied to this mentoring program",
      });
    }

    await MentoringProgram.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: "Mentoring program deleted successfully",
    });
  } catch (error) {
    logger.error("Delete mentoring program error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete mentoring program",
    });
  }
};

// Get program statistics
export const getProgramStatistics = async (req: Request, res: Response) => {
  try {
    const program = await MentoringProgram.findById(req.params.id);

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
        message: "Access denied to this mentoring program",
      });
    }

    // Build base query for tenant filtering
    const isSuperAdmin = req.user?.role === "super_admin";
    const baseQuery: any = { programId: program._id };
    if (!isSuperAdmin && program.tenantId) {
      baseQuery.tenantId = program.tenantId;
    }

    // Calculate actual statistics
    // Total mentors (all registrations regardless of status)
    const totalMentors = await MentorRegistration.countDocuments(baseQuery);

    // Total mentees (all registrations regardless of status)
    const totalMentees = await MenteeRegistration.countDocuments(baseQuery);

    // Approved mentors
    const approvedMentors = await MentorRegistration.countDocuments({
      ...baseQuery,
      status: "approved",
    });

    // Approved mentees
    const approvedMentees = await MenteeRegistration.countDocuments({
      ...baseQuery,
      status: "approved",
    });

    // Pending mentors (submitted status)
    const pendingMentors = await MentorRegistration.countDocuments({
      ...baseQuery,
      status: "submitted",
    });

    // Pending mentees (submitted status)
    const pendingMentees = await MenteeRegistration.countDocuments({
      ...baseQuery,
      status: "submitted",
    });

    // Matched pairs (accepted matches)
    const matchedPairs = await MentorMenteeMatching.countDocuments({
      ...baseQuery,
      status: MatchingStatus.ACCEPTED,
    });

    // Pending matches (pending mentor acceptance)
    const pendingMatches = await MentorMenteeMatching.countDocuments({
      ...baseQuery,
      status: MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
    });

    const statistics = {
      totalMentors,
      totalMentees,
      approvedMentors,
      approvedMentees,
      pendingMentors,
      pendingMentees,
      matchedPairs,
      pendingMatches,
    };

    return res.json({
      success: true,
      data: { statistics, program },
    });
  } catch (error) {
    logger.error("Get program statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch program statistics",
    });
  }
};

// Publish approved mentors list
export const publishApprovedMentors = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { mentorIds } = req.body; // Optional array of mentor registration IDs to publish, if not provided, publish all approved
    const tenantId = req.tenantId;

    const program = await MentoringProgram.findById(id);

    if (!program || program.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Get approved mentor registrations
    let approvedMentors;
    if (mentorIds && Array.isArray(mentorIds) && mentorIds.length > 0) {
      // Publish specific mentors
      approvedMentors = await MentorRegistration.find({
        _id: { $in: mentorIds },
        programId: id,
        status: "approved",
        tenantId,
      });
    } else {
      // Publish all approved mentors
      approvedMentors = await MentorRegistration.find({
        programId: id,
        status: "approved",
        tenantId,
      });
    }

    if (approvedMentors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No approved mentors found to publish",
      });
    }

    // Update program with published mentors
    program.mentorsPublished = true;
    program.mentorsPublishedAt = new Date();
    program.publishedMentorsCount = approvedMentors.length;
    program.publishedMentorIds = approvedMentors.map((m) => new mongoose.Types.ObjectId(m._id));
    await program.save();

    return res.json({
      success: true,
      message: `${approvedMentors.length} mentor(s) published successfully`,
      data: {
        program,
        publishedCount: approvedMentors.length,
      },
    });
  } catch (error) {
    logger.error("Publish approved mentors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to publish mentors",
    });
  }
};

// Unpublish mentors list
export const unpublishApprovedMentors = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const tenantId = req.tenantId;

    const program = await MentoringProgram.findById(id);

    if (!program || program.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    // Unpublish mentors
    program.mentorsPublished = false;
    program.publishedMentorsCount = 0;
    program.publishedMentorIds = [];
    await program.save();

    return res.json({
      success: true,
      message: "Mentors list unpublished successfully",
      data: { program },
    });
  } catch (error) {
    logger.error("Unpublish mentors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to unpublish mentors",
    });
  }
};

// Get published mentors (Public endpoint - no auth required)
export const getPublishedMentors = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const program = await MentoringProgram.findById(id).select(
      "name category mentorsPublished mentorsPublishedAt publishedMentorsCount publishedMentorIds tenantId"
    );

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Mentoring program not found",
      });
    }

    if (!program.mentorsPublished) {
      return res.json({
        success: true,
        message: "No mentors published for this program",
        data: {
          program: {
            _id: program._id,
            name: program.name,
            mentorsPublished: false,
          },
          mentors: [],
        },
      });
    }

    // Get published mentor registrations with user and profile data
    const mentorRegistrations = await MentorRegistration.find({
      _id: { $in: program.publishedMentorIds || [] },
      programId: id,
      status: "approved",
      tenantId: program.tenantId, // Ensure tenant matching for security
    })
      .populate({
        path: "userId",
        select: "firstName lastName email",
      })
      .select(
        "preferredName areasOfMentoring personalEmail sitEmail classOf title firstName lastName userId"
      )
      .lean()
      .sort({ createdAt: -1 });

    // Fetch alumni profiles separately
    const AlumniProfile = (await import("../models/AlumniProfile")).default;
    const mentorRegistrationsWithProfiles = await Promise.all(
      mentorRegistrations.map(async (reg: any) => {
        if (reg.userId?._id || reg.userId) {
          try {
            const userId = reg.userId?._id || reg.userId;
            const profile = await AlumniProfile.findOne({
              userId: userId,
            })
              .select(
                "currentCompany currentPosition industry experience graduationYear program"
              )
              .lean();
            return {
              ...reg,
              userId: {
                ...(typeof reg.userId === 'object' ? reg.userId : { _id: reg.userId }),
                alumniProfile: profile,
              },
            };
          } catch {
            return reg;
          }
        }
        return reg;
      })
    );

    // Format mentor data for public display
    const mentors = mentorRegistrationsWithProfiles.map((reg: any) => {
      const user = reg.userId || {};
      const profile = user?.alumniProfile || {};
      return {
        _id: reg._id,
        registrationId: reg._id,
        name: reg.preferredName || `${reg.firstName || ""} ${reg.lastName || ""}`,
        title: reg.title,
        firstName: reg.firstName,
        lastName: reg.lastName,
        company: profile?.currentCompany,
        position: profile?.currentPosition,
        industry: profile?.industry,
        experience: profile?.experience,
        graduationYear: profile?.graduationYear || reg.classOf,
        program: profile?.program,
        areasOfMentoring: reg.areasOfMentoring || [],
        classOf: reg.classOf,
      };
    });

    return res.json({
      success: true,
      data: {
        program: {
          _id: program._id,
          name: program.name,
          category: program.category,
          mentorsPublished: program.mentorsPublished,
          mentorsPublishedAt: program.mentorsPublishedAt,
          publishedMentorsCount: program.publishedMentorsCount,
        },
        mentors,
      },
    });
  } catch (error) {
    logger.error("Get published mentors error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch published mentors",
    });
  }
};

export default {
  createProgram,
  getAllPrograms,
  getProgramById,
  updateProgram,
  publishProgram,
  unpublishProgram,
  deleteProgram,
  getProgramStatistics,
  publishApprovedMentors,
  unpublishApprovedMentors,
  getPublishedMentors,
};

