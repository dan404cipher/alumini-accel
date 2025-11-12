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
  
  // Validate program end date is after start date
  if (doc.programDuration && doc.programDuration.endDate <= doc.programDuration.startDate) {
    return next(new Error("Program end date must be after start date"));
  }

  // Validate registration dates are after program start date
  if (doc.programDuration?.startDate) {
    const programStart = new Date(doc.programDuration.startDate);
    
    if (doc.registrationEndDateMentee && doc.registrationEndDateMentee <= programStart) {
      return next(new Error("Mentee registration end date must be after program start date"));
    }
    if (doc.registrationEndDateMentor && doc.registrationEndDateMentor <= programStart) {
      return next(new Error("Mentor registration end date must be after program start date"));
    }
  }

  // Validate matching end date is after both registration end dates
  if (
    doc.matchingEndDate &&
    (doc.matchingEndDate <= doc.registrationEndDateMentee ||
      doc.matchingEndDate <= doc.registrationEndDateMentor)
  ) {
    return next(
      new Error(
        "Matching end date must be after both registration end dates"
      )
    );
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

