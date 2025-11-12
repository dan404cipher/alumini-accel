/**
 * Frontend Validation Utilities for Mentoring System
 * Real-time form validation and error formatting
 */

// Constants (matching backend constants)
const FIELD_LENGTHS = {
  NAME: 30,
  PREFERRED_NAME: 100,
  STUDENT_ID: 10,
  MATRIC_NUMBER: 10,
  MOBILE_NUMBER: 20,
  AREAS_OF_MENTORING: 100,
  REJECTION_REASON_MIN: 10,
};

const MIN_AGE_YEARS = 16;
const CLASS_OF_2017 = 2017;
const CLASS_OF_YEAR_MIN = 1950;
const CLASS_OF_YEAR_MAX = new Date().getFullYear() + 5;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_FILE_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const SIT_EMAIL_DOMAINS = [
  '@sit.edu',
  '@sit.sg',
  '@singaporetech.edu.sg',
];

const TITLE_OPTIONS = ['Mr', 'Mrs', 'Ms', 'Dr'];
const EVENT_SLOT_OPTIONS = ['Weekend afternoon', 'Weekday evenings'];
const MEETUP_PREFERENCE_OPTIONS = ['Virtual', 'Physical'];

// Validation Result Type
export interface ValidationResult {
  valid: boolean;
  error?: string;
  [key: string]: any;
}

/**
 * Validate registration closure date (client-side check)
 */
export const validateRegistrationClosureDate = (
  closureDate: Date | string
): ValidationResult => {
  const now = new Date();
  const closure = new Date(closureDate);

  if (now > closure) {
    return {
      valid: false,
      error: 'Registration period has closed for this program',
    };
  }

  return { valid: true };
};

/**
 * Validate SIT email domain
 */
export const validateSITEmail = (
  email: string,
  allowedDomains: string[] = SIT_EMAIL_DOMAINS
): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'SIT email is required',
    };
  }

  const emailLower = email.toLowerCase();
  const isValid = allowedDomains.some((domain) =>
    emailLower.endsWith(domain.toLowerCase())
  );

  if (!isValid) {
    return {
      valid: false,
      error: 'SIT email must be from an approved SIT domain',
    };
  }

  return { valid: true };
};

/**
 * Validate student ID format
 */
export const validateStudentID = (
  studentId: string,
  classOf: number
): ValidationResult => {
  if (classOf >= CLASS_OF_2017) {
    if (!studentId || studentId.trim().length === 0) {
      return {
        valid: false,
        error: 'SIT Student ID is required for graduates after 2017',
      };
    }

    if (studentId.length > FIELD_LENGTHS.STUDENT_ID) {
      return {
        valid: false,
        error: 'Student ID cannot exceed 10 characters',
      };
    }

    if (!/^[a-zA-Z0-9]+$/.test(studentId)) {
      return {
        valid: false,
        error: 'Student ID must be alphanumeric only',
      };
    }
  }

  return { valid: true };
};

/**
 * Validate matric number format
 */
export const validateMatricNumber = (
  matricNumber: string,
  classOf: number
): ValidationResult => {
  if (classOf < CLASS_OF_2017) {
    if (!matricNumber || matricNumber.trim().length === 0) {
      return {
        valid: false,
        error: 'SIT Matric Number is required for graduates before 2017',
      };
    }

    if (matricNumber.length > FIELD_LENGTHS.MATRIC_NUMBER) {
      return {
        valid: false,
        error: 'Matric Number cannot exceed 10 characters',
      };
    }

    if (!/^[a-zA-Z0-9]+$/.test(matricNumber)) {
      return {
        valid: false,
        error: 'Matric Number must be alphanumeric only',
      };
    }
  }

  return { valid: true };
};

/**
 * Validate date of birth
 */
export const validateDateOfBirth = (
  dateOfBirth: Date | string
): ValidationResult => {
  if (!dateOfBirth) {
    return {
      valid: false,
      error: 'Date of birth is required',
    };
  }

  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }

  if (age < MIN_AGE_YEARS) {
    return {
      valid: false,
      error: `Must be at least ${MIN_AGE_YEARS} years old to register`,
      age,
    };
  }

  if (dob > now) {
    return {
      valid: false,
      error: 'Date of birth cannot be in the future',
      age,
    };
  }

  return { valid: true, age };
};

/**
 * Validate special characters
 */
export const validateSpecialCharacters = (
  text: string,
  allowSpecial: boolean = false
): ValidationResult => {
  if (!text || typeof text !== 'string') {
    return { valid: true };
  }

  if (allowSpecial) {
    return { valid: true };
  }

  const pattern = /^[a-zA-Z0-9\s\-_]+$/;

  if (!pattern.test(text)) {
    return {
      valid: false,
      error:
        'Contains invalid characters. Only letters, numbers, spaces, hyphens, and underscores are allowed',
    };
  }

  return { valid: true };
};

/**
 * Validate phone number
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  required: boolean = false
): ValidationResult => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    if (required) {
      return {
        valid: false,
        error: 'Phone number is required',
      };
    }
    return { valid: true };
  }

  if (phoneNumber.length > FIELD_LENGTHS.MOBILE_NUMBER) {
    return {
      valid: false,
      error: 'Phone number cannot exceed 20 characters',
    };
  }

  const phonePattern =
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

  if (!phonePattern.test(phoneNumber.replace(/\s/g, ''))) {
    return {
      valid: false,
      error: 'Invalid phone number format',
    };
  }

  return { valid: true };
};

/**
 * Validate email domain
 */
export const validateEmailDomain = (
  email: string,
  allowedDomains?: string[]
): ValidationResult => {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: 'Email format is invalid',
    };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      error: 'Email format is invalid',
    };
  }

  if (allowedDomains && allowedDomains.length > 0) {
    const emailLower = email.toLowerCase();
    const isValidDomain = allowedDomains.some((domain) =>
      emailLower.endsWith(domain.toLowerCase())
    );

    if (!isValidDomain) {
      return {
        valid: false,
        error: 'Email domain is not allowed',
      };
    }
  }

  return { valid: true };
};

/**
 * Validate file upload (client-side)
 */
export const validateFileUpload = (
  file: File | null | undefined,
  required: boolean = false
): ValidationResult => {
  if (!file) {
    if (required) {
      return {
        valid: false,
        error: 'File is required',
      };
    }
    return { valid: true };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds maximum limit of 10MB',
    };
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type as any)) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_FILE_EXTENSIONS.includes(`.${ext}` as any)) {
      return {
        valid: false,
        error: 'File type not allowed. Only PDF, DOC, and DOCX files are accepted',
      };
    }
  }

  return { valid: true };
};

/**
 * Validate class of year
 */
export const validateClassOfYear = (classOf: number): ValidationResult => {
  if (!classOf || isNaN(classOf)) {
    return {
      valid: false,
      error: 'Class of year is required',
    };
  }

  if (classOf < CLASS_OF_YEAR_MIN || classOf > CLASS_OF_YEAR_MAX) {
    return {
      valid: false,
      error: `Class of year must be between ${CLASS_OF_YEAR_MIN} and ${CLASS_OF_YEAR_MAX}`,
    };
  }

  return { valid: true };
};

/**
 * Validate name fields
 */
export const validateNameFields = (
  firstName: string,
  lastName: string,
  preferredName?: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!firstName || firstName.trim().length === 0) {
    errors.push('First name is required');
  } else {
    if (firstName.length > FIELD_LENGTHS.NAME) {
      errors.push('First name cannot exceed 30 characters');
    }
    const specialCharCheck = validateSpecialCharacters(firstName);
    if (!specialCharCheck.valid) {
      errors.push(specialCharCheck.error || 'Invalid characters in first name');
    }
  }

  if (!lastName || lastName.trim().length === 0) {
    errors.push('Last name is required');
  } else {
    if (lastName.length > FIELD_LENGTHS.NAME) {
      errors.push('Last name cannot exceed 30 characters');
    }
    const specialCharCheck = validateSpecialCharacters(lastName);
    if (!specialCharCheck.valid) {
      errors.push(specialCharCheck.error || 'Invalid characters in last name');
    }
  }

  if (preferredName !== undefined) {
    if (!preferredName || preferredName.trim().length === 0) {
      errors.push('Preferred name is required');
    } else {
      if (preferredName.length > FIELD_LENGTHS.PREFERRED_NAME) {
        errors.push('Preferred name cannot exceed 100 characters');
      }
      const specialCharCheck = validateSpecialCharacters(preferredName);
      if (!specialCharCheck.valid) {
        errors.push(
          specialCharCheck.error || 'Invalid characters in preferred name'
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Character count helper
 */
export const getCharacterCount = (text: string | undefined): number => {
  return text?.length || 0;
};

/**
 * Character count remaining helper
 */
export const getCharactersRemaining = (
  text: string | undefined,
  maxLength: number
): number => {
  const current = getCharacterCount(text);
  return Math.max(0, maxLength - current);
};

/**
 * Date validation helpers
 */
export const isDateValid = (date: Date | string | null): boolean => {
  if (!date) return false;
  const d = new Date(date);
  return !isNaN(d.getTime());
};

export const isDateInPast = (date: Date | string): boolean => {
  return new Date(date) < new Date();
};

export const isDateInFuture = (date: Date | string): boolean => {
  return new Date(date) > new Date();
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
 * Format error message for display
 */
export const formatErrorMessage = (
  field: string,
  error: string
): string => {
  return `${field}: ${error}`;
};

/**
 * reCAPTCHA integration helper
 */
export const validateRecaptcha = async (
  token: string | null
): Promise<ValidationResult> => {
  if (!token || token.trim().length === 0) {
    return {
      valid: false,
      error: 'reCAPTCHA verification is required',
    };
  }

  // In production, verify token with Google's reCAPTCHA API
  // For now, just check if token exists
  return { valid: true };
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate areas of mentoring
 */
export const validateAreasOfMentoring = (
  areas: string[]
): ValidationResult => {
  if (!areas || areas.length === 0) {
    return {
      valid: false,
      error: 'At least one area of mentoring is required',
    };
  }

  for (const area of areas) {
    if (area.length > FIELD_LENGTHS.AREAS_OF_MENTORING) {
      return {
        valid: false,
        error: 'Each area of mentoring cannot exceed 100 characters',
      };
    }
  }

  return { valid: true };
};

/**
 * Validate rejection reason
 */
export const validateRejectionReason = (reason: string): ValidationResult => {
  if (!reason || reason.trim().length === 0) {
    return {
      valid: false,
      error: 'Rejection reason is required',
    };
  }

  if (reason.trim().length < FIELD_LENGTHS.REJECTION_REASON_MIN) {
    return {
      valid: false,
      error: `Rejection reason must be at least ${FIELD_LENGTHS.REJECTION_REASON_MIN} characters`,
    };
  }

  return { valid: true };
};

// Export constants for use in components
export const MENTORING_CONSTANTS = {
  FIELD_LENGTHS,
  MIN_AGE_YEARS,
  CLASS_OF_2017,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  TITLE_OPTIONS,
  EVENT_SLOT_OPTIONS,
  MEETUP_PREFERENCE_OPTIONS,
  SIT_EMAIL_DOMAINS,
};

