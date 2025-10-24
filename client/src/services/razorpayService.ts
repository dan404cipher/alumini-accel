// Razorpay Service for Frontend
import Razorpay from "razorpay";

// Razorpay configuration
const RAZORPAY_KEY_ID =
  import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_RUU9Bp4fN23nvp";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";

export interface RazorpayOrderData {
  amount: number; // Amount in paise
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayPaymentResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface RazorpayPaymentData {
  orderId: string;
  paymentId: string;
  signature: string;
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  method?: {
    netbanking?: boolean;
    wallet?: boolean;
    upi?: boolean;
    card?: boolean;
    emi?: boolean;
  };
  upi?: {
    flow?: string;
  };
  handler?: (response: RazorpayPaymentResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

class RazorpayService {
  private static instance: RazorpayService;
  private razorpay: typeof window.Razorpay | null = null;

  private constructor() {
    // Load Razorpay script dynamically
    this.loadRazorpayScript();
  }

  private getAuthToken(): string {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem("token");
    if (!token) {
      token = sessionStorage.getItem("token");
    }
    if (!token) {
      throw new Error("User not authenticated. Please log in first.");
    }
    return token;
  }

  public static getInstance(): RazorpayService {
    if (!RazorpayService.instance) {
      RazorpayService.instance = new RazorpayService();
    }
    return RazorpayService.instance;
  }

  private loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => {
        // Add a small delay to ensure the script is fully initialized
        setTimeout(() => {
          resolve();
        }, 100);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        reject(new Error("Failed to load Razorpay script"));
      };
      document.head.appendChild(script);
    });
  }

  public async createOrder(orderData: RazorpayOrderData): Promise<{
    success: boolean;
    message?: string;
    data?: {
      orderId: string;
      amount: number;
      currency: string;
      receipt: string;
      keyId: string;
    };
  }> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/payments/donation/order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Order creation error:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  }

  public async verifyPayment(
    paymentData: RazorpayPaymentData
  ): Promise<{ success: boolean; message?: string; data?: unknown }> {
    try {
      const token = this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/payments/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Verification error:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error verifying Razorpay payment:", error);
      throw error;
    }
  }

  public async openPaymentModal(options: RazorpayOptions): Promise<void> {
    try {
      await this.loadRazorpayScript();

      const razorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount: options.amount,
        currency: options.currency,
        name: options.name,
        description: options.description,
        order_id: options.order_id,
        prefill: options.prefill || {},
        notes: options.notes || {},
        theme: {
          color: "#4F46E5", // Indigo color
          ...options.theme,
        },
        handler: options.handler,
        modal: {
          ondismiss: options.modal?.ondismiss,
        },
      };

      const razorpay = new window.Razorpay(razorpayOptions);
      razorpay.open();
    } catch (error) {
      console.error("Error opening Razorpay payment modal:", error);
      throw error;
    }
  }

  public async processDonationPayment(
    amount: number,
    donorInfo: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
    },
    campaignTitle: string,
    onSuccess: (paymentData: RazorpayPaymentData) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      // Validate inputs
      if (!amount || amount <= 0) {
        throw new Error("Invalid donation amount");
      }

      if (!donorInfo.firstName || !donorInfo.lastName || !donorInfo.email) {
        throw new Error("Missing required donor information");
      }

      // Ensure Razorpay script is loaded
      await this.loadRazorpayScript();

      // Check if Razorpay script is loaded
      if (typeof window === "undefined" || !window.Razorpay) {
        console.error("Razorpay SDK not available");
        throw new Error(
          "Razorpay SDK not loaded. Please refresh the page and try again."
        );
      }

      // Create order
      const orderData: RazorpayOrderData = {
        amount: amount, // Amount in rupees (Razorpay handles paise conversion internally)
        currency: "INR",
        receipt: `donation_${Date.now()}`,
        notes: {
          campaign: campaignTitle,
          donor_name: `${donorInfo.firstName} ${donorInfo.lastName}`,
          donor_email: donorInfo.email,
        },
      };

      const orderResult = await this.createOrder(orderData);

      if (!orderResult.success) {
        throw new Error(orderResult.message || "Failed to create order");
      }

      // Validate order response
      if (!orderResult.data?.orderId) {
        throw new Error("Invalid order response from server");
      }

      // Open payment modal
      const paymentOptions: RazorpayOptions = {
        key: RAZORPAY_KEY_ID,
        amount: amount, // Amount in rupees
        currency: "INR",
        name: "AlumniAccel",
        description: `Donation for ${campaignTitle}`,
        order_id: orderResult.data.orderId,
        prefill: {
          name: `${donorInfo.firstName} ${donorInfo.lastName}`,
          email: donorInfo.email,
          contact: donorInfo.phone,
        },
        notes: {
          campaign: campaignTitle,
          donor_name: `${donorInfo.firstName} ${donorInfo.lastName}`,
        },
        // Enable all payment methods
        method: {
          netbanking: true,
          wallet: true,
          upi: true,
          card: true,
          emi: true,
        },
        // Additional UPI configuration
        theme: {
          color: "#3399cc",
        },
        // Enable UPI intent
        upi: {
          flow: "intent",
        },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            // Validate response
            if (
              !response.razorpay_order_id ||
              !response.razorpay_payment_id ||
              !response.razorpay_signature
            ) {
              throw new Error("Invalid payment response from Razorpay");
            }

            // Map Razorpay response to our format
            const paymentData: RazorpayPaymentData = {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            };

            // Verify payment
            const verificationResult = await this.verifyPayment(paymentData);

            if (verificationResult.success) {
              onSuccess(paymentData);
            } else {
              console.error("Payment verification failed:", verificationResult);
              onError(
                new Error(
                  verificationResult.message || "Payment verification failed"
                )
              );
            }
          } catch (error) {
            console.error("Error in payment handler:", error);
            onError(error);
          }
        },
        modal: {
          ondismiss: () => {
            onError(new Error("Payment cancelled by user"));
          },
        },
      };

      const rzp = new window.Razorpay(paymentOptions);

      // Add error handlers
      rzp.on(
        "payment.failed",
        (response: { error?: { description?: string } }) => {
          console.error("Payment failed:", response);
          onError(new Error(response.error?.description || "Payment failed"));
        }
      );

      rzp.open();
    } catch (error) {
      console.error("Error in processDonationPayment:", error);
      onError(error);
    }
  }
}

// Extend Window interface for Razorpay
declare global {
  interface Window {
    Razorpay: {
      new (options: RazorpayOptions): {
        open(): void;
        on(event: string, callback: (response: unknown) => void): void;
      };
    };
  }
}

export default RazorpayService;
