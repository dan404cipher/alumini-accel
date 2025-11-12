/**
 * Mentoring System Constants
 * Centralized constants for all mentoring features
 */

// Matching Algorithm Weights
export const MATCHING_WEIGHTS = {
  INDUSTRY_WEIGHT: 0.30,
  PROGRAMME_WEIGHT: 0.20,
  SKILLS_WEIGHT: 0.10,
  PREFERENCE_WEIGHT: 0.40,
} as const;

// Time-based Constants
export const AUTO_REJECT_DAYS = 3; // Days before auto-rejecting match requests
export const MAX_MENTEES_PER_MENTOR = 20; // Maximum number of mentees a mentor can have per program
export const MIN_AGE_YEARS = 16; // Minimum age for registration

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'] as const;

// Email Domain Constants
export const SIT_EMAIL_DOMAINS = [
  '@sit.edu',
  '@sit.sg',
  '@singaporetech.edu.sg',
] as const;

// Registration Field Options
export const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr'] as const;

export const EVENT_SLOT_OPTIONS = [
  'Weekend afternoon',
  'Weekday evenings',
] as const;

export const MEETUP_PREFERENCE_OPTIONS = ['Virtual', 'Physical'] as const;

// Field Length Constraints
export const FIELD_LENGTHS = {
  NAME: 30,
  PREFERRED_NAME: 100,
  SHORT_DESCRIPTION: 250,
  LONG_DESCRIPTION: 5000,
  PROGRAM_NAME: 75,
  STUDENT_ID: 10,
  MATRIC_NUMBER: 10,
  MOBILE_NUMBER: 20,
  AREAS_OF_MENTORING: 100,
  F_B_PREFERENCE: 100,
  DIETARY_RESTRICTIONS: 100,
  MAILING_ADDRESS: 200,
  EVENT_MEETUP_PREFERENCE: 100,
  REJECTION_REASON_MIN: 10,
} as const;

// Year Range Constants
export const CLASS_OF_YEAR_MIN = 1950;
export const CLASS_OF_YEAR_MAX = new Date().getFullYear() + 5; // Allow future years up to 5 years ahead
export const CLASS_OF_2017 = 2017; // Threshold for Student ID vs Matric Number

// Registration Status
export const REGISTRATION_STATUS = {
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Matching Status
export const MATCHING_STATUS = {
  PENDING_MENTOR_ACCEPTANCE: 'pending_mentor_acceptance',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  EXPIRED: 'expired',
  AUTO_REJECTED: 'auto_rejected',
} as const;

// Program Status
export const PROGRAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

// Registration Field Configuration
export const REGISTRATION_FIELDS_CONFIG = {
  title: {
    required: true,
    type: 'enum',
    options: TITLE_OPTIONS,
  },
  firstName: {
    required: true,
    maxLength: FIELD_LENGTHS.NAME,
    allowSpecialChars: false,
  },
  lastName: {
    required: true,
    maxLength: FIELD_LENGTHS.NAME,
    allowSpecialChars: false,
  },
  preferredName: {
    required: true,
    maxLength: FIELD_LENGTHS.PREFERRED_NAME,
    allowSpecialChars: false,
  },
  mobileNumber: {
    required: false,
    maxLength: FIELD_LENGTHS.MOBILE_NUMBER,
    validateFormat: true,
  },
  dateOfBirth: {
    required: true,
    minAge: MIN_AGE_YEARS,
  },
  personalEmail: {
    required: true,
    validateDomain: true,
  },
  sitEmail: {
    required: true,
    validateSITDomain: true,
  },
  classOf: {
    required: true,
    minYear: CLASS_OF_YEAR_MIN,
    maxYear: CLASS_OF_YEAR_MAX,
  },
  sitStudentId: {
    required: 'conditional', // Required if classOf >= 2017
    maxLength: FIELD_LENGTHS.STUDENT_ID,
    validateFormat: true,
  },
  sitMatricNumber: {
    required: 'conditional', // Required if classOf < 2017
    maxLength: FIELD_LENGTHS.MATRIC_NUMBER,
    validateFormat: true,
  },
  mentorCV: {
    required: false,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES,
  },
  menteeCV: {
    required: false,
    maxSize: MAX_FILE_SIZE,
    allowedTypes: ALLOWED_FILE_TYPES,
  },
  areasOfMentoring: {
    required: true,
    minItems: 1,
    maxLengthPerItem: FIELD_LENGTHS.AREAS_OF_MENTORING,
  },
  eventSlotPreference: {
    required: false,
    type: 'enum',
    options: EVENT_SLOT_OPTIONS,
  },
  eventMeetupPreference: {
    required: false,
    type: 'enum',
    options: MEETUP_PREFERENCE_OPTIONS,
  },
  pdpaConsent: {
    required: true,
    type: 'boolean',
    mustBeTrue: true,
  },
  recaptchaToken: {
    required: true,
    type: 'string',
  },
} as const;

// Date Validation Constants
export const DATE_FORMATS = {
  DISPLAY: 'MMM d, yyyy',
  DISPLAY_WITH_TIME: 'MMM d, yyyy h:mm a',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
} as const;

// Email Rate Limiting
export const EMAIL_RATE_LIMIT = {
  BATCH_SIZE: 50,
  DELAY_BETWEEN_BATCHES: 1000, // 1 second
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000, // 5 seconds
} as const;

// Token Generation
export const TOKEN_CONFIG = {
  LENGTH: 32,
  EXPIRY_HOURS: 168, // 7 days
} as const;

