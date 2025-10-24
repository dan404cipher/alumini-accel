import express from "express";
import { authenticateToken } from "../middleware/auth";
import paymentController from "../controllers/paymentController";
import { asyncHandler } from "../middleware/errorHandler";

const router = express.Router();

// @route   POST /api/v1/payments/donation/order
// @desc    Create payment order for donation
// @access  Private
router.post(
  "/donation/order",
  authenticateToken,
  asyncHandler(paymentController.createDonationOrder)
);

// @route   POST /api/v1/payments/event/order
// @desc    Create payment order for paid event
// @access  Private
router.post(
  "/event/order",
  authenticateToken,
  asyncHandler(paymentController.createEventOrder)
);

// @route   POST /api/v1/payments/verify
// @desc    Verify payment signature and update status
// @access  Private
router.post(
  "/verify",
  authenticateToken,
  asyncHandler(paymentController.verifyPayment)
);

// @route   GET /api/v1/payments/:paymentId
// @desc    Get payment details by payment ID
// @access  Private
router.get(
  "/:paymentId",
  authenticateToken,
  asyncHandler(paymentController.getPaymentDetails)
);

// @route   GET /api/v1/payments/order/:orderId
// @desc    Get order details by order ID
// @access  Private
router.get(
  "/order/:orderId",
  authenticateToken,
  asyncHandler(paymentController.getOrderDetails)
);

export default router;
