import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser, UserRole, UserStatus } from "../types";

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    password: {
      type: String,
      required: true,
      minlength: [8, "Password must be at least 8 characters long"],
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.ALUMNI,
      required: true,
    },
    roleId: {
      type: Schema.Types.ObjectId,
      ref: "Role",
      required: false, // Optional for backward compatibility
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: function () {
        // SUPER_ADMIN doesn't need tenantId, all others do
        return this.role !== UserRole.SUPER_ADMIN;
      },
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
    },
    profilePicture: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    lastLoginAt: {
      type: Date,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    linkedinProfile: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w\-]+\/?$/,
        "Please enter a valid LinkedIn profile URL",
      ],
    },
    twitterHandle: {
      type: String,
      trim: true,
      match: [/^@?[\w]{1,15}$/, "Please enter a valid Twitter handle"],
    },
    githubProfile: {
      type: String,
      trim: true,
      match: [
        /^https?:\/\/(www\.)?github\.com\/[\w\-]+\/?$/,
        "Please enter a valid GitHub profile URL",
      ],
    },
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [100, "Location cannot exceed 100 characters"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
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
    graduationYear: {
      type: Number,
      min: [1950, "Graduation year must be after 1950"],
      max: [
        new Date().getFullYear() + 1,
        "Graduation year cannot be in the future",
      ],
    },
    currentYear: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "Final Year", "Graduate"],
      trim: true,
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
    eligibleForAlumni: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    preferences: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: false,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      newsletterSubscription: {
        type: Boolean,
        default: true,
      },
    },
    // Additional profile fields
    university: {
      type: String,
      trim: true,
      maxlength: [200, "University name cannot exceed 200 characters"],
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
    profileCompletionPercentage: {
      type: Number,
      default: 0,
      min: [0, "Profile completion percentage cannot be negative"],
      max: [100, "Profile completion percentage cannot exceed 100"],
    },
    // Saved events for alumni
    savedEvents: [
      {
        type: Schema.Types.ObjectId,
        ref: "Event",
      },
    ],
    // Saved jobs for alumni
    savedJobs: [
      {
        type: Schema.Types.ObjectId,
        ref: "JobPost",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret: any) {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        return ret;
      },
    },
  }
);

// Indexes for better query performance
// Note: email index is automatically created by unique: true
userSchema.index({ role: 1, status: 1 });
userSchema.index({ role: 1, eligibleForAlumni: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ "preferences.emailNotifications": 1 });

// Pre-save middleware to hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    // Check if password is already hashed (starts with $2a$ or $2b$)
    if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
      return next();
    }

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || "12");
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to check eligibility for alumni
userSchema.pre("save", function (next) {
  // Only check eligibility for students with graduationYear
  if (
    this.role === UserRole.STUDENT &&
    this.graduationYear &&
    typeof this.graduationYear === "number"
  ) {
    const currentYear = new Date().getFullYear();
    // Mark as eligible if graduation year is <= current year
    this.eligibleForAlumni = this.graduationYear <= currentYear;
  } else if (this.role !== UserRole.STUDENT) {
    // Reset eligibleForAlumni if user is not a student
    this.eligibleForAlumni = false;
  }
  next();
});

// Instance method to compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Instance method to get full name
userSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

// Static method to find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ status: UserStatus.ACTIVE });
};

// Virtual for full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
userSchema.set("toJSON", { virtuals: true });

export default mongoose.model<IUser>("User", userSchema);
