import twilio from 'twilio';
import { logger } from './logger';

// Twilio client configuration
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// SMS interface
interface SMSOptions {
  to: string;
  body: string;
  from?: string;
}

// Send SMS function
export const sendSMS = async (options: SMSOptions): Promise<boolean> => {
  try {
    const message = await twilioClient.messages.create({
      body: options.body,
      from: options.from || process.env.TWILIO_PHONE_NUMBER,
      to: options.to
    });

    logger.info('SMS sent successfully:', {
      messageId: message.sid,
      to: options.to,
      status: message.status
    });

    return true;
  } catch (error) {
    logger.error('SMS sending failed:', error);
    return false;
  }
};

// SMS templates
export const smsTemplates = {
  // Welcome SMS
  welcome: (firstName: string) => ({
    body: `Welcome to AlumniAccel, ${firstName}! Your account has been created successfully. Please check your email to verify your account.`
  }),

  // Event reminder
  eventReminder: (firstName: string, eventTitle: string, eventDate: string) => ({
    body: `Hi ${firstName}! Reminder: ${eventTitle} is tomorrow at ${eventDate}. Don't forget to attend!`
  }),

  // Job notification
  jobNotification: (firstName: string, jobTitle: string, companyName: string) => ({
    body: `Hi ${firstName}! New job opportunity: ${jobTitle} at ${companyName}. Check your email for details.`
  }),

  // Password reset
  passwordReset: (firstName: string, resetCode: string) => ({
    body: `Hi ${firstName}! Your AlumniAccel password reset code is: ${resetCode}. This code expires in 10 minutes.`
  }),

  // Verification code
  verificationCode: (firstName: string, code: string) => ({
    body: `Hi ${firstName}! Your AlumniAccel verification code is: ${code}. This code expires in 5 minutes.`
  }),

  // Event registration confirmation
  eventConfirmation: (firstName: string, eventTitle: string, eventDate: string) => ({
    body: `Hi ${firstName}! You're confirmed for ${eventTitle} on ${eventDate}. We look forward to seeing you there!`
  }),

  // Mentorship request
  mentorshipRequest: (firstName: string, menteeName: string, domain: string) => ({
    body: `Hi ${firstName}! ${menteeName} has requested mentorship in ${domain}. Please check your email for details.`
  }),

  // Donation receipt
  donationReceipt: (firstName: string, amount: number, cause: string) => ({
    body: `Hi ${firstName}! Thank you for your donation of $${amount} for ${cause}. Your receipt has been sent to your email.`
  }),

  // Newsletter notification
  newsletterNotification: (firstName: string) => ({
    body: `Hi ${firstName}! The latest AlumniAccel newsletter is now available. Check your email for the full update.`
  }),

  // Account verification
  accountVerification: (firstName: string, verificationCode: string) => ({
    body: `Hi ${firstName}! Your AlumniAccel account verification code is: ${verificationCode}. Enter this code to verify your account.`
  })
};

// Verify SMS configuration
export const verifySMSConfig = async (): Promise<boolean> => {
  try {
    // Test the Twilio client by getting account info
    const account = await twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID || '').fetch();
    logger.info('SMS configuration verified successfully', {
      accountSid: account.sid,
      status: account.status
    });
    return true;
  } catch (error) {
    logger.error('SMS configuration verification failed:', error);
    return false;
  }
};

// Send bulk SMS (for notifications)
export const sendBulkSMS = async (phoneNumbers: string[], template: string, variables: any): Promise<boolean[]> => {
  const results: boolean[] = [];

  for (const phoneNumber of phoneNumbers) {
    try {
      let messageBody = '';
      
      switch (template) {
        case 'welcome':
          messageBody = smsTemplates.welcome(variables.firstName).body;
          break;
        case 'eventReminder':
          messageBody = smsTemplates.eventReminder(variables.firstName, variables.eventTitle, variables.eventDate).body;
          break;
        case 'jobNotification':
          messageBody = smsTemplates.jobNotification(variables.firstName, variables.jobTitle, variables.companyName).body;
          break;
        case 'passwordReset':
          messageBody = smsTemplates.passwordReset(variables.firstName, variables.resetCode).body;
          break;
        case 'verificationCode':
          messageBody = smsTemplates.verificationCode(variables.firstName, variables.code).body;
          break;
        case 'eventConfirmation':
          messageBody = smsTemplates.eventConfirmation(variables.firstName, variables.eventTitle, variables.eventDate).body;
          break;
        case 'mentorshipRequest':
          messageBody = smsTemplates.mentorshipRequest(variables.firstName, variables.menteeName, variables.domain).body;
          break;
        case 'donationReceipt':
          messageBody = smsTemplates.donationReceipt(variables.firstName, variables.amount, variables.cause).body;
          break;
        case 'newsletterNotification':
          messageBody = smsTemplates.newsletterNotification(variables.firstName).body;
          break;
        case 'accountVerification':
          messageBody = smsTemplates.accountVerification(variables.firstName, variables.verificationCode).body;
          break;
        default:
          messageBody = variables.message || 'You have a new notification from AlumniAccel.';
      }

      const success = await sendSMS({
        to: phoneNumber,
        body: messageBody
      });

      results.push(success);
    } catch (error) {
      logger.error(`Failed to send SMS to ${phoneNumber}:`, error);
      results.push(false);
    }
  }

  return results;
};

// Validate phone number format
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Basic phone number validation (E.164 format)
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
};

// Format phone number to E.164
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // If it doesn't start with +, add +1 (assuming US numbers)
  if (!cleaned.startsWith('+')) {
    cleaned = '+1' + cleaned;
  }
  
  return cleaned;
};

export default {
  sendSMS,
  smsTemplates,
  verifySMSConfig,
  sendBulkSMS,
  validatePhoneNumber,
  formatPhoneNumber
}; 