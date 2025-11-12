/**
 * Mentoring Utilities Index
 * Re-exports all validation and helper functions for easy importing
 */

// Validation functions
export * from './mentoringValidation';

// Helper functions
export * from './mentoringHelpers';

// Constants (re-export for convenience)
export * from '../constants/mentoring';
export { VALIDATION_ERRORS, getErrorMessage, getError } from '../constants/mentoringErrors';

