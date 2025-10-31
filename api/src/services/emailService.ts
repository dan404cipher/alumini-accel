import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
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

      const fromName = options.fromName || "Alumni Accel";
      const mailOptions = {
        from: `"${fromName}" <${process.env.SMTP_USER}>`,
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

  // Helper method to generate the welcome email HTML template (table-based for email compatibility)
  private generateWelcomeEmailTemplate(data: {
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
    const collegeName = data.collegeName || "Alumni Accel";

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Alumni Portal</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333333; background-color: #f5f5f5;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="max-width: 650px; background-color: #ffffff; margin: 0 auto;">
                <!-- Header -->
                <tr>
                  <td style="background-color: #ffffff; padding: 30px 40px; border-bottom: 2px solid #e5e5e5;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td width="60" style="width: 60px; vertical-align: middle;">
                          <div style="width: 60px; height: 60px; background: #2563eb; border-radius: 8px; text-align: center; line-height: 60px; font-size: 28px; font-weight: bold; color: #ffffff;">A</div>
                        </td>
                        <td width="15" style="width: 15px;"></td>
                        <td style="vertical-align: middle;">
                          <div style="font-size: 16px; font-weight: 600; color: #1a1a1a; line-height: 1.3;">${collegeName.toUpperCase()}</div>
                          <div style="font-size: 16px; font-weight: 600; color: #2563eb; line-height: 1.3;">ALUMNI PORTAL</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Banner Section -->
                <tr>
                  <td style="background: #2563eb; padding: 60px 40px; text-align: center;">
                    <div style="color: white; text-align: center;">
                      <div style="font-size: 28px; font-weight: 700; margin-bottom: 10px; color: #ffffff;">Welcome to Your Alumni Network</div>
                      <div style="font-size: 16px; color: rgba(255, 255, 255, 0.9);">Connect, Engage, Grow Together</div>
                    </div>
                  </td>
                </tr>
                
                <!-- Content Section -->
                <tr>
                  <td style="padding: 40px; background-color: #ffffff;">
                    <div style="font-size: 16px; color: #1a1a1a; margin-bottom: 20px;">
                      <strong>Dear ${data.firstName},</strong>
                    </div>

                    <div style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin-bottom: 25px;">
                      Congratulations!!
                    </div>

                    <div style="font-size: 16px; color: #4b5563; margin-bottom: 20px; line-height: 1.8;">
                      Graduating from ${collegeName} doesn't mean losing your ties to the University.
                    </div>

                    <div style="font-size: 15px; color: #4b5563; margin-bottom: 15px; line-height: 1.8;">
                      Your alumni user account has been created for ${collegeName} Alumni portal. Follow the link below to activate your account${data.password ? " and set the password" : ""}.
                    </div>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-left: 4px solid #2563eb; margin: 25px 0;">
                      <tr>
                        <td style="padding: 20px;">
                          <div style="font-size: 15px; color: #4b5563; margin-bottom: 10px; line-height: 1.8;">
                            <strong>After activating your account, you can access to ${collegeName} Alumni portal through:</strong>
                          </div>
                          <div style="margin: 10px 0;">
                            <a href="${data.portalUrl}" style="color: #2563eb; text-decoration: underline; font-weight: 500;">${data.portalUrl}</a>
                          </div>
                          <div style="font-size: 14px; color: #4b5563; margin-top: 15px; line-height: 1.8;">
                            You can download the ${collegeName} alumni mobile app in App store and Google play store.
                          </div>
                        </td>
                      </tr>
                    </table>

                    ${
                      data.password
                        ? `
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border: 1px solid #fcd34d; margin: 20px 0;">
                      <tr>
                        <td style="padding: 15px;">
                          <p style="margin: 5px 0; font-size: 14px; color: #92400e;"><strong>Your Login Credentials:</strong></p>
                          <p style="margin: 5px 0; font-size: 14px; color: #92400e;">Email: ${data.email}</p>
                          <p style="margin-top: 10px; font-size: 13px; color: #92400e;">Please use your email address to login to the Alumni portal. After your first login, you will be prompted to reset your password.</p>
                          <p style="margin-top: 8px; font-size: 13px; color: #92400e;"><strong>Important:</strong> Please reset your password after first login for security purposes.</p>
                        </td>
                      </tr>
                    </table>
                    `
                        : `
                    <div style="font-size: 15px; color: #4b5563; margin-bottom: 15px; line-height: 1.8;">
                      Please use your email address and the newly created password as credentials to access the Alumni portal and the Alumni mobile app.
                    </div>
                    `
                    }

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td align="center" style="padding: 30px 0;">
                          <a href="${data.activationLink}" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 15px;">Please click here to activate your account</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Signature Section -->
                <tr>
                  <td style="padding: 0 40px 40px 40px; background-color: #ffffff;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background: #f3f4f6;">
                      <tr>
                        <td style="padding: 30px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td width="60" style="width: 60px; vertical-align: top;">
                                <div style="width: 60px; height: 60px; border-radius: 50%; background: #2563eb; text-align: center; line-height: 60px; color: #ffffff; font-weight: 600; font-size: 20px;">
                                  ${(data.senderName || "A").charAt(0).toUpperCase()}
                                </div>
                              </td>
                              <td width="20" style="width: 20px;"></td>
                              <td style="vertical-align: top;">
                                <div style="font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 5px;">${data.senderName || "Alumni Relations Team"}</div>
                                <div style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">${data.senderTitle || "Alumni Relations Manager"}</div>
                                ${
                                  data.senderPhone
                                    ? `<div style="font-size: 14px; color: #4b5563; margin-bottom: 8px;">📞 ${data.senderPhone}</div>`
                                    : ""
                                }
                                ${
                                  data.senderEmail
                                    ? `<div style="font-size: 14px; color: #4b5563;">✉️ ${data.senderEmail}</div>`
                                    : ""
                                }
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      <tr>
                        <td style="height: 30px; background: #374151;"></td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="background-color: #1f2937; padding: 25px 40px; text-align: center; color: #9ca3af;">
                    <div style="font-size: 12px; line-height: 1.8;">
                      <div style="margin-bottom: 15px;">
                        Copyright © ${new Date().getFullYear()} ${collegeName}. All rights reserved.
                      </div>
                      <div>
                        ${data.senderPhone || "Contact"} <span style="margin: 0 10px; color: #4b5563;">|</span> ${data.senderEmail || "alumni@alumniaccel.com"} <span style="margin: 0 10px; color: #4b5563;">|</span> Alumni Relations
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
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
    const collegeName = data.collegeName || "Alumni Accel";
    const subject = `Welcome to ${collegeName} Alumni Portal - Your Account is Ready!`;
    const fullName = `${data.firstName} ${data.lastName}`;

    const html = this.generateWelcomeEmailTemplate(data);

    const text = `
Dear ${data.firstName},

Congratulations!!

Graduating from ${collegeName} doesn't mean losing your ties to the University.

Your alumni user account has been created for ${collegeName} Alumni portal. Follow the link below to activate your account${data.password ? " and set the password" : ""}.

After activating your account, you can access to ${collegeName} Alumni portal through:
${data.portalUrl}

You can download the ${collegeName} alumni mobile app in App store and Google play store.

${
  data.password
    ? `
Your Login Credentials:
Email: ${data.email}

Please use your email address to login to the Alumni portal. After your first login, you will be prompted to reset your password.
Important: Please reset your password after first login for security purposes.
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
Copyright © ${new Date().getFullYear()} ${collegeName}. All rights reserved.
    `;

    return this.sendEmail({
      to: data.email,
      subject,
      html,
      text,
      fromName: collegeName,
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
    return this.generateWelcomeEmailTemplate(data);
  }

  // ==========================
  // Event Emails (Inline CSS)
  // ==========================

  private buildAbsoluteImageUrl(imagePath?: string): string | null {
    if (!imagePath) return null;
    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath;
    }
    // Fallback to local server base URL if relative path
    const apiBase = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    return `${apiBase}${imagePath.startsWith("/") ? imagePath : `/${imagePath}`}`;
  }

  private generateEventEmailTemplate(data: {
    type: "registration" | "reminder";
    eventTitle: string;
    eventDescription?: string;
    startDate: Date | string;
    endDate?: Date | string;
    location: string;
    isOnline?: boolean;
    meetingLink?: string;
    price?: number;
    image?: string;
    attendeeName: string;
    ctaUrl?: string;
    collegeName?: string;
    organizerName?: string;
    speakers?: Array<{ name: string; title?: string; company?: string; photo?: string; bio?: string }>;
    agenda?: Array<{ title: string; speaker?: string; description?: string }>;
  }): string {
    const title = data.type === "registration" ? "Event Registration Confirmed" : "Event Reminder";
    const bannerText = data.type === "registration" ? "You're Registered!" : "Reminder: Upcoming Event";
    const eventImage = this.buildAbsoluteImageUrl(data.image);
    const formattedStart = new Date(data.startDate).toLocaleString();
    const formattedEnd = data.endDate ? new Date(data.endDate).toLocaleString() : undefined;
    const college = data.collegeName || "Alumni Accel";
    const isPaid = typeof data.price === "number" && data.price > 0;

    const speakersHtml = (data.speakers && data.speakers.length)
      ? `
          <div style="margin-top:18px;">
            <div style="font-size:16px;font-weight:700;margin-bottom:8px;">Speakers</div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#f9fafb;border-left:4px solid #10b981;">
              <tr>
                <td style="padding:14px 16px;">
                  ${data.speakers
                    .map((s) => `
                      <div style=\"margin-bottom:10px; font-size:14px; color:#111827;\">
                        <div><strong>${s.name}</strong>${s.title ? `, ${s.title}` : ""}${s.company ? ` - ${s.company}` : ""}</div>
                      </div>
                    `)
                    .join("")}
                </td>
              </tr>
            </table>
          </div>
        `
      : "";

    const agendaHtml = (data.agenda && data.agenda.length)
      ? `
          <div style=\"margin-top:18px;\">
            <div style=\"font-size:16px;font-weight:700;margin-bottom:8px;\">Event Agenda</div>
            <table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:#f9fafb;border-left:4px solid #3b82f6;\">
              <tr>
                <td style=\"padding:14px 16px;\">
                  ${data.agenda
                    .map((a) => `
                      <div style=\\"margin-bottom:10px; font-size:14px; color:#111827;\\">
                        <div><strong>${a.title}</strong>${a.speaker ? ` - ${a.speaker}` : ""}</div>
                        ${a.description ? `<div style=\\"color:#4b5563; font-size:13px; margin-top:4px;\\">${a.description}</div>` : ""}
                      </div>
                    `)
                    .join("")}
                </td>
              </tr>
            </table>
          </div>
        `
      : "";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - ${college}</title>
</head>
<body style="margin:0;padding:0;font-family: Arial, Helvetica, sans-serif; background-color:#f5f5f5; color:#111827;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="650" style="max-width:650px;background-color:#ffffff;margin:0 auto;border-radius:8px; overflow:hidden;">
          <tr>
            <td style="background:#2563eb;padding:24px 32px;text-align:center;">
              <div style="color:#ffffff; font-size:24px; font-weight:700;">${bannerText}</div>
              <div style="color:rgba(255,255,255,0.9); font-size:14px; margin-top:6px;">${college}</div>
            </td>
          </tr>
          ${eventImage ? `
          <tr>
            <td style="padding:0;">
              <img src="${eventImage}" alt="Event image" style="display:block;width:100%;height:auto;" />
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:28px 32px;">
              <div style="font-size:16px;">Hello <strong>${data.attendeeName}</strong>,</div>
              <div style="font-size:18px;font-weight:700;margin-top:12px;">${data.eventTitle}</div>
              ${data.eventDescription ? `<div style=\"margin-top:8px; color:#4b5563; line-height:1.7; font-size:14px;\">${data.eventDescription}</div>` : ""}

              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top:16px;background-color:#f9fafb;border-left:4px solid #2563eb;">
                <tr>
                  <td style="padding:16px 16px 8px 16px;">
                    <div style="font-size:14px; color:#111827; margin-bottom:8px;"><strong>Date & Time:</strong> ${formattedStart}${formattedEnd ? ` &ndash; ${formattedEnd}` : ""}</div>
                    <div style="font-size:14px; color:#111827; margin-bottom:8px;"><strong>Location:</strong> ${data.isOnline ? "Online" : data.location}</div>
                    ${data.organizerName ? `<div style=\"font-size:14px; color:#111827; margin-bottom:8px;\"><strong>Organized By:</strong> ${data.organizerName}</div>` : ""}
                    ${data.meetingLink ? `<div style=\"font-size:14px; color:#2563eb; margin-bottom:8px;\"><a style=\"color:#2563eb; text-decoration:underline;\" href=\"${data.meetingLink}\">Join Link</a></div>` : ""}
                    ${isPaid ? `<div style=\"font-size:14px; color:#111827; margin-bottom:8px;\"><strong>Price:</strong> ₹${Number(data.price).toFixed(2)}</div>` : `<div style=\"font-size:14px; color:#111827; margin-bottom:8px;\"><strong>Price:</strong> Free</div>`}
                  </td>
                </tr>
              </table>

              ${speakersHtml}
              ${agendaHtml}

              ${data.type === "registration" && data.ctaUrl ? `
              <div style="text-align:center; margin-top:22px;">
                <a href="${data.ctaUrl}" style="display:inline-block;background-color:#2563eb;color:#ffffff;padding:12px 22px;text-decoration:none;border-radius:6px;font-weight:600; font-size:14px;">View Event</a>
              </div>
              ` : ""}

              <div style="margin-top:24px; font-size:13px; color:#6b7280;">
                If you have questions, reply to this email.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color:#1f2937; padding:18px 24px; text-align:center; color:#9ca3af; font-size:12px;">
              © ${new Date().getFullYear()} ${college}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async sendEventRegistrationEmail(data: {
    to: string;
    attendeeName: string;
    eventTitle: string;
    eventDescription?: string;
    startDate: Date | string;
    endDate?: Date | string;
    location: string;
    isOnline?: boolean;
    meetingLink?: string;
    price?: number;
    image?: string;
    ctaUrl?: string;
    collegeName?: string;
    organizerName?: string;
    speakers?: Array<{ name: string; title?: string; company?: string; photo?: string; bio?: string }>;
    agenda?: Array<{ title: string; speaker?: string; description?: string }>;
  }): Promise<boolean> {
    const html = this.generateEventEmailTemplate({ type: "registration", ...data });
    const text = `Registration Confirmed\n\n${data.eventTitle}\n${new Date(data.startDate).toLocaleString()}${data.endDate ? ` - ${new Date(data.endDate).toLocaleString()}` : ""}\n${data.isOnline ? "Online" : data.location}\n${data.meetingLink ? `Link: ${data.meetingLink}\n` : ""}${typeof data.price === "number" && data.price > 0 ? `Price: ₹${Number(data.price).toFixed(2)}` : "Price: Free"}`;
    return this.sendEmail({ to: data.to, subject: `Registration Confirmed: ${data.eventTitle}`, html, text });
  }

  async sendEventReminderEmail(data: {
    to: string;
    attendeeName: string;
    eventTitle: string;
    eventDescription?: string;
    startDate: Date | string;
    endDate?: Date | string;
    location: string;
    isOnline?: boolean;
    meetingLink?: string;
    price?: number;
    image?: string;
    ctaUrl?: string;
    collegeName?: string;
    organizerName?: string;
    speakers?: Array<{ name: string; title?: string; company?: string; photo?: string; bio?: string }>;
    agenda?: Array<{ title: string; speaker?: string; description?: string }>;
  }): Promise<boolean> {
    const html = this.generateEventEmailTemplate({ type: "reminder", ...data });
    const text = `Reminder: ${data.eventTitle} (Tomorrow)\n\n${new Date(data.startDate).toLocaleString()}${data.endDate ? ` - ${new Date(data.endDate).toLocaleString()}` : ""}\n${data.isOnline ? "Online" : data.location}\n${data.meetingLink ? `Link: ${data.meetingLink}\n` : ""}${typeof data.price === "number" && data.price > 0 ? `Price: ₹${Number(data.price).toFixed(2)}` : "Price: Free"}`;
    return this.sendEmail({ to: data.to, subject: `Reminder: ${data.eventTitle} is tomorrow`, html, text });
  }
}

export const emailService = new EmailService();
