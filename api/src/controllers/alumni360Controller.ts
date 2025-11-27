import { Request, Response } from "express";
import AlumniProfile from "../models/AlumniProfile";
import User from "../models/User";
import AlumniNote from "../models/AlumniNote";
import AlumniIssue from "../models/AlumniIssue";
import AlumniFlag from "../models/AlumniFlag";
import Donation from "../models/Donation";
import Event from "../models/Event";
import Message from "../models/Message";
import MentorshipCommunication from "../models/MentorshipCommunication";
import JobPost from "../models/JobPost";
import JobApplication from "../models/JobApplication";
import { logger } from "../utils/logger";
import { UserRole, AuthenticatedRequest } from "../types";
import mongoose from "mongoose";
import { rewardService } from "../services/rewardService";

// Helper function to find alumni profile by _id or userId
const findAlumniProfile = async (id: string) => {
  // Try to find by AlumniProfile _id first
  let alumniProfile = await AlumniProfile.findById(id)
    .populate("userId", "firstName lastName email profilePicture bio location linkedinProfile githubProfile website phone tenantId");

  // If not found by _id, try finding by userId
  if (!alumniProfile) {
    const userIdObjectId = mongoose.Types.ObjectId.isValid(id) 
      ? new mongoose.Types.ObjectId(id) 
      : id;
    
    // First check if user exists
    const user = await User.findById(userIdObjectId);
    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return null;
    }

    // Check if user is actually an alumni
    if (user.role !== UserRole.ALUMNI) {
      logger.warn(`User ${id} is not an alumni (role: ${user.role})`);
      return null;
    }

    // Try to find profile by userId
    alumniProfile = await AlumniProfile.findOne({ userId: userIdObjectId })
      .populate("userId", "firstName lastName email profilePicture bio location linkedinProfile githubProfile website phone tenantId");
    
    if (!alumniProfile) {
      logger.warn(`Alumni profile not found for user ID: ${id} (user exists but no profile)`);
    }
  }

  return alumniProfile;
};

// Helper function to check access permissions
const checkAccess = (req: Request, alumniProfile: any): boolean => {
  const userRole = req.user?.role;
  const userTenantId = req.user?.tenantId?.toString();
  const alumniTenantId = alumniProfile?.userId?.tenantId?.toString() || 
                         alumniProfile?.userId?.tenantId?.toString();

  // Super admin can access all
  if (userRole === UserRole.SUPER_ADMIN) {
    return true;
  }

  // Staff, HOD, and College Admin can only access alumni from their college
  if (userRole === UserRole.STAFF || 
      userRole === UserRole.HOD || 
      userRole === UserRole.COLLEGE_ADMIN) {
    return userTenantId === alumniTenantId;
  }

  return false;
};

// Get complete 360 view data for an alumnus
export const getAlumni360Data = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Find alumni profile by _id or userId
    let alumniProfile = await findAlumniProfile(id);

    if (!alumniProfile) {
      // Check if user exists and try to auto-create profile
      const userIdObjectId = mongoose.Types.ObjectId.isValid(id) 
        ? new mongoose.Types.ObjectId(id) 
        : id;
      const user = await User.findById(userIdObjectId);
      
      if (!user) {
        logger.warn(`User not found with ID: ${id}`);
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      if (user.role !== UserRole.ALUMNI) {
        logger.warn(`User ${id} is not an alumni (role: ${user.role})`);
        return res.status(400).json({
          success: false,
          message: `This user is not an alumnus. Current role: ${user.role}`,
        });
      }

      // Auto-create a minimal alumni profile if user exists and is alumni
      logger.info(`Auto-creating alumni profile for user ID: ${id}`);
      try {
        const currentYear = new Date().getFullYear();
        const defaultGraduationYear = (user as any).graduationYear || currentYear - 1;
        const defaultBatchYear = defaultGraduationYear - 4;

        const newProfile = new AlumniProfile({
          userId: user._id,
          program: "Not specified",
          batchYear: defaultBatchYear,
          graduationYear: defaultGraduationYear,
          department: user.department || "Not specified",
          specialization: undefined,
          currentCompany: undefined,
          currentPosition: undefined,
          currentLocation: user.location || undefined,
          experience: 0,
          skills: [],
          achievements: [],
          certifications: [],
          education: [],
          careerTimeline: [],
          isHiring: false,
          availableForMentorship: false,
          mentorshipDomains: [],
          availableSlots: [],
          testimonials: [],
          photos: [],
        });

        await newProfile.save();
        logger.info(`Successfully created alumni profile for user ID: ${id}`);

        // Re-populate userId after save
        alumniProfile = await AlumniProfile.findById(newProfile._id)
          .populate("userId", "firstName lastName email profilePicture bio location linkedinProfile githubProfile website phone tenantId");
      } catch (error) {
        logger.error(`Failed to auto-create alumni profile for user ID: ${id}`, error);
        return res.status(500).json({
          success: false,
          message: "Failed to create alumni profile automatically",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    // Ensure alumniProfile is not null at this point
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    // Check access permissions
    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view this alumni profile",
      });
    }

    // Use the alumniProfile._id for all queries (not the original id parameter)
    const alumniProfileId = alumniProfile._id.toString();
    const userId = (alumniProfile.userId as any)?._id || alumniProfile.userId;
    const userIdString = userId.toString();
    const userIdObjectId = new mongoose.Types.ObjectId(userIdString);

    // Build notes query: filter private notes - only show private notes to their creator (or admins see all)
    const currentUserId = req.user?.id;
    const currentUserIdObjectId = currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null;
    const userRole = req.user?.role;
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;
    
    // Notes query: show all non-private notes, and private notes only if user is creator (admins see all)
    const notesQuery: any = {
      alumniId: alumniProfileId,
    };
    
    if (!isAdmin && currentUserIdObjectId) {
      // Regular users: only see non-private notes OR their own private notes
      notesQuery.$or = [
        { isPrivate: false },
        { isPrivate: true, staffId: currentUserIdObjectId },
      ];
    }
    // Admins see all notes (no additional filter needed)

    const [
      notes,
      issues,
      flags,
      donations,
      events,
      messages,
      mentorshipCommunications,
      jobsPosted,
      jobsApplied,
    ] = await Promise.all([
      // Notes - use alumniProfileId, filter private notes
      AlumniNote.find(notesQuery)
        .populate("staffId", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 })
        .limit(50),

      // Issues - use alumniProfileId
      AlumniIssue.find({ alumniId: alumniProfileId })
        .populate("raisedBy", "firstName lastName email")
        .populate("assignedTo", "firstName lastName email")
        .populate("resolvedBy", "firstName lastName email")
        .populate("responses.staffId", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 }),

      // Flags - use alumniProfileId
      AlumniFlag.find({ alumniId: alumniProfileId })
        .populate("createdBy", "firstName lastName email")
        .sort({ createdAt: -1 }),

      // Donations - use userIdObjectId
      Donation.find({ donor: userIdObjectId })
        .populate("campaignId", "title")
        .sort({ createdAt: -1 })
        .limit(50),

      // Events (registrations and attendance) - use lean() to avoid virtual getter issues
      Event.find({
        $or: [
          { "attendees.userId": userIdObjectId },
          { "registrations.userId": userIdObjectId },
        ],
      })
        .select("title startDate endDate location isOnline attendees registrations feedback")
        .lean()
        .sort({ startDate: -1 })
        .limit(50),

      // Messages - use userIdObjectId
      Message.find({
        $or: [
          { sender: userIdObjectId },
          { recipient: userIdObjectId },
        ],
      })
        .populate("sender", "firstName lastName email profilePicture")
        .populate("recipient", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 })
        .limit(100),

      // Mentorship Communications - use userIdObjectId
      MentorshipCommunication.find({
        $or: [
          { fromUserId: userIdObjectId },
          { toUserId: userIdObjectId },
        ],
      })
        .populate("fromUserId", "firstName lastName email")
        .populate("toUserId", "firstName lastName email")
        .sort({ sentAt: -1 })
        .limit(50),

      // Jobs Posted by this alumnus
      JobPost.find({ postedBy: userIdObjectId })
        .select("title company position status createdAt")
        .sort({ createdAt: -1 })
        .limit(50),

      // Jobs Applied by this alumnus
      JobApplication.find({ applicantId: userIdObjectId })
        .populate("jobId", "title company position")
        .sort({ appliedAt: -1 })
        .limit(50),
    ]);

    // Calculate engagement metrics (userIdObjectId already defined above)
    const donationStats = await Donation.aggregate([
      {
        $match: {
          donor: userIdObjectId,
          paymentStatus: { $in: ["completed", "successful"] },
        },
      },
      {
        $group: {
          _id: null,
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
          lastDonationDate: { $max: "$createdAt" },
        },
      },
    ]);

    const eventStats = await Event.aggregate([
      {
        $match: {
          $or: [
            { "attendees.userId": userIdObjectId },
            { "registrations.userId": userIdObjectId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          eventsAttended: { $sum: 1 },
          lastEventDate: { $max: "$startDate" },
        },
      },
    ]);

    // Get job statistics
    const jobStats = await Promise.all([
      JobPost.countDocuments({ postedBy: userIdObjectId }),
      JobApplication.countDocuments({ applicantId: userIdObjectId }),
      JobPost.findOne({ postedBy: userIdObjectId })
        .sort({ createdAt: -1 })
        .select("createdAt"),
      JobApplication.findOne({ applicantId: userIdObjectId })
        .sort({ appliedAt: -1 })
        .select("appliedAt"),
    ]);

    const lastMessage = messages[0] || null;
    const lastInteraction = lastMessage
      ? lastMessage.createdAt
      : eventStats[0]?.lastEventDate || null;

    // Calculate engagement score (0-100)
    let engagementScore = 0;
    if (donationStats[0]?.donationCount > 0) engagementScore += 30;
    if (donationStats[0]?.totalDonated > 10000) engagementScore += 20;
    if (eventStats[0]?.eventsAttended > 0) engagementScore += 25;
    if (eventStats[0]?.eventsAttended > 5) engagementScore += 10;
    if (messages.length > 0) engagementScore += 10;
    if (lastInteraction && 
        (new Date().getTime() - new Date(lastInteraction).getTime()) < 90 * 24 * 60 * 60 * 1000) {
      engagementScore += 5; // Active in last 90 days
    }

    const engagementMetrics = {
      score: Math.min(engagementScore, 100),
      totalDonated: donationStats[0]?.totalDonated || 0,
      donationCount: donationStats[0]?.donationCount || 0,
      lastDonationDate: donationStats[0]?.lastDonationDate || null,
      eventsAttended: eventStats[0]?.eventsAttended || 0,
      lastEventDate: eventStats[0]?.lastEventDate || null,
      lastInteraction: lastInteraction,
      messageCount: messages.length,
      jobsPosted: jobStats[0] || 0,
      jobsApplied: jobStats[1] || 0,
      lastJobPostedDate: jobStats[2]?.createdAt || null,
      lastJobAppliedDate: jobStats[3]?.appliedAt || null,
    };

    // Fetch rewards data
    let rewardsData = {
      tierInfo: null as any,
      badges: [] as any[],
      activities: [] as any[],
      summary: null as any,
    };

    try {
      // Get tier info
      const tierInfo = await rewardService.getUserTierInfo(userIdString);
      rewardsData.tierInfo = tierInfo;

      // Get badges
      const badges = await rewardService.getUserBadges(userIdString);
      rewardsData.badges = badges;

      // Get activities
      const tenantId = req.tenantId || req.user?.tenantId?.toString() || undefined;
      const activities = await rewardService.getUserActivities(
        userIdString,
        tenantId
      );
      rewardsData.activities = activities;

      // Get summary
      const summary = await rewardService.getUserSummary(
        userIdString,
        tenantId
      );
      rewardsData.summary = summary;
    } catch (error) {
      logger.warn(`Failed to fetch rewards data for user ${userIdString}:`, error);
      // Continue without rewards data if there's an error
    }

    // Note: Communication history is now fetched separately with pagination
    // Return empty array for initial load (component will fetch with pagination)
    return res.json({
      success: true,
      data: {
        alumni: alumniProfile,
        notes: notes,
        issues: issues,
        flags: flags,
        donations: donations,
        events: events,
        jobsPosted: jobsPosted,
        jobsApplied: jobsApplied,
        communicationHistory: [], // Empty - fetched separately with pagination
        engagementMetrics: engagementMetrics,
        rewards: rewardsData,
      },
    });
  } catch (error) {
    logger.error("Get alumni 360 data error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alumni 360 view data",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add note
export const addNote = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, category, isPrivate } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add notes for this alumni",
      });
    }

    const note = await AlumniNote.create({
      alumniId: alumniProfile._id,
      staffId: req.user?.id,
      content,
      category: category || "general",
      isPrivate: isPrivate || false,
    });

    const populatedNote = await AlumniNote.findById(note._id)
      .populate("staffId", "firstName lastName email profilePicture");

    return res.status(201).json({
      success: true,
      data: { note: populatedNote },
      message: "Note added successfully",
    });
  } catch (error) {
    logger.error("Add note error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update note
export const updateNote = async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;
    const { content, category, isPrivate } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update notes for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const note = await AlumniNote.findOne({
      _id: noteId,
      alumniId: alumniProfileId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if user is the creator or has admin privileges
    const userRole = req.user?.role;
    const isCreator = note.staffId.toString() === req.user?.id;
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own notes",
      });
    }

    // Update note
    note.content = content.trim();
    if (category) note.category = category;
    if (isPrivate !== undefined) note.isPrivate = isPrivate;

    await note.save();

    const populatedNote = await AlumniNote.findById(note._id)
      .populate("staffId", "firstName lastName email profilePicture");

    return res.json({
      success: true,
      data: { note: populatedNote },
      message: "Note updated successfully",
    });
  } catch (error) {
    logger.error("Update note error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete note
export const deleteNote = async (req: Request, res: Response) => {
  try {
    const { id, noteId } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete notes for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const note = await AlumniNote.findOne({
      _id: noteId,
      alumniId: alumniProfileId,
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: "Note not found",
      });
    }

    // Check if user is the creator or has admin privileges
    const userRole = req.user?.role;
    const isCreator = note.staffId.toString() === req.user?.id;
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own notes",
      });
    }

    await AlumniNote.findByIdAndDelete(noteId);

    return res.json({
      success: true,
      message: "Note deleted successfully",
    });
  } catch (error) {
    logger.error("Delete note error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete note",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get notes
export const getNotes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view notes for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const currentUserId = req.user?.id;
    const currentUserIdObjectId = currentUserId ? new mongoose.Types.ObjectId(currentUserId) : null;
    const userRole = req.user?.role;
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;
    
    // Build notes query: filter private notes - only show private notes to their creator (or admins see all)
    const notesQuery: any = {
      alumniId: alumniProfileId,
    };
    
    if (!isAdmin && currentUserIdObjectId) {
      // Regular users: only see non-private notes OR their own private notes
      notesQuery.$or = [
        { isPrivate: false },
        { isPrivate: true, staffId: currentUserIdObjectId },
      ];
    }
    // Admins see all notes (no additional filter needed)

    const notes = await AlumniNote.find(notesQuery)
      .populate("staffId", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniNote.countDocuments(notesQuery);

    return res.json({
      success: true,
      data: {
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get notes error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch notes",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create issue
export const createIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, priority, assignedTo, tags } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        success: false,
        message: "Title and description are required",
      });
    }

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to create issues for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const issue = await AlumniIssue.create({
      alumniId: alumniProfileId,
      raisedBy: req.user?.id,
      title,
      description,
      priority: priority || "medium",
      assignedTo: assignedTo || null,
      status: "open",
      tags: tags || [],
    });

    const populatedIssue = await AlumniIssue.findById(issue._id)
      .populate("raisedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    return res.status(201).json({
      success: true,
      data: { issue: populatedIssue },
      message: "Issue created successfully",
    });
  } catch (error) {
    logger.error("Create issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create issue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update issue
export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id, issueId } = req.params;
    const { status, priority, assignedTo, response, tags } = req.body;

    // Find alumni profile first to get the correct ID
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const issue = await AlumniIssue.findOne({
      _id: issueId,
      alumniId: alumniProfileId,
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Check access (alumniProfile already found above)
    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this issue",
      });
    }

    // Update fields
    if (status) issue.status = status;
    if (priority) issue.priority = priority;
    if (assignedTo !== undefined) issue.assignedTo = assignedTo;
    if (tags) issue.tags = tags;
    if (req.body.title) issue.title = req.body.title;
    if (req.body.description) issue.description = req.body.description;

    // Add response if provided
    if (response && !req.body.responseId) {
      issue.responses.push({
        staffId: req.user?.id as mongoose.Types.ObjectId,
        content: response,
        createdAt: new Date(),
      });
    }

    // Update response if responseId is provided
    if (req.body.responseId && response) {
      const responseIndex = issue.responses.findIndex(
        (r: any) => r._id?.toString() === req.body.responseId
      );
      if (responseIndex !== -1) {
        const existingResponse = issue.responses[responseIndex];
        // Check if user is the creator or admin
        const userRole = req.user?.role;
        const isCreator = existingResponse.staffId?.toString() === req.user?.id;
        const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;

        if (!isCreator && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: "You can only edit your own responses",
          });
        }

        issue.responses[responseIndex].content = response;
      } else {
        return res.status(404).json({
          success: false,
          message: "Response not found",
        });
      }
    }

    // Delete response if responseIdToDelete is provided
    if (req.body.responseIdToDelete) {
      const responseIndex = issue.responses.findIndex(
        (r: any) => r._id?.toString() === req.body.responseIdToDelete
      );
      if (responseIndex !== -1) {
        const existingResponse = issue.responses[responseIndex];
        // Check if user is the creator or admin
        const userRole = req.user?.role;
        const isCreator = existingResponse.staffId?.toString() === req.user?.id;
        const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;

        if (!isCreator && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: "You can only delete your own responses",
          });
        }

        issue.responses.splice(responseIndex, 1);
      } else {
        return res.status(404).json({
          success: false,
          message: "Response not found",
        });
      }
    }

    // Update resolved fields if status is resolved
    if (status === "resolved" || status === "closed") {
      issue.resolvedAt = new Date();
      issue.resolvedBy = req.user?.id as mongoose.Types.ObjectId;
    }

    await issue.save();

    const populatedIssue = await AlumniIssue.findById(issue._id)
      .populate("raisedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email")
      .populate("responses.staffId", "firstName lastName email profilePicture");

    return res.json({
      success: true,
      data: { issue: populatedIssue },
      message: "Issue updated successfully",
    });
  } catch (error) {
    logger.error("Update issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update issue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete issue
export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id, issueId } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete issues for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const issue = await AlumniIssue.findOne({
      _id: issueId,
      alumniId: alumniProfileId,
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Check if user is the creator or has admin privileges
    const userRole = req.user?.role;
    const isCreator = issue.raisedBy?.toString() === req.user?.id;
    const isAdmin = userRole === UserRole.SUPER_ADMIN || userRole === UserRole.COLLEGE_ADMIN;

    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You can only delete issues you created",
      });
    }

    await AlumniIssue.findByIdAndDelete(issueId);

    return res.json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    logger.error("Delete issue error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete issue",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get issues
export const getIssues = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.query;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view issues for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const filter: any = { alumniId: alumniProfileId };
    if (status) filter.status = status;

    const issues = await AlumniIssue.find(filter)
      .populate("raisedBy", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .populate("resolvedBy", "firstName lastName email")
      .populate("responses.staffId", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { issues },
    });
  } catch (error) {
    logger.error("Get issues error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add or update flag
export const addFlag = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { flagType, flagValue, description } = req.body;

    if (!flagType || !flagValue) {
      return res.status(400).json({
        success: false,
        message: "Flag type and value are required",
      });
    }

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to add flags for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    // Use findOneAndUpdate with upsert to update or create
    const flag = await AlumniFlag.findOneAndUpdate(
      { alumniId: alumniProfileId, flagType },
      {
        flagValue,
        description,
        createdBy: req.user?.id,
      },
      { new: true, upsert: true }
    ).populate("createdBy", "firstName lastName email");

    return res.json({
      success: true,
      data: { flag },
      message: "Flag added successfully",
    });
  } catch (error) {
    logger.error("Add flag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add flag",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Remove flag
export const removeFlag = async (req: Request, res: Response) => {
  try {
    const { id, flagType } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to remove flags for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    await AlumniFlag.findOneAndDelete({ alumniId: alumniProfileId, flagType });

    return res.json({
      success: true,
      message: "Flag removed successfully",
    });
  } catch (error) {
    logger.error("Remove flag error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove flag",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get flags
export const getFlags = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view flags for this alumni",
      });
    }

    const alumniProfileId = alumniProfile._id.toString();
    const flags = await AlumniFlag.find({ alumniId: alumniProfileId })
      .populate("createdBy", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: { flags },
    });
  } catch (error) {
    logger.error("Get flags error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch flags",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get communication history
export const getCommunicationHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, page, limit, search } = req.query;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view communication history",
      });
    }

    const userId = (alumniProfile.userId as any)?._id || alumniProfile.userId;
    const userIdString = userId.toString();
    const userIdObjectId = new mongoose.Types.ObjectId(userIdString);
    
    // Pagination parameters
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const skip = (pageNum - 1) * limitNum;

    // Build query filters
    const messageFilter: any = {
      $or: [
        { sender: userIdObjectId },
        { recipient: userIdObjectId },
      ],
    };

    const mentorshipFilter: any = {
      $or: [
        { fromUserId: userIdObjectId },
        { toUserId: userIdObjectId },
      ],
    };

    // Get total counts for pagination (before search filtering)
    // We'll calculate the actual total after filtering
    const [totalMessages, totalMentorshipComms] = await Promise.all([
      Message.countDocuments(messageFilter),
      MentorshipCommunication.countDocuments(mentorshipFilter),
    ]);

    // Initial total (will be recalculated after search filter)
    let totalCommunications = totalMessages + totalMentorshipComms;

    // Fetch more than needed to ensure we have enough after filtering and sorting
    // Fetch up to (skip + limit) * 2 to account for filtering by type
    // Max limit to prevent loading too many records
    const maxFetchLimit = 1000;
    const fetchLimit = type 
      ? Math.min((skip + limitNum) * 3, maxFetchLimit) // Fetch 3x if filtering by type
      : Math.min(skip + limitNum, maxFetchLimit); // Fetch just what we need if no filter

    // Fetch messages and communications
    const [messages, mentorshipCommunications] = await Promise.all([
      Message.find(messageFilter)
        .populate("sender", "firstName lastName email profilePicture")
        .populate("recipient", "firstName lastName email profilePicture")
        .sort({ createdAt: -1 })
        .limit(fetchLimit),

      MentorshipCommunication.find(mentorshipFilter)
        .populate("fromUserId", "firstName lastName email")
        .populate("toUserId", "firstName lastName email")
        .sort({ sentAt: -1 })
        .limit(fetchLimit),
    ]);

    // Combine and format communication history
    const communicationHistory = [
      ...messages.map((msg: any) => ({
        type: "message",
        id: msg._id,
        from: msg.sender,
        to: msg.recipient,
        content: msg.content,
        date: msg.createdAt,
        isRead: msg.isRead,
      })),
      ...mentorshipCommunications.map((comm: any) => ({
        type: "mentorship",
        id: comm._id,
        from: comm.fromUserId,
        to: comm.toUserId,
        subject: comm.subject,
        content: comm.body,
        date: comm.sentAt,
        isRead: comm.isRead,
      })),
    ]
      .filter((comm) => {
        // Filter by type if specified
        if (type && comm.type !== type) return false;
        
        // Filter by search term if specified
        if (search && typeof search === "string") {
          const searchLower = search.toLowerCase();
          const fromName = `${comm.from?.firstName || ""} ${comm.from?.lastName || ""}`.toLowerCase();
          const toName = `${comm.to?.firstName || ""} ${comm.to?.lastName || ""}`.toLowerCase();
          const content = (comm.content || "").toLowerCase();
          const subject = ((comm as any).subject || "").toLowerCase(); // Subject only exists for mentorship
          
          return (
            fromName.includes(searchLower) ||
            toName.includes(searchLower) ||
            content.includes(searchLower) ||
            subject.includes(searchLower)
          );
        }
        
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Update total after search filtering
    totalCommunications = communicationHistory.length;

    // Apply pagination
    const paginatedHistory = communicationHistory.slice(skip, skip + limitNum);

    return res.json({
      success: true,
      data: {
        communicationHistory: paginatedHistory,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: totalCommunications,
          totalPages: Math.ceil(totalCommunications / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error("Get communication history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch communication history",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get alumni analytics for reports dashboard
export const getAlumniAnalytics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view analytics",
      });
    }

    const userId = (alumniProfile.userId as any)?._id || alumniProfile.userId;
    const userIdObjectId = new mongoose.Types.ObjectId(userId.toString());
    const alumniProfileId = alumniProfile._id.toString();

    // Get counts for all activity types
    const [
      donationCount,
      eventCount,
      messageCount,
      jobsPostedCount,
      jobsAppliedCount,
      notesCount,
      openIssuesCount,
      totalIssuesCount,
    ] = await Promise.all([
      Donation.countDocuments({
        donor: userIdObjectId,
        paymentStatus: { $in: ["completed", "successful"] },
      }),
      Event.countDocuments({
        $or: [
          { "attendees.userId": userIdObjectId },
          { "registrations.userId": userIdObjectId },
        ],
      }),
      Message.countDocuments({
        $or: [
          { sender: userIdObjectId },
          { recipient: userIdObjectId },
        ],
      }),
      JobPost.countDocuments({ postedBy: userIdObjectId }),
      JobApplication.countDocuments({ applicantId: userIdObjectId }),
      AlumniNote.countDocuments({ alumniId: alumniProfileId }),
      AlumniIssue.countDocuments({
        alumniId: alumniProfileId,
        status: { $in: ["open", "in_progress"] },
      }),
      AlumniIssue.countDocuments({ alumniId: alumniProfileId }),
    ]);

    // Calculate total activities
    const totalActivities =
      donationCount +
      eventCount +
      messageCount +
      jobsPostedCount +
      jobsAppliedCount +
      notesCount +
      totalIssuesCount;

    // Get engagement metrics
    const donationStats = await Donation.aggregate([
      {
        $match: {
          donor: userIdObjectId,
          paymentStatus: { $in: ["completed", "successful"] },
        },
      },
      {
        $group: {
          _id: null,
          totalDonated: { $sum: "$amount" },
          donationCount: { $sum: 1 },
        },
      },
    ]);

    const eventStats = await Event.aggregate([
      {
        $match: {
          $or: [
            { "attendees.userId": userIdObjectId },
            { "registrations.userId": userIdObjectId },
          ],
        },
      },
      {
        $group: {
          _id: null,
          eventsAttended: { $sum: 1 },
        },
      },
    ]);

    const messageStats = await Message.countDocuments({
      $or: [
        { sender: userIdObjectId },
        { recipient: userIdObjectId },
      ],
    });

    // Calculate engagement score
    let engagementScore = 0;
    if (donationStats[0]?.donationCount > 0) engagementScore += 30;
    if (donationStats[0]?.totalDonated > 10000) engagementScore += 20;
    if (eventStats[0]?.eventsAttended > 0) engagementScore += 25;
    if (eventStats[0]?.eventsAttended > 5) engagementScore += 10;
    if (messageStats > 0) engagementScore += 10;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivityCount = await Promise.all([
      Donation.countDocuments({
        donor: userIdObjectId,
        createdAt: { $gte: thirtyDaysAgo },
        paymentStatus: { $in: ["completed", "successful"] },
      }),
      Event.countDocuments({
        $or: [
          { "attendees.userId": userIdObjectId },
          { "registrations.userId": userIdObjectId },
        ],
        startDate: { $gte: thirtyDaysAgo },
      }),
      Message.countDocuments({
        $or: [
          { sender: userIdObjectId },
          { recipient: userIdObjectId },
        ],
        createdAt: { $gte: thirtyDaysAgo },
      }),
    ]).then((counts) => counts.reduce((sum, count) => sum + count, 0));

    // Calculate activity breakdown percentages
    const activityBreakdown = [
      {
        name: "Donations",
        value: donationCount,
        count: donationCount,
      },
      {
        name: "Events",
        value: eventCount,
        count: eventCount,
      },
      {
        name: "Messages",
        value: messageCount,
        count: messageCount,
      },
      {
        name: "Jobs",
        value: jobsPostedCount + jobsAppliedCount,
        count: jobsPostedCount + jobsAppliedCount,
      },
      {
        name: "Notes",
        value: notesCount,
        count: notesCount,
      },
      {
        name: "Issues",
        value: totalIssuesCount,
        count: totalIssuesCount,
      },
    ]
      .filter((item) => item.count > 0)
      .map((item) => ({
        ...item,
        value: totalActivities > 0 ? Math.round((item.count / totalActivities) * 100) : 0,
      }));

    // Calculate engagement status distribution
    const engagementStatus = [
      {
        status: "High Engagement",
        count: engagementScore >= 80 ? 1 : 0,
      },
      {
        status: "Medium Engagement",
        count: engagementScore >= 50 && engagementScore < 80 ? 1 : 0,
      },
      {
        status: "Low Engagement",
        count: engagementScore > 0 && engagementScore < 50 ? 1 : 0,
      },
      {
        status: "Inactive",
        count: engagementScore === 0 ? 1 : 0,
      },
    ];

    const summaryStats = {
      totalActivities,
      engagementScore: Math.min(engagementScore, 100),
      activeInteractions: recentActivityCount,
      pendingItems: openIssuesCount,
    };

    return res.json({
      success: true,
      data: {
        summaryStats,
        activityBreakdown,
        engagementStatus,
      },
    });
  } catch (error) {
    logger.error("Get alumni analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alumni analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get engagement metrics
export const getEngagementMetrics = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Find alumni profile and check access
    const alumniProfile = await findAlumniProfile(id);
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    if (!checkAccess(req, alumniProfile)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to view engagement metrics",
      });
    }

    const userId = (alumniProfile.userId as any)?._id || alumniProfile.userId;
    const userIdString = userId.toString();

    // Calculate metrics (same logic as in getAlumni360Data)
    const [donationStats, eventStats, messageCount] = await Promise.all([
      Donation.aggregate([
        {
          $match: {
            donor: new mongoose.Types.ObjectId(userIdString),
            paymentStatus: { $in: ["completed", "successful"] },
          },
        },
        {
          $group: {
            _id: null,
            totalDonated: { $sum: "$amount" },
            donationCount: { $sum: 1 },
            lastDonationDate: { $max: "$createdAt" },
          },
        },
      ]),
      Event.aggregate([
        {
          $match: {
            $or: [
              { "attendees.userId": new mongoose.Types.ObjectId(userIdString) },
              { "registrations.userId": new mongoose.Types.ObjectId(userIdString) },
            ],
          },
        },
        {
          $group: {
            _id: null,
            eventsAttended: { $sum: 1 },
            lastEventDate: { $max: "$startDate" },
          },
        },
      ]),
      Message.countDocuments({
        $or: [
          { sender: userId },
          { recipient: userId },
        ],
      }),
    ]);

    const lastMessage = await Message.findOne({
      $or: [
        { sender: userId },
        { recipient: userId },
      ],
    }).sort({ createdAt: -1 });

    const lastInteraction = lastMessage
      ? lastMessage.createdAt
      : eventStats[0]?.lastEventDate || null;

    // Calculate engagement score
    let engagementScore = 0;
    if (donationStats[0]?.donationCount > 0) engagementScore += 30;
    if (donationStats[0]?.totalDonated > 10000) engagementScore += 20;
    if (eventStats[0]?.eventsAttended > 0) engagementScore += 25;
    if (eventStats[0]?.eventsAttended > 5) engagementScore += 10;
    if (messageCount > 0) engagementScore += 10;
    if (lastInteraction && 
        (new Date().getTime() - new Date(lastInteraction).getTime()) < 90 * 24 * 60 * 60 * 1000) {
      engagementScore += 5;
    }

    const engagementMetrics = {
      score: Math.min(engagementScore, 100),
      totalDonated: donationStats[0]?.totalDonated || 0,
      donationCount: donationStats[0]?.donationCount || 0,
      lastDonationDate: donationStats[0]?.lastDonationDate || null,
      eventsAttended: eventStats[0]?.eventsAttended || 0,
      lastEventDate: eventStats[0]?.lastEventDate || null,
      lastInteraction: lastInteraction,
      messageCount: messageCount,
    };

    return res.json({
      success: true,
      data: { engagementMetrics },
    });
  } catch (error) {
    logger.error("Get engagement metrics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch engagement metrics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

