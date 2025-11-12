import mongoose, { Schema } from "mongoose";
import {
  IMenteeRegistration,
  MenteeRegistrationStatus,
} from "../types";
import crypto from "crypto";

const menteeRegistrationSchema = new Schema<IMenteeRegistration>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: "MentoringProgram",
      required: [true, "Program ID is required"],
    },
    registrationToken: {
      type: String,
      required: true,
      unique: true,
    },
    status: {
      type: String,
      enum: Object.values(MenteeRegistrationStatus),
      default: MenteeRegistrationStatus.SUBMITTED,
    },
    title: {
      type: String,
      enum: ["Mr", "Mrs", "Ms"],
      required: [true, "Title is required"],
    },
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
      maxlength: [30, "First name cannot exceed 30 characters"],
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z\s]+$/.test(v);
        },
        message:
          "First name can only contain letters (a-z, A-Z) and spaces",
      },
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
      maxlength: [30, "Last name cannot exceed 30 characters"],
      validate: {
        validator: function (v: string) {
          return /^[a-zA-Z\s]+$/.test(v);
        },
        message:
          "Last name can only contain letters (a-z, A-Z) and spaces",
      },
    },
    mobileNumber: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          // Optional field - if empty, validation passes
          if (!v || !v.trim()) return true;
          
          // Remove all spaces, dashes, and parentheses for validation
          const cleanedNumber = v.replace(/[\s\-\(\)]/g, "");
          
          // Indian mobile number validation: 10 digits starting with 9, 8, 7, or 6
          // Accept formats: 9876543210, +91 9876543210, 91 9876543210
          let digits = cleanedNumber;
          
          // Remove country code if present (+91 or 91)
          if (cleanedNumber.startsWith("+91")) {
            digits = cleanedNumber.substring(3);
          } else if (cleanedNumber.startsWith("91") && cleanedNumber.length === 12) {
            digits = cleanedNumber.substring(2);
          }
          
          // Validate: exactly 10 digits starting with 9, 8, 7, or 6
          const indianMobileRegex = /^[6789]\d{9}$/;
          
          return indianMobileRegex.test(digits);
        },
        message: "Please enter a valid Indian mobile number (10 digits starting with 9, 8, 7, or 6). Example: 9876543210 or +91 9876543210",
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
      required: false, // Optional field - removed from form
      trim: true,
      lowercase: true,
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
      trim: true,
      maxlength: [10, "SIT Student ID cannot exceed 10 characters"],
      validate: {
        validator: function (this: IMenteeRegistration, v: string): boolean {
          if (this.classOf >= 2017) {
            return !!(v && v.trim().length > 0);
          }
          return true;
        },
        message: "SIT Student ID is required for post-class of 2017",
      },
    },
    sitMatricNumber: {
      type: String,
      trim: true,
      maxlength: [10, "SIT Matric Number cannot exceed 10 characters"],
      validate: {
        validator: function (this: IMenteeRegistration, v: string): boolean {
          if (this.classOf < 2017) {
            return !!(v && v.trim().length > 0);
          }
          return true;
        },
        message: "SIT Matric Number is required for pre-class of 2017",
      },
    },
    menteeCV: {
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
      type: String,
      enum: ["Weekend afternoon", "Weekday evenings"],
      required: [true, "Event slot preference is required"],
    },
    eventMeetupPreference: {
      type: String,
      enum: ["Virtual", "Physical"],
      required: [true, "Event meetup preference is required"],
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
    validatedStudentId: {
      type: String,
      trim: true,
    },
    preferredMentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ], // Array of 3 mentor IDs in preference order
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
menteeRegistrationSchema.pre("save", function (next) {
  const doc = this as any;


  next();
});

// Indexes for better query performance
menteeRegistrationSchema.index({ programId: 1 });
// Note: registrationToken already has unique: true in schema definition, so we don't need to add it again
menteeRegistrationSchema.index({ status: 1 });
menteeRegistrationSchema.index({ tenantId: 1 });
menteeRegistrationSchema.index({ submittedAt: -1 });

// Virtual for program details
menteeRegistrationSchema.virtual("program", {
  ref: "MentoringProgram",
  localField: "programId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
menteeRegistrationSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IMenteeRegistration>(
  "MenteeRegistration",
  menteeRegistrationSchema
);

// Helper function to generate unique registration token
export const generateRegistrationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

