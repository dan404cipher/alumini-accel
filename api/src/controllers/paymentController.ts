import { Request, Response } from "express";
import PaymentService from "../services/paymentService";
import { asyncHandler } from "../middleware/errorHandler";

/**
 * Create payment order for donations
 */
export const createDonationOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const orderData = {
      amount: PaymentService.convertToPaise(amount),
      currency: currency || "INR",
      receipt: receipt || `donation_${Date.now()}`,
      notes: notes || {},
    };

    const result = await PaymentService.createOrder(orderData);

    if (!result.success || !result.order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        receipt: result.order.receipt,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  }
);

/**
 * Create payment order for paid events
 */
export const createEventOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { amount, eventId, userId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    if (!eventId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Event ID and User ID are required",
      });
    }

    const orderData = {
      amount: PaymentService.convertToPaise(amount),
      currency: "INR",
      receipt: `event_${eventId}_${userId}_${Date.now()}`,
      notes: {
        eventId,
        userId,
        type: "event",
      },
    };

    const result = await PaymentService.createOrder(orderData);

    if (!result.success || !result.order) {
      return res.status(500).json({
        success: false,
        message: "Failed to create payment order",
        error: result.error,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      data: {
        orderId: result.order.id,
        amount: result.order.amount,
        currency: result.order.currency,
        receipt: result.order.receipt,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
    });
  }
);

/**
 * Verify payment and update status
 */
export const verifyPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId, paymentId, signature, type, ...additionalData } = req.body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Payment ID, and Signature are required",
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

    if (!paymentResult.success || !paymentResult.payment) {
      return res.status(500).json({
        success: false,
        message: "Failed to verify payment with Razorpay",
        error: paymentResult.error,
      });
    }

    const payment = paymentResult.payment;

    // Payment verification successful
    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: PaymentService.convertToRupees(Number(payment.amount)),
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        verifiedAt: new Date().toISOString(),
        type,
        additionalData,
      },
    });
  }
);

/**
 * Get payment details
 */
export const getPaymentDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required",
      });
    }

    const result = await PaymentService.getPaymentDetails(paymentId);

    if (!result.success || !result.payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: result.payment.id,
        orderId: result.payment.order_id,
        amount: PaymentService.convertToRupees(Number(result.payment.amount)),
        currency: result.payment.currency,
        status: result.payment.status,
        method: result.payment.method,
        createdAt: new Date(result.payment.created_at * 1000).toISOString(),
      },
    });
  }
);

/**
 * Get order details
 */
export const getOrderDetails = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required",
      });
    }

    const result = await PaymentService.getOrderDetails(orderId);

    if (!result.success || !result.order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
        error: result.error,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: result.order.id,
        amount: PaymentService.convertToRupees(Number(result.order.amount)),
        currency: result.order.currency,
        receipt: result.order.receipt,
        status: result.order.status,
        createdAt: new Date(result.order.created_at * 1000).toISOString(),
      },
    });
  }
);

export default {
  createDonationOrder,
  createEventOrder,
  verifyPayment,
  getPaymentDetails,
  getOrderDetails,
};
