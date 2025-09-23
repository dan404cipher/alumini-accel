import mongoose, { Document, Schema } from "mongoose";

export interface IInvitation extends Document {
  name: string;
  email: string;
  graduationYear: number;
  degree?: string;
  currentRole?: string;
  company?: string;
  location?: string;
  linkedinProfile?: string;
  status: "pending" | "sent" | "opened" | "accepted" | "expired";
  token: string;
  expiresAt: Date;
  sentAt?: Date;
  openedAt?: Date;
  acceptedAt?: Date;
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invitationSchema = new Schema<IInvitation>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    graduationYear: {
      type: Number,
      required: true,
    },
    degree: {
      type: String,
      trim: true,
    },
    currentRole: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    linkedinProfile: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "opened", "accepted", "expired"],
      default: "pending",
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 }, // MongoDB TTL index
    },
    sentAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
    acceptedAt: {
      type: Date,
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
invitationSchema.index({ email: 1, status: 1 });
// Note: token and expiresAt indexes are automatically created by field definitions

export const Invitation = mongoose.model<IInvitation>(
  "Invitation",
  invitationSchema
);
