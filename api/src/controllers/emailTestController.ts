import { Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { emailService } from "../services/emailService";
import { logger } from "../utils/logger";

// Test email sending
export const testEmail = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { to, subject, message } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Email address (to) is required",
      });
    }

    const testSubject = subject || "Test Email from AlumniAccel";
    const testMessage = message || "This is a test email to verify SMTP configuration.";
    const testHtml = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #667eea;">Test Email</h2>
            <p>${testMessage}</p>
            <p>If you received this email, your SMTP configuration is working correctly!</p>
            <p>Best regards,<br>AlumniAccel Team</p>
          </div>
        </body>
      </html>
    `;

    const result = await emailService.sendEmail({
      to,
      subject: testSubject,
      html: testHtml,
      text: testMessage,
    });

    if (result) {
      return res.json({
        success: true,
        message: `Test email sent successfully to ${to}`,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send test email. Check server logs for details.",
      });
    }
  } catch (error: any) {
    logger.error("Test email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send test email",
      error: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

