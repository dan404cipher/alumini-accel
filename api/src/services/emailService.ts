import nodemailer from "nodemailer";
import { logger } from "../utils/logger";
import { replaceTemplateVariables, VariableData } from "./templateService";
import EmailTracking from "../models/EmailTracking";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateId?: string;
  metadata?: Record<string, any>;
}

interface BatchEmailOptions {
  recipients: Array<{ email: string; data: VariableData }>;
  subject: string;
  htmlTemplate: string;
  textTemplate?: string;
  templateId?: string;
  rateLimit?: number; // Emails per minute
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Configure email transporter
    const smtpConfig: any = {
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
    };

    // Only add auth if credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      // Gmail App Passwords may have spaces - remove them for nodemailer
      const smtpUser = process.env.SMTP_USER.trim();
      const smtpPass = process.env.SMTP_PASS.replace(/\s+/g, '').trim(); // Remove all spaces
      
      smtpConfig.auth = {
        user: smtpUser,
        pass: smtpPass,
      };
    }

    this.transporter = nodemailer.createTransport(smtpConfig);
    
    // Verify connection on startup (but don't block and don't warn if credentials exist)
    // Only verify if credentials are provided
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.verifyConnection().catch((error) => {
        // Only log as info, not warning, since verification can fail for network reasons
        // but emails might still work
        logger.info("SMTP connection verification skipped (non-blocking):", error.message);
      });
    } else {
      logger.warn("SMTP credentials not configured. Email sending will fail.");
    }
  }

  // Verify SMTP connection
  async verifyConnection(): Promise<boolean> {
    try {
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();
      
      if (!smtpUser || !smtpPass) {
        // Don't log warning here - it's already logged in constructor if needed
        return false;
      }
      
      // Create transporter with cleaned credentials for verification
      const smtpConfig: any = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: smtpPass.replace(/\s+/g, ''), // Remove spaces
        },
      };
      
      const testTransporter = nodemailer.createTransport(smtpConfig);
      // Set a timeout for verification to prevent hanging
      await Promise.race([
        testTransporter.verify(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("SMTP verification timeout")), 10000)
        )
      ]);
      logger.info("SMTP connection verified successfully");
      return true;
    } catch (error: any) {
      // Don't log as error - verification failures are common and don't mean emails won't work
      // Only log if it's not a timeout (timeouts are expected in some network configurations)
      if (!error.message?.includes("timeout")) {
        // Use info level since debug might not be visible
        logger.info("SMTP connection verification skipped (non-critical):", error.message);
      }
      return false;
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Validate SMTP configuration
      const smtpUser = process.env.SMTP_USER?.trim();
      const smtpPass = process.env.SMTP_PASS?.trim();
      
      if (!smtpUser || !smtpPass) {
        logger.error("SMTP configuration missing. Please set SMTP_USER and SMTP_PASS environment variables.");
        return false;
      }

      // Validate email address
      if (!options.to || !options.to.includes("@")) {
        logger.error(`Invalid email address: ${options.to}`);
        return false;
      }
      
      // Clean password - remove all spaces (Gmail App Passwords have spaces but nodemailer needs them removed)
      const cleanedPassword = smtpPass.replace(/\s+/g, '');
      
      // Log password info for debugging (always log for troubleshooting)
      logger.info("SMTP Configuration:", {
        user: smtpUser,
        passwordLength: cleanedPassword.length,
        passwordPreview: cleanedPassword.length > 0 ? `${cleanedPassword.substring(0, 2)}...${cleanedPassword.substring(cleanedPassword.length - 2)}` : "empty",
        expectedLength: 16,
        isValidLength: cleanedPassword.length === 16,
      });
      
      if (cleanedPassword.length !== 16) {
        logger.warn("App Password length is incorrect! Expected 16 characters, got " + cleanedPassword.length);
      }
      
      // Reconfigure transporter with cleaned credentials (in case env vars changed)
      const smtpConfig: any = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: smtpUser,
          pass: cleanedPassword,
        },
      };
      
      // Update transporter with cleaned credentials each time to ensure consistency
      this.transporter = nodemailer.createTransport(smtpConfig);

      const mailOptions = {
        from: `"AlumniAccel" <${smtpUser}>`,
        to: options.to,
        subject: options.subject || "No Subject",
        html: options.html || "",
        text: options.text || "",
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email sent successfully to ${options.to}:`,
        result.messageId
      );
      
      // Log success for debugging
      if (process.env.NODE_ENV === "development") {
        logger.info(`Email sent successfully`, {
          to: options.to,
          subject: options.subject,
          messageId: result.messageId,
        });
      }

      // Track email if templateId provided (don't fail if tracking fails)
      if (options.templateId && options.metadata?.tenantId) {
        try {
          await EmailTracking.create({
            templateId: options.templateId,
            recipientEmail: options.to,
            subject: options.subject,
            sentAt: new Date(),
            status: "sent",
            metadata: options.metadata,
            tenantId: options.metadata.tenantId,
          });
        } catch (trackingError) {
          // Log but don't fail the email send
          logger.warn("Failed to track email (email was still sent):", trackingError);
        }
      }

      return true;
    } catch (error: any) {
      // More detailed error logging
      const errorDetails = {
        to: options.to,
        error: error.message || error.toString(),
        code: error.code,
        command: error.command,
        response: error.response,
      };
      
      logger.error("Failed to send email:", errorDetails);
      
      // Log specific error types with detailed messages
      if (error.code === "EAUTH") {
        if (error.response?.includes("BadCredentials") || error.message?.includes("BadCredentials")) {
          logger.error("SMTP Authentication failed - Invalid Gmail App Password!");
          logger.error("FIX STEPS:");
          logger.error("1. Enable 2-Step Verification: https://myaccount.google.com/security");
          logger.error("2. Create App Password: https://myaccount.google.com/apppasswords");
          logger.error("3. Select 'Mail' and 'Other (Custom name)' → Type 'AlumniAccel'");
          logger.error("4. Copy the 16-character password (remove ALL spaces)");
          logger.error("5. Update SMTP_PASS in .env file (no spaces)");
          logger.error("6. Restart server");
          logger.error(`Current SMTP_USER: ${process.env.SMTP_USER}`);
          logger.error(`Gmail Error: ${error.response || error.message}`);
          logger.error("See SMTP_SETUP_GUIDE.md for detailed instructions");
        } else {
          logger.error("SMTP Authentication failed. Please check SMTP_USER and SMTP_PASS.");
        }
      } else if (error.code === "ECONNECTION") {
        logger.error("SMTP Connection failed. Please check SMTP_HOST and SMTP_PORT.");
      } else if (error.code === "ETIMEDOUT") {
        logger.error("SMTP Connection timeout. Please check network connectivity.");
      }

      // Track failed email (don't fail if tracking fails)
      if (options.templateId && options.metadata?.tenantId) {
        try {
          await EmailTracking.create({
            templateId: options.templateId,
            recipientEmail: options.to,
            subject: options.subject,
            sentAt: new Date(),
            status: "failed",
            errorMessage: error.message,
            retryCount: 1,
            metadata: options.metadata,
            tenantId: options.metadata.tenantId,
          });
        } catch (trackingError) {
          logger.warn("Failed to track failed email:", trackingError);
        }
      }

      return false;
    }
  }

  // Send email using template with variable replacement
  async sendTemplatedEmail(
    template: { subject: string; body: string },
    recipientEmail: string,
    variables: VariableData,
    templateId?: string,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    const subject = replaceTemplateVariables(template.subject, variables);
    const html = replaceTemplateVariables(template.body, variables);
    const text = html.replace(/<[^>]*>/g, ""); // Basic HTML to text conversion

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html,
      text,
      templateId,
      metadata,
    });
  }

  // Send batch emails with rate limiting
  async sendBatchEmails(options: BatchEmailOptions): Promise<{
    success: number;
    failed: number;
    results: Array<{ email: string; success: boolean; error?: string }>;
  }> {
    const results: Array<{ email: string; success: boolean; error?: string }> = [];
    let success = 0;
    let failed = 0;

    const rateLimit = options.rateLimit || 60; // Default 60 emails per minute
    const delayBetweenBatches = (60 / rateLimit) * 1000; // Delay in milliseconds

    for (let i = 0; i < options.recipients.length; i++) {
      const recipient = options.recipients[i];
      const subject = replaceTemplateVariables(options.subject, recipient.data);
      const html = replaceTemplateVariables(options.htmlTemplate, recipient.data);
      const text = options.textTemplate
        ? replaceTemplateVariables(options.textTemplate, recipient.data)
        : html.replace(/<[^>]*>/g, "");

      try {
        const result = await this.sendEmail({
          to: recipient.email,
          subject,
          html,
          text,
          templateId: options.templateId,
          metadata: {
            ...recipient.data,
            tenantId: recipient.data.tenantId,
          },
        });

        if (result) {
          success++;
          results.push({ email: recipient.email, success: true });
        } else {
          failed++;
          // Check if SMTP is configured
          const smtpUser = process.env.SMTP_USER?.trim();
          const smtpPass = process.env.SMTP_PASS?.trim();
          
          let errorMsg = "Failed to send email";
          if (!smtpUser || !smtpPass) {
            errorMsg = "SMTP configuration missing. Please configure SMTP_USER and SMTP_PASS in .env file.";
          } else {
            errorMsg = "Failed to send email. Check SMTP configuration and server logs.";
          }
          
          results.push({
            email: recipient.email,
            success: false,
            error: errorMsg,
          });
        }
      } catch (error: any) {
        failed++;
        // Extract more detailed error message
        let errorMessage = "Failed to send email";
        
        if (error.code === "EAUTH") {
          if (error.response?.includes("BadCredentials") || error.message?.includes("BadCredentials")) {
            errorMessage = "Invalid Gmail App Password. Please: 1) Enable 2-Step Verification, 2) Create new App Password at https://myaccount.google.com/apppasswords, 3) Copy 16-char password (remove spaces), 4) Update SMTP_PASS in .env, 5) Restart server.";
          } else {
            errorMessage = `SMTP Authentication failed: ${error.message || error.response || "Invalid credentials"}`;
          }
        } else if (error.code === "ECONNECTION") {
          errorMessage = `SMTP Connection failed: ${error.message || "Cannot connect to SMTP server"}`;
        } else if (error.code === "ETIMEDOUT") {
          errorMessage = `SMTP Connection timeout: ${error.message || "Server took too long to respond"}`;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.response) {
          errorMessage = error.response;
        }
        
        logger.error(`Failed to send email to ${recipient.email}:`, {
          error: errorMessage,
          code: error.code,
          response: error.response,
        });
        
        results.push({
          email: recipient.email,
          success: false,
          error: errorMessage,
        });
      }

      // Rate limiting - delay between emails
      if (i < options.recipients.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return { success, failed, results };
  }

  // Retry failed emails
  async retryFailedEmail(trackingId: string): Promise<boolean> {
    try {
      const tracking = await EmailTracking.findById(trackingId);
      if (!tracking || tracking.retryCount >= 3) {
        return false;
      }

      // Get template if available
      let subject = tracking.subject;
      let html = "";

      if (tracking.templateId) {
        const EmailTemplate = (await import("../models/EmailTemplate")).default;
        const template = await EmailTemplate.findById(tracking.templateId);
        if (template) {
          subject = template.subject;
          html = template.body;
        }
      }

      if (!html) {
        return false;
      }

      const result = await this.sendEmail({
        to: tracking.recipientEmail,
        subject,
        html,
        templateId: tracking.templateId?.toString(),
      });

      if (result) {
        tracking.status = "sent";
        tracking.retryCount += 1;
        await tracking.save();
      } else {
        tracking.retryCount += 1;
        await tracking.save();
      }

      return result;
    } catch (error) {
      logger.error("Failed to retry email:", error);
      return false;
    }
  }

  async sendAlumniInvitation(data: {
    name: string;
    email: string;
    graduationYear: number;
    degree?: string;
    currentRole?: string;
    company?: string;
    location?: string;
    invitationLink: string;
    invitedBy: string;
  }): Promise<boolean> {
    const subject = `You're Invited to Join AlumniAccel - ${data.name}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AlumniAccel Invitation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
          .info-item { margin: 10px 0; }
          .info-label { font-weight: bold; color: #555; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 Welcome to AlumniAccel!</h1>
            <p>You've been invited to join our alumni network</p>
          </div>
          
          <div class="content">
            <h2>Hello ${data.name}!</h2>
            
            <p>You've been invited by <strong>${data.invitedBy}</strong> to join our exclusive alumni network. This is your gateway to:</p>
            
            <ul>
              <li>🤝 Connect with fellow alumni from your graduation year</li>
              <li>💼 Access exclusive job opportunities and career resources</li>
              <li>🎉 Attend alumni events and networking meetups</li>
              <li>📚 Share knowledge and mentor current students</li>
              <li>🌟 Stay updated with university news and achievements</li>
            </ul>
            
            <div class="info">
              <h3>Your Information:</h3>
              <div class="info-item">
                <span class="info-label">Name:</span> ${data.name}
              </div>
              <div class="info-item">
                <span class="info-label">Graduation Year:</span> ${data.graduationYear}
              </div>
              ${data.degree ? `<div class="info-item"><span class="info-label">Degree:</span> ${data.degree}</div>` : ""}
              ${data.currentRole ? `<div class="info-item"><span class="info-label">Current Role:</span> ${data.currentRole}</div>` : ""}
              ${data.company ? `<div class="info-item"><span class="info-label">Company:</span> ${data.company}</div>` : ""}
              ${data.location ? `<div class="info-item"><span class="info-label">Location:</span> ${data.location}</div>` : ""}
            </div>
            
            <p>Click the button below to complete your profile and join the network:</p>
            
            <div style="text-align: center;">
              <a href="${data.invitationLink}" class="button">Join AlumniAccel Now</a>
            </div>
            
            <p><strong>Important:</strong> This invitation will expire in 7 days. Don't miss out on connecting with your fellow alumni!</p>
            
            <p>If you have any questions or need assistance, feel free to reach out to us.</p>
            
            <p>Best regards,<br>The AlumniAccel Team</p>
          </div>
          
          <div class="footer">
            <p>This email was sent to ${data.email}</p>
            <p>If you didn't expect this invitation, you can safely ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to AlumniAccel!
      
      Hello ${data.name}!
      
      You've been invited by ${data.invitedBy} to join our exclusive alumni network.
      
      Your Information:
      - Name: ${data.name}
      - Graduation Year: ${data.graduationYear}
      ${data.degree ? `- Degree: ${data.degree}` : ""}
      ${data.currentRole ? `- Current Role: ${data.currentRole}` : ""}
      ${data.company ? `- Company: ${data.company}` : ""}
      ${data.location ? `- Location: ${data.location}` : ""}
      
      Join the network: ${data.invitationLink}
      
      This invitation expires in 7 days.
      
      Best regards,
      The AlumniAccel Team
    `;

    return this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }
}

export const emailService = new EmailService();
