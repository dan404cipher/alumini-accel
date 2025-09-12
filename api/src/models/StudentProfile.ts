import mongoose, { Schema } from "mongoose";
import { IStudentProfile } from "@/types";

const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
      type: mongoose.Types.ObjectId as any,
      ref: "User",
      required: true,
      unique: true,
    },
    // Educational Details
    university: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "University name cannot exceed 200 characters"],
    },
    department: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    program: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Program cannot exceed 100 characters"],
    },
    batchYear: {
      type: Number,
      required: true,
      min: [2020, "Batch year must be 2020 or later"],
      max: [
        new Date().getFullYear() + 5,
        "Batch year cannot be more than 5 years in the future",
      ],
    },
    graduationYear: {
      type: Number,
      required: true,
      min: [2020, "Graduation year must be 2020 or later"],
      max: [
        new Date().getFullYear() + 5,
        "Graduation year cannot be more than 5 years in the future",
      ],
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
      maxlength: [20, "Roll number cannot exceed 20 characters"],
    },
    studentId: {
      type: String,
      trim: true,
      maxlength: [20, "Student ID cannot exceed 20 characters"],
    },
    achievements: [
      {
        type: String,
        trim: true,
        maxlength: [200, "Achievement cannot exceed 200 characters"],
      },
    ],
    certifications: [
      {
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
        credentialUrl: {
          type: String,
          trim: true,
        },
      },
    ],

    // Current Academic Details
    currentYear: {
      type: String,
      required: true,
      enum: [
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Final Year",
        "Graduate",
      ],
    },
    currentCGPA: {
      type: Number,
      min: [0, "CGPA cannot be negative"],
      max: [10, "CGPA cannot exceed 10"],
    },
    currentGPA: {
      type: Number,
      min: [0, "GPA cannot be negative"],
      max: [4, "GPA cannot exceed 4"],
    },
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
              required: [true, "Team member name is required"],
              trim: true,
              maxlength: [100, "Team member name cannot exceed 100 characters"],
            },
            role: {
              type: String,
              required: [true, "Team member role is required"],
              trim: true,
              maxlength: [50, "Role cannot exceed 50 characters"],
            },
          },
        ],
      },
    ],
    researchWork: [
      {
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
      },
    ],
    internshipExperience: [
      {
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
        certificateUrl: {
          type: String,
          trim: true,
        },
      },
    ],
    careerInterests: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Career interest cannot exceed 50 characters"],
      },
    ],

    // Social & Networking
    linkedinProfile: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/,
        "Please enter a valid LinkedIn profile URL",
      ],
    },
    githubProfile: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?github\.com\/[\w\-]+\/?$/,
        "Please enter a valid GitHub profile URL",
      ],
    },
    portfolioUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid portfolio URL"],
    },
    twitterHandle: {
      type: String,
      trim: true,
      match: [/^@?[\w]{1,15}$/, "Please enter a valid Twitter handle"],
    },
    otherSocialHandles: [
      {
        platform: {
          type: String,
          required: true,
          trim: true,
          maxlength: [50, "Platform name cannot exceed 50 characters"],
        },
        handle: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Handle cannot exceed 100 characters"],
        },
        url: {
          type: String,
          trim: true,
          match: [/^https?:\/\/.+/, "Please enter a valid URL"],
        },
      },
    ],

    // Connection Requests
    connectionRequests: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        userId: {
          type: mongoose.Types.ObjectId as any,
          ref: "User",
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        respondedAt: {
          type: Date,
        },
        message: {
          type: String,
          trim: true,
          maxlength: [500, "Message cannot exceed 500 characters"],
        },
      },
    ],
    connections: [
      {
        type: mongoose.Types.ObjectId as any,
        ref: "User",
      },
    ],

    // Skills & Interests
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Skill name cannot exceed 50 characters"],
      },
    ],
    interests: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Interest cannot exceed 50 characters"],
      },
    ],

    // Job Preferences
    preferredJobLocation: [
      {
        type: String,
        trim: true,
        maxlength: [100, "Location cannot exceed 100 characters"],
      },
    ],
    preferredJobTypes: [
      {
        type: String,
        enum: ["full-time", "part-time", "internship", "contract", "freelance"],
      },
    ],
    expectedSalary: {
      min: {
        type: Number,
        min: [0, "Minimum salary cannot be negative"],
      },
      max: {
        type: Number,
        min: [0, "Maximum salary cannot be negative"],
      },
      currency: {
        type: String,
        default: "INR",
        enum: ["INR", "USD", "EUR", "GBP", "CAD", "AUD"],
      },
    },

    // Events
    eventsRegistered: [
      {
        eventId: {
          type: mongoose.Types.ObjectId as any,
          ref: "Event",
          required: true,
        },
        registeredAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["registered", "attended", "cancelled"],
          default: "registered",
        },
      },
    ],
    eventsAttended: [
      {
        eventId: {
          type: mongoose.Types.ObjectId as any,
          ref: "Event",
          required: true,
        },
        attendedAt: {
          type: Date,
          required: true,
        },
        feedback: {
          rating: {
            type: Number,
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
          },
          comment: {
            type: String,
            trim: true,
            maxlength: [500, "Feedback comment cannot exceed 500 characters"],
          },
        },
      },
    ],

    // Additional Info
    isAvailableForInternships: {
      type: Boolean,
      default: true,
    },
    isAvailableForProjects: {
      type: Boolean,
      default: true,
    },
    isAvailableForMentorship: {
      type: Boolean,
      default: false,
    },
    mentorshipDomains: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Mentorship domain cannot exceed 50 characters"],
      },
    ],
    resumeUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid resume URL"],
    },
    coverLetterUrl: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid cover letter URL"],
    },
    additionalDocuments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
          maxlength: [100, "Document name cannot exceed 100 characters"],
        },
        url: {
          type: String,
          required: true,
          trim: true,
          match: [/^https?:\/\/.+/, "Please enter a valid document URL"],
        },
        type: {
          type: String,
          enum: ["transcript", "certificate", "portfolio", "other"],
          default: "other",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
// Note: userId index is automatically created by unique: true
studentProfileSchema.index({ university: 1 });
studentProfileSchema.index({ department: 1 });
studentProfileSchema.index({ batchYear: 1 });
studentProfileSchema.index({ graduationYear: 1 });
studentProfileSchema.index({ skills: 1 });
studentProfileSchema.index({ careerInterests: 1 });
studentProfileSchema.index({ "connectionRequests.userId": 1 });
studentProfileSchema.index({ "connectionRequests.status": 1 });

export default mongoose.model<IStudentProfile>(
  "StudentProfile",
  studentProfileSchema
);
