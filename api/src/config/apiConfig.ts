// API Configuration for Frontend Integration
// This file contains all the API endpoints and configuration needed by the frontend

export const API_CONFIG = {
  // Base configuration
  BASE_URL: process.env.API_BASE_URL || "http://localhost:3000/api/v1",
  TIMEOUT: 30000, // 30 seconds

  // Authentication endpoints
  AUTH: {
    LOGIN: "/auth/login",
    REGISTER: "/auth/register",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
    VERIFY_EMAIL: "/auth/verify-email",
    FORGOT_PASSWORD: "/auth/forgot-password",
    RESET_PASSWORD: "/auth/reset-password",
  },

  // User management endpoints
  USERS: {
    BASE: "/users",
    GET_ALL: "/users",
    GET_BY_ID: (id: string) => `/users/${id}`,
    UPDATE_PROFILE: "/users/profile",
    UPDATE_STATUS: (id: string) => `/users/${id}/status`,
    DELETE: (id: string) => `/users/${id}`,
    SEARCH: "/users/search",
    STATS: "/users/stats",
    BULK_UPDATE: "/users/bulk-update",
  },

  // Alumni profile endpoints
  ALUMNI: {
    BASE: "/alumni",
    GET_ALL: "/alumni",
    GET_BY_ID: (id: string) => `/alumni/${id}`,
    CREATE: "/alumni",
    UPDATE: (id: string) => `/alumni/${id}`,
    DELETE: (id: string) => `/alumni/${id}`,
    SEARCH: "/alumni/search",
    GET_BY_BATCH: (batchYear: number) => `/alumni/batch/${batchYear}`,
    GET_HIRING: "/alumni/hiring",
    GET_MENTORS: "/alumni/mentors",
  },

  // Event management endpoints
  EVENTS: {
    BASE: "/events",
    GET_ALL: "/events",
    GET_BY_ID: (id: string) => `/events/${id}`,
    CREATE: "/events",
    UPDATE: (id: string) => `/events/${id}`,
    DELETE: (id: string) => `/events/${id}`,
    REGISTER: (id: string) => `/events/${id}/register`,
    UNREGISTER: (id: string) => `/events/${id}/unregister`,
    GET_MY_EVENTS: "/events/my-events",
    GET_UPCOMING: "/events/upcoming",
    GET_PAST: "/events/past",
  },

  // Job posting endpoints
  JOBS: {
    BASE: "/jobs",
    GET_ALL: "/jobs",
    GET_BY_ID: (id: string) => `/jobs/${id}`,
    CREATE: "/jobs",
    UPDATE: (id: string) => `/jobs/${id}`,
    DELETE: (id: string) => `/jobs/${id}`,
    APPLY: (id: string) => `/jobs/${id}/apply`,
    GET_MY_APPLICATIONS: "/jobs/my-applications",
    GET_POSTED_BY_ME: "/jobs/posted-by-me",
    SEARCH: "/jobs/search",
  },

  // Mentorship endpoints
  MENTORSHIP: {
    BASE: "/mentorship",
    GET_ALL: "/mentorship",
    GET_BY_ID: (id: string) => `/mentorship/${id}`,
    REQUEST: "/mentorship",
    ACCEPT: (id: string) => `/mentorship/${id}/accept`,
    REJECT: (id: string) => `/mentorship/${id}/reject`,
    COMPLETE: (id: string) => `/mentorship/${id}/complete`,
    GET_MY_MENTORSHIPS: "/mentorship/my-mentorships",
    GET_AS_MENTOR: "/mentorship/as-mentor",
    GET_AS_MENTEE: "/mentorship/as-mentee",
  },

  // Donation endpoints
  DONATIONS: {
    BASE: "/donations",
    GET_ALL: "/donations",
    GET_BY_ID: (id: string) => `/donations/${id}`,
    CREATE: "/donations",
    GET_MY_DONATIONS: "/donations/my-donations",
    GET_STATS: "/donations/stats",
  },

  // File upload endpoints
  UPLOADS: {
    BASE: "/uploads",
    PROFILE_PICTURE: "/uploads/profile-picture",
    RESUME: "/uploads/resume",
    EVENT_IMAGE: "/uploads/event-image",
    JOB_IMAGE: "/uploads/job-image",
  },

  // Notification endpoints
  NOTIFICATIONS: {
    BASE: "/notifications",
    GET_ALL: "/notifications",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    MARK_ALL_READ: "/notifications/mark-all-read",
    GET_UNREAD_COUNT: "/notifications/unread-count",
  },

  // Analytics endpoints
  ANALYTICS: {
    BASE: "/analytics",
    USER_STATS: "/analytics/users",
    EVENT_STATS: "/analytics/events",
    JOB_STATS: "/analytics/jobs",
    ENGAGEMENT: "/analytics/engagement",
  },

  // Documentation endpoint
  DOCS: "/docs",

  // Health check endpoint
  HEALTH: "/health",
};

// HTTP Methods
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
} as const;

// Common query parameters
export const QUERY_PARAMS = {
  // Pagination
  PAGE: "page",
  LIMIT: "limit",

  // Sorting
  SORT: "sort",
  ORDER: "order",

  // Filtering
  SEARCH: "q",
  ROLE: "role",
  STATUS: "status",
  TYPE: "type",
  IS_ONLINE: "isOnline",
  REMOTE: "remote",
  LOCATION: "location",
  BATCH_YEAR: "batchYear",
  DEPARTMENT: "department",
  IS_HIRING: "isHiring",
  AVAILABLE_FOR_MENTORSHIP: "availableForMentorship",

  // Date ranges
  START_DATE: "startDate",
  END_DATE: "endDate",
  CREATED_AFTER: "createdAfter",
  CREATED_BEFORE: "createdBefore",
} as const;

// Response status codes
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// User roles
export const USER_ROLES = {
  SUPER_ADMIN: "super_admin", // Can manage multiple colleges
  COLLEGE_ADMIN: "college_admin", // Manages one specific college
  HOD: "hod", // Head of Department
  STAFF: "staff", // College staff member
  ALUMNI: "alumni", // Alumni member
} as const;

// User statuses
export const USER_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  SUSPENDED: "suspended",
  VERIFIED: "verified",
} as const;

// Event types
export const EVENT_TYPES = {
  REUNION: "reunion",
  WORKSHOP: "workshop",
  WEBINAR: "webinar",
  MEETUP: "meetup",
  CONFERENCE: "conference",
  CAREER_FAIR: "career_fair",
} as const;

// Job types
export const JOB_TYPES = {
  FULL_TIME: "full-time",
  PART_TIME: "part-time",
  INTERNSHIP: "internship",
  CONTRACT: "contract",
} as const;

// Mentorship statuses
export const MENTORSHIP_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  ACTIVE: "active",
  REJECTED: "rejected",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

// Donation statuses
export const DONATION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// Currency options
export const CURRENCIES = {
  USD: "USD",
  EUR: "EUR",
  GBP: "GBP",
  INR: "INR",
  CAD: "CAD",
  AUD: "AUD",
  JPY: "JPY",
  CHF: "CHF",
  CNY: "CNY",
} as const;

// File upload limits
export const UPLOAD_LIMITS = {
  PROFILE_PICTURE: 5 * 1024 * 1024, // 5MB
  RESUME: 10 * 1024 * 1024, // 10MB
  EVENT_IMAGE: 10 * 1024 * 1024, // 10MB
  JOB_IMAGE: 5 * 1024 * 1024, // 5MB
} as const;

// Allowed file types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"],
  DOCUMENTS: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
} as const;

// Rate limiting information
export const RATE_LIMITS = {
  AUTH: {
    REQUESTS: 5,
    WINDOW_MS: 900000, // 15 minutes
  },
  USERS: {
    REQUESTS: 50,
    WINDOW_MS: 900000, // 15 minutes
  },
  GENERAL: {
    REQUESTS: 100,
    WINDOW_MS: 900000, // 15 minutes
  },
} as const;

// Default pagination
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Default sorting
export const DEFAULT_SORTING = {
  FIELD: "createdAt",
  ORDER: "desc",
} as const;

export default API_CONFIG;
