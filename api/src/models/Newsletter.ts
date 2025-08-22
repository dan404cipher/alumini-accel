import mongoose, { Document, Schema } from 'mongoose';

export interface INewsletter extends Document {
  title: string;
  subject: string;
  content: string;
  htmlContent: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'cancelled';
  category: string;
  tags: string[];
  scheduledAt?: Date;
  sentAt?: Date;
  sentBy: mongoose.Types.ObjectId;
  recipients: {
    type: 'all' | 'alumni' | 'students' | 'admin' | 'custom';
    filters?: Record<string, any>;
    customEmails?: string[];
  };
  stats: {
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    bouncedCount: number;
    unsubscribedCount: number;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface INewsletterSubscription extends Document {
  user: mongoose.Types.ObjectId;
  email: string;
  isSubscribed: boolean;
  categories: string[];
  preferences: {
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'never';
    topics: string[];
  };
  lastSentAt?: Date;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const newsletterSchema = new Schema<INewsletter>({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  htmlContent: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
    default: 'draft',
    index: true
  },
  category: {
    type: String,
    required: true,
    enum: ['general', 'events', 'jobs', 'achievements', 'updates', 'announcements'],
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  scheduledAt: {
    type: Date,
    index: true
  },
  sentAt: {
    type: Date
  },
  sentBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: {
    type: {
      type: String,
      required: true,
      enum: ['all', 'alumni', 'students', 'admin', 'custom']
    },
    filters: {
      type: Schema.Types.Mixed,
      default: {}
    },
    customEmails: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  stats: {
    totalRecipients: {
      type: Number,
      default: 0,
      min: 0
    },
    sentCount: {
      type: Number,
      default: 0,
      min: 0
    },
    deliveredCount: {
      type: Number,
      default: 0,
      min: 0
    },
    openedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    clickedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    bouncedCount: {
      type: Number,
      default: 0,
      min: 0
    },
    unsubscribedCount: {
      type: Number,
      default: 0,
      min: 0
    }
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

// Indexes
newsletterSchema.index({ status: 1, scheduledAt: 1 });
newsletterSchema.index({ category: 1, status: 1 });
newsletterSchema.index({ sentBy: 1, createdAt: -1 });
newsletterSchema.index({ tags: 1 });

// Virtual for open rate
newsletterSchema.virtual('openRate').get(function() {
  if (this.stats.deliveredCount === 0) return 0;
  return (this.stats.openedCount / this.stats.deliveredCount) * 100;
});

// Virtual for click rate
newsletterSchema.virtual('clickRate').get(function() {
  if (this.stats.deliveredCount === 0) return 0;
  return (this.stats.clickedCount / this.stats.deliveredCount) * 100;
});

// Virtual for bounce rate
newsletterSchema.virtual('bounceRate').get(function() {
  if (this.stats.sentCount === 0) return 0;
  return (this.stats.bouncedCount / this.stats.sentCount) * 100;
});

// Virtual for sender info
newsletterSchema.virtual('senderInfo', {
  ref: 'User',
  localField: 'sentBy',
  foreignField: '_id',
  justOne: true,
  options: { select: 'firstName lastName email' }
});

// Instance methods
newsletterSchema.methods.markAsSent = function() {
  this.status = 'sent';
  this.sentAt = new Date();
  return this.save();
};

newsletterSchema.methods.markAsSending = function() {
  this.status = 'sending';
  return this.save();
};

newsletterSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

newsletterSchema.methods.updateStats = function(stats: Partial<INewsletter['stats']>) {
  Object.assign(this.stats, stats);
  return this.save();
};

// Static methods
newsletterSchema.statics.getScheduledNewsletters = function() {
  return this.find({
    status: 'scheduled',
    scheduledAt: { $lte: new Date() }
  }).sort({ scheduledAt: 1 });
};

newsletterSchema.statics.getNewslettersByStatus = function(status: string) {
  return this.find({ status })
    .populate('sentBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

newsletterSchema.statics.getNewslettersByCategory = function(category: string) {
  return this.find({ category })
    .populate('sentBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

newsletterSchema.statics.getNewsletterStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRecipients: { $sum: '$stats.totalRecipients' },
        totalSent: { $sum: '$stats.sentCount' },
        totalOpened: { $sum: '$stats.openedCount' },
        totalClicked: { $sum: '$stats.clickedCount' }
      }
    }
  ]);
};

newsletterSchema.statics.getMonthlyStats = function() {
  return this.aggregate([
    {
      $match: {
        status: 'sent',
        sentAt: { $exists: true }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$sentAt' },
          month: { $month: '$sentAt' }
        },
        count: { $sum: 1 },
        totalRecipients: { $sum: '$stats.totalRecipients' },
        totalSent: { $sum: '$stats.sentCount' },
        totalOpened: { $sum: '$stats.openedCount' },
        totalClicked: { $sum: '$stats.clickedCount' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
};

const Newsletter = mongoose.model<INewsletter>('Newsletter', newsletterSchema);

// Newsletter Subscription Schema
const newsletterSubscriptionSchema = new Schema<INewsletterSubscription>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  isSubscribed: {
    type: Boolean,
    default: true,
    index: true
  },
  categories: [{
    type: String,
    enum: ['general', 'events', 'jobs', 'achievements', 'updates', 'announcements']
  }],
  preferences: {
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'never'],
      default: 'monthly'
    },
    topics: [{
      type: String,
      trim: true
    }]
  },
  lastSentAt: {
    type: Date
  },
  unsubscribedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for user and email
newsletterSubscriptionSchema.index({ user: 1, email: 1 }, { unique: true });

// Indexes
newsletterSubscriptionSchema.index({ isSubscribed: 1 });
newsletterSubscriptionSchema.index({ categories: 1 });
newsletterSubscriptionSchema.index({ 'preferences.frequency': 1 });

// Virtual for user info
newsletterSubscriptionSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true,
  options: { select: 'firstName lastName email profilePicture' }
});

// Instance methods
newsletterSubscriptionSchema.methods.unsubscribe = function() {
  this.isSubscribed = false;
  this.unsubscribedAt = new Date();
  return this.save();
};

newsletterSubscriptionSchema.methods.resubscribe = function() {
  this.isSubscribed = true;
  this.unsubscribedAt = undefined;
  return this.save();
};

newsletterSubscriptionSchema.methods.updatePreferences = function(preferences: Partial<INewsletterSubscription['preferences']>) {
  Object.assign(this.preferences, preferences);
  return this.save();
};

// Static methods
newsletterSubscriptionSchema.statics.getActiveSubscribers = function() {
  return this.find({ isSubscribed: true })
    .populate('userInfo')
    .sort({ createdAt: -1 });
};

newsletterSubscriptionSchema.statics.getSubscribersByCategory = function(category: string) {
  return this.find({
    isSubscribed: true,
    categories: category
  })
    .populate('userInfo')
    .sort({ createdAt: -1 });
};

newsletterSubscriptionSchema.statics.getSubscriberStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$isSubscribed',
        count: { $sum: 1 }
      }
    }
  ]);
};

newsletterSubscriptionSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    { $match: { isSubscribed: true } },
    { $unwind: '$categories' },
    {
      $group: {
        _id: '$categories',
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const NewsletterSubscription = mongoose.model<INewsletterSubscription>('NewsletterSubscription', newsletterSubscriptionSchema);

export { Newsletter, NewsletterSubscription };
export default Newsletter; 