import PDFDocument from "pdfkit";
import { logger } from "../utils/logger";
import { emailService } from "./emailService";

interface ReceiptData {
  donation: any;
  campaign?: any;
  fund?: any;
  donor: {
    name: string;
    email: string;
    address?: string;
  };
}

/**
 * Generate PDF receipt for donation
 */
export const generateReceiptPDF = async (
  data: ReceiptData
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fontSize(20).text("DONATION RECEIPT", { align: "center" });
      doc.moveDown();

      // Receipt details
      doc.fontSize(12);
      doc.text(`Receipt Number: ${data.donation.transactionId || data.donation._id}`, {
        align: "left",
      });
      doc.text(
        `Date: ${new Date(data.donation.paidAt || data.donation.createdAt).toLocaleDateString()}`,
        { align: "left" }
      );
      doc.moveDown();

      // Donor information
      doc.fontSize(14).text("Donor Information", { underline: true });
      doc.fontSize(12);
      doc.text(`Name: ${data.donor.name}`);
      doc.text(`Email: ${data.donor.email}`);
      if (data.donor.address) {
        doc.text(`Address: ${data.donor.address}`);
      }
      doc.moveDown();

      // Donation details
      doc.fontSize(14).text("Donation Details", { underline: true });
      doc.fontSize(12);
      doc.text(`Amount: ${formatCurrency(data.donation.amount, data.donation.currency)}`);
      doc.text(`Payment Method: ${data.donation.paymentMethod}`);
      if (data.donation.taxDeductible) {
        doc.text("Tax Deductible: Yes");
      }
      doc.moveDown();

      // Campaign/Fund information
      if (data.campaign) {
        doc.fontSize(14).text("Campaign", { underline: true });
        doc.fontSize(12);
        doc.text(`Campaign: ${data.campaign.title || data.campaign.name}`);
        if (data.campaign.description) {
          doc.text(`Description: ${data.campaign.description.substring(0, 100)}...`);
        }
        doc.moveDown();
      }

      if (data.fund) {
        doc.fontSize(14).text("Fund", { underline: true });
        doc.fontSize(12);
        doc.text(`Fund: ${data.fund.name}`);
        if (data.fund.description) {
          doc.text(`Description: ${data.fund.description.substring(0, 100)}...`);
        }
        doc.moveDown();
      }

      // Message
      if (data.donation.message) {
        doc.fontSize(14).text("Message", { underline: true });
        doc.fontSize(12);
        doc.text(data.donation.message);
        doc.moveDown();
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(10).text("Thank you for your generous contribution!", {
        align: "center",
      });
      doc.text("This receipt serves as proof of your donation.", {
        align: "center",
      });

      doc.end();
    } catch (error) {
      logger.error("Error generating receipt PDF:", error);
      reject(error);
    }
  });
};

/**
 * Format currency amount
 */
const formatCurrency = (amount: number, currency: string): string => {
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  });
  return formatter.format(amount);
};

/**
 * Send receipt email with PDF attachment
 */
export const sendReceiptEmail = async (
  data: ReceiptData,
  pdfBuffer: Buffer
): Promise<boolean> => {
  try {
    const receiptNumber = data.donation.transactionId || data.donation._id;
    const subject = `Donation Receipt - ${receiptNumber}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
          .amount { font-size: 24px; font-weight: bold; color: #10b981; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Thank You for Your Donation!</h1>
          </div>
          <div class="content">
            <p>Dear ${data.donor.name},</p>
            <p>Thank you for your generous donation of <span class="amount">${formatCurrency(data.donation.amount, data.donation.currency)}</span>.</p>
            <p>Your receipt is attached to this email for your records.</p>
            ${data.campaign ? `<p><strong>Campaign:</strong> ${data.campaign.title || data.campaign.name}</p>` : ""}
            ${data.fund ? `<p><strong>Fund:</strong> ${data.fund.name}</p>` : ""}
            <p>Receipt Number: <strong>${receiptNumber}</strong></p>
            <p>Your contribution makes a real difference. We truly appreciate your support!</p>
          </div>
          <div class="footer">
            <p>This is an automated receipt. Please keep it for your records.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Thank You for Your Donation!\n\nDear ${data.donor.name},\n\nThank you for your generous donation of ${formatCurrency(data.donation.amount, data.donation.currency)}.\n\nYour receipt is attached to this email.\n\nReceipt Number: ${receiptNumber}\n\nThank you for your support!`;

    return await emailService.sendEmail({
      to: data.donor.email,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `receipt-${receiptNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    logger.error("Error sending receipt email:", error);
    return false;
  }
};

