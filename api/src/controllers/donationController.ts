import { Request, Response } from "express";
import Donation from "@/models/Donation";
import { DonationStatus } from "@/types";

// Get all donations
export const getAllDonations = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show donations from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    const donations = await Donation.find(filter)
      .populate("donorId", "firstName lastName email")
      .populate("recipientId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching donations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get donation by ID
export const getDonationById = async (req: Request, res: Response) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("donorId", "firstName lastName email")
      .populate("recipientId", "firstName lastName email");

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: donation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching donation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Create new donation
export const createDonation = async (req: Request, res: Response) => {
  try {
    const donation = new Donation({
      ...req.body,
      status: DonationStatus.PENDING,
    });

    await donation.save();

    return res.status(201).json({
      success: true,
      message: "Donation created successfully",
      data: donation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating donation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Update donation
export const updateDonation = async (req: Request, res: Response) => {
  try {
    const donation = await Donation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation updated successfully",
      data: donation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating donation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Delete donation
export const deleteDonation = async (req: Request, res: Response) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);

    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Donation deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting donation",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get donations by donor
export const getDonationsByDonor = async (req: Request, res: Response) => {
  try {
    const donations = await Donation.find({ donorId: req.params.donorId })
      .populate("recipientId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching donations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get donations by recipient
export const getDonationsByRecipient = async (req: Request, res: Response) => {
  try {
    const donations = await Donation.find({
      recipientId: req.params.recipientId,
    })
      .populate("donorId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching donations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get my donations
export const getMyDonations = async (req: Request, res: Response) => {
  try {
    const donations = await Donation.find({ donorId: req.user.id })
      .populate("recipientId", "firstName lastName email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: donations,
      count: donations.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching your donations",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Get donation statistics
export const getDonationStats = async (req: Request, res: Response) => {
  try {
    const totalDonations = await Donation.countDocuments();
    const totalAmount = await Donation.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const monthlyStats = await Donation.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalDonations,
        totalAmount: totalAmount[0]?.total || 0,
        monthlyStats,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching donation statistics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export default {
  getAllDonations,
  getDonationById,
  createDonation,
  updateDonation,
  deleteDonation,
  getDonationsByDonor,
  getDonationsByRecipient,
  getMyDonations,
  getDonationStats,
};
