import mongoose, { Document, Schema } from "mongoose";

export interface IDonation extends Document {
  donor: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
  donationType: "one-time" | "recurring";
  campaign?: string;
  cause?: string;
  message?: string;
  anonymous: boolean;
  receiptSent: boolean;
  receiptEmail?: string;
  transactionId?: string;
  paymentGateway?: string;
  screenshot?: string;
  eventId?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const donationSchema = new Schema<IDonation>(
  {
    donor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "Campaign",
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
      enum: ["USD", "EUR", "GBP", "INR"],
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "paypal",
        "stripe",
        "other",
      ],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    donationType: {
      type: String,
      required: true,
      enum: ["one-time", "recurring"],
      default: "one-time",
    },
    campaign: {
      type: String,
      trim: true,
    },
    cause: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
    },
    paymentGateway: {
      type: String,
      trim: true,
    },
    screenshot: {
      type: String,
      trim: true,
    },
    eventId: {
      type: String,
      trim: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
// Note: donor, tenantId, campaignId, and paymentStatus indexes are automatically created by index: true
donationSchema.index({ createdAt: -1 });
donationSchema.index({ paymentStatus: 1, createdAt: -1 });
donationSchema.index({ donor: 1, createdAt: -1 });
donationSchema.index({ campaignId: 1, createdAt: -1 });
donationSchema.index({ amount: -1 });

// Virtual for formatted amount
donationSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for donor info (if not anonymous)
donationSchema.virtual("donorInfo", {
  ref: "User",
  localField: "donor",
  foreignField: "_id",
  justOne: true,
  options: { select: "firstName lastName email profilePicture" },
});

// Instance methods
donationSchema.methods.markAsCompleted = function (transactionId?: string) {
  this.paymentStatus = "completed";
  if (transactionId) {
    this.transactionId = transactionId;
  }
  return this.save();
};

donationSchema.methods.markAsFailed = function () {
  this.paymentStatus = "failed";
  return this.save();
};

donationSchema.methods.markAsRefunded = function () {
  this.paymentStatus = "refunded";
  return this.save();
};

donationSchema.methods.sendReceipt = function () {
  this.receiptSent = true;
  return this.save();
};

// Static methods
donationSchema.statics.getTotalDonations = function (filter = {}) {
  return this.aggregate([
    { $match: { ...filter, paymentStatus: "completed" } },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: "$amount" },
        totalCount: { $sum: 1 },
      },
    },
  ]);
};

donationSchema.statics.getDonationsByPeriod = function (
  startDate: Date,
  endDate: Date
) {
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        paymentStatus: "completed",
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        },
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
  ]);
};

donationSchema.statics.getTopDonors = function (limit = 10) {
  return this.aggregate([
    { $match: { paymentStatus: "completed" } },
    {
      $group: {
        _id: "$donor",
        totalAmount: { $sum: "$amount" },
        donationCount: { $sum: 1 },
        lastDonation: { $max: "$createdAt" },
      },
    },
    { $sort: { totalAmount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "donorInfo",
      },
    },
    { $unwind: "$donorInfo" },
    {
      $project: {
        donor: {
          _id: "$donorInfo._id",
          firstName: "$donorInfo.firstName",
          lastName: "$donorInfo.lastName",
          email: "$donorInfo.email",
          profilePicture: "$donorInfo.profilePicture",
        },
        totalAmount: 1,
        donationCount: 1,
        lastDonation: 1,
      },
    },
  ]);
};

donationSchema.statics.getCampaignStats = function () {
  return this.aggregate([
    { $match: { paymentStatus: "completed" } },
    {
      $group: {
        _id: "$campaign",
        totalAmount: { $sum: "$amount" },
        donorCount: { $addToSet: "$donor" },
        donationCount: { $sum: 1 },
      },
    },
    {
      $project: {
        campaign: "$_id",
        totalAmount: 1,
        uniqueDonors: { $size: "$donorCount" },
        donationCount: 1,
      },
    },
    { $sort: { totalAmount: -1 } },
  ]);
};

// Pre-save middleware
donationSchema.pre("save", function (next) {
  // Auto-generate transaction ID if not provided
  if (!this.transactionId && this.paymentStatus === "completed") {
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Set receipt email if not provided
  if (!this.receiptEmail && this.donor) {
    // This will be populated when saving
    next();
  } else {
    next();
  }
});

// Pre-save middleware to populate receipt email
donationSchema.pre("save", async function (next) {
  if (!this.receiptEmail && this.donor) {
    try {
      const User = mongoose.model("User");
      const user = await User.findById(this.donor).select("email");
      if (user) {
        this.receiptEmail = user.email;
      }
    } catch (error) {
      // Continue without receipt email
    }
  }
  next();
});

const Donation = mongoose.model<IDonation>("Donation", donationSchema);

export default Donation;
