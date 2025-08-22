import { Request, Response } from 'express';
import Mentorship from '@/models/Mentorship';
import User from '@/models/User';
import AlumniProfile from '@/models/AlumniProfile';
import { logger } from '@/utils/logger';
import { MentorshipStatus } from '@/types';

// Get all mentorships
export const getAllMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};
    
    // Apply filters
    if (req.query.status) filter.status = req.query.status;
    if (req.query.domain) filter.domain = { $regex: req.query.domain, $options: 'i' };

    const mentorships = await Mentorship.find(filter)
      .populate('mentor', 'firstName lastName email profilePicture')
      .populate('mentee', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments(filter);

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get all mentorships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorships'
    });
  }
};

// Get mentorship by ID
export const getMentorshipById = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id)
      .populate('mentor', 'firstName lastName email profilePicture')
      .populate('mentee', 'firstName lastName email profilePicture');

    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    res.json({
      success: true,
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Get mentorship by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship'
    });
  }
};

// Create mentorship request
export const createMentorship = async (req: Request, res: Response) => {
  try {
    const {
      mentorId,
      domain,
      description,
      goals,
      preferredSchedule,
      duration
    } = req.body;

    // Check if mentor exists and is available for mentorship
    const mentorProfile = await AlumniProfile.findOne({ 
      userId: mentorId,
      availableForMentorship: true 
    });

    if (!mentorProfile) {
      return res.status(400).json({
        success: false,
        message: 'Mentor is not available for mentorship'
      });
    }

    // Check if there's already a pending or active mentorship between these users
    const existingMentorship = await Mentorship.findOne({
      $or: [
        { mentor: mentorId, mentee: req.user.id },
        { mentor: req.user.id, mentee: mentorId }
      ],
      status: { $in: [MentorshipStatus.PENDING, MentorshipStatus.ACTIVE] }
    });

    if (existingMentorship) {
      return res.status(400).json({
        success: false,
        message: 'A mentorship request already exists between you and this mentor'
      });
    }

    const mentorship = new Mentorship({
      mentor: mentorId,
      mentee: req.user.id,
      domain,
      description,
      goals: goals || [],
      preferredSchedule,
      duration: duration || 3, // Default 3 months
      status: MentorshipStatus.PENDING
    });

    await mentorship.save();

    res.status(201).json({
      success: true,
      message: 'Mentorship request created successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Create mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create mentorship request'
    });
  }
};

// Accept mentorship
export const acceptMentorship = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is the mentor
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can accept the mentorship'
      });
    }

    if (mentorship.status !== MentorshipStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Mentorship is not in pending status'
      });
    }

    mentorship.status = MentorshipStatus.ACTIVE;
    mentorship.acceptedAt = new Date();
    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship accepted successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Accept mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept mentorship'
    });
  }
};

// Reject mentorship
export const rejectMentorship = async (req: Request, res: Response) => {
  try {
    const { reason } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is the mentor
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can reject the mentorship'
      });
    }

    if (mentorship.status !== MentorshipStatus.PENDING) {
      return res.status(400).json({
        success: false,
        message: 'Mentorship is not in pending status'
      });
    }

    mentorship.status = MentorshipStatus.REJECTED;
    mentorship.rejectedAt = new Date();
    mentorship.rejectionReason = reason;
    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship rejected successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Reject mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject mentorship'
    });
  }
};

// Complete mentorship
export const completeMentorship = async (req: Request, res: Response) => {
  try {
    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is the mentor or mentee
    if (mentorship.mentor.toString() !== req.user.id && mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to complete this mentorship'
      });
    }

    if (mentorship.status !== MentorshipStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Mentorship is not active'
      });
    }

    mentorship.status = MentorshipStatus.COMPLETED;
    mentorship.completedAt = new Date();
    await mentorship.save();

    res.json({
      success: true,
      message: 'Mentorship completed successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Complete mentorship error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete mentorship'
    });
  }
};

// Add mentorship session
export const addSession = async (req: Request, res: Response) => {
  try {
    const {
      date,
      duration,
      topic,
      notes,
      meetingLink
    } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is the mentor
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can add sessions'
      });
    }

    if (mentorship.status !== MentorshipStatus.ACTIVE) {
      return res.status(400).json({
        success: false,
        message: 'Mentorship is not active'
      });
    }

    mentorship.sessions.push({
      date: new Date(date),
      duration,
      topic,
      notes,
      meetingLink,
      status: 'scheduled'
    });

    await mentorship.save();

    res.json({
      success: true,
      message: 'Session added successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Add session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add session'
    });
  }
};

// Update mentorship session
export const updateSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const {
      date,
      duration,
      topic,
      notes,
      meetingLink,
      status
    } = req.body;

    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is the mentor
    if (mentorship.mentor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the mentor can update sessions'
      });
    }

    const session = mentorship.sessions.id(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Update session fields
    if (date !== undefined) session.date = new Date(date);
    if (duration !== undefined) session.duration = duration;
    if (topic !== undefined) session.topic = topic;
    if (notes !== undefined) session.notes = notes;
    if (meetingLink !== undefined) session.meetingLink = meetingLink;
    if (status !== undefined) session.status = status;

    await mentorship.save();

    res.json({
      success: true,
      message: 'Session updated successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Update session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update session'
    });
  }
};

// Submit mentorship feedback
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { rating, comment, type } = req.body; // type: 'mentor' or 'mentee'

    const mentorship = await Mentorship.findById(req.params.id);
    
    if (!mentorship) {
      return res.status(404).json({
        success: false,
        message: 'Mentorship not found'
      });
    }

    // Check if user is part of the mentorship
    if (mentorship.mentor.toString() !== req.user.id && mentorship.mentee.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit feedback for this mentorship'
      });
    }

    // Check if mentorship is completed
    if (mentorship.status !== MentorshipStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Mentorship must be completed to submit feedback'
      });
    }

    // Check if user already submitted feedback
    const existingFeedback = mentorship.feedback.find(
      feedback => feedback.user.toString() === req.user.id && feedback.type === type
    );

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this mentorship'
      });
    }

    mentorship.feedback.push({
      user: req.user.id,
      type,
      rating,
      comment,
      submittedAt: new Date()
    });

    await mentorship.save();

    res.json({
      success: true,
      message: 'Feedback submitted successfully',
      data: { mentorship }
    });
  } catch (error) {
    logger.error('Submit feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
};

// Get my mentorships
export const getMyMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      $or: [
        { mentor: req.user.id },
        { mentee: req.user.id }
      ]
    })
      .populate('mentor', 'firstName lastName email profilePicture')
      .populate('mentee', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      $or: [
        { mentor: req.user.id },
        { mentee: req.user.id }
      ]
    });

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get my mentorships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your mentorships'
    });
  }
};

// Get active mentorships
export const getActiveMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      status: MentorshipStatus.ACTIVE,
      $or: [
        { mentor: req.user.id },
        { mentee: req.user.id }
      ]
    })
      .populate('mentor', 'firstName lastName email profilePicture')
      .populate('mentee', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      status: MentorshipStatus.ACTIVE,
      $or: [
        { mentor: req.user.id },
        { mentee: req.user.id }
      ]
    });

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get active mentorships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active mentorships'
    });
  }
};

// Get pending mentorships
export const getPendingMentorships = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const mentorships = await Mentorship.find({
      status: MentorshipStatus.PENDING,
      mentor: req.user.id
    })
      .populate('mentor', 'firstName lastName email profilePicture')
      .populate('mentee', 'firstName lastName email profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Mentorship.countDocuments({
      status: MentorshipStatus.PENDING,
      mentor: req.user.id
    });

    res.json({
      success: true,
      data: {
        mentorships,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get pending mentorships error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending mentorships'
    });
  }
};

// Get mentorship statistics
export const getMentorshipStats = async (req: Request, res: Response) => {
  try {
    const totalMentorships = await Mentorship.countDocuments();
    const activeMentorships = await Mentorship.countDocuments({ status: MentorshipStatus.ACTIVE });
    const completedMentorships = await Mentorship.countDocuments({ status: MentorshipStatus.COMPLETED });
    const pendingMentorships = await Mentorship.countDocuments({ status: MentorshipStatus.PENDING });

    const domainStats = await Mentorship.aggregate([
      {
        $group: {
          _id: '$domain',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const monthlyStats = await Mentorship.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        totalMentorships,
        activeMentorships,
        completedMentorships,
        pendingMentorships,
        domainStats,
        monthlyStats
      }
    });
  } catch (error) {
    logger.error('Get mentorship stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentorship statistics'
    });
  }
};

export default {
  getAllMentorships,
  getMentorshipById,
  createMentorship,
  acceptMentorship,
  rejectMentorship,
  completeMentorship,
  addSession,
  updateSession,
  submitFeedback,
  getMyMentorships,
  getActiveMentorships,
  getPendingMentorships,
  getMentorshipStats
}; 