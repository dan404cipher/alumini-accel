import nodemailer from "nodemailer";
import { logger } from "./logger";

// Email interface
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Create transporter inside the function to ensure env vars are loaded
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com", // Use IPv4 directly
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: options.from || `AlumniAccel <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully:", {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    logger.error("Email sending failed:", error);
    return false;
  }
};

// Email templates
export const emailTemplates = {
  // Welcome email template
  welcome: (firstName: string, verificationUrl: string) => ({
    subject: "Welcome to AlumniAccel - Verify Your Email",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AlumniAccel</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to AlumniAccel!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>Thank you for joining AlumniAccel - the ultimate platform for alumni engagement and networking!</p>
              <p>To get started, please verify your email address by clicking the button below:</p>
              <p style="text-align: center;">
                <a href="${verificationUrl}" class="button">Verify Email Address</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
              <p>This link will expire in 24 hours.</p>
              <p>If you didn't create this account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The AlumniAccel Team</p>
              <p>© 2024 AlumniAccel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Password reset template
  passwordReset: (firstName: string, resetUrl: string) => ({
    subject: "Password Reset Request - AlumniAccel",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #dc3545; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>We received a request to reset your password for your AlumniAccel account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #666;">${resetUrl}</p>
              <p><strong>This link will expire in 10 minutes.</strong></p>
              <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The AlumniAccel Team</p>
              <p>© 2024 AlumniAccel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Event invitation template
  eventInvitation: (
    firstName: string,
    eventTitle: string,
    eventDate: string,
    eventUrl: string
  ) => ({
    subject: `You're Invited: ${eventTitle} - AlumniAccel`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Event Invitation</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>You're Invited!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>You're invited to attend an exciting alumni event!</p>
              <h3>${eventTitle}</h3>
              <p><strong>Date:</strong> ${eventDate}</p>
              <p>Click the button below to view event details and RSVP:</p>
              <p style="text-align: center;">
                <a href="${eventUrl}" class="button">View Event & RSVP</a>
              </p>
              <p>We look forward to seeing you there!</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The AlumniAccel Team</p>
              <p>© 2024 AlumniAccel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Newsletter template
  newsletter: (firstName: string, content: string, unsubscribeUrl: string) => ({
    subject: "AlumniAccel Newsletter",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>AlumniAccel Newsletter</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>AlumniAccel Newsletter</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              ${content}
            </div>
            <div class="footer">
              <p>Best regards,<br>The AlumniAccel Team</p>
              <p><a href="${unsubscribeUrl}">Unsubscribe from this newsletter</a></p>
              <p>© 2024 AlumniAccel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // Job notification template
  jobNotification: (
    firstName: string,
    jobTitle: string,
    companyName: string,
    jobUrl: string
  ) => ({
    subject: `New Job Opportunity: ${jobTitle} at ${companyName}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Job Opportunity</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #ffc107; color: #333; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            .button { display: inline-block; background-color: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 4px; }
            .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Job Opportunity!</h1>
            </div>
            <div class="content">
              <h2>Hi ${firstName},</h2>
              <p>A new job opportunity has been posted by an alumni:</p>
              <h3>${jobTitle}</h3>
              <p><strong>Company:</strong> ${companyName}</p>
              <p>Click the button below to view the job details and apply:</p>
              <p style="text-align: center;">
                <a href="${jobUrl}" class="button">View Job & Apply</a>
              </p>
              <p>Good luck with your application!</p>
            </div>
            <div class="footer">
              <p>Best regards,<br>The AlumniAccel Team</p>
              <p>© 2024 AlumniAccel. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),
};

// Verify email configuration
export const verifyEmailConfig = async (): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.verify();
    logger.info("Email configuration verified successfully");
    return true;
  } catch (error) {
    logger.error("Email configuration verification failed:", error);
    return false;
  }
};

export default {
  sendEmail,
  emailTemplates,
  verifyEmailConfig,
};
