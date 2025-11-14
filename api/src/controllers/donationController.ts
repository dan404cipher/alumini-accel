import { Request, Response } from "express";
import Donation from "../models/Donation";
import PaymentService from "../services/paymentService";

// Get all donations
export const getAllDonations = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    // 🔒 MULTI-TENANT FILTERING: Only show donations from same college (unless super admin)
    if (req.query.tenantId) {
      filter.tenantId = req.query.tenantId;
    } else if (req.user?.role !== "SUPER_ADMIN" && req.user?.tenantId) {
      filter.tenantId = req.user.tenantId;
    }

    const donations = await Donation.find(filter)
      .populate("donor", "firstName lastName email")
      .populate("campaignId", "title")
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
      .populate("donor", "firstName lastName email")
      .populate("campaignId", "title");

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
    const donationData = {
      ...req.body,
      // If donor information is provided in the request body, use it
      // Otherwise, use the authenticated user as donor
      donor: req.body.donorName ? null : req.user?.id,
      tenantId: req.user?.tenantId,
      paymentStatus: "successful", // Since payment is already verified
      paidAt: new Date(), // Set payment completion time
    };

    const donation = new Donation(donationData);
    await donation.save();

    // Update campaign statistics if this is a campaign donation
    if (donation.campaignId) {
      const Campaign = require("@/models/Campaign").default;
      const campaign = await Campaign.findById(donation.campaignId);
      if (campaign) {
        await campaign.updateStatistics();
      }
    }

    await donation.populate("donor", "firstName lastName email");
    if (donation.campaignId) {
      await donation.populate("campaignId", "title");
    }

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
    const donations = await Donation.find({ donor: req.params.donorId })
      .populate("campaignId", "title")
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
      tenantId: req.params.recipientId,
    })
      .populate("donor", "firstName lastName email")
      .populate("campaignId", "title")
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ donor: req.user?.id })
      .populate("campaignId", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Donation.countDocuments({ donor: req.user?.id });

    return res.status(200).json({
      success: true,
      data: {
        donations,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
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

// Verify donation payment
export const verifyDonationPayment = async (req: Request, res: Response) => {
  try {
    const { donationId, orderId, paymentId, signature } = req.body;

    if (!donationId || !orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message:
          "Donation ID, Order ID, Payment ID, and Signature are required",
      });
    }

    // Find the donation
    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: "Donation not found",
      });
    }

    // Verify payment signature
    const isValidSignature = PaymentService.verifyPayment(
      orderId,
      paymentId,
      signature
    );

    if (!isValidSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // Get payment details from Razorpay
    const paymentResult = await PaymentService.getPaymentDetails(paymentId);

    if (
      !paymentResult.success ||
      !paymentResult.payment ||
      paymentResult.payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // Update donation with successful payment
    donation.paymentStatus = "successful";
    donation.paymentId = paymentId;
    donation.orderId = orderId;
    donation.paymentMethod = paymentResult.payment.method;
    donation.paidAt = new Date();

    await donation.save();

    // Update campaign statistics
    if (donation.campaignId) {
      const Campaign = require("../models/Campaign").default;
      const campaign = await Campaign.findById(donation.campaignId);
      if (campaign) {
        await campaign.updateStatistics();
      }
    }

    await donation.populate("donor", "firstName lastName email");
    if (donation.campaignId) {
      await donation.populate("campaignId", "title");
    }

    return res.status(200).json({
      success: true,
      message: "Donation payment verified successfully",
      data: donation,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying donation payment",
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
  verifyDonationPayment,
};
