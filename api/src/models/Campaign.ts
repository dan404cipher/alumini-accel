import mongoose, { Schema, Document } from "mongoose";

export interface ICampaign extends Document {
  title: string;
  description: string;
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  fundId?: mongoose.Types.ObjectId;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: Date;
  endDate: Date;
  status: "draft" | "active" | "paused" | "completed" | "cancelled";
  imageUrl: string;
  images: string[];
  documents: string[];
  isPublic: boolean;
  allowAnonymous: boolean;
  featured: boolean;
  tags: string[];
  location?: string;
  contactInfo: {
    email: string;
    phone?: string;
    person?: string;
  };
  updates: {
    title: string;
    description: string;
    createdAt: Date;
    createdBy: mongoose.Types.ObjectId;
  }[];
  statistics: {
    totalDonations: number;
    totalDonors: number;
    averageDonation: number;
    topDonor?: {
      userId: mongoose.Types.ObjectId;
      amount: number;
      anonymous: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const campaignSchema = new Schema<ICampaign>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Campaign title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      maxlength: [5000, "Campaign description cannot exceed 5000 characters"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fundId: {
      type: Schema.Types.ObjectId,
      ref: "Fund",
      required: false,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, "Category cannot exceed 100 characters"],
    },
    targetAmount: {
      type: Number,
      required: true,
      min: [1, "Target amount must be greater than 0"],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, "Current amount cannot be negative"],
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD", "EUR", "GBP"],
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (this: ICampaign, value: Date) {
          return value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    status: {
      type: String,
      enum: ["draft", "active", "paused", "completed", "cancelled"],
      default: "draft",
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    documents: [
      {
        type: String,
        trim: true,
      },
    ],
    isPublic: {
      type: Boolean,
      default: true,
    },
    allowAnonymous: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
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
      person: {
        type: String,
        trim: true,
        maxlength: [100, "Contact person name cannot exceed 100 characters"],
      },
    },
    updates: [
      {
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [200, "Update title cannot exceed 200 characters"],
        },
        description: {
          type: String,
          required: true,
          maxlength: [2000, "Update description cannot exceed 2000 characters"],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
    statistics: {
      totalDonations: {
        type: Number,
        default: 0,
      },
      totalDonors: {
        type: Number,
        default: 0,
      },
      averageDonation: {
        type: Number,
        default: 0,
      },
      topDonor: {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        amount: {
          type: Number,
        },
        anonymous: {
          type: Boolean,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ createdBy: 1 });
campaignSchema.index({ category: 1 });
campaignSchema.index({ featured: 1, status: 1 });
campaignSchema.index({ endDate: 1 });
campaignSchema.index({ tags: 1 });
campaignSchema.index({ fundId: 1 });

// Virtual for progress percentage
campaignSchema.virtual("progressPercentage").get(function () {
  return Math.round((this.currentAmount / this.targetAmount) * 100);
});

// Virtual for days remaining
campaignSchema.virtual("daysRemaining").get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Virtual for isActive
campaignSchema.virtual("isActive").get(function () {
  const now = new Date();
  return (
    this.status === "active" && now >= this.startDate && now <= this.endDate
  );
});

// Methods
campaignSchema.methods.updateStatistics = async function () {
  const Donation = mongoose.model("Donation");

  const stats = await Donation.aggregate([
    { $match: { campaignId: this._id, paymentStatus: { $in: ["completed", "successful"] } } },
    {
      $group: {
        _id: null,
        totalDonations: { $sum: "$amount" },
        totalDonors: { $sum: 1 },
        averageDonation: { $avg: "$amount" },
        topDonor: { $max: "$amount" },
      },
    },
  ]);

  if (stats.length > 0) {
    this.statistics.totalDonations = stats[0].totalDonations;
    this.statistics.totalDonors = stats[0].totalDonors;
    this.statistics.averageDonation = Math.round(stats[0].averageDonation);
    this.currentAmount = stats[0].totalDonations;
  }

  await this.save();

  // Update linked Fund's totalRaised if campaign has fundId
  if (this.fundId) {
    const Fund = mongoose.model("Fund");
    const fund = await Fund.findById(this.fundId);
    if (fund) {
      await fund.updateTotalRaised();
    }
  }
};

// Pre-save middleware
campaignSchema.pre("save", function (next) {
  // Auto-complete campaign if target reached
  if (this.currentAmount >= this.targetAmount && this.status === "active") {
    this.status = "completed";
  }

  // Auto-activate if start date reached
  if (this.status === "draft" && new Date() >= this.startDate) {
    this.status = "active";
  }

  next();
});

export default mongoose.model<ICampaign>("Campaign", campaignSchema);
