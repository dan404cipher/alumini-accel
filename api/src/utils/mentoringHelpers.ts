import crypto from 'crypto';
import { logger } from './logger';
import { emailService } from '../services/emailService';
import { TOKEN_CONFIG, EMAIL_RATE_LIMIT } from '../constants/mentoring';
import User from '../models/User';
import MenteeRegistration from '../models/MenteeRegistration';

/**
 * Generate unique token for registration links
 */
export const generateUniqueToken = (length: number = TOKEN_CONFIG.LENGTH): string => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Validate registration token
 */
export const validateToken = async (
  token: string,
  programId: string
): Promise<{ valid: boolean; error?: string; registration?: any }> => {
  try {
    const registration = await MenteeRegistration.findOne({
      registrationToken: token,
      programId,
    });

    if (!registration) {
      return {
        valid: false,
        error: 'Invalid or expired registration token',
      };
    }

    // Check if token is still valid (not expired based on program registration date)
    // This would require checking the program's registrationEndDateMentee
    // Implementation depends on how tokens are stored/expired

    return {
      valid: true,
      registration,
    };
  } catch (error) {
    logger.error('Token validation error:', error);
    return {
      valid: false,
      error: 'Failed to validate token',
    };
  }
};

/**
 * Generate registration link for mentee
 */
export const generateRegistrationLink = (
  token: string,
  baseUrl: string = process.env.FRONTEND_URL || 'http://localhost:8080'
): string => {
  return `${baseUrl}/mentee-registration?token=${token}`;
};

/**
 * Format mentor name for display
 */
export const formatMentorName = (
  mentor: {
    preferredName?: string;
    firstName?: string;
    lastName?: string;
    title?: string;
  }
): string => {
  const name = mentor.preferredName || 
    `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim();
  
  if (mentor.title) {
    return `${mentor.title} ${name}`;
  }
  
  return name;
};

/**
 * Format date range for display
 */
export const formatDateRange = (
  startDate: Date | string,
  endDate: Date | string,
  format: 'short' | 'long' | 'relative' = 'short'
): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (format === 'short') {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }
  
  if (format === 'long') {
    return `${start.toLocaleString()} to ${end.toLocaleString()}`;
  }
  
  // Relative format (e.g., "2 days ago")
  const now = new Date();
  const diffTime = Math.abs(start.getTime() - now.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays < 7) return `In ${diffDays} days`;
  
  return start.toLocaleDateString();
};

/**
 * Get human-readable registration status
 */
export const getRegistrationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    submitted: 'Submitted',
    approved: 'Approved',
    rejected: 'Rejected',
  };
  
  return statusMap[status] || status;
};

/**
 * Check if mentor has available slots
 */
export const checkMentorAvailability = async (
  mentorId: string,
  programId: string,
  maxMentees?: number
): Promise<{ available: boolean; currentCount: number; maxCount?: number }> => {
  try {
    const MentorMenteeMatching = (await import('../models/MentorMenteeMatching')).default;
    
    // Count current accepted matches for this mentor in this program
    const currentMatches = await MentorMenteeMatching.countDocuments({
      mentorId,
      programId,
      status: 'accepted',
    });
    
    if (maxMentees && currentMatches >= maxMentees) {
      return {
        available: false,
        currentCount: currentMatches,
        maxCount: maxMentees,
      };
    }
    
    return {
      available: true,
      currentCount: currentMatches,
      maxCount: maxMentees,
    };
  } catch (error) {
    logger.error('Check mentor availability error:', error);
    return {
      available: false,
      currentCount: 0,
    };
  }
};

/**
 * Send emails in batches with rate limiting
 */
export const sendBulkEmails = async (
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    metadata?: Record<string, any>;
  }>,
  options: {
    batchSize?: number;
    delayBetweenBatches?: number;
    onProgress?: (sent: number, total: number) => void;
  } = {}
): Promise<{ success: number; failed: number; errors: any[] }> => {
  const {
    batchSize = EMAIL_RATE_LIMIT.BATCH_SIZE,
    delayBetweenBatches = EMAIL_RATE_LIMIT.DELAY_BETWEEN_BATCHES,
    onProgress,
  } = options;

  let success = 0;
  let failed = 0;
  const errors: any[] = [];

  // Process emails in batches
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);
    
    // Send batch concurrently
    const results = await Promise.allSettled(
      batch.map(async (email) => {
        try {
          await emailService.sendEmail(email);
          return { success: true, email: email.to };
        } catch (error: any) {
          return { success: false, email: email.to, error: error.message };
        }
      })
    );

    // Count results
    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          success++;
        } else {
          failed++;
          errors.push({
            email: result.value.email,
            error: result.value.error,
          });
        }
      } else {
        failed++;
        errors.push({
          email: 'unknown',
          error: result.reason?.message || 'Unknown error',
        });
      }
    });

    // Progress callback
    if (onProgress) {
      onProgress(success + failed, emails.length);
    }

    // Delay before next batch (except for last batch)
    if (i + batchSize < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return { success, failed, errors };
};

/**
 * Calculate age from date of birth
 */
export const calculateAge = (dateOfBirth: Date | string): number => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Sanitize HTML content (basic)
 */
export const sanitizeHTML = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, ''); // Remove event handlers
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (firstName?: string, lastName?: string): string => {
  const first = firstName?.charAt(0).toUpperCase() || '';
  const last = lastName?.charAt(0).toUpperCase() || '';
  return first + last || '?';
};

/**
 * Format phone number for display
 */
export const formatPhoneNumber = (phone: string): string => {
  // Basic formatting - can be enhanced
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone; // Return as-is if can't format
};

/**
 * Check if date is in the past
 */
export const isDateInPast = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

/**
 * Check if date is in the future
 */
export const isDateInFuture = (date: Date | string): boolean => {
  return new Date(date) > new Date();
};

/**
 * Get days until date
 */
export const getDaysUntil = (date: Date | string): number => {
  const target = new Date(date);
  const today = new Date();
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is within range
 */
export const isDateInRange = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const check = new Date(date);
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return check >= start && check <= end;
};

