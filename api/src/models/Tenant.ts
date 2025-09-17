import mongoose, { Schema, Document } from "mongoose";

export interface ITenant extends Document {
  name: string;
  domain: string;
  logo?: string;
  banner?: string;
  about?: string;
  superAdminId: mongoose.Types.ObjectId;
  settings: {
    allowAlumniRegistration: boolean;
    requireApproval: boolean;
    allowJobPosting: boolean;
    allowFundraising: boolean;
    allowMentorship: boolean;
    allowEvents: boolean;
    emailNotifications: boolean;
    whatsappNotifications: boolean;
    customBranding: boolean;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  subscription: {
    plan: "basic" | "premium" | "enterprise";
    status: "active" | "suspended" | "cancelled";
    startDate: Date;
    endDate: Date;
    maxUsers: number;
    features: string[];
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Tenant name cannot exceed 100 characters"],
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9.-]+$/,
        "Domain must contain only lowercase letters, numbers, hyphens, and dots",
      ],
    },
    logo: {
      type: String,
      trim: true,
    },
    banner: {
      type: String,
      trim: true,
    },
    about: {
      type: String,
      maxlength: [1000, "About section cannot exceed 1000 characters"],
    },
    superAdminId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    settings: {
      allowAlumniRegistration: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: true,
      },
      allowJobPosting: {
        type: Boolean,
        default: true,
      },
      allowFundraising: {
        type: Boolean,
        default: true,
      },
      allowMentorship: {
        type: Boolean,
        default: true,
      },
      allowEvents: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      whatsappNotifications: {
        type: Boolean,
        default: false,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
    },
    contactInfo: {
      email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [
          /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
          "Please enter a valid email",
        ],
      },
      phone: {
        type: String,
        trim: true,
        match: [/^\+?[\d\s-()]+$/, "Please enter a valid phone number"],
      },
      address: {
        type: String,
        maxlength: [500, "Address cannot exceed 500 characters"],
      },
      website: {
        type: String,
        trim: true,
        match: [/^https?:\/\/.+/, "Please enter a valid website URL"],
      },
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "premium", "enterprise"],
        default: "basic",
      },
      status: {
        type: String,
        enum: ["active", "suspended", "cancelled"],
        default: "active",
      },
      startDate: {
        type: Date,
        default: Date.now,
      },
      endDate: {
        type: Date,
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      },
      maxUsers: {
        type: Number,
        default: 1000,
      },
      features: [
        {
          type: String,
        },
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
tenantSchema.index({ domain: 1 });
tenantSchema.index({ superAdminId: 1 });
tenantSchema.index({ isActive: 1 });

// Virtual for tenant statistics
tenantSchema.virtual("stats", {
  ref: "User",
  localField: "_id",
  foreignField: "tenantId",
  count: true,
});

// Methods
tenantSchema.methods.getStats = async function () {
  const User = mongoose.model("User");
  const AlumniProfile = mongoose.model("AlumniProfile");

  const totalUsers = await User.countDocuments({ tenantId: this._id });
  const totalAlumni = await AlumniProfile.countDocuments({
    userId: { $in: await User.find({ tenantId: this._id }).distinct("_id") },
  });
  const activeUsers = await User.countDocuments({
    tenantId: this._id,
    status: { $in: ["active", "verified"] },
  });

  return {
    totalUsers,
    totalAlumni,
    activeUsers,
    inactiveUsers: totalUsers - activeUsers,
  };
};

// Pre-save middleware
tenantSchema.pre("save", function (next) {
  // Ensure domain is lowercase and clean
  if (this.isModified("domain")) {
    this.domain = this.domain.toLowerCase().replace(/[^a-z0-9-]/g, "");
  }
  next();
});

export default mongoose.model<ITenant>("Tenant", tenantSchema);
