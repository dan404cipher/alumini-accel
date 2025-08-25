import mongoose, { Schema } from "mongoose";
import { IEvent, EventType } from "@/types";

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
      type: String,
      enum: Object.values(EventType),
      required: true,
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
        time: {
          type: String,
          required: true,
          trim: true,
          match: [
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            "Time must be in HH:MM format",
          ],
        },
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
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
      },
    ],
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
eventSchema.virtual("attendeesCount").get(function () {
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

// Ensure virtual fields are serialized
eventSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IEvent>("Event", eventSchema);
