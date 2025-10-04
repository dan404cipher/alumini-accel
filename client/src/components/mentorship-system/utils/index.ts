// Utility functions for the Mentorship System
// Author: AI Assistant
// Purpose: Helper functions for form validation, text formatting, and data manipulation

import type {
  Mentor,
  RequestFormData,
  MentorshipRequest,
  MentorshipError,
} from "../types";

/**
 * Validates mentor form data
 * @param formData - The mentor form data to validate
 * @returns boolean indicating if form is valid
 */
export const validateMentorForm = (formData: Mentor): Boolean => {
  // Basic validation logic - implement based on your requirements
  return !!(
    formData.name &&
    formData.title &&
    formData.company &&
    formData.yearsExp !== "" &&
    formData.slots !== "" &&
    formData.expertise.length > 0 &&
    formData.style &&
    formData.hours &&
    formData.timezone &&
    formData.testimonial
  );
};

/**
 * Validates mentorship request form data
 * @param formData - The request form data to validate
 * @returns boolean indicating if form is valid
 */
export const validateRequestForm = (formData: RequestFormData): Boolean => {
  return !!(
    formData.applicantName &&
    formData.applicantEducation &&
    formData.applicantYear &&
    formData.careerGoals &&
    formData.challenges &&
    formData.background &&
    formData.expectations &&
    formData.timeCommitment &&
    formData.communicationMethod &&
    formData.specificQuestions
  );
};

/**
 * Truncates text to specified limit
 * @param text - Text to truncate
 * @param limit - Character limit
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, limit: number): string => {
  return text.length > limit ? `${text.substring(0, limit)}...` : text;
};

/**
 * Formats time ago string from date
 * @param date - Date to format
 * @returns Human-readable time string
 */
export const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `Over a month ago`;
};

/**
 * Gets experience level categorization from years
 * @param years - Years of experience
 * @returns Experience level string
 */
export const getExperienceLevelFromYears = (years: number | ""): string => {
  if (years === "") return "Not specified";
  if (years < 2) return "Entry Level";
  if (years < 5) return "Mid Level";
  if (years < 10) return "Senior Level";
  return "Expert Level";
};

/**
 * Gets status icon for mentorship request status
 * @param status - The status string
 * @returns JSX element or string representing the status icon
 */
export const getStatusIcon = (status: string) => {
  switch (status) {
    case "Pending":
      return "⏳";
    case "Approved":
      return "✅";
    case "Rejected":
      return "❌";
    default:
      return "❓";
  }
};

/**
 * Gets status color for styling
 * @param status - The status string
 * @returns CSS color class or color string
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case "Pending":
      return "text-orange-600 bg-orange-50";
    case "Approved":
      return "text-green-600 bg-green-50";
    case "Rejected":
      return "text-red-600 bg-red-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

/**
 * Filters mentors based on search criteria
 * @param mentors - Array of mentors to filter
 * @param filters - Object containing filter criteria
 * @returns Filtered array of mentors
 */
export const filterMentors = (
  mentors: Mentor[],
  filters: {
    searchTerm: string;
    selectedIndustry: string;
    selectedExperienceLevel: string;
  }
) => {
  const { searchTerm, selectedIndustry, selectedExperienceLevel } = filters;

  return mentors.filter((mentor) => {
    const matchesSearch =
      !searchTerm ||
      mentor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.expertise.some((skill) =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesIndustry =
      !selectedIndustry || mentor.industry === selectedIndustry;
    const matchesExperience =
      !selectedExperienceLevel ||
      getExperienceLevelFromYears(mentor.yearsExp) === selectedExperienceLevel;

    return matchesSearch && matchesIndustry && matchesExperience;
  });
};

/**
 * Generates unique ID for mentorship requests
 * @returns Unique string ID
 */
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Handles file upload validation
 * @param file - The file to validate
 * @param maxSizeMB - Maximum file size in MB
 * @param allowedTypes - Array of allowed MIME types
 * @returns Validation result with success boolean and optional error message
 */
export const validateFileUpload = (
  file: File,
  maxSizeMB: number = 5,
  allowedTypes: string[] = ["image/jpeg", "image/png", "image/gif"]
): { success: boolean; error?: string } => {
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      error: "File type not allowed. Please upload a valid image.",
    };
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return {
      success: false,
      error: `File size must be less than ${maxSizeMB}MB.`,
    };
  }

  return { success: true };
};

/**
 * Formats mentor slot availability text
 * @param slots - Number of available slots
 * @returns Formatted availability text
 */
export const formatAvailability = (slots: number | ""): string => {
  if (slots === "") return "Not specified";
  if (slots === 0) return "Fully booked";
  if (slots === 1) return "1 slot available";
  return `${slots} slots available`;
};

/**
 * Generates default mentor data for forms
 * @returns Default mentor object
 */
export const getDefaultMentorData = (): Mentor => ({
  name: "",
  title: "",
  company: "",
  yearsExp: "",
  slots: "",
  expertise: [],
  style: "",
  hours: "",
  timezone: "",
  testimonial: "",
  industry: "",
});

/**
 * Generates default request form data
 * @returns Default request form object
 */
export const getDefaultRequestData = (): RequestFormData => ({
  applicantName: "",
  applicantEducation: "",
  applicantYear: "",
  careerGoals: "",
  challenges: "",
  background: "",
  expectations: "",
  timeCommitment: "",
  communicationMethod: "",
  specificQuestions: "",
});

// Export all utility functions
export default {
  validateMentorForm,
  validateRequestForm,
  truncateText,
  formatTimeAgo,
  getExperienceLevelFromYears,
  getStatusIcon,
  getStatusColor,
  filterMentors,
  generateRequestId,
  validateFileUpload,
  formatAvailability,
  getDefaultMentorData,
  getDefaultRequestData,
};
