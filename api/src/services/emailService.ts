import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Clean and validate SMTP credentials
    const smtpUser =
      process.env.SMTP_USER?.trim().replace(/^["']|["']$/g, "") || "";
    const smtpPass =
      process.env.SMTP_PASS?.trim().replace(/^["']|["']$/g, "") || "";

    if (!smtpUser || !smtpPass) {
      logger.warn(
        "SMTP credentials not configured. Email sending will fail. Please set SMTP_USER and SMTP_PASS in your .env file."
      );
      logger.warn(
        `SMTP_USER: ${smtpUser ? "SET" : "NOT SET"}, SMTP_PASS: ${smtpPass ? "SET" : "NOT SET"}`
      );
    } else {
      logger.info("SMTP credentials loaded successfully");
    }

    // Configure email transporter
    // For Gmail, use secure: false with port 587 and requireTLS
    const isGmail = (process.env.SMTP_HOST || "smtp.gmail.com").includes(
      "gmail"
    );
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: smtpPort,
      secure: smtpPort === 465, // Port 465 requires secure: true
      // For Gmail on port 587, require TLS
      requireTLS: isGmail && smtpPort === 587,
      auth: {
        // Clean values: remove quotes and trim whitespace
        user:
          process.env.SMTP_USER?.trim().replace(/^["']|["']$/g, "") ||
          process.env.SMTP_USER,
        // Remove spaces and quotes from App Password (Gmail App Passwords work without spaces)
        pass:
          process.env.SMTP_PASS?.trim()
            .replace(/^["']|["']$/g, "")
            .replace(/\s+/g, "") || process.env.SMTP_PASS,
      },
      tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Check if SMTP credentials are configured
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.error(
          "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in your .env file."
        );
        throw new Error(
          "SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables."
        );
      }

      const mailOptions = {
        from: `"AlumniAccel" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(
        `Email sent successfully to ${options.to}:`,
        result.messageId
      );
      return true;
    } catch (error: any) {
      logger.error("Failed to send email:", error);

      // Provide more helpful error messages
      if (
        error.message?.includes("credentials") ||
        error.message?.includes("PLAIN")
      ) {
        logger.error(
          "SMTP authentication failed. Please check your SMTP_USER and SMTP_PASS in .env file."
        );
        throw new Error(
          "SMTP authentication failed. Please verify your email credentials in the .env file."
        );
      }

      throw error;
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

  async sendAlumniWelcomeEmail(data: {
    firstName: string;
    lastName: string;
    email: string;
    collegeName: string;
    activationLink: string;
    portalUrl: string;
    password?: string;
    senderName?: string;
    senderTitle?: string;
    senderEmail?: string;
    senderPhone?: string;
  }): Promise<boolean> {
    const subject = `Welcome to ${data.collegeName} Alumni Portal - Your Account is Ready!`;
    const fullName = `${data.firstName} ${data.lastName}`;

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Alumni Portal</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background-color: #ffffff;
            padding: 30px 40px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-circle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
          }
          .institution-name {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.3;
          }
          .institution-name .line1 {
            color: #1a1a1a;
          }
          .institution-name .line2 {
            color: #dc2626;
          }
          .banner-section {
            position: relative;
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            overflow: hidden;
          }
          .banner-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .content-section {
            padding: 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          .welcome-text {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .congratulations {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 25px;
          }
          .info-text {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.8;
          }
          .portal-access {
            background-color: #f9fafb;
            padding: 20px;
            border-left: 4px solid #2563eb;
            margin: 25px 0;
            border-radius: 4px;
          }
          .portal-link {
            color: #2563eb;
            text-decoration: underline;
            font-weight: 500;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .activate-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
          }
          .credentials-info {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .credentials-info p {
            margin: 5px 0;
            font-size: 14px;
            color: #92400e;
          }
          .signature-section {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 30px;
            margin-top: 40px;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
          }
          .signature-angle {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: linear-gradient(to bottom right, transparent 50%, #374151 50%);
          }
          .signature-content {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            position: relative;
            z-index: 1;
          }
          .signature-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 600;
            font-size: 20px;
            flex-shrink: 0;
          }
          .signature-info {
            flex: 1;
          }
          .signature-name {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          .signature-title {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 15px;
          }
          .signature-contact {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #4b5563;
          }
          .footer {
            background-color: #1f2937;
            padding: 25px 40px;
            text-align: center;
            color: #9ca3af;
            position: relative;
          }
          .footer-content {
            font-size: 12px;
            line-height: 1.8;
          }
          .footer-divider {
            margin: 0 10px;
            color: #4b5563;
          }
          .footer-decoration {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #374151 0%, #dc2626 100%);
            clip-path: polygon(50% 0%, 100% 100%, 100% 0%);
            opacity: 0.3;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
            .header,
            .content-section,
            .footer {
              padding: 20px !important;
            }
            .banner-section {
              height: 150px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-circle">A</div>
                <div class="institution-name">
                  <div class="line1">${data.collegeName.toUpperCase()}</div>
                  <div class="line2">ALUMNI PORTAL</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Banner Section -->
          <div class="banner-section">
            <div class="banner-overlay">
              <div style="color: white; text-align: center; z-index: 2;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">Welcome to Your Alumni Network</div>
                <div style="font-size: 16px; opacity: 0.9;">Connect, Engage, Grow Together</div>
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="content-section">
            <div class="greeting">
              <strong>Dear ${data.firstName},</strong>
            </div>

            <div class="congratulations">
              Congratulations!!
            </div>

            <div class="welcome-text">
              Graduating from ${data.collegeName} doesn't mean losing your ties to the University.
            </div>

            <div class="info-text">
              Your alumni user account has been created for ${data.collegeName} Alumni portal. Follow the link below to activate your account${data.password ? " and set the password" : ""}.
            </div>

            <div class="portal-access">
              <div class="info-text" style="margin-bottom: 10px;">
                <strong>After activating your account, you can access to ${data.collegeName} Alumni portal through:</strong>
              </div>
              <div style="margin: 10px 0;">
                <a href="${data.portalUrl}" class="portal-link">${data.portalUrl}</a>
              </div>
              <div class="info-text" style="margin-top: 15px; font-size: 14px;">
                You can download the ${data.collegeName} alumni mobile app in App store and Google play store.
              </div>
            </div>

            ${
              data.password
                ? `
            <div class="credentials-info">
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: ${data.email}</p>
              <p>Temporary Password: ${data.password}</p>
              <p style="margin-top: 10px; font-size: 13px;">Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.</p>
              <p style="margin-top: 8px; font-size: 13px;"><strong>Important:</strong> Please change your password after first login for security purposes.</p>
            </div>
            `
                : `
            <div class="info-text">
              Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.
            </div>
            `
            }

            <div class="button-container">
              <a href="${data.activationLink}" class="activate-button">Please click here to activate your account</a>
            </div>
          </div>

          <!-- Signature Section -->
          <div class="content-section" style="padding-top: 0;">
            <div class="signature-section">
              <div class="signature-angle"></div>
              <div class="signature-content">
                <div class="signature-avatar">
                  ${(data.senderName || "A").charAt(0).toUpperCase()}
                </div>
                <div class="signature-info">
                  <div class="signature-name">${data.senderName || "Alumni Relations Team"}</div>
                  <div class="signature-title">${data.senderTitle || "Alumni Relations Manager"}</div>
                  <div class="signature-contact">
                    ${
                      data.senderPhone
                        ? `
                    <div class="contact-item">
                      <span>📞</span>
                      <span>${data.senderPhone}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      data.senderEmail
                        ? `
                    <div class="contact-item">
                      <span>✉️</span>
                      <span>${data.senderEmail}</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-decoration"></div>
            <div class="footer-content">
              <div style="margin-bottom: 15px;">
                Copyright © ${new Date().getFullYear()} ${data.collegeName}. All rights reserved.
              </div>
              <div>
                ${data.senderPhone || "Contact"} <span class="footer-divider">|</span> ${data.senderEmail || "alumni@college.edu"} <span class="footer-divider">|</span> Alumni Relations
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Dear ${data.firstName},

Congratulations!!

Graduating from ${data.collegeName} doesn't mean losing your ties to the University.

Your alumni user account has been created for ${data.collegeName} Alumni portal. Follow the link below to activate your account${data.password ? " and set the password" : ""}.

After activating your account, you can access to ${data.collegeName} Alumni portal through:
${data.portalUrl}

You can download the ${data.collegeName} alumni mobile app in App store and Google play store.

${
  data.password
    ? `
Your Login Credentials:
Email: ${data.email}
Temporary Password: ${data.password}

Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.
Important: Please change your password after first login for security purposes.
`
    : `
Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.
`
}

Please click here to activate your account:
${data.activationLink}

Best Regards,
${data.senderName || "Alumni Relations Team"}
${data.senderTitle || "Alumni Relations Manager"}
${data.senderPhone ? `Phone: ${data.senderPhone}` : ""}
${data.senderEmail ? `Email: ${data.senderEmail}` : ""}

---
Copyright © ${new Date().getFullYear()} ${data.collegeName}. All rights reserved.
    `;

    return this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
    });
  }

  // Method to generate email HTML for preview (without sending)
  generateWelcomeEmailHTML(data: {
    firstName: string;
    lastName: string;
    email: string;
    collegeName: string;
    activationLink: string;
    portalUrl: string;
    password?: string;
    senderName?: string;
    senderTitle?: string;
    senderEmail?: string;
    senderPhone?: string;
  }): string {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Alumni Portal</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 650px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background-color: #ffffff;
            padding: 30px 40px;
            border-bottom: 2px solid #e5e5e5;
          }
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .logo-section {
            display: flex;
            align-items: center;
            gap: 15px;
          }
          .logo-circle {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            font-weight: bold;
            color: #ffffff;
          }
          .institution-name {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
            line-height: 1.3;
          }
          .institution-name .line1 {
            color: #1a1a1a;
          }
          .institution-name .line2 {
            color: #dc2626;
          }
          .banner-section {
            position: relative;
            width: 100%;
            height: 200px;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            overflow: hidden;
          }
          .banner-overlay {
            position: absolute;
            inset: 0;
            background: rgba(0, 0, 0, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .content-section {
            padding: 40px;
            background-color: #ffffff;
          }
          .greeting {
            font-size: 16px;
            color: #1a1a1a;
            margin-bottom: 20px;
          }
          .welcome-text {
            font-size: 16px;
            color: #4b5563;
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .congratulations {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 25px;
          }
          .info-text {
            font-size: 15px;
            color: #4b5563;
            margin-bottom: 15px;
            line-height: 1.8;
          }
          .portal-access {
            background-color: #f9fafb;
            padding: 20px;
            border-left: 4px solid #2563eb;
            margin: 25px 0;
            border-radius: 4px;
          }
          .portal-link {
            color: #2563eb;
            text-decoration: underline;
            font-weight: 500;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .activate-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            font-size: 15px;
          }
          .credentials-info {
            background-color: #fef3c7;
            border: 1px solid #fcd34d;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .credentials-info p {
            margin: 5px 0;
            font-size: 14px;
            color: #92400e;
          }
          .signature-section {
            background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
            padding: 30px;
            margin-top: 40px;
            border-radius: 8px;
            position: relative;
            overflow: hidden;
          }
          .signature-angle {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 30px;
            background: linear-gradient(to bottom right, transparent 50%, #374151 50%);
          }
          .signature-content {
            display: flex;
            align-items: flex-start;
            gap: 20px;
            position: relative;
            z-index: 1;
          }
          .signature-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ffffff;
            font-weight: 600;
            font-size: 20px;
            flex-shrink: 0;
          }
          .signature-info {
            flex: 1;
          }
          .signature-name {
            font-size: 18px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 5px;
          }
          .signature-title {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 15px;
          }
          .signature-contact {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .contact-item {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 14px;
            color: #4b5563;
          }
          .footer {
            background-color: #1f2937;
            padding: 25px 40px;
            text-align: center;
            color: #9ca3af;
            position: relative;
          }
          .footer-content {
            font-size: 12px;
            line-height: 1.8;
          }
          .footer-divider {
            margin: 0 10px;
            color: #4b5563;
          }
          .footer-decoration {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 100px;
            height: 100px;
            background: linear-gradient(135deg, #374151 0%, #dc2626 100%);
            clip-path: polygon(50% 0%, 100% 100%, 100% 0%);
            opacity: 0.3;
          }
          @media only screen and (max-width: 600px) {
            .email-container {
              width: 100% !important;
            }
            .header,
            .content-section,
            .footer {
              padding: 20px !important;
            }
            .banner-section {
              height: 150px !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header -->
          <div class="header">
            <div class="header-content">
              <div class="logo-section">
                <div class="logo-circle">A</div>
                <div class="institution-name">
                  <div class="line1">${data.collegeName.toUpperCase()}</div>
                  <div class="line2">ALUMNI PORTAL</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Banner Section -->
          <div class="banner-section">
            <div class="banner-overlay">
              <div style="color: white; text-align: center; z-index: 2;">
                <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px;">Welcome to Your Alumni Network</div>
                <div style="font-size: 16px; opacity: 0.9;">Connect, Engage, Grow Together</div>
              </div>
            </div>
          </div>

          <!-- Content Section -->
          <div class="content-section">
            <div class="greeting">
              <strong>Dear ${data.firstName},</strong>
            </div>

            <div class="congratulations">
              Congratulations!!
            </div>

            <div class="welcome-text">
              Graduating from ${data.collegeName} doesn't mean losing your ties to the University.
            </div>

            <div class="info-text">
              Your alumni user account has been created for ${data.collegeName} Alumni portal. Follow the link below to activate your account${data.password ? " and set the password" : ""}.
            </div>

            <div class="portal-access">
              <div class="info-text" style="margin-bottom: 10px;">
                <strong>After activating your account, you can access to ${data.collegeName} Alumni portal through:</strong>
              </div>
              <div style="margin: 10px 0;">
                <a href="${data.portalUrl}" class="portal-link">${data.portalUrl}</a>
              </div>
              <div class="info-text" style="margin-top: 15px; font-size: 14px;">
                You can download the ${data.collegeName} alumni mobile app in App store and Google play store.
              </div>
            </div>

            ${
              data.password
                ? `
            <div class="credentials-info">
              <p><strong>Your Login Credentials:</strong></p>
              <p>Email: ${data.email}</p>
              <p>Temporary Password: ${data.password}</p>
              <p style="margin-top: 10px; font-size: 13px;">Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.</p>
              <p style="margin-top: 8px; font-size: 13px;"><strong>Important:</strong> Please change your password after first login for security purposes.</p>
            </div>
            `
                : `
            <div class="info-text">
              Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.
            </div>
            `
            }

            <div class="button-container">
              <a href="${data.activationLink}" class="activate-button">Please click here to activate your account</a>
            </div>
          </div>

          <!-- Signature Section -->
          <div class="content-section" style="padding-top: 0;">
            <div class="signature-section">
              <div class="signature-angle"></div>
              <div class="signature-content">
                <div class="signature-avatar">
                  ${(data.senderName || "A").charAt(0).toUpperCase()}
                </div>
                <div class="signature-info">
                  <div class="signature-name">${data.senderName || "Alumni Relations Team"}</div>
                  <div class="signature-title">${data.senderTitle || "Alumni Relations Manager"}</div>
                  <div class="signature-contact">
                    ${
                      data.senderPhone
                        ? `
                    <div class="contact-item">
                      <span>📞</span>
                      <span>${data.senderPhone}</span>
                    </div>
                    `
                        : ""
                    }
                    ${
                      data.senderEmail
                        ? `
                    <div class="contact-item">
                      <span>✉️</span>
                      <span>${data.senderEmail}</span>
                    </div>
                    `
                        : ""
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-decoration"></div>
            <div class="footer-content">
              <div style="margin-bottom: 15px;">
                Copyright © ${new Date().getFullYear()} ${data.collegeName}. All rights reserved.
              </div>
              <div>
                ${data.senderPhone || "Contact"} <span class="footer-divider">|</span> ${data.senderEmail || "alumni@college.edu"} <span class="footer-divider">|</span> Alumni Relations
              </div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    return html;
  }
}

export const emailService = new EmailService();
