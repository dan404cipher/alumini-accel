import mongoose, { Document, Schema } from 'mongoose';

export interface IBadge extends Document {
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  criteria: {
    type: string;
    value: number;
    description: string;
  };
  points: number;
  isActive: boolean;
  isRare: boolean;
  maxRecipients?: number;
  currentRecipients: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserBadge extends Document {
  user: mongoose.Types.ObjectId;
  badge: mongoose.Types.ObjectId;
  awardedAt: Date;
  awardedBy?: mongoose.Types.ObjectId;
  reason?: string;
  metadata?: Record<string, any>;
}

const badgeSchema = new Schema<IBadge>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    index: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['mentorship', 'donation', 'event', 'job', 'engagement', 'achievement', 'special'],
    index: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  color: {
    type: String,
    required: true,
    default: '#3B82F6'
  },
  criteria: {
    type: {
      type: String,
      required: true,
      enum: ['donations', 'mentorships', 'events', 'jobs', 'engagement', 'manual']
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      required: true,
      trim: true
    }
  },
  points: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isRare: {
    type: Boolean,
    default: false
  },
  maxRecipients: {
    type: Number,
    min: 0
  },
  currentRecipients: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
badgeSchema.index({ category: 1, isActive: 1 });
badgeSchema.index({ points: -1 });
badgeSchema.index({ isRare: 1 });

// Virtual for rarity percentage
badgeSchema.virtual('rarityPercentage').get(function() {
  if (!this.maxRecipients || this.maxRecipients === 0) return null;
  return (this.currentRecipients / this.maxRecipients) * 100;
});

// Virtual for availability
badgeSchema.virtual('isAvailable').get(function() {
  if (!this.isActive) return false;
  if (this.maxRecipients && this.currentRecipients >= this.maxRecipients) return false;
  return true;
});

// Instance methods
badgeSchema.methods.incrementRecipients = function() {
  this.currentRecipients += 1;
  return this.save();
};

badgeSchema.methods.decrementRecipients = function() {
  if (this.currentRecipients > 0) {
    this.currentRecipients -= 1;
  }
  return this.save();
};

// Static methods
badgeSchema.statics.getAvailableBadges = function() {
  return this.find({
    isActive: true,
    $or: [
      { maxRecipients: { $exists: false } },
      { maxRecipients: { $gt: '$currentRecipients' } }
    ]
  }).sort({ points: -1 });
};

badgeSchema.statics.getBadgesByCategory = function(category: string) {
  return this.find({
    category,
    isActive: true
  }).sort({ points: -1 });
};

badgeSchema.statics.getRareBadges = function() {
  return this.find({
    isRare: true,
    isActive: true
  }).sort({ points: -1 });
};

const Badge = mongoose.model<IBadge>('Badge', badgeSchema);

// User Badge Schema
const userBadgeSchema = new Schema<IUserBadge>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  badge: {
    type: Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
    index: true
  },
  awardedAt: {
    type: Date,
    required: true,
    default: Date.now
  },
  awardedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reason: {
    type: String,
    trim: true
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to prevent duplicate badges per user
userBadgeSchema.index({ user: 1, badge: 1 }, { unique: true });

// Indexes
userBadgeSchema.index({ awardedAt: -1 });
userBadgeSchema.index({ user: 1, awardedAt: -1 });

// Virtual for badge details
userBadgeSchema.virtual('badgeDetails', {
  ref: 'Badge',
  localField: 'badge',
  foreignField: '_id',
  justOne: true
});

// Virtual for awarded by user
userBadgeSchema.virtual('awardedByUser', {
  ref: 'User',
  localField: 'awardedBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'firstName lastName email' }
});

// Instance methods
userBadgeSchema.methods.getFormattedAwardDate = function() {
  return this.awardedAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Static methods
userBadgeSchema.statics.getUserBadges = function(userId: string) {
  return this.find({ user: userId })
    .populate('badge')
    .populate('awardedBy', 'firstName lastName email')
    .sort({ awardedAt: -1 });
};

userBadgeSchema.statics.getUserBadgeCount = function(userId: string) {
  return this.countDocuments({ user: userId });
};

userBadgeSchema.statics.getUserTotalPoints = function(userId: string) {
  return this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'badges',
        localField: 'badge',
        foreignField: '_id',
        as: 'badgeDetails'
      }
    },
    { $unwind: '$badgeDetails' },
    {
      $group: {
        _id: null,
        totalPoints: { $sum: '$badgeDetails.points' }
      }
    }
  ]);
};

userBadgeSchema.statics.getBadgeRecipients = function(badgeId: string) {
  return this.find({ badge: badgeId })
    .populate('user', 'firstName lastName email profilePicture')
    .populate('awardedBy', 'firstName lastName email')
    .sort({ awardedAt: -1 });
};

userBadgeSchema.statics.getRecentAwards = function(limit = 10) {
  return this.find()
    .populate('user', 'firstName lastName email profilePicture')
    .populate('badge')
    .populate('awardedBy', 'firstName lastName email')
    .sort({ awardedAt: -1 })
    .limit(limit);
};

userBadgeSchema.statics.getTopBadgeCollectors = function(limit = 10) {
  return this.aggregate([
    {
      $group: {
        _id: '$user',
        badgeCount: { $sum: 1 },
        lastAward: { $max: '$awardedAt' }
      }
    },
    { $sort: { badgeCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }
    },
    { $unwind: '$userInfo' },
    {
      $project: {
        user: {
          _id: '$userInfo._id',
          firstName: '$userInfo.firstName',
          lastName: '$userInfo.lastName',
          email: '$userInfo.email',
          profilePicture: '$userInfo.profilePicture'
        },
        badgeCount: 1,
        lastAward: 1
      }
    }
  ]);
};

// Pre-save middleware to increment badge recipients
userBadgeSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Badge = mongoose.model('Badge');
      const badge = await Badge.findById(this.badge);
      if (badge) {
        await badge.incrementRecipients();
      }
    } catch (error) {
      // Continue without incrementing
    }
  }
  next();
});

// Pre-remove middleware to decrement badge recipients
userBadgeSchema.pre('remove', async function(next) {
  try {
    const Badge = mongoose.model('Badge');
    const badge = await Badge.findById(this.badge);
    if (badge) {
      await badge.decrementRecipients();
    }
  } catch (error) {
    // Continue without decrementing
  }
  next();
});

const UserBadge = mongoose.model<IUserBadge>('UserBadge', userBadgeSchema);

export { Badge, UserBadge };
export default Badge; 