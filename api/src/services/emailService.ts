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
    // Configure email transporter
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
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
    } catch (error) {
      logger.error("Failed to send email:", error);
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
