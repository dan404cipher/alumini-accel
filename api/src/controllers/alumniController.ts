import { Request, Response } from "express";
import AlumniProfile from "../models/AlumniProfile";
import User from "../models/User";
import { logger } from "../utils/logger";
import { UserRole } from "../types";

// Get all alumni directory
export const getAllUsersDirectory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    // Build filter for alumni only
    const userFilter: any = {
      role: UserRole.ALUMNI,
    };

    // 🔒 MULTI-TENANT FILTERING: Only show alumni from same college (unless super admin)
    if (req.query.tenantId) {
      userFilter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      userFilter.tenantId = req.user.tenantId;
    }

    // Get all users
    const users = await User.find(userFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await User.countDocuments(userFilter);

    // Get profiles for all users
    const alumniProfiles = await AlumniProfile.find({
      userId: { $in: users.map((u) => u._id) },
    }).populate(
      "userId",
      "firstName lastName email profilePicture role bio location linkedinProfile githubProfile website"
    );

    // Debug: Log alumni profiles found
    console.log("Found alumni profiles:", alumniProfiles.length);
    console.log(
      "Alumni profiles data:",
      alumniProfiles.map((p) => ({
        userId: p.userId,
        graduationYear: p.graduationYear,
        currentCompany: p.currentCompany,
        currentPosition: p.currentPosition,
        experience: p.experience,
      }))
    );

    // Create maps for quick lookup
    const alumniMap = new Map();
    alumniProfiles.forEach((profile: any) => {
      // Handle both populated and non-populated userId
      const userId = profile.userId._id
        ? profile.userId._id.toString()
        : profile.userId.toString();
      alumniMap.set(userId, profile);
    });

    // Format the response
    const formattedUsers = users.map((user) => {
      const baseUser = {
        id: user._id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profileImage: user.profilePicture,
        role: user.role,
        phone: user.phone,
        bio: user.bio,
        location: user.location,
        linkedinProfile: user.linkedinProfile,
        githubProfile: user.githubProfile,
        website: user.website,
        createdAt: user.createdAt,
        skills: [],
        careerInterests: [],
        isHiring: false,
        availableForMentorship: false,
        mentorshipDomains: [],
        achievements: [],
      };

      // Add profile-specific data
      if (user.role === UserRole.ALUMNI) {
        const profile = alumniMap.get(user._id.toString());
        console.log(`User ${user.firstName} ${user.lastName} (${user._id}):`, {
          hasProfile: !!profile,
          profileData: profile
            ? {
                graduationYear: profile.graduationYear,
                currentCompany: profile.currentCompany,
                currentPosition: profile.currentPosition,
                experience: profile.experience,
              }
            : null,
        });
        if (profile) {
          return {
            ...baseUser,
            graduationYear: profile.graduationYear,
            batchYear: profile.batchYear,
            department: profile.department,
            specialization: profile.specialization,
            currentRole: profile.currentPosition,
            company: profile.currentCompany,
            currentLocation: profile.currentLocation,
            experience: profile.experience,
            skills: profile.skills || [],
            careerInterests: profile.careerInterests || [],
            isHiring: profile.isHiring,
            availableForMentorship: profile.availableForMentorship,
            mentorshipDomains: profile.mentorshipDomains || [],
            achievements: profile.achievements || [],
          };
        }
      }

      return baseUser;
    });

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all users directory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users directory",
    });
  }
};

// Get public alumni directory data (no authentication required)
export const getPublicAlumniDirectory = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters
    if (req.query.batchYear)
      filter.batchYear = parseInt(req.query.batchYear as string);
    if (req.query.department)
      filter.department = { $regex: req.query.department, $options: "i" };
    if (req.query.isHiring) filter.isHiring = req.query.isHiring === "true";
    if (req.query.availableForMentorship)
      filter.availableForMentorship =
        req.query.availableForMentorship === "true";
    if (req.query.location)
      filter.currentLocation = { $regex: req.query.location, $options: "i" };

    const alumni = await AlumniProfile.find(filter)
      .populate({
        path: "user",
        select: "firstName lastName email profilePicture role",
        match: { role: UserRole.ALUMNI },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out any alumni profiles where the user is not an alumni
    const validAlumni = alumni.filter((alumnus) => (alumnus as any).user);

    // Get total count of alumni profiles with alumni role
    const total = await AlumniProfile.aggregate([
      { $match: filter },
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $match: { "user.role": UserRole.ALUMNI } },
      { $count: "total" },
    ]);

    const totalCount = total.length > 0 ? total[0].total : 0;

    // Return only public information
    const publicAlumni = validAlumni.map((alumnus) => ({
      id: alumnus._id,
      name: `${(alumnus as any).user.firstName} ${(alumnus as any).user.lastName}`,
      email: (alumnus as any).user.email,
      profileImage: (alumnus as any).user.profilePicture,
      graduationYear: alumnus.graduationYear,
      batchYear: alumnus.batchYear,
      department: alumnus.department,
      specialization: alumnus.specialization,
      currentRole: alumnus.currentPosition,
      company: alumnus.currentCompany,
      location: alumnus.currentLocation,
      experience: alumnus.experience,
      skills: alumnus.skills,
      isHiring: alumnus.isHiring,
      availableForMentorship: alumnus.availableForMentorship,
      mentorshipDomains: alumnus.mentorshipDomains,
      achievements: alumnus.achievements,
      bio: (alumnus as any).bio,
      linkedinProfile: (alumnus as any).linkedinProfile,
      githubProfile: (alumnus as any).githubProfile,
      website: (alumnus as any).website,
      createdAt: alumnus.createdAt,
    }));

    res.json({
      success: true,
      data: {
        alumni: publicAlumni,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get public alumni directory error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumni directory",
    });
  }
};

// Get all alumni profiles
export const getAllAlumni = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build user filter for multi-tenant filtering
    const userFilter: any = {
      role: UserRole.ALUMNI,
    };

    // 🔒 MULTI-TENANT FILTERING: Only show alumni from same college (unless super admin)
    if (req.query.tenantId) {
      userFilter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      userFilter.tenantId = req.user.tenantId;
    }

    // Get alumni users first
    const alumniUsers = await User.find(userFilter)
      .select("_id firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of alumni users
    const totalUsers = await User.countDocuments(userFilter);

    // Get alumni profiles for these users
    const alumniProfileFilter: any = {
      userId: { $in: alumniUsers.map((user) => user._id) },
    };

    // Apply additional filters to alumni profiles
    if (req.query.batchYear)
      alumniProfileFilter.batchYear = parseInt(req.query.batchYear as string);
    if (req.query.department)
      alumniProfileFilter.department = {
        $regex: req.query.department,
        $options: "i",
      };
    if (req.query.isHiring)
      alumniProfileFilter.isHiring = req.query.isHiring === "true";
    if (req.query.availableForMentorship)
      alumniProfileFilter.availableForMentorship =
        req.query.availableForMentorship === "true";
    if (req.query.location)
      alumniProfileFilter.currentLocation = {
        $regex: req.query.location,
        $options: "i",
      };

    const alumniProfiles = await AlumniProfile.find(alumniProfileFilter)
      .populate("userId", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 });

    // Create a map for quick lookup
    const profileMap = new Map();
    alumniProfiles.forEach((profile: any) => {
      profileMap.set(profile.userId._id.toString(), profile);
    });

    // Combine user data with profile data
    const alumni = alumniUsers.map((user) => {
      const profile = profileMap.get(user._id.toString());
      return {
        _id: profile?._id || user._id,
        userId: user,
        user: user, // For backward compatibility
        ...profile?.toObject(),
      };
    });

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get all alumni error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumni",
    });
  }
};

// Get alumni profile by ID
export const getAlumniById = async (req: Request, res: Response) => {
  try {
    const alumni = await AlumniProfile.findById(req.params.id).populate(
      "user",
      "firstName lastName email profilePicture bio location linkedinProfile twitterHandle githubProfile website"
    );

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    return res.json({
      success: true,
      data: { alumni },
    });
  } catch (error) {
    logger.error("Get alumni by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch alumni profile",
    });
  }
};

// Create alumni profile
export const createProfile = async (req: Request, res: Response) => {
  try {
    const {
      university,
      program,
      batchYear,
      graduationYear,
      department,
      specialization,
      rollNumber,
      studentId,
      currentCompany,
      currentPosition,
      currentLocation,
      experience,
      salary,
      currency,
      skills,
      achievements,
      certifications,
      education,
      careerTimeline,
      isHiring,
      availableForMentorship,
      mentorshipDomains,
      availableSlots,
      testimonials,
      photos,
    } = req.body;

    // Check if user already has an alumni profile
    const existingProfile = await AlumniProfile.findOne({
      userId: req.user.id,
    });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: "Alumni profile already exists",
      });
    }

    const alumniProfile = new AlumniProfile({
      userId: req.user.id,
      university,
      program,
      batchYear,
      graduationYear,
      department,
      specialization,
      rollNumber,
      studentId,
      currentCompany,
      currentPosition,
      currentLocation,
      experience: experience || 0,
      salary,
      currency,
      skills: skills || [],
      achievements: achievements || [],
      certifications: certifications || [],
      education: education || [],
      careerTimeline: careerTimeline || [],
      isHiring: isHiring || false,
      availableForMentorship: availableForMentorship || false,
      mentorshipDomains: mentorshipDomains || [],
      availableSlots: availableSlots || [],
      testimonials: testimonials || [],
      photos: photos || [],
    });

    await alumniProfile.save();

    // Update user role to alumni if not already
    await User.findByIdAndUpdate(req.user.id, { role: UserRole.ALUMNI });

    return res.status(201).json({
      success: true,
      message: "Alumni profile created successfully",
      data: { alumniProfile },
    });
  } catch (error) {
    logger.error("Create alumni profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create alumni profile",
    });
  }
};

// Register as mentor
export const registerAsMentor = async (req: Request, res: Response) => {
  try {
    const {
      mentorshipDomains,
      availableSlots,
      mentoringStyle,
      availableHours,
      timezone,
      bio,
      testimonials,
      currentPosition,
      currentCompany,
      experience,
    } = req.body;

    // Check if user already has an alumni profile
    let alumniProfile = await AlumniProfile.findOne({
      userId: req.user.id,
    });

    if (!alumniProfile) {
      // Create a basic alumni profile if one doesn't exist
      alumniProfile = new AlumniProfile({
        userId: req.user.id,
        university: "Not specified",
        program: "Not specified",
        batchYear: new Date().getFullYear() - 4, // Default to 4 years ago
        graduationYear: new Date().getFullYear() - 4,
        department: "Not specified",
        specialization: "Not specified",
        currentCompany: "Not specified",
        currentPosition: "Not specified",
        currentLocation: "Not specified",
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

      await alumniProfile.save();
    }

    // Check if already registered as mentor
    if (alumniProfile.availableForMentorship) {
      // Allow updates to existing mentor information
      alumniProfile.mentorshipDomains =
        mentorshipDomains || alumniProfile.mentorshipDomains;
      alumniProfile.availableSlots =
        availableSlots || alumniProfile.availableSlots;

      // Update profile fields with mentor form data
      if (currentPosition) {
        alumniProfile.currentPosition = currentPosition;
      }
      if (currentCompany) {
        alumniProfile.currentCompany = currentCompany;
      }
      if (experience !== undefined && experience !== null) {
        alumniProfile.experience = experience;
      }

      // Add testimonials if provided
      if (testimonials && testimonials.length > 0) {
        alumniProfile.testimonials = testimonials;
      }

      await alumniProfile.save();

      return res.status(200).json({
        success: true,
        message: "Mentor information updated successfully",
        data: alumniProfile,
      });
    }

    // First-time registration
    alumniProfile.availableForMentorship = true;
    alumniProfile.mentorshipDomains = mentorshipDomains || [];
    alumniProfile.availableSlots = availableSlots || [];

    // Update profile fields with mentor form data
    if (currentPosition) {
      alumniProfile.currentPosition = currentPosition;
    }
    if (currentCompany) {
      alumniProfile.currentCompany = currentCompany;
    }
    if (experience !== undefined && experience !== null) {
      alumniProfile.experience = experience;
    }

    // Add testimonials if provided
    if (testimonials && testimonials.length > 0) {
      alumniProfile.testimonials = testimonials;
    }

    await alumniProfile.save();

    return res.status(200).json({
      success: true,
      message: "Successfully registered as mentor",
      data: alumniProfile,
    });
  } catch (error) {
    logger.error("Register as mentor error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to register as mentor",
    });
  }
};

// Update alumni profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const {
      university,
      program,
      batchYear,
      graduationYear,
      department,
      specialization,
      rollNumber,
      studentId,
      currentCompany,
      currentPosition,
      currentLocation,
      experience,
      salary,
      currency,
      skills,
      achievements,
      certifications,
      education,
      careerTimeline,
      isHiring,
      availableForMentorship,
      mentorshipDomains,
      availableSlots,
      testimonials,
      photos,
    } = req.body;

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });

    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    // Update fields if provided
    if (university !== undefined) alumniProfile.university = university;
    if (program !== undefined) alumniProfile.program = program;
    if (batchYear !== undefined) alumniProfile.batchYear = batchYear;
    if (graduationYear !== undefined)
      alumniProfile.graduationYear = graduationYear;
    if (department !== undefined) alumniProfile.department = department;
    if (specialization !== undefined)
      alumniProfile.specialization = specialization;
    if (rollNumber !== undefined) alumniProfile.rollNumber = rollNumber;
    if (studentId !== undefined) alumniProfile.studentId = studentId;
    if (currentCompany !== undefined)
      alumniProfile.currentCompany = currentCompany;
    if (currentPosition !== undefined)
      alumniProfile.currentPosition = currentPosition;
    if (currentLocation !== undefined)
      alumniProfile.currentLocation = currentLocation;
    if (experience !== undefined) alumniProfile.experience = experience;
    if (salary !== undefined) alumniProfile.salary = salary;
    if (currency !== undefined) alumniProfile.currency = currency;
    if (skills !== undefined) alumniProfile.skills = skills;
    if (achievements !== undefined) alumniProfile.achievements = achievements;
    if (certifications !== undefined)
      alumniProfile.certifications = certifications;
    if (education !== undefined) alumniProfile.education = education;
    if (careerTimeline !== undefined)
      alumniProfile.careerTimeline = careerTimeline;
    if (isHiring !== undefined) alumniProfile.isHiring = isHiring;
    if (availableForMentorship !== undefined)
      alumniProfile.availableForMentorship = availableForMentorship;
    if (mentorshipDomains !== undefined)
      alumniProfile.mentorshipDomains = mentorshipDomains;
    if (availableSlots !== undefined)
      alumniProfile.availableSlots = availableSlots;
    if (testimonials !== undefined) alumniProfile.testimonials = testimonials;
    if (photos !== undefined) alumniProfile.photos = photos;

    await alumniProfile.save();

    return res.json({
      success: true,
      message: "Alumni profile updated successfully",
      data: { alumniProfile },
    });
  } catch (error) {
    logger.error("Update alumni profile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update alumni profile",
    });
  }
};

// Search alumni
export const searchAlumni = async (req: Request, res: Response) => {
  try {
    const {
      q,
      batchYear,
      department,
      location,
      skills,
      isHiring,
      availableForMentorship,
      page = 1,
      limit = 10,
    } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = {};

    if (q) {
      filter.$or = [
        { department: { $regex: q, $options: "i" } },
        { currentCompany: { $regex: q, $options: "i" } },
        { currentPosition: { $regex: q, $options: "i" } },
        { currentLocation: { $regex: q, $options: "i" } },
        { skills: { $in: [new RegExp(q as string, "i")] } },
      ];
    }

    if (batchYear) filter.batchYear = parseInt(batchYear as string);
    if (department) filter.department = { $regex: department, $options: "i" };
    if (location) filter.currentLocation = { $regex: location, $options: "i" };
    if (skills) filter.skills = { $in: skills };
    if (isHiring) filter.isHiring = isHiring === "true";
    if (availableForMentorship)
      filter.availableForMentorship = availableForMentorship === "true";

    const alumni = await AlumniProfile.find(filter)
      .populate("user", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit as string));

    const total = await AlumniProfile.countDocuments(filter);

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total,
          totalPages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    });
  } catch (error) {
    logger.error("Search alumni error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search alumni",
    });
  }
};

// Get alumni by batch year
export const getAlumniByBatch = async (req: Request, res: Response) => {
  try {
    const { year } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const alumni = await AlumniProfile.find({ batchYear: parseInt(year) })
      .populate("user", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniProfile.countDocuments({
      batchYear: parseInt(year),
    });

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get alumni by batch error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumni by batch",
    });
  }
};

// Get alumni who are hiring
export const getHiringAlumni = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const alumni = await AlumniProfile.find({ isHiring: true })
      .populate("user", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniProfile.countDocuments({ isHiring: true });

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get hiring alumni error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch hiring alumni",
    });
  }
};

// Get alumni mentors
export const getMentors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    // Build user filter for multi-tenant filtering
    const userFilter: any = {
      role: UserRole.ALUMNI,
    };

    // 🔒 MULTI-TENANT FILTERING: Only show mentors from same college (unless super admin)
    if (req.query.tenantId) {
      userFilter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      userFilter.tenantId = req.user.tenantId;
    }

    // Get alumni users first
    const alumniUsers = await User.find(userFilter)
      .select("_id firstName lastName email profilePicture")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count of alumni users
    const totalUsers = await User.countDocuments(userFilter);

    // Get alumni profiles for mentors from these users
    const alumniProfileFilter: any = {
      userId: { $in: alumniUsers.map((user) => user._id) },
      availableForMentorship: true,
    };

    const alumni = await AlumniProfile.find(alumniProfileFilter)
      .populate("userId", "firstName lastName email profilePicture")
      .sort({ createdAt: -1 });

    const total = await AlumniProfile.countDocuments(alumniProfileFilter);

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    logger.error("Get mentors error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch mentors",
    });
  }
};

// Get alumni statistics
export const getAlumniStats = async (req: Request, res: Response) => {
  try {
    const totalAlumni = await AlumniProfile.countDocuments();
    const hiringAlumni = await AlumniProfile.countDocuments({ isHiring: true });
    const mentors = await AlumniProfile.countDocuments({
      availableForMentorship: true,
    });

    const batchStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: "$batchYear",
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const departmentStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const locationStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: "$currentLocation",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalAlumni,
        hiringAlumni,
        mentors,
        batchStats,
        departmentStats,
        locationStats,
      },
    });
  } catch (error) {
    logger.error("Get alumni stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch alumni statistics",
    });
  }
};

// Update alumni skills and interests only
export const updateSkillsInterests = async (req: Request, res: Response) => {
  try {
    const { skills, careerInterests } = req.body;

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });

    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    // Update skills and careerInterests if provided
    if (skills !== undefined) alumniProfile.skills = skills;
    if (careerInterests !== undefined)
      alumniProfile.careerInterests = careerInterests;

    await alumniProfile.save();

    return res.json({
      success: true,
      message: "Skills updated successfully",
      data: {
        skills: alumniProfile.skills,
      },
    });
  } catch (error) {
    logger.error("Update skills error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get alumni by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get user (alumni only)
    const user = await User.findOne({ _id: id, role: UserRole.ALUMNI });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Alumni not found",
      });
    }

    // Get alumni profile
    const profile = await AlumniProfile.findOne({ userId: user._id });

    // Format the response
    const baseUser = {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      profileImage: user.profilePicture,
      role: user.role,
      phone: user.phone,
      bio: user.bio,
      location: user.location,
      linkedinProfile: user.linkedinProfile,
      githubProfile: user.githubProfile,
      website: user.website,
      createdAt: user.createdAt,
      skills: [],
      careerInterests: [],
      isHiring: false,
      availableForMentorship: false,
      mentorshipDomains: [],
      achievements: [],
    };

    // Add profile-specific data
    if (profile) {
      const alumniProfile = profile as any;
      const formattedUser = {
        ...baseUser,
        graduationYear: alumniProfile.graduationYear,
        batchYear: alumniProfile.batchYear,
        department: alumniProfile.department,
        specialization: alumniProfile.specialization,
        currentRole: alumniProfile.currentPosition,
        company: alumniProfile.currentCompany,
        currentLocation: alumniProfile.currentLocation,
        experience: alumniProfile.experience,
        skills: alumniProfile.skills || [],
        careerInterests: alumniProfile.careerInterests || [],
        isHiring: alumniProfile.isHiring,
        availableForMentorship: alumniProfile.availableForMentorship,
        mentorshipDomains: alumniProfile.mentorshipDomains || [],
        achievements: alumniProfile.achievements || [],
        certifications: alumniProfile.certifications || [],
        careerTimeline: alumniProfile.careerTimeline || [],
        education: alumniProfile.education || [],
        projects: alumniProfile.projects || [],
        internshipExperience: alumniProfile.internshipExperience || [],
        researchWork: alumniProfile.researchWork || [],
      };
      return res.json({
        success: true,
        data: { user: formattedUser },
      });
    }

    // Return base user if no profile found
    return res.json({
      success: true,
      data: { user: baseUser },
    });
  } catch (error) {
    logger.error("Get user by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// Add project to alumni profile
export const addProject = async (req: Request, res: Response) => {
  try {
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

    let profile = await AlumniProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
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
    console.error("Add alumni project error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update project in alumni profile
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
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
    logger.error("Update alumni project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update project",
    });
  }
};

// Delete project from alumni profile
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
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
    logger.error("Delete alumni project error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project",
    });
  }
};

// Add internship experience
export const addInternship = async (req: Request, res: Response) => {
  try {
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

    // Handle file upload
    let certificateFile = "";
    if (req.file) {
      certificateFile = `/uploads/documents/${req.file.filename}`;
    }

    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const internship = {
      company,
      position,
      description: description || "",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOngoing: isOngoing || false,
      location: location || "",
      isRemote: isRemote || false,
      stipend: stipendAmount
        ? {
            amount: stipendAmount,
            currency: stipendCurrency || "INR",
          }
        : undefined,
      skills: skills
        ? typeof skills === "string"
          ? JSON.parse(skills)
          : skills
        : [],
      certificateFile: certificateFile || "",
    };

    profile.internshipExperience.push(internship);
    await profile.save();

    return res.json({
      success: true,
      message: "Internship experience added successfully",
      data: { internship },
    });
  } catch (error) {
    console.error("Add internship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add internship experience",
    });
  }
};

// Update internship experience
export const updateInternship = async (req: Request, res: Response) => {
  try {
    const { internshipId } = req.params;
    const updateData = req.body;

    // Handle file upload
    if (req.file) {
      updateData.certificateFile = `/uploads/documents/${req.file.filename}`;
    }

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const internshipIndex = profile.internshipExperience.findIndex(
      (internship) => internship._id?.toString() === internshipId
    );

    if (internshipIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    const internship = profile.internshipExperience[internshipIndex];

    // Update fields
    if (updateData.company) internship.company = updateData.company;
    if (updateData.position) internship.position = updateData.position;
    if (updateData.description !== undefined)
      internship.description = updateData.description;
    if (updateData.startDate)
      internship.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
      internship.endDate = updateData.endDate
        ? new Date(updateData.endDate)
        : undefined;
    if (updateData.isOngoing !== undefined)
      internship.isOngoing = updateData.isOngoing;
    if (updateData.location !== undefined)
      internship.location = updateData.location;
    if (updateData.isRemote !== undefined)
      internship.isRemote = updateData.isRemote;
    if (updateData.skills)
      internship.skills =
        typeof updateData.skills === "string"
          ? JSON.parse(updateData.skills)
          : updateData.skills;
    if (updateData.certificateFile !== undefined)
      internship.certificateFile = updateData.certificateFile;

    await profile.save();

    return res.json({
      success: true,
      message: "Internship experience updated successfully",
      data: { internship },
    });
  } catch (error) {
    console.error("Update internship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update internship experience",
    });
  }
};

// Delete internship experience
export const deleteInternship = async (req: Request, res: Response) => {
  try {
    const { internshipId } = req.params;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const internshipIndex = profile.internshipExperience.findIndex(
      (internship) => internship._id?.toString() === internshipId
    );

    if (internshipIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Internship not found",
      });
    }

    profile.internshipExperience.splice(internshipIndex, 1);
    await profile.save();

    return res.json({
      success: true,
      message: "Internship experience deleted successfully",
    });
  } catch (error) {
    console.error("Delete internship error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete internship experience",
    });
  }
};

// Add research work
export const addResearch = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      supervisor,
      startDate,
      endDate,
      isOngoing,
      publicationUrl,
      conferenceUrl,
      keywords,
      status,
    } = req.body;

    // Handle file uploads
    let publicationFile = "";
    let conferenceFile = "";

    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.publicationFile && files.publicationFile[0]) {
        publicationFile = `/uploads/documents/${files.publicationFile[0].filename}`;
      }

      if (files.conferenceFile && files.conferenceFile[0]) {
        conferenceFile = `/uploads/documents/${files.conferenceFile[0].filename}`;
      }
    }

    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const research = {
      title,
      description,
      supervisor: supervisor || "",
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isOngoing: isOngoing || false,
      publicationUrl: publicationUrl || "",
      conferenceUrl: conferenceUrl || "",
      keywords: keywords
        ? typeof keywords === "string"
          ? JSON.parse(keywords)
          : keywords
        : [],
      status: status || "ongoing",
      publicationFile: publicationFile || "",
      conferenceFile: conferenceFile || "",
    };

    profile.researchWork.push(research);
    await profile.save();

    return res.json({
      success: true,
      message: "Research work added successfully",
      data: { research },
    });
  } catch (error) {
    console.error("Add research error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add research work",
    });
  }
};

// Update research work
export const updateResearch = async (req: Request, res: Response) => {
  try {
    const { researchId } = req.params;
    const updateData = req.body;

    // Handle file uploads
    if (req.files) {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (files.publicationFile && files.publicationFile[0]) {
        updateData.publicationFile = `/uploads/documents/${files.publicationFile[0].filename}`;
      }

      if (files.conferenceFile && files.conferenceFile[0]) {
        updateData.conferenceFile = `/uploads/documents/${files.conferenceFile[0].filename}`;
      }
    }

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const researchIndex = profile.researchWork.findIndex(
      (research) => research._id?.toString() === researchId
    );

    if (researchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Research work not found",
      });
    }

    const research = profile.researchWork[researchIndex];

    // Update fields
    if (updateData.title) research.title = updateData.title;
    if (updateData.description) research.description = updateData.description;
    if (updateData.supervisor !== undefined)
      research.supervisor = updateData.supervisor;
    if (updateData.startDate)
      research.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined)
      research.endDate = updateData.endDate
        ? new Date(updateData.endDate)
        : undefined;
    if (updateData.isOngoing !== undefined)
      research.isOngoing = updateData.isOngoing;
    if (updateData.publicationUrl !== undefined)
      research.publicationUrl = updateData.publicationUrl;
    if (updateData.conferenceUrl !== undefined)
      research.conferenceUrl = updateData.conferenceUrl;
    if (updateData.keywords)
      research.keywords =
        typeof updateData.keywords === "string"
          ? JSON.parse(updateData.keywords)
          : updateData.keywords;
    if (updateData.status) research.status = updateData.status;
    if (updateData.publicationFile !== undefined)
      research.publicationFile = updateData.publicationFile;
    if (updateData.conferenceFile !== undefined)
      research.conferenceFile = updateData.conferenceFile;

    await profile.save();

    return res.json({
      success: true,
      message: "Research work updated successfully",
      data: { research },
    });
  } catch (error) {
    console.error("Update research error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update research work",
    });
  }
};

// Delete research work
export const deleteResearch = async (req: Request, res: Response) => {
  try {
    const { researchId } = req.params;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const researchIndex = profile.researchWork.findIndex(
      (research) => research._id?.toString() === researchId
    );

    if (researchIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Research work not found",
      });
    }

    profile.researchWork.splice(researchIndex, 1);
    await profile.save();

    return res.json({
      success: true,
      message: "Research work deleted successfully",
    });
  } catch (error) {
    console.error("Delete research error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete research work",
    });
  }
};

// Add certification
export const addCertification = async (req: Request, res: Response) => {
  try {
    const { name, issuer, date, credentialId } = req.body;

    // Handle file upload
    let credentialFile = "";
    if (req.file) {
      credentialFile = `/uploads/documents/${req.file.filename}`;
    }

    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const certification = {
      name,
      issuer,
      date: new Date(date),
      credentialId: credentialId || "",
      credentialFile: credentialFile || "",
    };

    profile.certifications.push(certification);
    await profile.save();

    return res.json({
      success: true,
      message: "Certification added successfully",
      data: { certification },
    });
  } catch (error) {
    console.error("Add certification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add certification",
    });
  }
};

// Update certification
export const updateCertification = async (req: Request, res: Response) => {
  try {
    const { certificationId } = req.params;
    const updateData = req.body;

    // Handle file upload
    if (req.file) {
      updateData.credentialFile = `/uploads/documents/${req.file.filename}`;
    }

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const certificationIndex = profile.certifications.findIndex(
      (certification) => certification._id?.toString() === certificationId
    );

    if (certificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    const certification = profile.certifications[certificationIndex];

    // Update fields
    if (updateData.name) certification.name = updateData.name;
    if (updateData.issuer) certification.issuer = updateData.issuer;
    if (updateData.date) certification.date = new Date(updateData.date);
    if (updateData.credentialId !== undefined)
      certification.credentialId = updateData.credentialId;

    await profile.save();

    return res.json({
      success: true,
      message: "Certification updated successfully",
      data: { certification },
    });
  } catch (error) {
    console.error("Update certification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update certification",
    });
  }
};

// Delete certification
export const deleteCertification = async (req: Request, res: Response) => {
  try {
    const { certificationId } = req.params;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const certificationIndex = profile.certifications.findIndex(
      (certification) => certification._id?.toString() === certificationId
    );

    if (certificationIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Certification not found",
      });
    }

    profile.certifications.splice(certificationIndex, 1);
    await profile.save();

    return res.json({
      success: true,
      message: "Certification deleted successfully",
    });
  } catch (error) {
    console.error("Delete certification error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete certification",
    });
  }
};

// Add career timeline item
export const addCareerTimelineItem = async (req: Request, res: Response) => {
  try {
    const {
      position,
      company,
      startDate,
      endDate,
      isCurrent,
      description,
      location,
    } = req.body;

    let profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const careerItem = {
      position,
      company,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      isCurrent: isCurrent || false,
      description: description || "",
      location: location || "",
    };

    profile.careerTimeline.push(careerItem);
    await profile.save();

    return res.json({
      success: true,
      message: "Career timeline item added successfully",
      data: { careerItem },
    });
  } catch (error) {
    console.error("Add career timeline item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add career timeline item",
    });
  }
};

// Update career timeline item
export const updateCareerTimelineItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    const updateData = req.body;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const itemIndex = profile.careerTimeline.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Career timeline item not found",
      });
    }

    const item = profile.careerTimeline[itemIndex];

    // Update fields
    if (updateData.position) item.position = updateData.position;
    if (updateData.company) item.company = updateData.company;
    if (updateData.startDate) item.startDate = new Date(updateData.startDate);
    if (updateData.endDate !== undefined) {
      item.endDate = updateData.endDate
        ? new Date(updateData.endDate)
        : undefined;
    }
    if (updateData.isCurrent !== undefined)
      item.isCurrent = updateData.isCurrent;
    if (updateData.description !== undefined)
      item.description = updateData.description;
    if (updateData.location !== undefined) item.location = updateData.location;

    await profile.save();

    return res.json({
      success: true,
      message: "Career timeline item updated successfully",
      data: { careerItem: item },
    });
  } catch (error) {
    console.error("Update career timeline item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update career timeline item",
    });
  }
};

// Delete career timeline item
export const deleteCareerTimelineItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const profile = await AlumniProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Alumni profile not found",
      });
    }

    const itemIndex = profile.careerTimeline.findIndex(
      (item) => item._id?.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Career timeline item not found",
      });
    }

    profile.careerTimeline.splice(itemIndex, 1);
    await profile.save();

    return res.json({
      success: true,
      message: "Career timeline item deleted successfully",
    });
  } catch (error) {
    console.error("Delete career timeline item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete career timeline item",
    });
  }
};

export default {
  getAllUsersDirectory,
  getUserById,
  getPublicAlumniDirectory,
  getAllAlumni,
  getAlumniById,
  createProfile,
  updateProfile,
  registerAsMentor,
  updateSkillsInterests,
  searchAlumni,
  getAlumniByBatch,
  getHiringAlumni,
  getMentors,
  getAlumniStats,
  addProject,
  updateProject,
  deleteProject,
  addInternship,
  updateInternship,
  deleteInternship,
  addResearch,
  updateResearch,
  deleteResearch,
  addCertification,
  updateCertification,
  deleteCertification,
  addCareerTimelineItem,
  updateCareerTimelineItem,
  deleteCareerTimelineItem,
};
