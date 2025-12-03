import mongoose, { Schema } from "mongoose";
import { IAlumniPoints } from "../types";

const alumniPointsSchema = new Schema<IAlumniPoints>(
  {
    alumniId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Alumni ID is required"],
    },
    totalPoints: {
      type: Number,
      required: [true, "Total points is required"],
      default: 0,
      min: [0, "Total points cannot be negative"],
    },
    redeemedPoints: {
      type: Number,
      required: [true, "Redeemed points is required"],
      default: 0,
      min: [0, "Redeemed points cannot be negative"],
    },
    availablePoints: {
      type: Number,
      required: [true, "Available points is required"],
      default: 0,
      min: [0, "Available points cannot be negative"],
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: "Tenant",
      required: false,
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: true }, // Only track updatedAt
  }
);

// Indexes for better query performance
alumniPointsSchema.index({ alumniId: 1 }, { unique: true });
alumniPointsSchema.index({ totalPoints: -1 });
alumniPointsSchema.index({ availablePoints: -1 });
alumniPointsSchema.index({ tenantId: 1 });

// Pre-save middleware to calculate available points
alumniPointsSchema.pre("save", function (next) {
  this.availablePoints = Math.max(0, this.totalPoints - this.redeemedPoints);
  next();
});

// Virtual for alumni details
alumniPointsSchema.virtual("alumni", {
  ref: "User",
  localField: "alumniId",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
alumniPointsSchema.set("toJSON", { virtuals: true });

// Static method to get or create AlumniPoints for a user
alumniPointsSchema.statics.getOrCreate = async function (alumniId: mongoose.Types.ObjectId) {
  let alumniPoints = await this.findOne({ alumniId });
  if (!alumniPoints) {
    alumniPoints = await this.create({
      alumniId,
      totalPoints: 0,
      redeemedPoints: 0,
      availablePoints: 0,
    });
  }
  return alumniPoints;
};

export default mongoose.model<IAlumniPoints>("AlumniPoints", alumniPointsSchema);

