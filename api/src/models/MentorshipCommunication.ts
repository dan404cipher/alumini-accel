import mongoose, { Schema } from "mongoose";
import { IMentorshipCommunication } from "../types";

const mentorshipCommunicationSchema = new Schema<IMentorshipCommunication>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: "Community",
      required: [true, "Community ID is required"],
    },
    fromUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "From user ID is required"],
    },
    toUserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "To user ID is required"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [200, "Subject cannot exceed 200 characters"],
    },
    body: {
      type: String,
      required: [true, "Email body is required"],
    },
    attachments: [
      {
        type: String,
        trim: true,
      },
    ],
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    relatedMentorshipId: {
      type: Schema.Types.ObjectId,
      ref: "MentorMenteeMatching",
    },
    relatedProgramId: {
      type: Schema.Types.ObjectId,
      ref: "MentoringProgram",
    },
    replyToId: {
      type: Schema.Types.ObjectId,
      ref: "MentorshipCommunication",
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
mentorshipCommunicationSchema.index({ communityId: 1 });
mentorshipCommunicationSchema.index({ fromUserId: 1 });
mentorshipCommunicationSchema.index({ toUserId: 1 });
mentorshipCommunicationSchema.index({ relatedMentorshipId: 1 });
mentorshipCommunicationSchema.index({ sentAt: -1 });
mentorshipCommunicationSchema.index({ isRead: 1 });
mentorshipCommunicationSchema.index({ tenantId: 1 });
mentorshipCommunicationSchema.index({ communityId: 1, sentAt: -1 });

// Virtual for sender details
mentorshipCommunicationSchema.virtual("fromUser", {
  ref: "User",
  localField: "fromUserId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for recipient details
mentorshipCommunicationSchema.virtual("toUser", {
  ref: "User",
  localField: "toUserId",
  foreignField: "_id",
  justOne: true,
});

// Virtual for community details
mentorshipCommunicationSchema.virtual("community", {
  ref: "Community",
  localField: "communityId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
mentorshipCommunicationSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IMentorshipCommunication>(
  "MentorshipCommunication",
  mentorshipCommunicationSchema
);

