import { Request, Response } from "express";
import StudentProfile from "@/models/StudentProfile";
import User from "@/models/User";
import { UserRole } from "@/types";
import { logger } from "@/utils/logger";

// Get all student profiles
export const getAllStudentProfiles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      university,
      department,
      batchYear,
      skills,
      careerInterests,
    } = req.query;

    const query: any = {};

    // Search functionality
    if (search) {
      query.$or = [
        { university: { $regex: search, $options: "i" } },
        { department: { $regex: search, $options: "i" } },
        { program: { $regex: search, $options: "i" } },
        { skills: { $in: [new RegExp(search as string, "i")] } },
        { careerInterests: { $in: [new RegExp(search as string, "i")] } },
      ];
    }

    // Filter by university
    if (university) {
      query.university = { $regex: university, $options: "i" };
    }

    // Filter by department
    if (department) {
      query.department = { $regex: department, $options: "i" };
    }

    // Filter by batch year
    if (batchYear) {
      query.batchYear = parseInt(batchYear as string);
    }

    // Filter by skills
    if (skills) {
      const skillArray = (skills as string).split(",");
      query.skills = {
        $in: skillArray.map((skill) => new RegExp(skill.trim(), "i")),
      };
    }

    // Filter by career interests
    if (careerInterests) {
      const interestArray = (careerInterests as string).split(",");
      query.careerInterests = {
        $in: interestArray.map((interest) => new RegExp(interest.trim(), "i")),
      };
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [profiles, total] = await Promise.all([
      StudentProfile.find(query)
        .populate("userId", "firstName lastName email profilePicture role")
        .skip(skip)
        .limit(parseInt(limit as string))
        .sort({ createdAt: -1 }),
      StudentProfile.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: {
        profiles,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error("Get all student profiles error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student profiles",
    });
  }
};

// Get student profile by ID
export const getStudentProfileById = async (req: Request, res: Response) => {
  try {
    const profile = await StudentProfile.findOne({
      userId: req.params.id,
    }).populate(
      "userId",
      "firstName lastName email profilePicture role university"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.json({
      success: true,
      data: { profile },
    });
  } catch (error) {
    logger.error("Get student profile by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student profile",
    });
  }
};

// Create student profile
export const createStudentProfile = async (req: Request, res: Response) => {
  try {
    const {
      university,
      department,
      program,
      batchYear,
      graduationYear,
      rollNumber,
      studentId,
      currentYear,
      currentCGPA,
      currentGPA,
      skills,
      interests,
      careerInterests,
      preferredJobLocation,
      preferredJobTypes,
      expectedSalary,
      linkedinProfile,
      githubProfile,
      portfolioUrl,
      twitterHandle,
      otherSocialHandles,
      isAvailableForInternships,
      isAvailableForProjects,
      isAvailableForMentorship,
      mentorshipDomains,
      resumeUrl,
      coverLetterUrl,
    } = req.body;

    // Check if user already has a student profile
    const existingProfile = await StudentProfile.findOne({
      userId: req.user.id,
    });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Student profile already exists",
      });
    }

    // Check if user is a student
    const user = await User.findById(req.user.id);
    if (!user || user.role !== UserRole.STUDENT) {
      return res.status(400).json({
        success: false,
        message: "Only students can create student profiles",
      });
    }

    const studentProfile = new StudentProfile({
      userId: req.user.id,
      university,
      department,
      program,
      batchYear,
      graduationYear,
      rollNumber,
      studentId,
      currentYear,
      currentCGPA,
      currentGPA,
      skills: skills || [],
      interests: interests || [],
      careerInterests: careerInterests || [],
      preferredJobLocation: preferredJobLocation || [],
      preferredJobTypes: preferredJobTypes || [],
      expectedSalary,
      linkedinProfile,
      githubProfile,
      portfolioUrl,
      twitterHandle,
      otherSocialHandles: otherSocialHandles || [],
      isAvailableForInternships: isAvailableForInternships ?? true,
      isAvailableForProjects: isAvailableForProjects ?? true,
      isAvailableForMentorship: isAvailableForMentorship ?? false,
      mentorshipDomains: mentorshipDomains || [],
      resumeUrl,
      coverLetterUrl,
    });

    await studentProfile.save();

    // Update user's university field
    if (university) {
      await User.findByIdAndUpdate(req.user.id, { university });
    }

    return res.status(201).json({
      success: true,
      message: "Student profile created successfully",
      data: { studentProfile },
    });
  } catch (error) {
    logger.error("Create student profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create student profile",
    });
  }
};

// Update student profile
export const updateStudentProfile = async (req: Request, res: Response) => {
  try {
    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Update allowed fields
    const allowedFields = [
      "university",
      "department",
      "program",
      "batchYear",
      "graduationYear",
      "rollNumber",
      "studentId",
      "currentYear",
      "currentCGPA",
      "currentGPA",
      "skills",
      "interests",
      "careerInterests",
      "preferredJobLocation",
      "preferredJobTypes",
      "expectedSalary",
      "linkedinProfile",
      "githubProfile",
      "portfolioUrl",
      "twitterHandle",
      "otherSocialHandles",
      "isAvailableForInternships",
      "isAvailableForProjects",
      "isAvailableForMentorship",
      "mentorshipDomains",
      "resumeUrl",
      "coverLetterUrl",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        (profile as any)[field] = req.body[field];
      }
    });

    await profile.save();

    // Update user's university field if changed
    if (req.body.university) {
      await User.findByIdAndUpdate(req.user.id, {
        university: req.body.university,
      });
    }

    return res.json({
      success: true,
      message: "Student profile updated successfully",
      data: { profile },
    });
  } catch (error) {
    logger.error("Update student profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update student profile",
    });
  }
};

// Add project to student profile
export const addProject = async (req: Request, res: Response) => {
  try {
    console.log("Add project request:", {
      userId: req.user?.id,
      body: req.body,
    });

    const {
      title,
      description,
      technologies,
      startDate,
      endDate,
      isOngoing,
      githubUrl,
      liveUrl,
      teamMembers,
    } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    console.log("Found profile:", !!profile);

    if (!profile) {
      // Create a basic student profile if one doesn't exist
      profile = new StudentProfile({
        userId: req.user.id,
        university: "Not specified",
        department: "Not specified",
        program: "Not specified",
        batchYear: new Date().getFullYear(),
        graduationYear: new Date().getFullYear() + 4,
        rollNumber: "Not specified",
        currentYear: "1st Year",
        // Don't initialize any arrays - let them be undefined initially
        // This prevents validation errors on empty arrays
        isAvailableForInternships: true,
        isAvailableForProjects: true,
        isAvailableForMentorship: false,
      });
      await profile.save();
      console.log("Created new student profile");
    }

    // Validate team members
    if (!teamMembers || teamMembers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one team member is required",
      });
    }

    const project = {
      title,
      description,
      technologies: technologies || [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOngoing: isOngoing || false,
      githubUrl,
      liveUrl,
      teamMembers: teamMembers || [],
    };

    profile.projects.push(project);
    await profile.save();

    return res.json({
      success: true,
      message: "Project added successfully",
      data: { project },
    });
  } catch (error) {
    console.error("Add project error:", error);
    logger.error("Add project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add project",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update project in student profile
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const projectIndex = profile.projects.findIndex(
      (p) => p._id?.toString() === projectId
    );
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Update project fields
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        if (key === "startDate" || key === "endDate") {
          (profile.projects[projectIndex] as any)[key] = new Date(
            updateData[key]
          );
        } else {
          (profile.projects[projectIndex] as any)[key] = updateData[key];
        }
      }
    });

    await profile.save();

    return res.json({
      success: true,
      message: "Project updated successfully",
      data: { project: profile.projects[projectIndex] },
    });
  } catch (error) {
    logger.error("Update project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// Delete project from student profile
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const projectIndex = profile.projects.findIndex(
      (p) => p._id?.toString() === projectId
    );
    if (projectIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    profile.projects.splice(projectIndex, 1);
    await profile.save();

    return res.json({
      success: true,
      message: "Project deleted successfully",
    });
  } catch (error) {
    logger.error("Delete project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

// Add internship experience
export const addInternshipExperience = async (req: Request, res: Response) => {
  try {
    console.log("Add internship request:", {
      userId: req.user?.id,
      body: req.body,
      file: req.file,
    });

    const {
      company,
      position,
      description,
      startDate,
      endDate,
      isOngoing,
      location,
      isRemote,
      stipendAmount,
      stipendCurrency,
      skills,
    } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Create a basic student profile if one doesn't exist
      profile = new StudentProfile({
        userId: req.user.id,
        university: "Not specified",
        department: "Not specified",
        program: "Not specified",
        batchYear: new Date().getFullYear(),
        graduationYear: new Date().getFullYear() + 4,
        rollNumber: "Not specified",
        currentYear: "1st Year",
        // Don't initialize any arrays - let them be undefined initially
        // This prevents validation errors on empty arrays
        isAvailableForInternships: true,
        isAvailableForProjects: true,
        isAvailableForMentorship: false,
      });
      await profile.save();
      console.log("Created new student profile for internship");
    } else {
      console.log(
        "Found existing profile with projects:",
        profile.projects?.length || 0
      );
      if (profile.projects && profile.projects.length > 0) {
        console.log(
          "Projects details:",
          profile.projects.map((p) => ({
            title: p.title,
            githubUrl: p.githubUrl,
            teamMembers: p.teamMembers?.length || 0,
          }))
        );

        // Clean up invalid projects that don't have required fields
        const validProjects = profile.projects.filter((project) => {
          return (
            project.githubUrl &&
            project.teamMembers &&
            project.teamMembers.length > 0
          );
        });

        if (validProjects.length !== profile.projects.length) {
          console.log(
            `Cleaning up ${profile.projects.length - validProjects.length} invalid projects`
          );
          profile.projects = validProjects;
          await profile.save();
        }
      }
    }

    // Handle file upload
    let certificateUrl = "";
    if (req.file) {
      certificateUrl = `/uploads/documents/${req.file.filename}`;
    }

    // Parse skills if it's a string
    let skillsArray = [];
    if (skills) {
      try {
        skillsArray = typeof skills === "string" ? JSON.parse(skills) : skills;
      } catch (e) {
        skillsArray = [];
      }
    }

    // Handle stipend
    let stipend = undefined;
    if (stipendAmount) {
      stipend = {
        amount: parseFloat(stipendAmount),
        currency: stipendCurrency || "USD",
      };
    }

    const internship = {
      company,
      position,
      description,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOngoing: isOngoing === "true" || isOngoing === true,
      location,
      isRemote: isRemote === "true" || isRemote === true,
      stipend,
      skills: skillsArray,
      certificateUrl,
    };

    profile.internshipExperience.push(internship);
    await profile.save();

    return res.json({
      success: true,
      message: "Internship experience added successfully",
      data: { internship },
    });
  } catch (error) {
    console.error("Add internship experience error:", error);
    logger.error("Add internship experience error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add internship experience",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Add research work
export const addResearchWork = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      supervisor,
      startDate,
      endDate,
      isOngoing,
      status,
      keywords,
    } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Create a basic student profile if one doesn't exist
      profile = new StudentProfile({
        userId: req.user.id,
        university: "Not specified",
        department: "Not specified",
        program: "Not specified",
        batchYear: new Date().getFullYear(),
        graduationYear: new Date().getFullYear() + 4,
        rollNumber: "Not specified",
        currentYear: "1st Year",
        // Don't initialize any arrays - let them be undefined initially
        // This prevents validation errors on empty arrays
        isAvailableForInternships: true,
        isAvailableForProjects: true,
        isAvailableForMentorship: false,
      });
      await profile.save();
      console.log("Created new student profile for research work");
    }

    // Handle file uploads
    let publicationUrl = "";
    let conferenceUrl = "";

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.publicationFile && files.publicationFile[0]) {
        publicationUrl = `/uploads/documents/${files.publicationFile[0].filename}`;
      }

      if (files.conferenceFile && files.conferenceFile[0]) {
        conferenceUrl = `/uploads/documents/${files.conferenceFile[0].filename}`;
      }
    }

    // Parse keywords if it's a string
    let keywordsArray = [];
    if (keywords) {
      try {
        keywordsArray =
          typeof keywords === "string" ? JSON.parse(keywords) : keywords;
      } catch (e) {
        keywordsArray = [];
      }
    }

    const research = {
      title,
      description,
      supervisor,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOngoing: isOngoing === "true" || isOngoing === true,
      publicationUrl,
      conferenceUrl,
      status: status || "ongoing",
      keywords: keywordsArray,
    };

    profile.researchWork.push(research);
    await profile.save();

    return res.json({
      success: true,
      message: "Research work added successfully",
      data: { research },
    });
  } catch (error) {
    logger.error("Add research work error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add research work",
    });
  }
};

// Add certification
export const addCertification = async (req: Request, res: Response) => {
  try {
    const { name, issuer, date, credentialId } = req.body;

    let profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      // Create a basic student profile if one doesn't exist
      profile = new StudentProfile({
        userId: req.user.id,
        university: "Not specified",
        department: "Not specified",
        program: "Not specified",
        batchYear: new Date().getFullYear(),
        graduationYear: new Date().getFullYear() + 4,
        rollNumber: "Not specified",
        currentYear: "1st Year",
        // Don't initialize any arrays - let them be undefined initially
        // This prevents validation errors on empty arrays
        isAvailableForInternships: true,
        isAvailableForProjects: true,
        isAvailableForMentorship: false,
      });
      await profile.save();
      console.log("Created new student profile for certification");
    }

    // Handle file upload
    let credentialUrl = "";
    if (req.file) {
      credentialUrl = `/uploads/documents/${req.file.filename}`;
    }

    const certification = {
      name,
      issuer,
      date: new Date(date),
      credentialId,
      credentialUrl,
    };

    profile.certifications.push(certification);
    await profile.save();

    return res.json({
      success: true,
      message: "Certification added successfully",
      data: { certification },
    });
  } catch (error) {
    logger.error("Add certification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add certification",
    });
  }
};

// Send connection request
export const sendConnectionRequest = async (req: Request, res: Response) => {
  try {
    const { targetUserId, message } = req.body;

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot send connection request to yourself",
      });
    }

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Check if connection request already exists
    const existingRequest = profile.connectionRequests.find(
      (req) => req.userId.toString() === targetUserId
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: "Connection request already sent",
      });
    }

    // Check if already connected
    if (profile.connections.includes(targetUserId)) {
      return res.status(400).json({
        success: false,
        message: "Already connected to this user",
      });
    }

    profile.connectionRequests.push({
      userId: targetUserId,
      status: "pending",
      requestedAt: new Date(),
      message,
    });

    await profile.save();

    return res.json({
      success: true,
      message: "Connection request sent successfully",
    });
  } catch (error) {
    logger.error("Send connection request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send connection request",
    });
  }
};

// Respond to connection request
export const respondToConnectionRequest = async (
  req: Request,
  res: Response
) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'accepted' or 'rejected'",
      });
    }

    const profile = await StudentProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const connectionRequestIndex = profile.connectionRequests.findIndex(
      (cr) => cr._id?.toString() === requestId
    );
    if (connectionRequestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Connection request not found",
      });
    }

    profile.connectionRequests[connectionRequestIndex].status = status;
    profile.connectionRequests[connectionRequestIndex].respondedAt = new Date();

    if (status === "accepted") {
      profile.connections.push(
        profile.connectionRequests[connectionRequestIndex].userId
      );
    }

    await profile.save();

    return res.json({
      success: true,
      message: `Connection request ${status} successfully`,
    });
  } catch (error) {
    logger.error("Respond to connection request error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to respond to connection request",
    });
  }
};

// Get connection requests
export const getConnectionRequests = async (req: Request, res: Response) => {
  try {
    const profile = await StudentProfile.findOne({
      userId: req.user.id,
    }).populate(
      "connectionRequests.userId",
      "firstName lastName email profilePicture"
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    return res.json({
      success: true,
      data: {
        sent: profile.connectionRequests.filter(
          (req) => req.status === "pending"
        ),
        received: profile.connectionRequests.filter(
          (req) => req.status === "pending"
        ),
        accepted: profile.connections,
      },
    });
  } catch (error) {
    logger.error("Get connection requests error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch connection requests",
    });
  }
};

// Get student profile statistics
export const getStudentProfileStats = async (req: Request, res: Response) => {
  try {
    const totalStudents = await StudentProfile.countDocuments();
    const studentsByYear = await StudentProfile.aggregate([
      {
        $group: {
          _id: "$currentYear",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const studentsByUniversity = await StudentProfile.aggregate([
      {
        $group: {
          _id: "$university",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const topSkills = await StudentProfile.aggregate([
      { $unwind: "$skills" },
      {
        $group: {
          _id: "$skills",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    return res.json({
      success: true,
      data: {
        totalStudents,
        studentsByYear,
        studentsByUniversity,
        topSkills,
      },
    });
  } catch (error) {
    logger.error("Get student profile stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch student profile statistics",
    });
  }
};

export default {
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
};
