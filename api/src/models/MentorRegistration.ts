import mongoose, { Schema } from "mongoose";
import {
  IMentorRegistration,
  MentorRegistrationStatus,
} from "../types";

const mentorRegistrationSchema = new Schema<IMentorRegistration>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: "MentoringProgram",
      required: [true, "Program ID is required"],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    status: {
      type: String,
      enum: Object.values(MentorRegistrationStatus),
      default: MentorRegistrationStatus.SUBMITTED,
    },
    title: {
      type: String,
      enum: ["Mr", "Mrs", "Ms", "Dr"],
      required: [true, "Title is required"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [30, "First name cannot exceed 30 characters"],
      validate: {
        validator: function (v: string) {
          // Allow only letters, numbers, spaces, hyphens, underscores
          return /^[a-zA-Z0-9\s\-_]+$/.test(v);
        },
        message:
          "First name can only contain letters, numbers, spaces, hyphens, and underscores",
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [30, "Last name cannot exceed 30 characters"],
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9\s\-_]+$/.test(v);
        },
        message:
          "Last name can only contain letters, numbers, spaces, hyphens, and underscores",
      },
    },
    preferredName: {
      type: String,
      required: [true, "Preferred name is required"],
      trim: true,
      maxlength: [100, "Preferred name cannot exceed 100 characters"],
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z0-9\s\-_]+$/.test(v);
        },
        message:
          "Preferred name can only contain letters, numbers, spaces, hyphens, and underscores",
      },
    },
    mobileNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          if (!v) return true; // Optional field
          // Basic phone validation - can be enhanced with country code validation
          return /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/.test(
            v
          );
        },
        message: "Please enter a valid phone number",
      },
    },
    dateOfBirth: {
      type: Date,
      required: [true, "Date of birth is required"],
      validate: {
        validator: function (v: Date) {
          const today = new Date();
          const minDate = new Date(
            today.getFullYear() - 16,
            today.getMonth(),
            today.getDate()
          );
          return v <= minDate;
        },
        message: "You must be at least 16 years old",
      },
    },
    personalEmail: {
      type: String,
      required: [true, "Personal email is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Please enter a valid email address",
      },
    },
    sitEmail: {
      type: String,
      required: false, // Made optional - removed from form
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          // Only validate if provided
          if (!v) return true;
          // Check SIT domain (configurable)
          const sitDomains = [
            "@sit.edu",
            "@sit.sg",
            process.env.SIT_EMAIL_DOMAIN || "@sit.edu",
          ];
          return (
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) &&
            sitDomains.some((domain) => v.endsWith(domain))
          );
        },
        message: "SIT email must be a valid email with SIT domain",
      },
    },
    classOf: {
      type: Number,
      required: [true, "Class of year is required"],
      min: [1950, "Class of year must be after 1950"],
      max: [
        new Date().getFullYear(),
        "Class of year cannot be in the future",
      ],
    },
    sitStudentId: {
      type: String,
      required: false, // Made optional - removed from form
      trim: true,
      maxlength: [10, "SIT Student ID cannot exceed 10 characters"],
      // Validation removed - field is optional now
    },
    sitMatricNumber: {
      type: String,
      trim: true,
      maxlength: [10, "SIT Matric Number cannot exceed 10 characters"],
      validate: {
        validator: function (this: IMentorRegistration, v: string): boolean {
          // Required if classOf < 2017
          if (this.classOf < 2017) {
            return !!(v && v.trim().length > 0);
          }
          return true;
        },
        message: "SIT Matric Number is required for pre-class of 2017",
      },
    },
    mentorCV: {
      type: String,
      trim: true,
    },
    areasOfMentoring: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Area of mentoring cannot exceed 100 characters"],
      },
    ],
    fbPreference: {
      type: String,
      trim: true,
      maxlength: [100, "F&B Preference cannot exceed 100 characters"],
    },
    dietaryRestrictions: {
      type: String,
      trim: true,
      maxlength: [100, "Dietary restrictions cannot exceed 100 characters"],
    },
    optionToReceiveFB: {
      type: Boolean,
      default: false,
    },
    preferredMailingAddress: {
      type: String,
      required: [true, "Preferred mailing address is required"],
      trim: true,
      lowercase: true,
      validate: {
        validator: function (v: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: "Preferred mailing address must be a valid email",
      },
    },
    eventSlotPreference: {
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      startTime: {
        type: String,
      },
      endTime: {
        type: String,
      },
    },
    eventMeetupPreference: {
      type: String,
      trim: true,
      maxlength: [100, "Event meetup preference cannot exceed 100 characters"],
    },
    pdpaConsent: {
      type: Boolean,
      required: [true, "PDPA consent is required"],
      validate: {
        validator: function (v: boolean) {
          return v === true;
        },
        message: "PDPA consent must be accepted",
      },
    },
    recaptchaToken: {
      type: String,
      required: [true, "reCAPTCHA token is required"],
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
    },
    rejectedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    rejectedAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvalHistory: [
      {
        action: {
          type: String,
          enum: ["approve", "reject", "reconsider", "disapprove"],
        },
        performedBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        performedAt: {
          type: Date,
          default: Date.now,
        },
        notes: {
          type: String,
          trim: true,
        },
        reason: {
          type: String,
          trim: true,
        },
      },
    ],
    canReconsider: {
      type: Boolean,
      default: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save validation
mentorRegistrationSchema.pre("save", function (next) {
  const doc = this as any;

  // Validate personal email and SIT email are different
  if (doc.personalEmail && doc.sitEmail && doc.personalEmail === doc.sitEmail) {
    return next(new Error("Personal email and SIT email must be different"));
  }

  // Validate event slot dates if provided
  if (doc.eventSlotPreference) {
    if (
      doc.eventSlotPreference.endDate &&
      doc.eventSlotPreference.startDate &&
      doc.eventSlotPreference.endDate <= doc.eventSlotPreference.startDate
    ) {
      return next(
        new Error("Event slot end date must be after start date")
      );
    }
  }

  next();
});

// Indexes for better query performance
mentorRegistrationSchema.index({ programId: 1 });
mentorRegistrationSchema.index({ userId: 1 });
mentorRegistrationSchema.index({ status: 1 });
mentorRegistrationSchema.index({ tenantId: 1 });
mentorRegistrationSchema.index({ submittedAt: -1 });

// Compound index to prevent duplicate registrations
mentorRegistrationSchema.index(
  { programId: 1, userId: 1 },
  { unique: true }
);

// Virtual for program details
mentorRegistrationSchema.virtual("program", {
  ref: "MentoringProgram",
  localField: "programId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for user details
mentorRegistrationSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
mentorRegistrationSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IMentorRegistration>(
  "MentorRegistration",
  mentorRegistrationSchema
);

