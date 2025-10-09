import mongoose, { Schema } from "mongoose";
import { IJobPost, JobPostStatus } from "../types";

const jobPostSchema = new Schema<IJobPost>(
  {
    tenantId: {
      type: mongoose.Types.ObjectId as any,
      ref: "Tenant",
      required: true,
      index: true,
    },
    postedBy: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    position: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    type: {
      type: String,
      required: true,
      enum: ["full-time", "part-time", "internship", "contract"],
    },
    experience: {
      type: String,
      enum: ["entry", "mid", "senior", "lead"],
      default: "mid",
    },
    industry: {
      type: String,
      enum: [
        "technology",
        "finance",
        "healthcare",
        "education",
        "consulting",
        "marketing",
        "sales",
        "operations",
        "other",
      ],
      default: "technology",
    },
    remote: {
      type: Boolean,
      default: false,
    },
    salary: {
      min: {
        type: Number,
        required: true,
        min: [0, "Minimum salary cannot be negative"],
      },
      max: {
        type: Number,
        required: true,
        min: [0, "Maximum salary cannot be negative"],
      },
      currency: {
        type: String,
        default: "USD",
        enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CHF", "CNY"],
      },
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    requirements: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Requirement cannot exceed 200 characters"],
      },
    ],
    benefits: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Benefit cannot exceed 200 characters"],
      },
    ],
    status: {
      type: String,
      enum: Object.values(JobPostStatus),
      default: JobPostStatus.PENDING,
      required: true,
    },
    applications: [
      {
        applicantId: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
          required: true,
        },
        appliedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["pending", "shortlisted", "rejected", "hired"],
          default: "pending",
        },
        resume: {
          type: String,
          trim: true,
        },
        coverLetter: {
          type: String,
          trim: true,
          maxlength: [1000, "Cover letter cannot exceed 1000 characters"],
        },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    deadline: {
      type: Date,
    },
    companyWebsite: {
      type: String,
      trim: true,
      maxlength: [500, "Company website cannot exceed 500 characters"],
    },
    applicationUrl: {
      type: String,
      trim: true,
      maxlength: [500, "Application URL cannot exceed 500 characters"],
    },
    contactEmail: {
      type: String,
      trim: true,
      maxlength: [100, "Contact email cannot exceed 100 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
jobPostSchema.index({ tenantId: 1, status: 1 });
jobPostSchema.index({ postedBy: 1 });
jobPostSchema.index({ status: 1 });
jobPostSchema.index({ company: 1 });
jobPostSchema.index({ location: 1 });
jobPostSchema.index({ type: 1 });
jobPostSchema.index({ tags: 1 });
jobPostSchema.index({ createdAt: -1 });
jobPostSchema.index({ deadline: 1 });

// Virtual for poster details
jobPostSchema.virtual("poster", {
  ref: "User",
  localField: "postedBy",
  foreignField: "_id",
  justOne: true,
});

// Virtual for applications count
jobPostSchema.virtual("applicationsCount").get(function () {
  return this.applications.length;
});

// Virtual for days until deadline
jobPostSchema.virtual("daysUntilDeadline").get(function () {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Instance method to add application
jobPostSchema.methods.addApplication = function (
  applicantId: string,
  resume?: string,
  coverLetter?: string
) {
  const existingApplication = this.applications.find(
    (app: any) => app.applicantId.toString() === applicantId
  );
  if (existingApplication) {
    throw new Error("Application already exists");
  }

  this.applications.push({
    applicantId,
    resume,
    coverLetter,
  });

  return this.save();
};

// Instance method to update application status
jobPostSchema.methods.updateApplicationStatus = function (
  applicantId: string,
  status: string
) {
  const application = this.applications.find(
    (app: any) => app.applicantId.toString() === applicantId
  );
  if (!application) {
    throw new Error("Application not found");
  }

  application.status = status;
  return this.save();
};

// Static method to find active jobs
jobPostSchema.statics.findActive = function () {
  return this.find({ status: JobPostStatus.ACTIVE })
    .populate("poster", "firstName lastName email profilePicture")
    .sort({ createdAt: -1 });
};

// Static method to find by company
jobPostSchema.statics.findByCompany = function (company: string) {
  return this.find({
    company: { $regex: company, $options: "i" },
    status: JobPostStatus.ACTIVE,
  }).populate("poster", "firstName lastName email profilePicture");
};

// Static method to find by location
jobPostSchema.statics.findByLocation = function (location: string) {
  return this.find({
    location: { $regex: location, $options: "i" },
    status: JobPostStatus.ACTIVE,
  }).populate("poster", "firstName lastName email profilePicture");
};

// Static method to find by type
jobPostSchema.statics.findByType = function (type: string) {
  return this.find({
    type,
    status: JobPostStatus.ACTIVE,
  }).populate("poster", "firstName lastName email profilePicture");
};

// Ensure virtual fields are serialized
jobPostSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IJobPost>("JobPost", jobPostSchema);
