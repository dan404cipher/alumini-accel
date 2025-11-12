import {
  FIELD_LENGTHS,
  MIN_AGE_YEARS,
  CLASS_OF_2017,
  CLASS_OF_YEAR_MIN,
  CLASS_OF_YEAR_MAX,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  ALLOWED_FILE_EXTENSIONS,
  SIT_EMAIL_DOMAINS,
  TITLE_OPTIONS,
  EVENT_SLOT_OPTIONS,
  MEETUP_PREFERENCE_OPTIONS,
} from '../constants/mentoring';
import { VALIDATION_ERRORS } from '../constants/mentoringErrors';

/**
 * Validate if registration is still open
 */
export const validateRegistrationClosureDate = (
  closureDate: Date,
  registrationType: 'mentor' | 'mentee'
): { valid: boolean; error?: string } => {
  const now = new Date();
  const closure = new Date(closureDate);

  if (now > closure) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.REGISTRATION_CLOSED.message,
    };
  }

  return { valid: true };
};

/**
 * Validate if matching can still be done
 */
export const validateMatchingDate = (
  matchingEndDate: Date,
  mentorRegistrationEndDate?: Date,
  menteeRegistrationEndDate?: Date
): { valid: boolean; error?: string } => {
  const now = new Date();
  const matchingEnd = new Date(matchingEndDate);

  if (now > matchingEnd) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.MATCHING_CLOSED.message,
    };
  }

  // Check if registrations are closed
  if (mentorRegistrationEndDate && now <= mentorRegistrationEndDate) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.MATCHING_NOT_READY.message,
    };
  }

  if (menteeRegistrationEndDate && now <= menteeRegistrationEndDate) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.MATCHING_NOT_READY.message,
    };
  }

  return { valid: true };
};

/**
 * Validate SIT email domain
 */
export const validateSITEmail = (
  email: string,
  allowedDomains: string[] = SIT_EMAIL_DOMAINS as any
): { valid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: VALIDATION_ERRORS.SIT_EMAIL_INVALID.message,
    };
  }

  const emailLower = email.toLowerCase();
  const isValid = allowedDomains.some((domain) =>
    emailLower.endsWith(domain.toLowerCase())
  );

  if (!isValid) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.SIT_EMAIL_INVALID.message,
    };
  }

  return { valid: true };
};

/**
 * Validate student ID format (post-2017)
 */
export const validateStudentID = (
  studentId: string,
  classOf: number
): { valid: boolean; error?: string } => {
  if (classOf >= CLASS_OF_2017) {
    if (!studentId || studentId.trim().length === 0) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.STUDENT_ID_REQUIRED.message,
      };
    }

    if (studentId.length > FIELD_LENGTHS.STUDENT_ID) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.STUDENT_ID_INVALID_FORMAT.message,
      };
    }

    // Alphanumeric only
    if (!/^[a-zA-Z0-9]+$/.test(studentId)) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.STUDENT_ID_INVALID_FORMAT.message,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate matric number format (pre-2017)
 */
export const validateMatricNumber = (
  matricNumber: string,
  classOf: number
): { valid: boolean; error?: string } => {
  if (classOf < CLASS_OF_2017) {
    if (!matricNumber || matricNumber.trim().length === 0) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.MATRIC_NUMBER_REQUIRED.message,
      };
    }

    if (matricNumber.length > FIELD_LENGTHS.MATRIC_NUMBER) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.MATRIC_NUMBER_INVALID_FORMAT.message,
      };
    }

    // Alphanumeric only
    if (!/^[a-zA-Z0-9]+$/.test(matricNumber)) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.MATRIC_NUMBER_INVALID_FORMAT.message,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate date of birth (min age 16)
 */
export const validateDateOfBirth = (
  dateOfBirth: Date | string
): { valid: boolean; error?: string; age?: number } => {
  if (!dateOfBirth) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.DOB_REQUIRED.message,
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
      error: VALIDATION_ERRORS.DOB_MIN_AGE.message.replace(
        `${16}`,
        `${MIN_AGE_YEARS}`
      ),
      age,
    };
  }

  // Check if date is not in the future
  if (dob > now) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.DOB_INVALID_FORMAT.message,
      age,
    };
  }

  return { valid: true, age };
};

/**
 * Validate special characters in text fields
 */
export const validateSpecialCharacters = (
  text: string,
  allowSpecial: boolean = false
): { valid: boolean; error?: string } => {
  if (!text || typeof text !== 'string') {
    return { valid: true }; // Empty strings are handled by required validation
  }

  if (allowSpecial) {
    return { valid: true };
  }

  // Allow letters, numbers, spaces, hyphens, underscores
  const pattern = /^[a-zA-Z0-9\s\-_]+$/;

  if (!pattern.test(text)) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.FIRST_NAME_INVALID.message,
    };
  }

  return { valid: true };
};

/**
 * Validate phone number format
 */
export const validatePhoneNumber = (
  phoneNumber: string,
  required: boolean = false
): { valid: boolean; error?: string } => {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    if (required) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.PHONE_INVALID_FORMAT.message,
      };
    }
    return { valid: true }; // Optional field
  }

  if (phoneNumber.length > FIELD_LENGTHS.MOBILE_NUMBER) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.PHONE_TOO_LONG.message,
    };
  }

  // Basic phone validation (allows country codes, spaces, hyphens, parentheses)
  const phonePattern =
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;

  if (!phonePattern.test(phoneNumber.replace(/\s/g, ''))) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.PHONE_INVALID_FORMAT.message,
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
): { valid: boolean; error?: string } => {
  if (!email || typeof email !== 'string') {
    return {
      valid: false,
      error: VALIDATION_ERRORS.EMAIL_FORMAT_INVALID.message,
    };
  }

  // Basic email format validation
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.EMAIL_FORMAT_INVALID.message,
    };
  }

  // Domain validation if allowed domains provided
  if (allowedDomains && allowedDomains.length > 0) {
    const emailLower = email.toLowerCase();
    const isValidDomain = allowedDomains.some((domain) =>
      emailLower.endsWith(domain.toLowerCase())
    );

    if (!isValidDomain) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.EMAIL_DOMAIN_INVALID.message,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate file upload
 */
export const validateFileUpload = (
  file: Express.Multer.File | undefined,
  required: boolean = false
): { valid: boolean; error?: string } => {
  if (!file) {
    if (required) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.FILE_REQUIRED.message,
      };
    }
    return { valid: true }; // Optional file
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.FILE_TOO_LARGE.message,
    };
  }

  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype as any)) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.FILE_TYPE_INVALID.message,
    };
  }

  return { valid: true };
};

/**
 * Validate class of year
 */
export const validateClassOfYear = (
  classOf: number
): { valid: boolean; error?: string } => {
  if (!classOf || isNaN(classOf)) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.CLASS_OF_REQUIRED.message,
    };
  }

  if (classOf < CLASS_OF_YEAR_MIN || classOf > CLASS_OF_YEAR_MAX) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.CLASS_OF_INVALID_RANGE.message,
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
    errors.push(VALIDATION_ERRORS.FIRST_NAME_REQUIRED.message);
  } else {
    if (firstName.length > FIELD_LENGTHS.NAME) {
      errors.push(VALIDATION_ERRORS.FIRST_NAME_TOO_LONG.message);
    }
    const specialCharCheck = validateSpecialCharacters(firstName);
    if (!specialCharCheck.valid) {
      errors.push(VALIDATION_ERRORS.FIRST_NAME_INVALID.message);
    }
  }

  if (!lastName || lastName.trim().length === 0) {
    errors.push(VALIDATION_ERRORS.LAST_NAME_REQUIRED.message);
  } else {
    if (lastName.length > FIELD_LENGTHS.NAME) {
      errors.push(VALIDATION_ERRORS.LAST_NAME_TOO_LONG.message);
    }
    const specialCharCheck = validateSpecialCharacters(lastName);
    if (!specialCharCheck.valid) {
      errors.push(VALIDATION_ERRORS.LAST_NAME_INVALID.message);
    }
  }

  if (preferredName !== undefined) {
    if (!preferredName || preferredName.trim().length === 0) {
      errors.push(VALIDATION_ERRORS.PREFERRED_NAME_REQUIRED.message);
    } else {
      if (preferredName.length > FIELD_LENGTHS.PREFERRED_NAME) {
        errors.push(VALIDATION_ERRORS.PREFERRED_NAME_TOO_LONG.message);
      }
      const specialCharCheck = validateSpecialCharacters(preferredName);
      if (!specialCharCheck.valid) {
        errors.push(VALIDATION_ERRORS.PREFERRED_NAME_INVALID.message);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate title
 */
export const validateTitle = (
  title: string
): { valid: boolean; error?: string } => {
  if (!title || title.trim().length === 0) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.TITLE_REQUIRED.message,
    };
  }

  if (!TITLE_OPTIONS.includes(title as any)) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.TITLE_INVALID.message,
    };
  }

  return { valid: true };
};

/**
 * Validate areas of mentoring
 */
export const validateAreasOfMentoring = (
  areas: string[]
): { valid: boolean; error?: string } => {
  if (!areas || areas.length === 0) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.AREAS_REQUIRED.message,
    };
  }

  for (const area of areas) {
    if (area.length > FIELD_LENGTHS.AREAS_OF_MENTORING) {
      return {
        valid: false,
        error: VALIDATION_ERRORS.AREAS_TOO_LONG.message,
      };
    }
  }

  return { valid: true };
};

/**
 * Validate event slot preference
 */
export const validateEventSlotPreference = (
  preference: string
): { valid: boolean; error?: string } => {
  if (!preference) {
    return { valid: true }; // Optional
  }

  if (!EVENT_SLOT_OPTIONS.includes(preference as any)) {
    return {
      valid: false,
      error: 'Event slot preference must be one of: ' + EVENT_SLOT_OPTIONS.join(', '),
    };
  }

  return { valid: true };
};

/**
 * Validate meetup preference
 */
export const validateMeetupPreference = (
  preference: string
): { valid: boolean; error?: string } => {
  if (!preference) {
    return { valid: true }; // Optional
  }

  if (!MEETUP_PREFERENCE_OPTIONS.includes(preference as any)) {
    return {
      valid: false,
      error: 'Meetup preference must be one of: ' + MEETUP_PREFERENCE_OPTIONS.join(', '),
    };
  }

  return { valid: true };
};

/**
 * Validate PDPA consent
 */
export const validatePDPAConsent = (
  consent: boolean | string
): { valid: boolean; error?: string } => {
  const consentValue =
    typeof consent === 'boolean' ? consent : consent === 'true';

  if (!consentValue) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.PDPA_CONSENT_REQUIRED.message,
    };
  }

  return { valid: true };
};

/**
 * Validate rejection reason
 */
export const validateRejectionReason = (
  reason: string
): { valid: boolean; error?: string } => {
  if (!reason || reason.trim().length === 0) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.REJECTION_REASON_REQUIRED.message,
    };
  }

  if (reason.trim().length < FIELD_LENGTHS.REJECTION_REASON_MIN) {
    return {
      valid: false,
      error: VALIDATION_ERRORS.REJECTION_REASON_TOO_SHORT.message,
    };
  }

  return { valid: true };
};

