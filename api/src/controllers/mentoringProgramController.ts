import { Request, Response } from "express";
import mongoose from "mongoose";
import { AuthenticatedRequest } from "../types";
import MentoringProgram from "../models/MentoringProgram";
import MentorRegistration from "../models/MentorRegistration";
import { logger } from "../utils/logger";
import { MentoringProgramStatus } from "../types";
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
    const menteeRegEnd = new Date(registrationEndDateMentee);
    const mentorRegEnd = new Date(registrationEndDateMentor);
    const matchEnd = new Date(matchingEndDate);
    const progStart = new Date(programDuration.startDate);
    const progEnd = new Date(programDuration.endDate);

    if (menteeRegEnd <= progStart) {
      return res.status(400).json({
        success: false,
        message: "Mentee registration end date must be after program start date",
      });
    }

    if (mentorRegEnd <= progStart) {
      return res.status(400).json({
        success: false,
        message: "Mentor registration end date must be after program start date",
      });
    }

    if (progEnd <= progStart) {
      return res.status(400).json({
        success: false,
        message: "Program end date must be after start date",
      });
    }

    if (matchEnd <= menteeRegEnd || matchEnd <= mentorRegEnd) {
      return res.status(400).json({
        success: false,
        message:
          "Matching end date must be after both registration end dates",
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
    if (registrationEndDateMentee || registrationEndDateMentor || matchingEndDate) {
      const menteeRegEnd = registrationEndDateMentee
        ? new Date(registrationEndDateMentee)
        : program.registrationEndDateMentee;
      const mentorRegEnd = registrationEndDateMentor
        ? new Date(registrationEndDateMentor)
        : program.registrationEndDateMentor;
      const matchEnd = matchingEndDate
        ? new Date(matchingEndDate)
        : program.matchingEndDate;
      
      // Get program start date (from update or existing)
      const progStart = programDuration?.startDate
        ? new Date(programDuration.startDate)
        : program.programDuration.startDate;

      if (menteeRegEnd <= progStart && registrationEndDateMentee) {
        return res.status(400).json({
          success: false,
          message: "Mentee registration end date must be after program start date",
        });
      }

      if (mentorRegEnd <= progStart && registrationEndDateMentor) {
        return res.status(400).json({
          success: false,
          message: "Mentor registration end date must be after program start date",
        });
      }

      if (
        (matchEnd <= menteeRegEnd || matchEnd <= mentorRegEnd) &&
        matchingEndDate
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Matching end date must be after both registration end dates",
        });
      }
    }

    if (programDuration) {
      const progStart = new Date(programDuration.startDate);
      const progEnd = new Date(programDuration.endDate);
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

    // TODO: Add actual statistics when mentor/mentee registration models are created
    const statistics = {
      totalMentors: 0,
      totalMentees: 0,
      approvedMentors: 0,
      approvedMentees: 0,
      pendingMentors: 0,
      pendingMentees: 0,
      matchedPairs: 0,
      pendingMatches: 0,
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

