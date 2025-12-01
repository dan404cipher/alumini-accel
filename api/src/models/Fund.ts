import mongoose, { Schema, Document } from "mongoose";

export interface IFund extends Document {
  name: string;
  description: string;
  tenantId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  totalRaised: number;
  campaigns: mongoose.Types.ObjectId[];
  status: "active" | "archived" | "suspended";
  createdAt: Date;
  updatedAt: Date;
  updateTotalRaised(): Promise<void>;
}

const fundSchema = new Schema<IFund>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Fund name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: true,
      maxlength: [5000, "Fund description cannot exceed 5000 characters"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    totalRaised: {
      type: Number,
      default: 0,
      min: [0, "Total raised cannot be negative"],
    },
    campaigns: [
      {
        type: Schema.Types.ObjectId,
        ref: "Campaign",
      },
    ],
    status: {
      type: String,
      enum: ["active", "archived", "suspended"],
      default: "active",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
fundSchema.index({ tenantId: 1, status: 1 });
fundSchema.index({ createdBy: 1 });
fundSchema.index({ name: 1 });

// Virtual for campaign count
fundSchema.virtual("campaignCount").get(function () {
  return this.campaigns?.length || 0;
});

// Method to update totalRaised from linked campaigns
fundSchema.methods.updateTotalRaised = async function () {
  const Campaign = mongoose.model("Campaign");
  
  const stats = await Campaign.aggregate([
    { $match: { fundId: this._id, status: { $in: ["active", "completed"] } } },
    {
      $group: {
        _id: null,
        totalRaised: { $sum: "$currentAmount" },
      },
    },
  ]);

  if (stats.length > 0) {
    this.totalRaised = stats[0].totalRaised;
  } else {
    this.totalRaised = 0;
  }

  await this.save();
};

// Pre-save middleware
fundSchema.pre("save", function (next) {
  next();
});

export default mongoose.model<IFund>("Fund", fundSchema);

