import mongoose, { Schema } from "mongoose";
import {
  IMentoringProgram,
  MentoringProgramStatus,
  ProgramSchedule,
} from "../types";

const mentoringProgramSchema = new Schema<IMentoringProgram>(
  {
    category: {
      type: String,
      required: [true, "Program category is required"],
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Program name is required"],
      trim: true,
      maxlength: [75, "Name cannot exceed 75 characters"],
      validate: {
        validator: function (v: string) {
          // Allow letters, numbers, spaces, and hyphens only
          return /^[a-zA-Z0-9\s\-]+$/.test(v);
        },
        message: "Name can only contain letters, numbers, spaces, and hyphens",
      },
    },
    shortDescription: {
      type: String,
      required: [true, "Short description is required"],
      trim: true,
      maxlength: [250, "Short description cannot exceed 250 characters"],
      validate: {
        validator: function (v: string) {
          // Allow letters, numbers, spaces, hyphens, and basic punctuation
          return /^[a-zA-Z0-9\s\-.,!?()]+$/.test(v);
        },
        message:
          "Short description contains invalid characters",
      },
    },
    longDescription: {
      type: String,
      trim: true,
    },
    programSchedule: {
      type: String,
      enum: Object.values(ProgramSchedule),
      required: [true, "Program schedule is required"],
    },
    programDuration: {
      startDate: {
        type: Date,
        required: [true, "Program start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "Program end date is required"],
      },
    },
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
    areasOfMentoring: {
      mentor: [
        {
          type: String,
          trim: true,
        },
      ],
      mentee: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    entryCriteriaRules: {
      type: String,
      trim: true,
    },
    registrationEndDateMentee: {
      type: Date,
      required: [true, "Mentee registration end date is required"],
    },
    registrationEndDateMentor: {
      type: Date,
      required: [true, "Mentor registration end date is required"],
    },
    matchingEndDate: {
      type: Date,
      required: [true, "Matching end date is required"],
    },
    mentoringAgreementForm: {
      type: String,
      trim: true,
    },
    manager: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Manager is required"],
    },
    coordinators: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reportsEscalationsTo: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    registrationApprovalBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Registration approval by is required"],
    },
    emailTemplateMentorInvitation: {
      type: Schema.Types.ObjectId,
      ref: "EmailTemplate",
    },
    emailTemplateMenteeInvitation: {
      type: Schema.Types.ObjectId,
      ref: "EmailTemplate",
    },
    status: {
      type: String,
      enum: Object.values(MentoringProgramStatus),
      default: MentoringProgramStatus.DRAFT,
    },
    mentorsPublished: {
      type: Boolean,
      default: false,
    },
    mentorsPublishedAt: {
      type: Date,
    },
    publishedMentorsCount: {
      type: Number,
      default: 0,
    },
    publishedMentorIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "MentorRegistration",
      },
    ],
    menteeSelectionEmailsSent: {
      type: Boolean,
      default: false,
    },
    matchingProcessStartDate: {
      type: Date,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

// Pre-save validation hook
mentoringProgramSchema.pre("save", function (next) {
  const doc = this as any;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  // Validate program end date is after start date
  if (doc.programDuration && doc.programDuration.endDate <= doc.programDuration.startDate) {
    return next(new Error("Program end date must be after start date"));
  }

  // Validate dates if program duration exists
  if (doc.programDuration?.startDate) {
    const programStart = new Date(doc.programDuration.startDate);
    programStart.setHours(0, 0, 0, 0);
    const programEnd = new Date(doc.programDuration.endDate);
    programEnd.setHours(0, 0, 0, 0);
    
    // Validate that start date is in the future
    if (programStart <= now) {
      return next(new Error("Program start date must be in the future"));
    }
    
    // Validate that end date is in the future
    if (programEnd <= now) {
      return next(new Error("Program end date must be in the future"));
    }
    
    // Validate matching end date is before start date
    if (doc.matchingEndDate) {
      const matchEnd = new Date(doc.matchingEndDate);
      matchEnd.setHours(0, 0, 0, 0);
      
      if (matchEnd >= programStart) {
        return next(new Error("Matching end date must be before program start date"));
  }

      // Validate registration dates are before matching end date
      if (doc.registrationEndDateMentee) {
        const menteeRegEnd = new Date(doc.registrationEndDateMentee);
        menteeRegEnd.setHours(0, 0, 0, 0);
        if (menteeRegEnd >= matchEnd) {
          return next(new Error("Mentee registration end date must be before matching end date"));
        }
      }
      
      if (doc.registrationEndDateMentor) {
        const mentorRegEnd = new Date(doc.registrationEndDateMentor);
        mentorRegEnd.setHours(0, 0, 0, 0);
        if (mentorRegEnd >= matchEnd) {
          return next(new Error("Mentor registration end date must be before matching end date"));
        }
      }
    }
  }

  next();
});

// Indexes for better query performance
mentoringProgramSchema.index({ category: 1 });
mentoringProgramSchema.index({ status: 1 });
mentoringProgramSchema.index({ tenantId: 1 });
mentoringProgramSchema.index({ createdBy: 1 });
mentoringProgramSchema.index({ manager: 1 });
mentoringProgramSchema.index({ createdAt: -1 });

// Virtual for program status check
mentoringProgramSchema.virtual("isRegistrationOpen").get(function () {
  const doc = this as any;
  const now = new Date();
  return (
    doc.status === MentoringProgramStatus.PUBLISHED &&
    (now <= doc.registrationEndDateMentee ||
      now <= doc.registrationEndDateMentor)
  );
});

// Virtual for matching status check
mentoringProgramSchema.virtual("isMatchingOpen").get(function () {
  const doc = this as any;
  const now = new Date();
  return (
    doc.status === MentoringProgramStatus.PUBLISHED &&
    now <= doc.matchingEndDate
  );
});

// Ensure virtual fields are serialized
mentoringProgramSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IMentoringProgram>(
  "MentoringProgram",
  mentoringProgramSchema
);

