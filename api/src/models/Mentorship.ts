import mongoose, { Schema } from 'mongoose';
import { IMentorship, MentorshipStatus } from '@/types';

const mentorshipSchema = new Schema<IMentorship>({
  mentorId: {
    type: mongoose.Types.ObjectId as any,
    ref: 'User',
    required: true
  },
  menteeId: {
    type: mongoose.Types.ObjectId as any,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(MentorshipStatus),
    default: MentorshipStatus.PENDING,
    required: true
  },
  domain: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Domain cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  goals: [{
    type: String,
    trim: true,
    maxlength: [200, 'Goal cannot exceed 200 characters']
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date
  },
  sessions: [{
    date: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      required: true,
      min: [15, 'Session duration must be at least 15 minutes'],
      max: [480, 'Session duration cannot exceed 8 hours']
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
    meetingLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, 'Please enter a valid meeting link']
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    }
  }],
  feedback: [{
    from: {
      type: String,
      enum: ['mentor', 'mentee'],
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters']
    },
    date: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
mentorshipSchema.index({ mentorId: 1 });
mentorshipSchema.index({ menteeId: 1 });
mentorshipSchema.index({ status: 1 });
mentorshipSchema.index({ domain: 1 });
mentorshipSchema.index({ startDate: 1 });
mentorshipSchema.index({ createdAt: -1 });

// Compound index to prevent duplicate mentorship requests
mentorshipSchema.index({ mentorId: 1, menteeId: 1 }, { unique: true });

// Virtual for mentor details
mentorshipSchema.virtual('mentor', {
  ref: 'User',
  localField: 'mentorId',
  foreignField: '_id',
  justOne: true
});

// Virtual for mentee details
mentorshipSchema.virtual('mentee', {
  ref: 'User',
  localField: 'menteeId',
  foreignField: '_id',
  justOne: true
});

// Virtual for sessions count
mentorshipSchema.virtual('sessionsCount').get(function() {
  return this.sessions.length;
});

// Virtual for completed sessions count
mentorshipSchema.virtual('completedSessionsCount').get(function() {
  return this.sessions.filter(session => session.status === 'completed').length;
});

// Virtual for average rating
mentorshipSchema.virtual('averageRating').get(function() {
  if (this.feedback.length === 0) return 0;
  const totalRating = this.feedback.reduce((sum, feedback) => sum + feedback.rating, 0);
  return (totalRating / this.feedback.length).toFixed(1);
});

// Instance method to add session
mentorshipSchema.methods.addSession = function(sessionData: any) {
  this.sessions.push(sessionData);
  return this.save();
};

// Instance method to update session
mentorshipSchema.methods.updateSession = function(sessionId: string, updates: any) {
  const session = this.sessions.id(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }
  
  Object.assign(session, updates);
  return this.save();
};

// Instance method to add feedback
mentorshipSchema.methods.addFeedback = function(from: 'mentor' | 'mentee', rating: number, comment?: string) {
  const existingFeedback = this.feedback.find(feedback => feedback.from === from);
  if (existingFeedback) {
    throw new Error(`${from} has already provided feedback`);
  }
  
  this.feedback.push({ from, rating, comment });
  return this.save();
};

// Instance method to accept mentorship
mentorshipSchema.methods.accept = function() {
  if (this.status !== MentorshipStatus.PENDING) {
    throw new Error('Mentorship is not in pending status');
  }
  
  this.status = MentorshipStatus.ACCEPTED;
  return this.save();
};

// Instance method to reject mentorship
mentorshipSchema.methods.reject = function() {
  if (this.status !== MentorshipStatus.PENDING) {
    throw new Error('Mentorship is not in pending status');
  }
  
  this.status = MentorshipStatus.REJECTED;
  return this.save();
};

// Instance method to complete mentorship
mentorshipSchema.methods.complete = function() {
  if (this.status !== MentorshipStatus.ACCEPTED) {
    throw new Error('Mentorship must be accepted before completion');
  }
  
  this.status = MentorshipStatus.COMPLETED;
  this.endDate = new Date();
  return this.save();
};

// Static method to find by mentor
mentorshipSchema.statics.findByMentor = function(mentorId: string) {
  return this.find({ mentorId })
    .populate('mentee', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to find by mentee
mentorshipSchema.statics.findByMentee = function(menteeId: string) {
  return this.find({ menteeId })
    .populate('mentor', 'firstName lastName email profilePicture')
    .sort({ createdAt: -1 });
};

// Static method to find active mentorships
mentorshipSchema.statics.findActive = function() {
  return this.find({ status: MentorshipStatus.ACCEPTED })
    .populate('mentor', 'firstName lastName email profilePicture')
    .populate('mentee', 'firstName lastName email profilePicture');
};

// Static method to find pending requests
mentorshipSchema.statics.findPending = function() {
  return this.find({ status: MentorshipStatus.PENDING })
    .populate('mentor', 'firstName lastName email profilePicture')
    .populate('mentee', 'firstName lastName email profilePicture');
};

// Ensure virtual fields are serialized
mentorshipSchema.set('toJSON', { virtuals: true });

export default mongoose.model<IMentorship>('Mentorship', mentorshipSchema); 