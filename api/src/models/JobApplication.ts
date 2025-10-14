import mongoose, { Document, Schema } from "mongoose";

export interface IJobApplication extends Document {
  _id: string;
  jobId: mongoose.Types.ObjectId;
  applicantId: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  resume?: string; // File path or URL
  skills: string[];
  experience: string;
  contactDetails: {
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
  status: "Applied" | "Shortlisted" | "Rejected" | "Hired";
  appliedAt: Date;
  updatedAt: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
}

const JobApplicationSchema = new Schema<IJobApplication>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: "JobPost",
      required: true,
    },
    applicantId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    resume: {
      type: String,
      default: null,
    },
    skills: {
      type: [String],
      required: true,
    },
    experience: {
      type: String,
      required: true,
    },
    contactDetails: {
      name: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
        required: true,
      },
    },
    message: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["Applied", "Shortlisted", "Rejected", "Hired"],
      default: "Applied",
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewNotes: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
JobApplicationSchema.index({ jobId: 1, applicantId: 1 }, { unique: true });
JobApplicationSchema.index({ applicantId: 1 });
JobApplicationSchema.index({ jobId: 1 });
JobApplicationSchema.index({ status: 1 });
JobApplicationSchema.index({ tenantId: 1 });

// Update the updatedAt field before saving
JobApplicationSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const JobApplication = mongoose.model<IJobApplication>(
  "JobApplication",
  JobApplicationSchema
);

export default JobApplication;
