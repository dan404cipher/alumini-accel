import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import MentoringProgram from "../models/MentoringProgram";
import { logger } from "../utils/logger";

// Select alumni for invitation (with filters)
export const selectAlumniForInvitation = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      graduationYear,
      department,
      industry,
      company,
      location,
      search,
      page = 1,
      limit = 50,
    } = req.query;
    
    // Get tenantId - handle both super admin and regular users
    let tenantId = req.tenantId;
    if (!tenantId && req.user?.tenantId) {
      tenantId = req.user.tenantId.toString();
    }
    
    // Super admin can access all, but regular admins need tenantId
    if (!tenantId && req.user?.role !== "super_admin") {
      return res.status(400).json({
        success: false,
        message: "Tenant ID is required",
      });
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query for alumni users
    // Note: We don't filter by status to match the College Admin Dashboard behavior
    // which shows all alumni regardless of status
    const userQuery: any = {
      role: "alumni",
    };
    
    // Add tenantId filter only if not super admin
    if (tenantId && req.user?.role !== "super_admin") {
      userQuery.tenantId = tenantId;
    }

    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // Build alumni profile query
    const profileQuery: any = {};

    if (graduationYear && graduationYear !== "") {
      const year = parseInt(graduationYear as string);
      if (!isNaN(year)) {
        profileQuery.graduationYear = year;
      }
    }

    if (department && department !== "") {
      profileQuery.department = { $regex: department, $options: "i" };
    }

    if (industry && industry !== "") {
      profileQuery.industry = { $regex: industry, $options: "i" };
    }

    if (company && company !== "") {
      profileQuery.currentCompany = { $regex: company, $options: "i" };
    }

    if (location && location !== "") {
      profileQuery.location = { $regex: location, $options: "i" };
    }

    // Get alumni profiles matching criteria
    let matchingProfileIds: any[] = [];
    if (Object.keys(profileQuery).length > 0) {
      const profiles = await AlumniProfile.find(profileQuery).select("_id");
      matchingProfileIds = profiles.map((p) => p._id);
    }

    // Update user query if profile filters exist
    if (matchingProfileIds.length > 0) {
      userQuery.alumniProfile = { $in: matchingProfileIds };
    } else if (Object.keys(profileQuery).length > 0 && matchingProfileIds.length === 0) {
      // No profiles match the criteria
      return res.json({
        success: true,
        data: {
          alumni: [],
          pagination: {
            page: pageNum,
            limit: limitNum,
            total: 0,
            totalPages: 0,
          },
        },
      });
    }

    // Get users with populated profiles
    // Note: We include users even if they don't have alumniProfile yet
    const users = await User.find(userQuery)
      .populate({
        path: "alumniProfile",
        options: { strictPopulate: false }, // Allow null profiles
      })
      .select("-password")
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(userQuery);

    // Format response
    const alumni = users.map((user: any) => {
      const profile = user.alumniProfile || {};
      return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        graduationYear: profile.graduationYear || null,
        department: profile.department || null,
        industry: profile.industry || null,
        currentCompany: profile.currentCompany || null,
        currentPosition: profile.currentPosition || null,
        location: profile.location || null,
        preferredName: profile.preferredName || `${user.firstName} ${user.lastName}`,
        profile: profile._id || null,
      };
    });

    return res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error: any) {
    logger.error("Select alumni for invitation error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch alumni list",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Send bulk mentor invitations
export const sendBulkMentorInvitations = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId, alumniIds, templateId } = req.body;
    const tenantId = req.tenantId;

    if (!programId || !alumniIds || !Array.isArray(alumniIds)) {
      return res.status(400).json({
        success: false,
        message: "Program ID and alumni IDs are required",
      });
    }

    // This will use the emailTemplateController.sendMentorInvitations
    // For now, return a response indicating the request was received
    return res.json({
      success: true,
      message:
        "Bulk invitation request received. Use /email-templates/:programId/send-mentor-invitations endpoint.",
      data: {
        programId,
        alumniCount: alumniIds.length,
      },
    });
  } catch (error) {
    logger.error("Send bulk invitations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process bulk invitation request",
    });
  }
};

// Export invitation list for external email tools
export const exportInvitationList = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { programId, alumniIds } = req.query;
    const tenantId = req.tenantId;

    if (!programId) {
      return res.status(400).json({
        success: false,
        message: "Program ID is required",
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

    // Get alumni
    const alumniIdArray = alumniIds
      ? (alumniIds as string).split(",")
      : [];
    const users = await User.find({
      _id: alumniIdArray.length > 0 ? { $in: alumniIdArray } : {},
      role: "alumni",
      tenantId,
    }).populate("alumniProfile");

    // Generate registration links
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:8080";
    const exportData = users.map((user: any) => {
      const profile = user.alumniProfile || {};
      const registrationLink = `${frontendUrl}/mentor-registration?programId=${programId}`;

      return {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferredName: profile.preferredName || `${user.firstName} ${user.lastName}`,
        graduationYear: profile.graduationYear,
        department: profile.department,
        company: profile.currentCompany,
        registrationLink: registrationLink,
        programName: program.name,
      };
    });

    // Return as CSV-ready format (can be converted on frontend)
    return res.json({
      success: true,
      data: {
        exportData,
        format: "csv",
        headers: [
          "Email",
          "First Name",
          "Last Name",
          "Preferred Name",
          "Graduation Year",
          "Department",
          "Company",
          "Registration Link",
          "Program Name",
        ],
      },
    });
  } catch (error) {
    logger.error("Export invitation list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to export invitation list",
    });
  }
};

