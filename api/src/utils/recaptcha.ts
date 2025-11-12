import axios from "axios";
import { logger } from "./logger";

interface RecaptchaVerificationResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

/**
 * Verify Google reCAPTCHA token
 * @param token - The reCAPTCHA token to verify
 * @param remoteip - Optional: The user's IP address
 * @returns Promise<boolean> - True if verification succeeds, false otherwise
 */
export const verifyRecaptcha = async (
  token: string,
  remoteip?: string
): Promise<{ success: boolean; error?: string }> => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    logger.warn("RECAPTCHA_SECRET_KEY not configured. Skipping reCAPTCHA verification.");
    // In development, allow bypass if secret key is not set
    if (process.env.NODE_ENV === "development") {
      return { success: true };
    }
    return {
      success: false,
      error: "reCAPTCHA verification is not configured",
    };
  }

  if (!token) {
    return {
      success: false,
      error: "reCAPTCHA token is missing",
    };
  }

  try {
    const verificationUrl = "https://www.google.com/recaptcha/api/siteverify";
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteip && { remoteip }),
    });

    const response = await axios.post<RecaptchaVerificationResponse>(
      verificationUrl,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        timeout: 10000, // 10 second timeout
      }
    );

    const { success, "error-codes": errorCodes } = response.data;

    if (!success) {
      const errorMessages = errorCodes || ["Unknown error"];
      logger.warn("reCAPTCHA verification failed", {
        errorCodes: errorMessages,
        hostname: response.data.hostname,
      });
      return {
        success: false,
        error: `reCAPTCHA verification failed: ${errorMessages.join(", ")}`,
      };
    }

    logger.info("reCAPTCHA verification successful", {
      hostname: response.data.hostname,
      challenge_ts: response.data.challenge_ts,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("reCAPTCHA verification error:", error);
    return {
      success: false,
      error: error.message || "Failed to verify reCAPTCHA",
    };
  }
};

