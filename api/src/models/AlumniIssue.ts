import mongoose, { Schema, Document } from "mongoose";

export interface IAlumniIssue extends Document {
  _id: string;
  alumniId: mongoose.Types.ObjectId;
  raisedBy?: mongoose.Types.ObjectId; // Alumni who raised the issue
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: mongoose.Types.ObjectId;
  responses: Array<{
    _id?: string;
    staffId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }>;
  resolvedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const alumniIssueSchema = new Schema<IAlumniIssue>(
  {
    alumniId: {
      type: mongoose.Types.ObjectId as any,
      ref: "AlumniProfile",
      required: [true, "Alumni ID is required"],
      index: true,
    },
    raisedBy: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      index: true,
    },
    title: {
      type: String,
      required: [true, "Issue title is required"],
      trim: true,
      maxlength: [200, "Issue title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Issue description is required"],
      trim: true,
      maxlength: [5000, "Issue description cannot exceed 5000 characters"],
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    assignedTo: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      index: true,
    },
    responses: [
      {
        staffId: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [5000, "Response content cannot exceed 5000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
    },
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
alumniIssueSchema.index({ alumniId: 1, status: 1, createdAt: -1 });
alumniIssueSchema.index({ assignedTo: 1, status: 1 });
alumniIssueSchema.index({ priority: 1, status: 1 });
alumniIssueSchema.index({ status: 1 });

export default mongoose.model<IAlumniIssue>("AlumniIssue", alumniIssueSchema);

