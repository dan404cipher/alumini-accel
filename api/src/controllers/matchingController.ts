import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import MentoringProgram from "../models/MentoringProgram";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import { logger } from "../utils/logger";
import { emailService } from "../services/emailService";
import {
  calculateMatchScore,
  calculateAllMatchScores,
  findBestMatch,
} from "../services/matchingAlgorithm";
import {
  MatchingStatus,
  MatchType,
} from "../types";
import { autoCreateMentorCommunity } from "../services/mentorshipCommunityService";
import { MAX_MENTEES_PER_MENTOR } from "../constants/mentoring";

// Submit mentee preferences (3 preferred mentors)
export const submitMenteePreferences = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const { preferredMentorIds } = req.body; // Array of 3 mentor IDs
    const tenantId = req.tenantId;

    if (!preferredMentorIds || !Array.isArray(preferredMentorIds) || preferredMentorIds.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Exactly 3 preferred mentor IDs are required",
      });
    }

    // Get program
    const program = await MentoringProgram.findOne({
      _id: programId,
      tenantId,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Check if registration end date has passed
    const now = new Date();
    if (now > new Date(program.registrationEndDateMentee)) {
      return res.status(400).json({
        success: false,
        message: "Mentee registration deadline has passed",
      });
    }

    // Get mentee registration (by validatedStudentId or token)
    const { validatedStudentId, token } = req.body;
    let menteeRegistration;
    
    if (validatedStudentId) {
      menteeRegistration = await MenteeRegistration.findOne({
        programId,
        status: "approved",
        validatedStudentId,
        tenantId,
      }).populate("programId");
    } else if (token) {
      menteeRegistration = await MenteeRegistration.findOne({
        programId,
        registrationToken: token,
        status: "approved",
        tenantId,
      }).populate("programId");
    } else if (req.user) {
      // If authenticated, try to find by email
      menteeRegistration = await MenteeRegistration.findOne({
        programId,
        status: "approved",
        personalEmail: req.user.email,
        tenantId,
      }).populate("programId");
    } else {
      return res.status(400).json({
        success: false,
        message: "Validated student ID or token is required",
      });
    }

    if (!menteeRegistration) {
      return res.status(404).json({
        success: false,
        message: "Approved mentee registration not found for this program",
      });
    }

    // Validate all mentor IDs are approved mentors for this program
    const approvedMentors = await MentorRegistration.find({
      programId,
      status: "approved",
      userId: { $in: preferredMentorIds },
      tenantId,
    });

    if (approvedMentors.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "All selected mentors must be approved for this program",
      });
    }

    // Check for duplicates
    const uniqueIds = [...new Set(preferredMentorIds)];
    if (uniqueIds.length !== 3) {
      return res.status(400).json({
        success: false,
        message: "Cannot select the same mentor multiple times",
      });
    }

    // Store preferences in mentee registration
    menteeRegistration.preferredMentors = preferredMentorIds.map((id: string) => id as any);
    await menteeRegistration.save();

    return res.json({
      success: true,
      message: "Mentee preferences submitted successfully",
      data: {
        preferredMentorIds,
      },
    });
  } catch (error) {
    logger.error("Submit mentee preferences error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit preferences",
    });
  }
};

// Initiate matching process
export const initiateMatching = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const tenantId = req.tenantId;

    // Get program
    const program = await MentoringProgram.findOne({
      _id: programId,
      tenantId,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Validate dates
    const now = new Date();
    const menteeRegEnd = new Date(program.registrationEndDateMentee);
    const mentorRegEnd = new Date(program.registrationEndDateMentor);
    const matchingEnd = new Date(program.matchingEndDate);

    if (now < menteeRegEnd || now < mentorRegEnd) {
      return res.status(400).json({
        success: false,
        message: "Cannot initiate matching before registration end dates",
      });
    }

    if (now > matchingEnd) {
      return res.status(400).json({
        success: false,
        message: "Matching end date has passed",
      });
    }

    // Run matching algorithm for all approved mentees
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }
    const result = await runMatchingAlgorithm(programId, tenantId);

    return res.json({
      success: true,
      message: "Matching process initiated successfully",
      data: result,
    });
  } catch (error) {
    logger.error("Initiate matching error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate matching",
    });
  }
};

// Run matching algorithm for all mentees
export const runMatchingAlgorithm = async (
  programId: string,
  tenantId: string
): Promise<{
  totalMentees: number;
  matched: number;
  pending: number;
  needsManual: number;
  errors: number;
}> => {
  try {
    // Get all approved mentee registrations
    const menteeRegistrations = await MenteeRegistration.find({
      programId,
      status: "approved",
      tenantId,
    });

    let matched = 0;
    let pending = 0;
    let needsManual = 0;
    let errors = 0;

    for (const menteeReg of menteeRegistrations) {
      try {
        // Check if mentee already has an active match (mentee registrations don't have userId)
        const existingMatch = await MentorMenteeMatching.findOne({
          programId,
          menteeRegistrationId: menteeReg._id,
          status: {
            $in: [MatchingStatus.PENDING_MENTOR_ACCEPTANCE, MatchingStatus.ACCEPTED],
          },
          tenantId,
        });

        if (existingMatch) {
          continue; // Skip if already matched
        }

        // Get mentee's preferred mentors
        const preferredMentorIds = menteeReg.preferredMentors
          ? menteeReg.preferredMentors.map((id: any) => id.toString())
          : [];

        // Find best match (use registration ID as identifier)
        const bestMatch = await findBestMatch(
          menteeReg._id.toString(), // Use registration ID as identifier
          menteeReg._id.toString(),
          programId,
          preferredMentorIds,
          [],
          tenantId
        );

        if (!bestMatch) {
          needsManual++;
          continue;
        }

        // Check if mentor has reached maximum mentee limit (20 mentees per mentor)
        // Note: findBestMatch already filters out mentors at capacity, but we double-check here
        const mentorMatchCount = await MentorMenteeMatching.countDocuments({
          programId,
          mentorId: bestMatch.mentorId,
          status: MatchingStatus.ACCEPTED,
          tenantId,
        });

        if (mentorMatchCount >= MAX_MENTEES_PER_MENTOR) {
          // Mentor has reached maximum capacity, try algorithm-based match with different mentor
          const algorithmMatch = await findBestMatch(
            menteeReg._id.toString(),
            menteeReg._id.toString(),
            programId,
            [],
            [bestMatch.mentorId],
            tenantId
          );

          if (!algorithmMatch) {
            needsManual++;
            continue;
          }

          // Create match with algorithm-based mentor
          await createMatchRequest(
            programId,
            menteeReg._id.toString(), // Use registration ID
            menteeReg._id.toString(),
            algorithmMatch,
            preferredMentorIds,
            tenantId
          );
          pending++;
        } else {
          // Create match request
          await createMatchRequest(
            programId,
            menteeReg._id.toString(), // Use registration ID
            menteeReg._id.toString(),
            bestMatch,
            preferredMentorIds,
            tenantId
          );
          pending++;
        }
      } catch (error) {
        logger.error(`Failed to match mentee ${menteeReg._id}:`, error);
        errors++;
      }
    }

    return {
      totalMentees: menteeRegistrations.length,
      matched: 0, // Will be updated when mentors accept
      pending,
      needsManual,
      errors,
    };
  } catch (error) {
    logger.error("Run matching algorithm error:", error);
    throw error;
  }
};

// Create match request
const createMatchRequest = async (
  programId: string,
  menteeId: string, // Registration ID in this case
  menteeRegistrationId: string,
  matchScore: any,
  preferredMentorIds: string[],
  tenantId: string
) => {
  // Get mentee registration for email lookup
  const menteeReg = await MenteeRegistration.findById(menteeRegistrationId);
  
  // Get mentor registration
  const mentorReg = await MentorRegistration.findOne({
    _id: matchScore.mentorRegistrationId,
    programId,
    status: "approved",
  });

  if (!mentorReg) {
    throw new Error("Mentor registration not found");
  }

  const mentorId = mentorReg.userId.toString();

  // Determine match type
  const matchType = matchScore.isInPreferredList
    ? MatchType.PREFERRED
    : MatchType.ALGORITHM;

  // Calculate auto-reject date (3 days from now)
  const autoRejectAt = new Date();
  autoRejectAt.setDate(autoRejectAt.getDate() + 3);

    // Get or create a user reference for mentee (use registration ID if no user found)
    let menteeUserId = menteeId;
    if (menteeReg?.personalEmail) {
      const menteeUser = await User.findOne({ email: menteeReg.personalEmail });
      if (menteeUser) {
        menteeUserId = menteeUser._id.toString();
      }
    }

    // Create matching record
    const matching = new MentorMenteeMatching({
      programId,
      menteeId: menteeUserId as any, // Use user ID if found, otherwise registration ID
      menteeRegistrationId,
      mentorId,
      mentorRegistrationId: matchScore.mentorRegistrationId,
      matchScore: matchScore.totalScore,
      matchType,
      preferredChoiceOrder: matchScore.preferredOrder,
      status: MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
      menteeSelectedMentors: preferredMentorIds.map((id) => id as any),
      matchedAt: new Date(),
      autoRejectAt,
      scoreBreakdown: {
        industryScore: matchScore.industryScore,
        programmeScore: matchScore.programmeScore,
        skillsScore: matchScore.skillsScore,
        preferenceScore: matchScore.preferenceScore,
      },
      tenantId,
    });

  await matching.save();

  // Send match request email to mentor
  await sendMatchRequestToMentor(matching._id.toString());

  return matching;
};

// Send match request email to mentor
export const sendMatchRequestToMentor = async (matchId: string) => {
  try {
    const matching = await MentorMenteeMatching.findById(matchId)
      .populate("programId")
      .populate("menteeId")
      .populate("mentorId")
      .populate("menteeRegistrationId");

    if (!matching) {
      throw new Error("Match not found");
    }

    const program = matching.programId as any;
    const mentor = matching.mentorId as any;
    const menteeReg = await MenteeRegistration.findById(matching.menteeRegistrationId);
    
    // Get mentee user if exists
    let mentee = null;
    if (menteeReg?.personalEmail) {
      mentee = await User.findOne({ email: menteeReg.personalEmail });
    }
    
    if (!mentee && matching.menteeId) {
      mentee = await User.findById(matching.menteeId);
    }

    // Send email using template or default
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const acceptLink = `${frontendUrl}/mentor-match-requests?matchId=${matching._id}`;

    await emailService.sendEmail({
      to: mentor.email,
      subject: `New Mentee Match Request - ${program?.name || "Mentoring Program"}`,
      html: `
        <h2>New Mentee Match Request</h2>
        <p>Dear ${mentor.firstName} ${mentor.lastName},</p>
        <p>You have been matched with a mentee for the <strong>${program?.name || "Mentoring Program"}</strong> program.</p>
        <p><strong>Mentee Details:</strong></p>
        <ul>
          <li>Name: ${menteeReg?.firstName || ""} ${menteeReg?.lastName || ""}</li>
          <li>Email: ${menteeReg?.personalEmail || ""}</li>
          <li>Class Of: ${menteeReg?.classOf || ""}</li>
          ${menteeReg?.areasOfMentoring && menteeReg.areasOfMentoring.length > 0 ? `<li>Areas of Interest: ${menteeReg.areasOfMentoring.join(", ")}</li>` : ""}
        </ul>
        <p><strong>Match Score:</strong> ${matching.matchScore}%</p>
        ${matching.scoreBreakdown ? `
        <p><strong>Score Breakdown:</strong></p>
        <ul>
          <li>Industry Match: ${matching.scoreBreakdown.industryScore}%</li>
          <li>Programme Match: ${matching.scoreBreakdown.programmeScore}%</li>
          <li>Skills Match: ${matching.scoreBreakdown.skillsScore}%</li>
          <li>Preference Match: ${matching.scoreBreakdown.preferenceScore}%</li>
        </ul>
        ` : ""}
        <p>Please review and respond to this match request within 3 days.</p>
        <p><a href="${acceptLink}">View Match Request</a></p>
        <p>Best regards,<br>AlumniAccel Team</p>
      `,
    });
  } catch (error) {
    logger.error("Send match request email error:", error);
  }
};

// Accept match
export const acceptMatch = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { matchId } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const matching = await MentorMenteeMatching.findById(matchId)
      .populate("programId")
      .populate("menteeId")
      .populate("mentorId")
      .populate("menteeRegistrationId");

    if (!matching || matching.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Verify mentor
    if (matching.mentorId.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned mentor can accept this match",
      });
    }

    // Check status
    if (matching.status !== MatchingStatus.PENDING_MENTOR_ACCEPTANCE) {
      return res.status(400).json({
        success: false,
        message: "Match is not in pending status",
      });
    }

    // Update status
    matching.status = MatchingStatus.ACCEPTED;
    matching.mentorResponseAt = new Date();
    await matching.save();

    // Auto-create mentorship community
    try {
      const menteeReg = await MenteeRegistration.findById(matching.menteeRegistrationId);
      const menteeUserId = menteeReg?.personalEmail
        ? (await User.findOne({ email: menteeReg.personalEmail }))?._id?.toString() || matching.menteeId?.toString()
        : matching.menteeId?.toString();

      const communityId = await autoCreateMentorCommunity({
        matchingId: matching._id.toString(),
        programId: matching.programId.toString(),
        mentorId: matching.mentorId.toString(),
        menteeId: menteeUserId || "",
        menteeRegistrationId: matching.menteeRegistrationId.toString(),
        tenantId: matching.tenantId.toString(),
      });

      if (communityId) {
        logger.info(`Mentorship community created: ${communityId}`);
      }
    } catch (communityError) {
      logger.error("Failed to create mentorship community:", communityError);
      // Don't fail the acceptance if community creation fails
    }

    // Send notification to mentee
    const program = matching.programId as any;
    const menteeReg = await MenteeRegistration.findById(matching.menteeRegistrationId);
    
    if (!menteeReg) {
      logger.error("Mentee registration not found for match acceptance");
      return res.json({
        success: true,
        message: "Match accepted successfully",
        data: { matching },
      });
    }

    try {
      await emailService.sendEmail({
        to: menteeReg.preferredMailingAddress,
        subject: `Mentor Match Accepted - ${program?.name || "Mentoring Program"}`,
        html: `
          <h2>Mentor Match Accepted</h2>
          <p>Dear ${menteeReg.firstName || ""} ${menteeReg.lastName || ""},</p>
          <p>Great news! Your mentor has accepted the match for the <strong>${program?.name || "Mentoring Program"}</strong> program.</p>
          <p>Your mentor will be in touch with you soon to begin your mentoring journey.</p>
          <p>Best regards,<br>AlumniAccel Team</p>
        `,
      });
    } catch (emailError) {
      logger.error("Failed to send acceptance email:", emailError);
    }

    return res.json({
      success: true,
      message: "Match accepted successfully",
      data: { matching },
    });
  } catch (error) {
    logger.error("Accept match error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to accept match",
    });
  }
};

// Reject match (automatically move to next preference)
export const rejectMatch = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { matchId } = req.params;
    const { reason } = req.body;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const matching = await MentorMenteeMatching.findById(matchId)
      .populate("programId")
      .populate("menteeId")
      .populate("menteeRegistrationId");

    if (!matching || matching.tenantId.toString() !== tenantId) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Verify mentor
    if (matching.mentorId.toString() !== userId?.toString()) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned mentor can reject this match",
      });
    }

    // Update status
    matching.status = MatchingStatus.REJECTED;
    matching.mentorResponseAt = new Date();
    matching.rejectionReason = reason;
    await matching.save();

    // Try to move to next preference (only if this was from preferred list)
    if (matching.matchType === MatchType.PREFERRED) {
      await moveToNextPreference(
        matching.menteeId?.toString() || matching.menteeRegistrationId.toString(),
        matching.menteeRegistrationId.toString(),
        matching.programId.toString(),
        matching.menteeSelectedMentors.map((id: any) => id.toString()),
        [matching.mentorId.toString()],
        matching.tenantId.toString()
      );
    }

    return res.json({
      success: true,
      message: "Match rejected. System will try next preference automatically.",
      data: { matching },
    });
  } catch (error) {
    logger.error("Reject match error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject match",
    });
  }
};

// Move to next preference
const moveToNextPreference = async (
  menteeId: string,
  menteeRegistrationId: string,
  programId: string,
  preferredMentorIds: string[],
  excludedMentorIds: string[],
  tenantId: string
) => {
  try {
    // Check if mentee already has an accepted match
    const existingAccepted = await MentorMenteeMatching.findOne({
      programId,
      menteeRegistrationId,
      status: MatchingStatus.ACCEPTED,
      tenantId,
    });

    if (existingAccepted) {
      // Already matched, don't proceed
      return;
    }

    // Find next best match
    const nextMatch = await findBestMatch(
      menteeId,
      menteeRegistrationId,
      programId,
      preferredMentorIds,
      excludedMentorIds,
      tenantId
    );

    if (nextMatch) {
      // Create new match request
      await createMatchRequest(
        programId,
        menteeId,
        menteeRegistrationId,
        nextMatch,
        preferredMentorIds,
        tenantId
      );
    } else {
      // No more matches available - notify staff
      await notifyManualMatchingRequired(programId, menteeRegistrationId, tenantId);
    }
  } catch (error) {
    logger.error("Move to next preference error:", error);
  }
};

// Notify staff when manual matching required
const notifyManualMatchingRequired = async (
  programId: string,
  menteeRegistrationId: string,
  tenantId: string
) => {
  try {
    const program = await MentoringProgram.findById(programId).populate("coordinators");
    if (!program) return;

    const menteeReg = await MenteeRegistration.findById(menteeRegistrationId);
    const coordinators = program.coordinators || [];
    for (const coordinatorId of coordinators) {
      const coordinator = await User.findById(coordinatorId);
      if (coordinator?.email) {
        await emailService.sendEmail({
          to: coordinator.email,
          subject: "Manual Matching Required",
          html: `
            <h2>Manual Matching Required</h2>
            <p>A mentee requires manual matching as all preferences have been exhausted.</p>
            <p>Program: ${program.name}</p>
            <p>Mentee: ${menteeReg?.firstName || ""} ${menteeReg?.lastName || ""} (${menteeReg?.personalEmail || ""})</p>
            <p>Please review and manually assign a mentor.</p>
          `,
        });
      }
    }
  } catch (error) {
    logger.error("Notify manual matching error:", error);
  }
};

// Get mentee matching status
export const getMenteeMatchingStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    // Get mentee registration
    const menteeReg = await MenteeRegistration.findOne({
      programId,
      $or: [
        { userId },
        { personalEmail: req.user?.email },
      ],
      status: "approved",
      tenantId,
    });

    if (!menteeReg) {
      return res.status(404).json({
        success: false,
        message: "Mentee registration not found",
      });
    }

    const matches = await MentorMenteeMatching.find({
      programId,
      $or: [
        { menteeRegistrationId: menteeReg._id },
        { menteeId: userId },
      ],
      tenantId,
    })
      .populate("mentorId", "firstName lastName email")
      .populate("programId", "name")
      .sort({ matchedAt: -1 });

    return res.json({
      success: true,
      data: {
        matches,
        currentMatch: matches.find(
          (m) => m.status === MatchingStatus.PENDING_MENTOR_ACCEPTANCE || m.status === MatchingStatus.ACCEPTED
        ),
      },
    });
  } catch (error) {
    logger.error("Get mentee matching status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get matching status",
    });
  }
};

// Get mentor match requests
export const getMentorMatchRequests = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    const matches = await MentorMenteeMatching.find({
      mentorId: userId,
      status: MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
      tenantId,
    })
      .populate("programId", "name category")
      .populate("menteeId", "firstName lastName email")
      .populate({
        path: "menteeRegistrationId",
        model: "MenteeRegistration",
        select: "firstName lastName personalEmail classOf areasOfMentoring preferredMailingAddress",
      })
      .sort({ matchedAt: -1 });

    // Calculate days remaining for each match
    const matchesWithDeadline = matches.map((match) => {
      const now = new Date();
      const autoRejectAt = match.autoRejectAt || new Date();
      const daysRemaining = Math.ceil(
        (autoRejectAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...match.toObject(),
        daysRemaining: Math.max(0, daysRemaining),
      };
    });

    return res.json({
      success: true,
      data: { matches: matchesWithDeadline },
    });
  } catch (error) {
    logger.error("Get mentor match requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get match requests",
    });
  }
};

// Auto-reject expired matches
export const autoRejectExpiredMatches = async () => {
  try {
    const now = new Date();

    // Find all pending matches past auto-reject date
    const expiredMatches = await MentorMenteeMatching.find({
      status: MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
      autoRejectAt: { $lt: now },
    });

    for (const match of expiredMatches) {
      // Update status
      match.status = MatchingStatus.AUTO_REJECTED;
      match.rejectionReason = "No response received within 3 days";
      await match.save();

      // Move to next preference (only if this was from preferred list)
      if (match.matchType === MatchType.PREFERRED) {
        await moveToNextPreference(
          match.menteeId?.toString() || match.menteeRegistrationId.toString(),
          match.menteeRegistrationId.toString(),
          match.programId.toString(),
          match.menteeSelectedMentors.map((id: any) => id.toString()),
          [match.mentorId.toString()],
          match.tenantId.toString()
        );
      }
    }

    logger.info(`Auto-rejected ${expiredMatches.length} expired matches`);
    return expiredMatches.length;
  } catch (error) {
    logger.error("Auto-reject expired matches error:", error);
    return 0;
  }
};

// Manual matching (Staff/Admin)
export const manualMatching = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const { menteeId, mentorId } = req.body;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    if (!menteeId || !mentorId) {
      return res.status(400).json({
        success: false,
        message: "Mentee ID and Mentor ID are required",
      });
    }

    // Get mentee registration (menteeId could be registration ID or user ID)
    let menteeReg = await MenteeRegistration.findOne({
      _id: menteeId,
      programId,
      status: "approved",
      tenantId,
    });

    // If not found by _id, try finding by userId
    if (!menteeReg) {
      const menteeUser = await User.findById(menteeId);
      if (menteeUser) {
        menteeReg = await MenteeRegistration.findOne({
          programId,
          personalEmail: menteeUser.email,
          status: "approved",
          tenantId,
        });
      }
    }

    // Get mentor registration (mentorId is user ID)
    const mentorReg = await MentorRegistration.findOne({
      programId,
      userId: mentorId,
      status: "approved",
      tenantId,
    });

    if (!menteeReg || !mentorReg) {
      return res.status(404).json({
        success: false,
        message: "Mentee or Mentor registration not found",
      });
    }

    // Get the actual mentee user ID
    const menteeUserId = menteeReg.personalEmail
      ? (await User.findOne({ email: menteeReg.personalEmail }))?._id?.toString() || menteeId
      : menteeId;

    // Check if mentor has reached maximum mentee limit (20 mentees per mentor)
    const mentorMatchCount = await MentorMenteeMatching.countDocuments({
      programId,
      mentorId,
      status: MatchingStatus.ACCEPTED,
      tenantId,
    });

    if (mentorMatchCount >= MAX_MENTEES_PER_MENTOR) {
      return res.status(400).json({
        success: false,
        message: `Mentor has reached the maximum capacity of ${MAX_MENTEES_PER_MENTOR} mentees per program`,
      });
    }

    // Calculate match score for reference
    const preferredMentorIds = menteeReg.preferredMentors
      ? menteeReg.preferredMentors.map((id: any) => id.toString())
      : [];
    const matchScore = await calculateMatchScore(
      menteeUserId,
      menteeReg._id.toString(),
      mentorId,
      mentorReg._id.toString(),
      preferredMentorIds
    );

    // Create manual match
    const matching = new MentorMenteeMatching({
      programId,
      menteeId: menteeUserId,
      menteeRegistrationId: menteeReg._id,
      mentorId,
      mentorRegistrationId: mentorReg._id,
      matchScore: matchScore.totalScore,
      matchType: MatchType.MANUAL,
      status: MatchingStatus.ACCEPTED, // Auto-accept manual matches
      menteeSelectedMentors: preferredMentorIds.map((id) => id as any),
      matchedAt: new Date(),
      mentorResponseAt: new Date(),
      matchedBy: userId,
      scoreBreakdown: {
        industryScore: matchScore.industryScore,
        programmeScore: matchScore.programmeScore,
        skillsScore: matchScore.skillsScore,
        preferenceScore: matchScore.preferenceScore,
      },
      tenantId,
    });

    await matching.save();

    // Auto-create mentorship community for manual matches
    let communityId: string | null = null;
    try {
      communityId = await autoCreateMentorCommunity({
        matchingId: matching._id.toString(),
        programId: matching.programId.toString(),
        mentorId: matching.mentorId.toString(),
        menteeId: menteeUserId || "",
        menteeRegistrationId: matching.menteeRegistrationId.toString(),
        tenantId: matching.tenantId.toString(),
      });

      if (communityId) {
        logger.info(`Mentorship community created for manual match: ${communityId}`);
        // Update matching record with community ID
        matching.mentorshipCommunityId = communityId as any;
        await matching.save();
      }
    } catch (communityError) {
      logger.error("Failed to create mentorship community for manual match:", communityError);
      // Don't fail the manual match if community creation fails
    }

    // Send notifications
    const program = await MentoringProgram.findById(programId);
    const mentee = await User.findById(menteeUserId);
    const mentor = await User.findById(mentorId);

    // Get frontend URL for community link
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const communityLink = communityId 
      ? `${frontendUrl}/community/${communityId}`
      : null;

    if (mentee && mentor) {
      // Email to mentee
      const menteeEmailHtml = `
        <h2>Mentor Assigned</h2>
        <p>Dear ${mentee.firstName} ${mentee.lastName},</p>
        <p>A mentor has been manually assigned to you for the <strong>${program?.name || "Mentoring Program"}</strong> program.</p>
        <p><strong>Mentor:</strong> ${mentor.firstName} ${mentor.lastName}</p>
        ${communityLink ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #0066cc;">
          <p style="margin: 0;"><strong>Access Your Mentorship Community:</strong></p>
          <p style="margin: 10px 0 0 0;"><a href="${communityLink}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Open Community</a></p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">You can communicate with your mentor and access mentorship resources through this private community.</p>
        </div>
        ` : ''}
        <p>Best regards,<br>AlumniAccel Team</p>
      `;

      await emailService.sendEmail({
        to: mentee.email,
        subject: `Mentor Assigned - ${program?.name || "Mentoring Program"}`,
        html: menteeEmailHtml,
      });

      // Email to mentor
      const mentorEmailHtml = `
        <h2>Mentee Assigned</h2>
        <p>Dear ${mentor.firstName} ${mentor.lastName},</p>
        <p>You have been manually assigned a mentee for the <strong>${program?.name || "Mentoring Program"}</strong> program.</p>
        <p><strong>Mentee:</strong> ${mentee.firstName} ${mentee.lastName}</p>
        ${communityLink ? `
        <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #0066cc;">
          <p style="margin: 0;"><strong>Access Your Mentorship Community:</strong></p>
          <p style="margin: 10px 0 0 0;"><a href="${communityLink}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Open Community</a></p>
          <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">You can communicate with your mentee and share mentorship resources through this private community.</p>
        </div>
        ` : ''}
        <p>Best regards,<br>AlumniAccel Team</p>
      `;

      await emailService.sendEmail({
        to: mentor.email,
        subject: `Mentee Assigned - ${program?.name || "Mentoring Program"}`,
        html: mentorEmailHtml,
      });
    }

    return res.json({
      success: true,
      message: "Manual match created successfully",
      data: { 
        matching,
        communityId: communityId || undefined,
      },
    });
  } catch (error) {
    logger.error("Manual matching error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create manual match",
    });
  }
};

// Get unmatched mentees
export const getUnmatchedMentees = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const tenantId = req.tenantId;

    // Get all approved mentee registrations
    const menteeRegs = await MenteeRegistration.find({
      programId,
      status: "approved",
      tenantId,
    });

    // Get all mentees with active matches (by registration ID)
    const matchedRegistrations = await MentorMenteeMatching.find({
      programId,
      status: {
        $in: [MatchingStatus.PENDING_MENTOR_ACCEPTANCE, MatchingStatus.ACCEPTED],
      },
      tenantId,
    }).distinct("menteeRegistrationId");

    // Filter unmatched mentees
    const matchedRegIds = matchedRegistrations.map((id) => id.toString());
    const unmatchedMentees = menteeRegs.filter(
      (reg) => !matchedRegIds.includes(reg._id.toString())
    );

    // Populate mentee details
    const unmatchedWithDetails = await Promise.all(
      unmatchedMentees.map(async (reg) => {
        const mentee = await User.findOne({ email: reg.personalEmail });
        return {
          registration: reg,
          mentee: mentee ? {
            _id: mentee._id,
            firstName: mentee.firstName,
            lastName: mentee.lastName,
            email: mentee.email,
          } : {
            firstName: reg.firstName,
            lastName: reg.lastName,
            email: reg.personalEmail,
          },
        };
      })
    );

    return res.json({
      success: true,
      data: { unmatchedMentees: unmatchedWithDetails },
    });
  } catch (error) {
    logger.error("Get unmatched mentees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unmatched mentees",
    });
  }
};

// Get matching statistics
export const getMatchingStatistics = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const tenantId = req.tenantId;

    // Get all matches for program
    const allMatches = await MentorMenteeMatching.find({
      programId,
      tenantId,
    });

    const totalMentees = await MenteeRegistration.countDocuments({
      programId,
      status: "approved",
      tenantId,
    });

    const statistics = {
      total: allMatches.length,
      pending: allMatches.filter((m) => m.status === MatchingStatus.PENDING_MENTOR_ACCEPTANCE).length,
      accepted: allMatches.filter((m) => m.status === MatchingStatus.ACCEPTED).length,
      rejected: allMatches.filter((m) => m.status === MatchingStatus.REJECTED).length,
      autoRejected: allMatches.filter((m) => m.status === MatchingStatus.AUTO_REJECTED).length,
      totalMentees,
      matchedMentees: new Set(allMatches.filter((m) => m.status === MatchingStatus.ACCEPTED).map((m) => m.menteeId.toString())).size,
      unmatchedMentees: totalMentees - new Set(allMatches.filter((m) => m.status === MatchingStatus.ACCEPTED).map((m) => m.menteeId.toString())).size,
      averageScore: allMatches.length > 0
        ? allMatches.reduce((sum, m) => sum + m.matchScore, 0) / allMatches.length
        : 0,
      preferredMatches: allMatches.filter((m) => m.matchType === MatchType.PREFERRED).length,
      algorithmMatches: allMatches.filter((m) => m.matchType === MatchType.ALGORITHM).length,
      manualMatches: allMatches.filter((m) => m.matchType === MatchType.MANUAL).length,
    };

    return res.json({
      success: true,
      data: { statistics },
    });
  } catch (error) {
    logger.error("Get matching statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get matching statistics",
    });
  }
};

// Get all matches for a program (Staff/Admin)
export const getAllMatches = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const tenantId = req.tenantId;

    // Get all matches for program with populated data
    const matches = await MentorMenteeMatching.find({
      programId,
      tenantId,
    })
      .populate("mentorId", "firstName lastName email profilePicture")
      .populate("menteeId", "firstName lastName email profilePicture")
      .populate({
        path: "menteeRegistrationId",
        model: "MenteeRegistration",
        select: "firstName lastName personalEmail classOf areasOfMentoring preferredMailingAddress",
      })
      .populate({
        path: "mentorRegistrationId",
        model: "MentorRegistration",
        select: "preferredName areasOfMentoring skills",
      })
      .populate("programId", "name category")
      .sort({ matchedAt: -1 });

    return res.json({
      success: true,
      data: { matches },
    });
  } catch (error) {
    logger.error("Get all matches error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get matches",
    });
  }
};

// Get all mentees for a mentor in a specific program (Mentor can view their own mentees)
export const getMyMentees = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const userId = req.user?._id || req.userId;
    const tenantId = req.tenantId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    // Get all matches for this mentor in this program (including pending and accepted)
    // This shows all mentees that have been selected/matched to this mentor
    const matches = await MentorMenteeMatching.find({
      programId,
      mentorId: userId,
      status: {
        $in: [
          MatchingStatus.ACCEPTED,
          MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
        ],
      },
      tenantId,
    })
      .populate("menteeId", "firstName lastName email profilePicture")
      .populate({
        path: "menteeRegistrationId",
        model: "MenteeRegistration",
        select: "firstName lastName personalEmail classOf areasOfMentoring preferredMailingAddress mobileNumber dateOfBirth",
      })
      .populate("programId", "name category")
      .sort({ matchedAt: -1 });

    // Format the response
    const mentees = matches.map((match) => ({
      _id: match._id,
      matchId: match._id,
      mentee: match.menteeId ? {
        _id: (match.menteeId as any)._id,
        firstName: (match.menteeId as any).firstName,
        lastName: (match.menteeId as any).lastName,
        email: (match.menteeId as any).email,
        profilePicture: (match.menteeId as any).profilePicture,
      } : null,
      registration: match.menteeRegistrationId ? {
        _id: (match.menteeRegistrationId as any)._id,
        firstName: (match.menteeRegistrationId as any).firstName,
        lastName: (match.menteeRegistrationId as any).lastName,
        personalEmail: (match.menteeRegistrationId as any).personalEmail,
        classOf: (match.menteeRegistrationId as any).classOf,
        areasOfMentoring: (match.menteeRegistrationId as any).areasOfMentoring || [],
        preferredMailingAddress: (match.menteeRegistrationId as any).preferredMailingAddress,
        mobileNumber: (match.menteeRegistrationId as any).mobileNumber,
        dateOfBirth: (match.menteeRegistrationId as any).dateOfBirth,
      } : null,
      program: match.programId ? {
        _id: (match.programId as any)._id,
        name: (match.programId as any).name,
        category: (match.programId as any).category,
      } : null,
      matchedAt: match.matchedAt,
      status: match.status,
    }));

    return res.json({
      success: true,
      data: { mentees },
    });
  } catch (error) {
    logger.error("Get my mentees error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get mentees",
    });
  }
};

// Send emails to approved mentees with link to select preferred mentors
export const sendMenteeSelectionEmails = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId } = req.params;
    const { templateId } = req.body; // Optional template ID
    const tenantId = req.tenantId;

    // Get program
    const program = await MentoringProgram.findOne({
      _id: programId,
      tenantId,
    });

    if (!program) {
      return res.status(404).json({
        success: false,
        message: "Program not found",
      });
    }

    // Check if program is published
    if (program.status !== "published") {
      return res.status(400).json({
        success: false,
        message: "Cannot send selection emails for non-published programs",
      });
    }

    // Get all approved mentee registrations
    const menteeRegistrations = await MenteeRegistration.find({
      programId,
      status: "approved",
      tenantId,
    });

    if (menteeRegistrations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No approved mentees found for this program",
      });
    }

    // Check SMTP configuration before proceeding
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(500).json({
        success: false,
        message: "Email configuration missing. Please configure SMTP settings (SMTP_USER and SMTP_PASS) in environment variables.",
      });
    }

    // Get email template if specified, otherwise use default
    const EmailTemplate = (await import("../models/EmailTemplate")).default;
    let template = null;

    if (templateId) {
      template = await EmailTemplate.findOne({
        _id: templateId,
        templateType: "mentee_selection", // You may need to add this template type
        isActive: true,
        tenantId,
      });
    }

    // If no template found, try to get default or create default email
    if (!template) {
      template = await EmailTemplate.findOne({
        templateType: "mentee_selection",
        isActive: true,
        tenantId,
      });
    }

    // Get coordinator and manager names for email
    const coordinatorIds = program.coordinators || [];
    const coordinators = await User.find({
      _id: { $in: coordinatorIds },
    });
    const coordinatorNames = coordinators
      .map((c) => `${c.firstName} ${c.lastName}`)
      .join(", ");

    const manager = program.manager
      ? await User.findById(program.manager)
      : null;
    const managerName = manager
      ? `${manager.firstName} ${manager.lastName}`
      : "";

    // Get approved mentors count for email
    const approvedMentorsCount = await MentorRegistration.countDocuments({
      programId,
      status: "approved",
      tenantId,
    });

    // Format date helper
    const formatDate = (date: Date | string, formatStr: string = "MMM dd, yyyy"): string => {
      try {
        const d = typeof date === "string" ? new Date(date) : date;
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        if (formatStr === "MMM dd, yyyy") {
          return `${months[d.getMonth()]} ${d.getDate().toString().padStart(2, "0")}, ${d.getFullYear()}`;
        }
        return d.toLocaleDateString();
      } catch {
        return "Invalid Date";
      }
    };

    // Get frontend URL
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";

    // Prepare recipients for batch email
    const recipients = menteeRegistrations
      .map((menteeReg) => {
        // Get valid email address - check preferredMailingAddress, personalEmail, or sitEmail
        const email = menteeReg.preferredMailingAddress || 
                     menteeReg.personalEmail || 
                     menteeReg.sitEmail;

        // Skip if no valid email
        if (!email || !email.includes("@")) {
          logger.warn(`Skipping mentee ${menteeReg.firstName} ${menteeReg.lastName} - no valid email address`);
          return null;
        }

        // Generate selection link using registration token and validated student ID
        const selectionLink = `${frontendUrl}/mentee-mentor-selection?programId=${programId}&token=${menteeReg.registrationToken}&validatedStudentId=${menteeReg.validatedStudentId || menteeReg.sitStudentId || menteeReg.sitMatricNumber || ""}`;

        // Prepare email variables
        const variables: any = {
          programName: program.name,
          programCategory: program.category,
          menteeName: `${menteeReg.firstName} ${menteeReg.lastName}`,
          firstName: menteeReg.firstName,
          lastName: menteeReg.lastName,
          personalEmail: menteeReg.personalEmail || menteeReg.sitEmail || email,
          sitEmail: menteeReg.sitEmail,
          classOf: menteeReg.classOf?.toString() || "",
          studentID: menteeReg.validatedStudentId || menteeReg.sitStudentId || menteeReg.sitMatricNumber || "",
          mentorSelectionLink: selectionLink,
          coordinatorName: coordinatorNames,
          programManagerName: managerName,
          matchingEndDate: formatDate(
            new Date(program.matchingEndDate),
            "MMM dd, yyyy"
          ),
          approvedMentorsCount: approvedMentorsCount.toString(),
          tenantId: tenantId as any,
        };

        return {
          email: email.trim().toLowerCase(),
          data: variables,
        };
      })
      .filter((recipient): recipient is { email: string; data: any } => recipient !== null);

    // Default email template if no template found
    const defaultSubject = `Select Your Preferred Mentors - {{programName}}`;
    const defaultHtmlTemplate = `
      <h2>Welcome to Mentor Selection - {{programName}}</h2>
      <p>Dear {{menteeName}},</p>
      <p>Congratulations! Your registration for the <strong>{{programName}}</strong> mentoring program has been approved.</p>
      <p>Now it's time to select your 3 preferred mentors from our pool of approved mentors.</p>
      
      <h3>What You Need to Do:</h3>
      <ol>
        <li>Click on the link below to access the mentor selection page</li>
        <li>Browse through the list of {{approvedMentorsCount}} approved mentors</li>
        <li>Select your top 3 preferred mentors in order of preference</li>
        <li>Submit your selection</li>
      </ol>
      
      <p><strong>Important:</strong> Please complete your mentor selection by <strong>{{matchingEndDate}}</strong>.</p>
      
      <div style="margin: 20px 0; padding: 15px; background-color: #f0f7ff; border-left: 4px solid #0066cc;">
        <p style="margin: 0;"><strong>Select Your Preferred Mentors:</strong></p>
        <p style="margin: 10px 0 0 0;"><a href="{{mentorSelectionLink}}" style="display: inline-block; padding: 12px 24px; background-color: #0066cc; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Select My Mentors</a></p>
      </div>
      
      <p>If you have any questions, please contact the program coordinators: <strong>{{coordinatorName}}</strong></p>
      
      <p>Best regards,<br>AlumniAccel Team</p>
      <p style="font-size: 12px; color: #666;">This is an automated email. Please do not reply to this message.</p>
    `;

    // Use template if available, otherwise use default
    let emailSubject = defaultSubject;
    let emailHtmlTemplate = defaultHtmlTemplate;

    if (template) {
      emailSubject = template.subject;
      emailHtmlTemplate = template.body;
    }

    // Check if we have any valid recipients
    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No mentees with valid email addresses found. Please ensure all approved mentees have email addresses (personalEmail, sitEmail, or preferredMailingAddress).",
      });
    }

    // Send batch emails
    const result = await emailService.sendBatchEmails({
      recipients,
      subject: emailSubject,
      htmlTemplate: emailHtmlTemplate,
      templateId: template?._id.toString(),
      rateLimit: 60, // 60 emails per minute
    });

    // Log the action
    logger.info(
      `Mentee selection emails sent for program ${programId}: ${result.success} successful, ${result.failed} failed out of ${recipients.length} recipients`
    );

    // Update menteeSelectionEmailsSent flag if emails were sent successfully
    if (result.success && result.failed === 0 && recipients.length > 0) {
      try {
        await MentoringProgram.findByIdAndUpdate(programId, {
          $set: { menteeSelectionEmailsSent: true },
        });
        logger.info(`Updated menteeSelectionEmailsSent flag for program ${programId}`);
      } catch (updateError) {
        logger.error(`Failed to update menteeSelectionEmailsSent flag for program ${programId}:`, updateError);
        // Don't fail the request if flag update fails
      }
    }

    // Get failure details for better error messages
    const failures = result.results.filter((r) => !r.success);
    let errorMessage = "";
    
    if (result.failed > 0) {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        errorMessage = "SMTP configuration missing. Please configure SMTP_USER and SMTP_PASS in .env file.";
      } else if (failures.length > 0 && failures[0].error) {
        errorMessage = failures[0].error;
        
        // Add helpful hints for common errors
        if (errorMessage.includes("BadCredentials") || errorMessage.includes("Invalid login")) {
          errorMessage = "Invalid Gmail App Password. Steps to fix: 1) Enable 2-Step Verification at https://myaccount.google.com/security, 2) Create App Password at https://myaccount.google.com/apppasswords, 3) Copy the 16-character password (remove spaces), 4) Update SMTP_PASS in .env file, 5) Restart server. See SMTP_SETUP_GUIDE.md for detailed instructions.";
        }
      } else {
        errorMessage = "Failed to send some emails. Check server logs for details.";
      }
    }

    return res.json({
      success: result.failed === 0,
      message: result.failed === 0
        ? `All ${result.success} mentor selection emails sent successfully`
        : `Mentor selection emails sent: ${result.success} successful, ${result.failed} failed. ${errorMessage}`,
      data: {
        programId: program._id,
        programName: program.name,
        totalMentees: menteeRegistrations.length,
        validEmails: recipients.length,
        emailsSent: result.success,
        emailsFailed: result.failed,
        results: result.results,
        templateUsed: template ? template.name : "Default Template",
        errorMessage: errorMessage || undefined,
      },
    });
  } catch (error) {
    logger.error("Send mentee selection emails error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send mentee selection emails",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Auto-send mentee selection emails for eligible programs
export const autoSendMenteeSelectionEmails = async (): Promise<{
  programsProcessed: number;
  emailsSent: number;
  errors: number;
}> => {
  try {
    const now = new Date();
    
    // Find programs where:
    // 1. Both registration end dates have passed
    // 2. Program status is "published"
    // 3. menteeSelectionEmailsSent is false
    const eligiblePrograms = await MentoringProgram.find({
      status: "published",
      menteeSelectionEmailsSent: false,
      registrationEndDateMentee: { $lte: now },
      registrationEndDateMentor: { $lte: now },
    });

    let programsProcessed = 0;
    let totalEmailsSent = 0;
    let totalErrors = 0;

    for (const program of eligiblePrograms) {
      try {
        // Check if program has approved mentees
        const approvedMenteesCount = await MenteeRegistration.countDocuments({
          programId: program._id,
          status: "approved",
          tenantId: program.tenantId,
        });

        if (approvedMenteesCount === 0) {
          logger.info(
            `Skipping program ${program.name} (${program._id}): No approved mentees`
          );
          continue;
        }

        // Check if matchingProcessStartDate is set and has not passed
        if (
          program.matchingProcessStartDate &&
          new Date(program.matchingProcessStartDate) > now
        ) {
          logger.info(
            `Skipping program ${program.name} (${program._id}): Matching process start date not reached`
          );
          continue;
        }

        // Send emails using the existing function
        // We need to create a mock request object for the function
        const mockReq = {
          params: { programId: program._id.toString() },
          body: {},
          tenantId: program.tenantId,
        } as any;

        const mockRes = {
          json: (data: any) => {
            if (data.success) {
              const emailsSent = data.data?.emailsSent || 0;
              const emailsFailed = data.data?.emailsFailed || 0;
              totalEmailsSent += emailsSent;
              totalErrors += emailsFailed;
              
              // Update flag if emails were sent successfully
              if (emailsSent > 0 && emailsFailed === 0) {
                program.menteeSelectionEmailsSent = true;
                program.save().catch((err) => {
                  logger.error(`Failed to update menteeSelectionEmailsSent flag for program ${program._id}:`, err);
                });
              }
              
              logger.info(
                `Auto-sent mentee selection emails for program ${program.name} (${program._id}): ${emailsSent} sent, ${emailsFailed} failed`
              );
            }
            return mockRes;
          },
          status: (code: number) => mockRes,
        } as any;

        await sendMenteeSelectionEmails(mockReq, mockRes);
        programsProcessed++;

      } catch (error: any) {
        totalErrors++;
        logger.error(
          `Failed to auto-send emails for program ${program.name} (${program._id}):`,
          error
        );
        // Continue with next program even if this one fails
      }
    }

    if (programsProcessed > 0) {
      logger.info(
        `Auto-sent mentee selection emails: ${programsProcessed} programs processed, ${totalEmailsSent} emails sent, ${totalErrors} errors`
      );
    }

    return {
      programsProcessed,
      emailsSent: totalEmailsSent,
      errors: totalErrors,
    };
  } catch (error) {
    logger.error("Auto-send mentee selection emails error:", error);
    return {
      programsProcessed: 0,
      emailsSent: 0,
      errors: 1,
    };
  }
};


