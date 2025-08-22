import { Request, Response } from 'express';
import AlumniProfile from '@/models/AlumniProfile';
import User from '@/models/User';
import { logger } from '@/utils/logger';
import { UserRole } from '@/types';

// Get all alumni profiles
export const getAllAlumni = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Apply filters
    if (req.query.batchYear) filter.batchYear = parseInt(req.query.batchYear as string);
    if (req.query.department) filter.department = { $regex: req.query.department, $options: 'i' };
    if (req.query.isHiring) filter.isHiring = req.query.isHiring === 'true';
    if (req.query.availableForMentorship) filter.availableForMentorship = req.query.availableForMentorship === 'true';
    if (req.query.location) filter.currentLocation = { $regex: req.query.location, $options: 'i' };

    const alumni = await AlumniProfile.find(filter)
      .populate('user', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniProfile.countDocuments(filter);

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni'
    });
  }
};

// Get alumni profile by ID
export const getAlumniById = async (req: Request, res: Response) => {
  try {
    const alumni = await AlumniProfile.findById(req.params.id)
      .populate('user', 'firstName lastName email profilePicture bio location linkedinProfile twitterHandle githubProfile website');

    if (!alumni) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found'
      });
    }

    res.json({
      success: true,
      data: { alumni }
    });
  } catch (error) {
    logger.error('Get alumni by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni profile'
    });
  }
};

// Create alumni profile
export const createProfile = async (req: Request, res: Response) => {
  try {
    const {
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
      photos
    } = req.body;

    // Check if user already has an alumni profile
    const existingProfile = await AlumniProfile.findOne({ userId: req.user.id });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Alumni profile already exists'
      });
    }

    const alumniProfile = new AlumniProfile({
      userId: req.user.id,
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
      photos: photos || []
    });

    await alumniProfile.save();

    // Update user role to alumni if not already
    await User.findByIdAndUpdate(req.user.id, { role: UserRole.ALUMNI });

    res.status(201).json({
      success: true,
      message: 'Alumni profile created successfully',
      data: { alumniProfile }
    });
  } catch (error) {
    logger.error('Create alumni profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create alumni profile'
    });
  }
};

// Update alumni profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const {
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
      photos
    } = req.body;

    const alumniProfile = await AlumniProfile.findOne({ userId: req.user.id });
    
    if (!alumniProfile) {
      return res.status(404).json({
        success: false,
        message: 'Alumni profile not found'
      });
    }

    // Update fields if provided
    if (batchYear !== undefined) alumniProfile.batchYear = batchYear;
    if (graduationYear !== undefined) alumniProfile.graduationYear = graduationYear;
    if (department !== undefined) alumniProfile.department = department;
    if (specialization !== undefined) alumniProfile.specialization = specialization;
    if (rollNumber !== undefined) alumniProfile.rollNumber = rollNumber;
    if (studentId !== undefined) alumniProfile.studentId = studentId;
    if (currentCompany !== undefined) alumniProfile.currentCompany = currentCompany;
    if (currentPosition !== undefined) alumniProfile.currentPosition = currentPosition;
    if (currentLocation !== undefined) alumniProfile.currentLocation = currentLocation;
    if (experience !== undefined) alumniProfile.experience = experience;
    if (salary !== undefined) alumniProfile.salary = salary;
    if (currency !== undefined) alumniProfile.currency = currency;
    if (skills !== undefined) alumniProfile.skills = skills;
    if (achievements !== undefined) alumniProfile.achievements = achievements;
    if (certifications !== undefined) alumniProfile.certifications = certifications;
    if (education !== undefined) alumniProfile.education = education;
    if (careerTimeline !== undefined) alumniProfile.careerTimeline = careerTimeline;
    if (isHiring !== undefined) alumniProfile.isHiring = isHiring;
    if (availableForMentorship !== undefined) alumniProfile.availableForMentorship = availableForMentorship;
    if (mentorshipDomains !== undefined) alumniProfile.mentorshipDomains = mentorshipDomains;
    if (availableSlots !== undefined) alumniProfile.availableSlots = availableSlots;
    if (testimonials !== undefined) alumniProfile.testimonials = testimonials;
    if (photos !== undefined) alumniProfile.photos = photos;

    await alumniProfile.save();

    res.json({
      success: true,
      message: 'Alumni profile updated successfully',
      data: { alumniProfile }
    });
  } catch (error) {
    logger.error('Update alumni profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update alumni profile'
    });
  }
};

// Search alumni
export const searchAlumni = async (req: Request, res: Response) => {
  try {
    const { q, batchYear, department, location, skills, isHiring, availableForMentorship, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const filter: any = {};
    
    if (q) {
      filter.$or = [
        { department: { $regex: q, $options: 'i' } },
        { currentCompany: { $regex: q, $options: 'i' } },
        { currentPosition: { $regex: q, $options: 'i' } },
        { currentLocation: { $regex: q, $options: 'i' } },
        { skills: { $in: [new RegExp(q as string, 'i')] } }
      ];
    }
    
    if (batchYear) filter.batchYear = parseInt(batchYear as string);
    if (department) filter.department = { $regex: department, $options: 'i' };
    if (location) filter.currentLocation = { $regex: location, $options: 'i' };
    if (skills) filter.skills = { $in: skills };
    if (isHiring) filter.isHiring = isHiring === 'true';
    if (availableForMentorship) filter.availableForMentorship = availableForMentorship === 'true';

    const alumni = await AlumniProfile.find(filter)
      .populate('user', 'firstName lastName email profilePicture')
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
          totalPages: Math.ceil(total / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    logger.error('Search alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search alumni'
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
      .populate('user', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniProfile.countDocuments({ batchYear: parseInt(year) });

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get alumni by batch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni by batch'
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
      .populate('user', 'firstName lastName email profilePicture')
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
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get hiring alumni error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch hiring alumni'
    });
  }
};

// Get alumni mentors
export const getMentors = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const alumni = await AlumniProfile.find({ availableForMentorship: true })
      .populate('user', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AlumniProfile.countDocuments({ availableForMentorship: true });

    res.json({
      success: true,
      data: {
        alumni,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get mentors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentors'
    });
  }
};

// Get alumni statistics
export const getAlumniStats = async (req: Request, res: Response) => {
  try {
    const totalAlumni = await AlumniProfile.countDocuments();
    const hiringAlumni = await AlumniProfile.countDocuments({ isHiring: true });
    const mentors = await AlumniProfile.countDocuments({ availableForMentorship: true });

    const batchStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: '$batchYear',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    const departmentStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const locationStats = await AlumniProfile.aggregate([
      {
        $group: {
          _id: '$currentLocation',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        totalAlumni,
        hiringAlumni,
        mentors,
        batchStats,
        departmentStats,
        locationStats
      }
    });
  } catch (error) {
    logger.error('Get alumni stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alumni statistics'
    });
  }
};

export default {
  getAllAlumni,
  getAlumniById,
  createProfile,
  updateProfile,
  searchAlumni,
  getAlumniByBatch,
  getHiringAlumni,
  getMentors,
  getAlumniStats
}; 