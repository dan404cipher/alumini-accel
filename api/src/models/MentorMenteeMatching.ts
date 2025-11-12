import mongoose, { Schema } from "mongoose";
import {
  IMentorMenteeMatching,
  MatchingStatus,
  MatchType,
} from "../types";

const mentorMenteeMatchingSchema = new Schema<IMentorMenteeMatching>(
  {
    programId: {
      type: Schema.Types.ObjectId,
      ref: "MentoringProgram",
      required: [true, "Program ID is required"],
    },
    menteeId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentee ID is required"],
    },
    menteeRegistrationId: {
      type: Schema.Types.ObjectId,
      ref: "MenteeRegistration",
      required: [true, "Mentee registration ID is required"],
    },
    mentorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Mentor ID is required"],
    },
    mentorRegistrationId: {
      type: Schema.Types.ObjectId,
      ref: "MentorRegistration",
      required: [true, "Mentor registration ID is required"],
    },
    matchScore: {
      type: Number,
      required: true,
      min: [0, "Match score cannot be negative"],
      max: [100, "Match score cannot exceed 100"],
    },
    matchType: {
      type: String,
      enum: Object.values(MatchType),
      required: true,
    },
    preferredChoiceOrder: {
      type: Number,
      min: [1, "Preferred choice order must be at least 1"],
      max: [3, "Preferred choice order cannot exceed 3"],
    },
    status: {
      type: String,
      enum: Object.values(MatchingStatus),
      default: MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
    },
    menteeSelectedMentors: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    matchedAt: {
      type: Date,
      default: Date.now,
    },
    mentorResponseAt: {
      type: Date,
    },
    autoRejectAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    matchedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    mentorshipCommunityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
    },
    scoreBreakdown: {
      industryScore: Number,
      programmeScore: Number,
      skillsScore: Number,
      preferenceScore: Number,
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

// Indexes
mentorMenteeMatchingSchema.index({ programId: 1 });
mentorMenteeMatchingSchema.index({ menteeId: 1 });
mentorMenteeMatchingSchema.index({ mentorId: 1 });
mentorMenteeMatchingSchema.index({ status: 1 });
mentorMenteeMatchingSchema.index({ autoRejectAt: 1 });
mentorMenteeMatchingSchema.index({ tenantId: 1 });
mentorMenteeMatchingSchema.index({ programId: 1, menteeId: 1 });

// Prevent duplicate active matches (one active match per mentee per program)
mentorMenteeMatchingSchema.index(
  { programId: 1, menteeId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: [
          MatchingStatus.PENDING_MENTOR_ACCEPTANCE,
          MatchingStatus.ACCEPTED,
        ],
      },
    },
  }
);

// Virtual for program details
mentorMenteeMatchingSchema.virtual("program", {
  ref: "MentoringProgram",
  localField: "programId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for mentee details
mentorMenteeMatchingSchema.virtual("mentee", {
  ref: "User",
  localField: "menteeId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for mentor details
mentorMenteeMatchingSchema.virtual("mentor", {
  ref: "User",
  localField: "mentorId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
mentorMenteeMatchingSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IMentorMenteeMatching>(
  "MentorMenteeMatching",
  mentorMenteeMatchingSchema
);

