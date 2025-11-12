/**
 * Mentoring System Error Messages
 * Standardized error messages for all validation failures
 */

export const VALIDATION_ERRORS = {
  // Registration Closure Date
  REGISTRATION_CLOSED: {
    code: 'REG_001',
    message: 'Registration period has closed for this program',
    field: 'registrationDate',
  },
  REGISTRATION_NOT_OPEN: {
    code: 'REG_002',
    message: 'Registration period has not yet started',
    field: 'registrationDate',
  },

  // Matching Date
  MATCHING_CLOSED: {
    code: 'MATCH_001',
    message: 'Matching deadline has passed. Cannot approve or initiate matching',
    field: 'matchingDate',
  },
  MATCHING_NOT_READY: {
    code: 'MATCH_002',
    message: 'Matching cannot be initiated until registration periods are closed',
    field: 'matchingDate',
  },

  // Email Validation
  SIT_EMAIL_INVALID: {
    code: 'EMAIL_001',
    message: 'SIT email must be from an approved SIT domain',
    field: 'sitEmail',
  },
  EMAIL_DOMAIN_INVALID: {
    code: 'EMAIL_002',
    message: 'Email domain is not valid',
    field: 'email',
  },
  EMAIL_MISMATCH: {
    code: 'EMAIL_003',
    message: 'Personal email and SIT email cannot be the same',
    field: 'personalEmail',
  },
  EMAIL_REQUIRED: {
    code: 'EMAIL_004',
    message: 'Email address is required',
    field: 'email',
  },
  EMAIL_FORMAT_INVALID: {
    code: 'EMAIL_005',
    message: 'Email format is invalid',
    field: 'email',
  },

  // Student ID Validation
  STUDENT_ID_REQUIRED: {
    code: 'ID_001',
    message: 'SIT Student ID is required for graduates after 2017',
    field: 'sitStudentId',
  },
  STUDENT_ID_INVALID_FORMAT: {
    code: 'ID_002',
    message: 'Student ID format is invalid (alphanumeric, max 10 characters)',
    field: 'sitStudentId',
  },
  MATRIC_NUMBER_REQUIRED: {
    code: 'ID_003',
    message: 'SIT Matric Number is required for graduates before 2017',
    field: 'sitMatricNumber',
  },
  MATRIC_NUMBER_INVALID_FORMAT: {
    code: 'ID_004',
    message: 'Matric Number format is invalid (alphanumeric, max 10 characters)',
    field: 'sitMatricNumber',
  },

  // Date of Birth Validation
  DOB_REQUIRED: {
    code: 'DOB_001',
    message: 'Date of birth is required',
    field: 'dateOfBirth',
  },
  DOB_MIN_AGE: {
    code: 'DOB_002',
    message: `Must be at least ${16} years old to register`,
    field: 'dateOfBirth',
  },
  DOB_INVALID_FORMAT: {
    code: 'DOB_003',
    message: 'Date of birth format is invalid',
    field: 'dateOfBirth',
  },

  // Name Validation
  FIRST_NAME_REQUIRED: {
    code: 'NAME_001',
    message: 'First name is required',
    field: 'firstName',
  },
  FIRST_NAME_TOO_LONG: {
    code: 'NAME_002',
    message: 'First name cannot exceed 30 characters',
    field: 'firstName',
  },
  FIRST_NAME_INVALID: {
    code: 'NAME_003',
    message: 'First name contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed',
    field: 'firstName',
  },
  LAST_NAME_REQUIRED: {
    code: 'NAME_004',
    message: 'Last name is required',
    field: 'lastName',
  },
  LAST_NAME_TOO_LONG: {
    code: 'NAME_005',
    message: 'Last name cannot exceed 30 characters',
    field: 'lastName',
  },
  LAST_NAME_INVALID: {
    code: 'NAME_006',
    message: 'Last name contains invalid characters',
    field: 'lastName',
  },
  PREFERRED_NAME_REQUIRED: {
    code: 'NAME_007',
    message: 'Preferred name is required',
    field: 'preferredName',
  },
  PREFERRED_NAME_TOO_LONG: {
    code: 'NAME_008',
    message: 'Preferred name cannot exceed 100 characters',
    field: 'preferredName',
  },
  PREFERRED_NAME_INVALID: {
    code: 'NAME_009',
    message: 'Preferred name contains invalid characters',
    field: 'preferredName',
  },

  // Title Validation
  TITLE_REQUIRED: {
    code: 'TITLE_001',
    message: 'Title is required',
    field: 'title',
  },
  TITLE_INVALID: {
    code: 'TITLE_002',
    message: 'Title must be one of: Mr, Mrs, Ms, Dr',
    field: 'title',
  },

  // Class Of Validation
  CLASS_OF_REQUIRED: {
    code: 'CLASS_001',
    message: 'Class of year is required',
    field: 'classOf',
  },
  CLASS_OF_INVALID_RANGE: {
    code: 'CLASS_002',
    message: 'Class of year is outside valid range',
    field: 'classOf',
  },

  // Phone Validation
  PHONE_INVALID_FORMAT: {
    code: 'PHONE_001',
    message: 'Phone number format is invalid',
    field: 'mobileNumber',
  },
  PHONE_TOO_LONG: {
    code: 'PHONE_002',
    message: 'Phone number cannot exceed 20 characters',
    field: 'mobileNumber',
  },

  // File Upload Validation
  FILE_TOO_LARGE: {
    code: 'FILE_001',
    message: 'File size exceeds maximum limit of 10MB',
    field: 'file',
  },
  FILE_TYPE_INVALID: {
    code: 'FILE_002',
    message: 'File type not allowed. Only PDF, DOC, and DOCX files are accepted',
    field: 'file',
  },
  FILE_REQUIRED: {
    code: 'FILE_003',
    message: 'File is required',
    field: 'file',
  },

  // Areas of Mentoring
  AREAS_REQUIRED: {
    code: 'AREAS_001',
    message: 'At least one area of mentoring is required',
    field: 'areasOfMentoring',
  },
  AREAS_TOO_LONG: {
    code: 'AREAS_002',
    message: 'Each area of mentoring cannot exceed 100 characters',
    field: 'areasOfMentoring',
  },

  // PDPA Consent
  PDPA_CONSENT_REQUIRED: {
    code: 'PDPA_001',
    message: 'PDPA consent is required to proceed',
    field: 'pdpaConsent',
  },

  // reCAPTCHA
  RECAPTCHA_REQUIRED: {
    code: 'RECAPTCHA_001',
    message: 'reCAPTCHA verification is required',
    field: 'recaptchaToken',
  },
  RECAPTCHA_INVALID: {
    code: 'RECAPTCHA_002',
    message: 'reCAPTCHA verification failed',
    field: 'recaptchaToken',
  },

  // Registration Status
  ALREADY_REGISTERED: {
    code: 'REG_003',
    message: 'You have already registered for this program',
    field: 'programId',
  },
  NOT_APPROVED: {
    code: 'REG_004',
    message: 'Your registration has not been approved yet',
    field: 'status',
  },
  REJECTED: {
    code: 'REG_005',
    message: 'Your registration has been rejected',
    field: 'status',
  },

  // Rejection Reason
  REJECTION_REASON_REQUIRED: {
    code: 'REJECT_001',
    message: 'Rejection reason is required (minimum 10 characters)',
    field: 'rejectionReason',
  },
  REJECTION_REASON_TOO_SHORT: {
    code: 'REJECT_002',
    message: 'Rejection reason must be at least 10 characters',
    field: 'rejectionReason',
  },

  // Matching Errors
  NO_PREFERENCES_SUBMITTED: {
    code: 'MATCH_003',
    message: 'Mentee preferences have not been submitted',
    field: 'preferences',
  },
  INVALID_PREFERENCE_COUNT: {
    code: 'MATCH_004',
    message: 'Exactly 3 mentor preferences are required',
    field: 'preferredMentors',
  },
  MENTOR_NOT_APPROVED: {
    code: 'MATCH_005',
    message: 'Selected mentor has not been approved',
    field: 'mentorId',
  },
  MENTEE_NOT_APPROVED: {
    code: 'MATCH_006',
    message: 'Mentee has not been approved',
    field: 'menteeId',
  },

  // Communication Errors
  COMMUNITY_NOT_FOUND: {
    code: 'COMM_001',
    message: 'Mentorship community not found',
    field: 'communityId',
  },
  NOT_COMMUNITY_MEMBER: {
    code: 'COMM_002',
    message: 'You are not a member of this community',
    field: 'communityId',
  },
  NOT_MENTOR: {
    code: 'COMM_003',
    message: 'Only mentors can send emails to mentees',
    field: 'role',
  },
  NOT_MENTEE: {
    code: 'COMM_004',
    message: 'Only mentees can send emails to mentors',
    field: 'role',
  },
} as const;

/**
 * Get error message by code
 */
export const getErrorMessage = (code: string): string => {
  for (const error of Object.values(VALIDATION_ERRORS)) {
    if (error.code === code) {
      return error.message;
    }
  }
  return 'Validation error occurred';
};

/**
 * Get error object by code
 */
export const getError = (code: string) => {
  for (const error of Object.values(VALIDATION_ERRORS)) {
    if (error.code === code) {
      return error;
    }
  }
  return null;
};

