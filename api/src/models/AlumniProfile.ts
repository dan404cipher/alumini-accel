import mongoose, { Schema } from "mongoose";
import { IAlumniProfile } from "@/types";

const alumniProfileSchema = new Schema<IAlumniProfile>(
  {
    userId: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
      unique: true,
    },
    batchYear: {
      type: Number,
      required: true,
      min: [1950, "Batch year must be after 1950"],
      max: [new Date().getFullYear() + 1, "Batch year cannot be in the future"],
    },
    graduationYear: {
      type: Number,
      required: true,
      min: [1950, "Graduation year must be after 1950"],
      max: [
        new Date().getFullYear() + 1,
        "Graduation year cannot be in the future",
      ],
    },
    university: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "University cannot exceed 100 characters"],
    },
    program: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Program cannot exceed 100 characters"],
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [100, "Specialization cannot exceed 100 characters"],
    },
    rollNumber: {
      type: String,
      trim: true,
      maxlength: [20, "Roll number cannot exceed 20 characters"],
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: [20, "Student ID cannot exceed 20 characters"],
    },
    currentCompany: {
      type: String,
      trim: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },
    currentPosition: {
      type: String,
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    currentLocation: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    experience: {
      type: Number,
      default: 0,
      min: [0, "Experience cannot be negative"],
    },
    salary: {
      type: Number,
      min: [0, "Salary cannot be negative"],
    },
    currency: {
      type: String,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY", "CHF", "CNY"],
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Skill name cannot exceed 50 characters"],
      },
    ],
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: [
          200,
          "Achievement description cannot exceed 200 characters",
        ],
      },
    ],
    internshipExperience: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
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
        description: {
          type: String,
          trim: true,
          maxlength: [1000, "Description cannot exceed 1000 characters"],
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        isOngoing: {
          type: Boolean,
          default: false,
        },
        location: {
          type: String,
          trim: true,
          maxlength: [100, "Location cannot exceed 100 characters"],
        },
        isRemote: {
          type: Boolean,
          default: false,
        },
        stipend: {
          amount: {
            type: Number,
            min: [0, "Stipend amount cannot be negative"],
          },
          currency: {
            type: String,
            default: "INR",
            enum: ["INR", "USD", "EUR", "GBP", "CAD", "AUD"],
          },
        },
        skills: [
          {
            type: String,
            trim: true,
            maxlength: [50, "Skill name cannot exceed 50 characters"],
          },
        ],
        certificateFile: {
          type: String,
          trim: true,
        },
      },
    ],
    researchWork: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Research title cannot exceed 200 characters"],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            1000,
            "Research description cannot exceed 1000 characters",
          ],
        },
        supervisor: {
          type: String,
          trim: true,
          maxlength: [100, "Supervisor name cannot exceed 100 characters"],
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        isOngoing: {
          type: Boolean,
          default: false,
        },
        publicationUrl: {
          type: String,
          trim: true,
        },
        conferenceUrl: {
          type: String,
          trim: true,
        },
        keywords: [
          {
            type: String,
            trim: true,
            maxlength: [50, "Keyword cannot exceed 50 characters"],
          },
        ],
        status: {
          type: String,
          enum: ["ongoing", "completed", "published", "presented"],
          default: "ongoing",
        },
        publicationFile: {
          type: String,
          trim: true,
        },
        conferenceFile: {
          type: String,
          trim: true,
        },
      },
    ],
    certifications: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Certification name cannot exceed 100 characters"],
        },
        issuer: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Issuer name cannot exceed 100 characters"],
        },
        date: {
          type: Date,
          required: true,
        },
        credentialId: {
          type: String,
          trim: true,
          maxlength: [50, "Credential ID cannot exceed 50 characters"],
        },
        credentialFile: {
          type: String,
          trim: true,
        },
      },
    ],
    education: [
      {
        degree: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Degree name cannot exceed 100 characters"],
        },
        institution: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Institution name cannot exceed 100 characters"],
        },
        year: {
          type: Number,
          required: true,
          min: [1950, "Year must be after 1950"],
          max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
        },
        gpa: {
          type: Number,
          min: [0, "GPA cannot be negative"],
          max: [4, "GPA cannot exceed 4.0"],
        },
      },
    ],
    careerTimeline: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
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
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        isCurrent: {
          type: Boolean,
          default: false,
        },
        description: {
          type: String,
          trim: true,
          maxlength: [500, "Description cannot exceed 500 characters"],
        },
        location: {
          type: String,
          trim: true,
          maxlength: [100, "Location cannot exceed 100 characters"],
        },
        logo: {
          type: String,
          trim: true,
        },
      },
    ],
    isHiring: {
      type: Boolean,
      default: false,
    },
    availableForMentorship: {
      type: Boolean,
      default: false,
    },
    mentorshipDomains: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Domain name cannot exceed 50 characters"],
      },
    ],
    availableSlots: [
      {
        day: {
          type: String,
          required: true,
          enum: [
            "monday",
            "tuesday",
            "wednesday",
            "thursday",
            "friday",
            "saturday",
            "sunday",
          ],
        },
        timeSlots: [
          {
            type: String,
            required: true,
            match: [
              /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
              "Time must be in HH:MM format",
            ],
          },
        ],
      },
    ],
    testimonials: [
      {
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [1000, "Testimonial cannot exceed 1000 characters"],
        },
        author: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Author name cannot exceed 100 characters"],
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    photos: [
      {
        type: String,
        trim: true,
      },
    ],
    projects: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Project title cannot exceed 200 characters"],
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            1000,
            "Project description cannot exceed 1000 characters",
          ],
        },
        technologies: [
          {
            type: String,
            trim: true,
            maxlength: [50, "Technology name cannot exceed 50 characters"],
          },
        ],
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        isOngoing: {
          type: Boolean,
          default: false,
        },
        githubUrl: {
          type: String,
          required: [true, "GitHub URL is required"],
          trim: true,
          validate: {
            validator: function (v: string) {
              return /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
            },
            message: "Please enter a valid GitHub URL",
          },
        },
        liveUrl: {
          type: String,
          trim: true,
          validate: {
            validator: function (v: string) {
              if (!v || v === "") return true; // Allow empty strings
              return /^https?:\/\/.+/.test(v);
            },
            message: "Please enter a valid live URL",
          },
        },
        teamMembers: [
          {
            name: {
              type: String,
              required: true,
              trim: true,
              maxlength: [100, "Name cannot exceed 100 characters"],
            },
            role: {
              type: String,
              required: true,
              trim: true,
              maxlength: [100, "Role cannot exceed 100 characters"],
            },
          },
        ],
      },
    ],
    careerInterests: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Career interest cannot exceed 50 characters"],
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: userId index is automatically created by unique: true
alumniProfileSchema.index({ batchYear: 1 });
alumniProfileSchema.index({ graduationYear: 1 });
alumniProfileSchema.index({ department: 1 });
alumniProfileSchema.index({ currentCompany: 1 });
alumniProfileSchema.index({ currentLocation: 1 });
alumniProfileSchema.index({ isHiring: 1 });
alumniProfileSchema.index({ availableForMentorship: 1 });
alumniProfileSchema.index({ skills: 1 });
alumniProfileSchema.index({ createdAt: -1 });

// Virtual for full name (populated from User)
alumniProfileSchema.virtual("user", {
  ref: "User",
  localField: "userId",
  foreignField: "_id",
  justOne: true,
});

// Instance method to get current position
alumniProfileSchema.methods.getCurrentPosition = function () {
  const currentJob = this.careerTimeline.find((job: any) => job.isCurrent);
  return currentJob ? currentJob.position : this.currentPosition;
};

// Instance method to get current company
alumniProfileSchema.methods.getCurrentCompany = function () {
  const currentJob = this.careerTimeline.find((job: any) => job.isCurrent);
  return currentJob ? currentJob.company : this.currentCompany;
};

// Instance method to add career entry
alumniProfileSchema.methods.addCareerEntry = function (entry: any) {
  // Set all other entries to not current
  this.careerTimeline.forEach((job: any) => {
    if (entry.isCurrent) {
      job.isCurrent = false;
    }
  });

  this.careerTimeline.push(entry);
  return this.save();
};

// Static method to find by batch year
alumniProfileSchema.statics.findByBatchYear = function (batchYear: number) {
  return this.find({ batchYear }).populate(
    "user",
    "firstName lastName email profilePicture"
  );
};

// Static method to find hiring alumni
alumniProfileSchema.statics.findHiring = function () {
  return this.find({ isHiring: true }).populate(
    "user",
    "firstName lastName email profilePicture"
  );
};

// Static method to find mentors
alumniProfileSchema.statics.findMentors = function () {
  return this.find({ availableForMentorship: true }).populate(
    "user",
    "firstName lastName email profilePicture"
  );
};

// Ensure virtual fields are populated
alumniProfileSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IAlumniProfile>(
  "AlumniProfile",
  alumniProfileSchema
);
