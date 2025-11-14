import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance lazily
let razorpay: Razorpay | null = null;

const getRazorpayInstance = (): Razorpay => {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET) {
      throw new Error("Razorpay credentials not configured");
    }
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
  }
  return razorpay;
};

export interface PaymentOrderData {
  amount: number; // Amount in paise (INR)
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface PaymentVerificationData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export class PaymentService {
  /**
   * Create a Razorpay order
   */
  static async createOrder(orderData: PaymentOrderData) {
    try {
      const options = {
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        receipt: orderData.receipt,
        notes: orderData.notes || {},
      };

      const order = await getRazorpayInstance().orders.create(options);

      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          created_at: order.created_at,
        },
      };
    } catch (error: any) {
      // Razorpay SDK often returns rich error objects; surface the description when available
      const sdkDescription = error?.error?.description || error?.message;
      const fallback = typeof error === "string" ? error : JSON.stringify(error);
      console.error("Error creating Razorpay order:", sdkDescription || fallback);
      return {
        success: false,
        error: sdkDescription || fallback || "Failed to create order",
      };
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const body = orderId + "|" + paymentId;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(body.toString())
        .digest("hex");

      return expectedSignature === signature;
    } catch (error) {
      console.error("Error verifying payment:", error);
      return false;
    }
  }

  /**
   * Fetch payment details from Razorpay
   */
  static async getPaymentDetails(paymentId: string) {
    try {
      const payment = await getRazorpayInstance().payments.fetch(paymentId);

      return {
        success: true,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          method: payment.method,
          created_at: payment.created_at,
          order_id: payment.order_id,
        },
      };
    } catch (error) {
      console.error("Error fetching payment details:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch payment",
      };
    }
  }

  /**
   * Fetch order details from Razorpay
   */
  static async getOrderDetails(orderId: string) {
    try {
      const order = await getRazorpayInstance().orders.fetch(orderId);

      return {
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
          status: order.status,
          created_at: order.created_at,
        },
      };
    } catch (error) {
      console.error("Error fetching order details:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch order",
      };
    }
  }

  /**
   * Convert amount to paise (Razorpay expects amount in smallest currency unit)
   */
  static convertToPaise(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Convert paise to rupees
   */
  static convertToRupees(amount: number): number {
    return amount / 100;
  }
}

export default PaymentService;
