import mongoose, { Schema } from "mongoose";
import { IEvent, EventType } from "../types";

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    type: {
      type: Schema.Types.Mixed, // Can be String (enum or stringified ObjectId) or ObjectId (custom)
      required: true,
      validate: {
        validator: function (value: any) {
          if (typeof value === "string") {
            // Accept stringified ObjectId or enum string
            if (mongoose.Types.ObjectId.isValid(value)) return true;
            return Object.values(EventType).includes(value as EventType);
          }
          // If it's an ObjectId, it's valid
          return mongoose.Types.ObjectId.isValid(value);
        },
        message: "Event type must be a valid enum value or ObjectId",
      },
    },
    customEventType: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    meetingLink: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid meeting link"],
    },
    maxAttendees: {
      type: Number,
      min: [1, "Maximum attendees must be at least 1"],
    },
    currentAttendees: {
      type: Number,
      default: 0,
      min: [0, "Current attendees cannot be negative"],
    },
    organizer: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    speakers: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Speaker name cannot exceed 100 characters"],
        },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Speaker title cannot exceed 100 characters"],
        },
        company: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Company name cannot exceed 100 characters"],
        },
        bio: {
          type: String,
          trim: true,
          maxlength: [500, "Bio cannot exceed 500 characters"],
        },
        photo: {
          type: String,
          trim: true,
        },
      },
    ],
    agenda: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Agenda title cannot exceed 200 characters"],
        },
        speaker: {
          type: String,
          trim: true,
          maxlength: [100, "Speaker name cannot exceed 100 characters"],
        },
        description: {
          type: String,
          trim: true,
          maxlength: [500, "Description cannot exceed 500 characters"],
        },
      },
    ],
    registrationDeadline: {
      type: Date,
    },
    attendees: [
      {
        userId: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
          required: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled", "pending_payment", "pending_approval"],
          default: "registered",
        },
        // Additional registration details
        phone: {
          type: String,
          trim: true,
        },
        dietaryRequirements: {
          type: String,
          trim: true,
        },
        emergencyContact: {
          type: String,
          trim: true,
        },
        additionalNotes: {
          type: String,
          trim: true,
        },
        amountPaid: {
          type: Number,
          default: 0,
        },
        paymentStatus: {
          type: String,
          enum: ["free", "pending", "successful", "failed"],
          default: "free",
        },
        reminderSent: {
          type: Boolean,
          default: false,
        },
        // Approval fields for free events
        approvalStatus: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        approvedBy: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
        },
        approvedAt: {
          type: Date,
        },
        rejectedBy: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
        },
        rejectedAt: {
          type: Date,
        },
        rejectionReason: {
          type: String,
          trim: true,
        },
      },
    ],
    image: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      default: 0,
      min: [0, "Price cannot be negative"],
    },
    photos: [
      {
        type: String,
        trim: true,
      },
    ],
    feedback: [
      {
        userId: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: [1, "Rating must be at least 1"],
          max: [5, "Rating cannot exceed 5"],
        },
        comment: {
          type: String,
          trim: true,
          maxlength: [500, "Comment cannot exceed 500 characters"],
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    status: {
      type: String,
      enum: ["upcoming", "ongoing", "completed", "cancelled"],
      default: "upcoming",
    },
    tenantId: {
      type: mongoose.Types.ObjectId as any,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ organizer: 1 });
eventSchema.index({ type: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ startDate: 1 });
eventSchema.index({ endDate: 1 });
eventSchema.index({ location: 1 });
eventSchema.index({ isOnline: 1 });
eventSchema.index({ createdAt: -1 });

// Virtual for organizer details
eventSchema.virtual("organizerDetails", {
  ref: "User",
  localField: "organizer",
  foreignField: "_id",
  justOne: true,
});

// Virtual for attendees count
eventSchema.virtual("totalAttendees").get(function () {
  return this.attendees.length;
});

// Virtual for average rating
eventSchema.virtual("averageRating").get(function () {
  if (this.feedback.length === 0) return 0;
  const totalRating = this.feedback.reduce(
    (sum, feedback) => sum + feedback.rating,
    0
  );
  return (totalRating / this.feedback.length).toFixed(1);
});

// Virtual for days until event
eventSchema.virtual("daysUntilEvent").get(function () {
  const now = new Date();
  const eventDate = new Date(this.startDate);
  const diffTime = eventDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for registration status
eventSchema.virtual("isRegistrationOpen").get(function () {
  if (!this.registrationDeadline) return true;
  const now = new Date();
  const deadline = new Date(this.registrationDeadline);
  return now < deadline;
});

// Instance method to add attendee
eventSchema.methods.addAttendee = function (userId: string) {
  const existingAttendee = this.attendees.find(
    (attendee: any) => attendee.userId.toString() === userId
  );
  if (existingAttendee) {
    throw new Error("User already registered for this event");
  }

  if (this.maxAttendees && this.currentAttendees >= this.maxAttendees) {
    throw new Error("Event is at full capacity");
  }

  this.attendees.push({ userId });
  this.currentAttendees += 1;
  return this.save();
};

// Instance method to remove attendee
eventSchema.methods.removeAttendee = function (userId: string) {
  const attendeeIndex = this.attendees.findIndex(
    (attendee: any) => attendee.userId.toString() === userId
  );
  if (attendeeIndex === -1) {
    throw new Error("User not registered for this event");
  }

  this.attendees.splice(attendeeIndex, 1);
  this.currentAttendees = Math.max(0, this.currentAttendees - 1);
  return this.save();
};

// Instance method to add feedback
eventSchema.methods.addFeedback = function (
  userId: string,
  rating: number,
  comment?: string
) {
  const existingFeedback = this.feedback.find(
    (feedback: any) => feedback.userId.toString() === userId
  );
  if (existingFeedback) {
    throw new Error("User has already provided feedback");
  }

  this.feedback.push({ userId, rating, comment });
  return this.save();
};

// Static method to find upcoming events
eventSchema.statics.findUpcoming = function () {
  const now = new Date();
  return this.find({
    startDate: { $gte: now },
    status: { $in: ["upcoming", "ongoing"] },
  }).populate("organizer", "firstName lastName email profilePicture");
};

// Static method to find by type
eventSchema.statics.findByType = function (type: EventType) {
  return this.find({ type }).populate(
    "organizer",
    "firstName lastName email profilePicture"
  );
};

// Static method to find by location
eventSchema.statics.findByLocation = function (location: string) {
  return this.find({
    location: { $regex: location, $options: "i" },
  }).populate("organizer", "firstName lastName email profilePicture");
};

// Middleware to sync currentAttendees with attendees.length before saving
eventSchema.pre("save", function (next) {
  if (this.isModified("attendees")) {
    // Count only confirmed registrations
    try {
      const confirmedCount = Array.isArray(this.attendees)
        ? this.attendees.filter((a: any) => a && a.status === "registered")
            .length
        : 0;
      this.currentAttendees = confirmedCount;
    } catch (_err) {
      this.currentAttendees = 0;
    }
  }
  next();
});

// Ensure virtual fields are serialized
eventSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IEvent>("Event", eventSchema);
