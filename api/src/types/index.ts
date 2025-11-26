import { Request } from "express";
import mongoose, { Document } from "mongoose";

// Export connection types
export * from "./connection";

// User Roles
export enum UserRole {
  SUPER_ADMIN = "super_admin", // Can manage multiple colleges
  COLLEGE_ADMIN = "college_admin", // Manages one specific college
  HOD = "hod", // Head of Department
  STAFF = "staff", // College staff member
  STUDENT = "student", // Student member
  ALUMNI = "alumni", // Alumni member
}

// User Status
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
  VERIFIED = "verified",
}

// Role Interface
export interface IRole extends Document {
  _id: string;
  name: string;
  description: string;
  permissions: {
    // User Management
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canViewUsers: boolean;
    canApproveUsers: boolean;

    // Content Management

    // Job Management
    canCreateJobs: boolean;
    canEditJobs: boolean;
    canDeleteJobs: boolean;
    canViewJobs: boolean;
    canEditAllJobs: boolean;
    canDeleteAllJobs: boolean;

    // Event Management
    canCreateEvents: boolean;
    canEditEvents: boolean;
    canDeleteEvents: boolean;
    canViewEvents: boolean;

    // Fundraising Management
    canCreateFundraisers: boolean;
    canEditFundraisers: boolean;
    canDeleteFundraisers: boolean;
    canViewFundraisers: boolean;

    // Gallery Management
    canCreateGalleries: boolean;
    canEditGalleries: boolean;
    canDeleteGalleries: boolean;
    canViewGalleries: boolean;

    // News Management
    canCreateNews: boolean;
    canEditNews: boolean;
    canDeleteNews: boolean;
    canViewNews: boolean;

    // Analytics & Reports
    canViewAnalytics: boolean;
    canExportData: boolean;
    canViewReports: boolean;

    // System Administration
    canManageTenants: boolean;
    canManageRoles: boolean;
    canManageSettings: boolean;
    canViewSystemLogs: boolean;
  };
  isSystemRole: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Event Types
export enum EventType {
  REUNION = "reunion",
  WORKSHOP = "workshop",
  WEBINAR = "webinar",
  MEETUP = "meetup",
  CONFERENCE = "conference",
  CAREER_FAIR = "career_fair",
}

// Job Post Status
export enum JobPostStatus {
  ACTIVE = "active",
  CLOSED = "closed",
  DRAFT = "draft",
  PENDING = "pending",
}

// Mentorship Status
export enum MentorshipStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  ACTIVE = "active",
  REJECTED = "rejected",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

// Donation Status
export enum DonationStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Badge Types
export enum BadgeType {
  MENTOR = "mentor",
  SPEAKER = "speaker",
  DONOR = "donor",
  CHAMPION = "champion",
  STAR_ALUMNI = "star_alumni",
  RECRUITER = "recruiter",
}

// Base User Interface
export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roleId?: string;
  tenantId?: string;
  status: UserStatus;
  phone?: string;
  profilePicture?: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  linkedinProfile?: string;
  twitterHandle?: string;
  githubProfile?: string;
  website?: string;
  bio?: string;
  location?: string;
  department?: string;
  currentCompany?: string;
  currentPosition?: string;
  graduationYear?: number;
  currentYear?: string;
  currentCGPA?: number;
  currentGPA?: number;
  eligibleForAlumni?: boolean;
  timezone?: string;
  preferences: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    newsletterSubscription: boolean;
  };
  university?: string;
  isProfileComplete: boolean;
  profileCompletionPercentage: number;
  savedEvents?: string[];
  savedJobs?: string[];
  rewards?: {
    totalPoints: number;
    currentTier: "bronze" | "silver" | "gold" | "platinum";
    tierPoints: number;
    badges: string[];
    lastPointsUpdate?: Date;
  };

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

// Alumni Profile Interface
export interface IAlumniProfile extends Document {
  _id: string;
  userId: string;
  program: string;
  batchYear: number;
  graduationYear: number;
  department: string;
  specialization?: string;
  rollNumber?: string;
  studentId?: string;
  currentCompany?: string;
  currentPosition?: string;
  currentLocation?: string;
  experience: number;
  salary?: number;
  currency?: string;
  skills: string[];
  achievements: string[];
  internshipExperience: Array<{
    _id?: string;
    company: string;
    position: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    isOngoing: boolean;
    location?: string;
    isRemote: boolean;
    stipend?: {
      amount: number;
      currency: string;
    };
    skills: string[];
    certificateFile?: string;
  }>;
  researchWork: Array<{
    _id?: string;
    title: string;
    description: string;
    supervisor?: string;
    startDate: Date;
    endDate?: Date;
    isOngoing: boolean;
    publicationUrl?: string;
    conferenceUrl?: string;
    keywords: string[];
    status: "ongoing" | "completed" | "published" | "presented";
    publicationFile?: string;
    conferenceFile?: string;
  }>;
  certifications: Array<{
    _id?: string;
    name: string;
    issuer: string;
    date: Date;
    credentialId?: string;
    credentialFile?: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: number;
    gpa?: number;
  }>;
  careerTimeline: Array<{
    _id?: string;
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
    location?: string;
    logo?: string;
  }>;
  isHiring: boolean;
  availableForMentorship: boolean;
  mentorshipDomains: string[];
  availableSlots: Array<{
    day: string;
    timeSlots: string[];
    startDate?: Date;
    endDate?: Date;
  }>;
  testimonials: Array<{
    content: string;
    author: string;
    date: Date;
  }>;
  photos: string[];
  projects: Array<{
    _id?: string;
    title: string;
    description: string;
    technologies: string[];
    startDate: Date;
    endDate?: Date;
    isOngoing: boolean;
    githubUrl?: string;
    liveUrl?: string;
    teamMembers: Array<{
      name: string;
      role: string;
    }>;
  }>;
  careerInterests: string[];
  donationHistory?: {
    totalDonated: number;
    totalDonations: number;
    lastDonationDate?: Date;
    lifetimeGiving: number;
  };
  updateDonationHistory(amount: number): Promise<void>;
  createdAt: Date;
  updatedAt: Date;
}

// Job Application Interface
export interface IJobApplication extends Document {
  _id: string;
  jobId: string;
  applicantId: string;
  tenantId: string;
  resume?: string;
  skills: string[];
  experience: string;
  contactDetails: {
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
  status: "Applied" | "Shortlisted" | "Rejected" | "Hired";
  appliedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Job Post Interface
export interface IJobPost extends Document {
  _id: string;
  tenantId: string;
  postedBy: string;
  company: string;
  title: string;
  position: string;
  location: string;
  type: "full-time" | "part-time" | "internship" | "contract" | string; // Support custom categories
  customJobType?: string; // Reference to Category model
  experience: "entry" | "mid" | "senior" | "lead" | string; // Support custom categories
  customExperience?: string; // Reference to Category model
  industry:
    | "technology"
    | "finance"
    | "healthcare"
    | "education"
    | "consulting"
    | "marketing"
    | "sales"
    | "operations"
    | "other"
    | string; // Support custom categories
  customIndustry?: string; // Reference to Category model
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  numberOfVacancies: number;
  description: string;
  requiredSkills: string[];
  requirements: string[];
  benefits: string[];
  status: JobPostStatus;
  applications: Array<{
    applicantId: string;
    appliedAt: Date;
    status: "pending" | "shortlisted" | "rejected" | "hired";
    resume?: string;
    coverLetter?: string;
  }>;
  tags: string[];
  deadline?: Date;
  companyWebsite?: string;
  applicationUrl?: string;
  contactEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Event Interface
export interface IEvent extends Document {
  _id: string;
  title: string;
  description: string;
  type: EventType | string; // Support custom categories (ObjectId as string)
  customEventType?: string; // Reference to Category model
  startDate: Date;
  endDate: Date;
  location: string;
  isOnline: boolean;
  onlineUrl?: string;
  meetingLink?: string;
  maxAttendees?: number;
  currentAttendees: number;
  organizer: string;
  tags?: string[];
  image?: string;
  price?: number;
  organizerNotes?: string;
  speakers: Array<{
    name: string;
    title: string;
    company: string;
    bio?: string;
    photo?: string;
  }>;
  agenda: Array<{
    title: string;
    speaker?: string;
    description?: string;
  }>;
  registrationDeadline?: Date;
  attendees: Array<{
    userId: string;
    registeredAt: Date;
    status: "registered" | "attended" | "cancelled" | "pending_payment" | "pending_approval";
    // Additional registration details
    phone?: string;
    dietaryRequirements?: string;
    emergencyContact?: string;
    additionalNotes?: string;
    amountPaid?: number;
    paymentStatus?: "free" | "pending" | "successful" | "failed";
    reminderSent?: boolean;
    // Approval fields for free events
    approvalStatus?: "pending" | "approved" | "rejected";
    approvedBy?: string;
    approvedAt?: Date;
    rejectedBy?: string;
    rejectedAt?: Date;
    rejectionReason?: string;
  }>;
  photos: string[];
  feedback: Array<{
    userId: string;
    rating: number;
    comment?: string;
    date: Date;
  }>;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  tenantId: string; // Multi-tenant support
  createdAt: Date;
  updatedAt: Date;
}

// Mentorship Interface
export interface IMentorship extends Document {
  _id: string;
  mentorId: string;
  menteeId: string;
  status: MentorshipStatus;
  domain: string;
  description: string;
  goals: string[];
  background?: string;
  expectations?: string;
  specificQuestions?: string;
  timeCommitment?: string;
  communicationMethod?: string;
  startDate: Date;
  endDate?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  cancelledBy?: string;
  duration?: number;
  notes?: string;
  sessions: Array<{
    _id?: string;
    date: Date;
    duration: number;
    topic?: string;
    notes?: string;
    meetingLink?: string;
    status: "scheduled" | "completed" | "cancelled";
  }>;
  feedback: Array<{
    from: "mentor" | "mentee";
    user: string;
    type: "mentor" | "mentee";
    rating: number;
    comment?: string;
    date: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Mentoring Program Status
export enum MentoringProgramStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

// Mentoring Program Schedule
export enum ProgramSchedule {
  ONETIME = "One-time",
  RECURRING = "Recurring",
}

// Mentoring Program Interface
export interface IMentoringProgram extends Document {
  _id: string;
  category: string; // Dropdown - Single Select
  name: string; // Max 75 chars
  shortDescription: string; // Max 250 chars
  longDescription?: string;
  programSchedule: ProgramSchedule; // "One-time" or "Recurring"
  programDuration: {
    startDate: Date;
    endDate: Date;
  };
  skillsRequired: string[]; // Multiple Values
  areasOfMentoring: {
    mentor: string[]; // Multiple Values for Mentor
    mentee: string[]; // Multiple Values for Mentee
  };
  entryCriteriaRules?: string;
  registrationEndDateMentee: Date; // Registration End Date for Mentee
  registrationEndDateMentor: Date; // Registration End Date for Mentor
  matchingEndDate: Date; // Mentor and Mentee Matching End Date
  mentoringAgreementForm?: string; // File path reference
  manager: mongoose.Types.ObjectId; // User Master Reference
  coordinators: mongoose.Types.ObjectId[]; // Multiple User References
  reportsEscalationsTo: mongoose.Types.ObjectId[]; // Multiple User Master References
  registrationApprovalBy: mongoose.Types.ObjectId; // User Master Reference
  emailTemplateMentorInvitation?: mongoose.Types.ObjectId; // Email template reference
  emailTemplateMenteeInvitation?: mongoose.Types.ObjectId; // Email template reference
  status: MentoringProgramStatus; // "draft" | "published" | "archived"
  mentorsPublished: boolean; // Whether mentors list is published
  mentorsPublishedAt?: Date; // Date when mentors were published
  publishedMentorsCount: number; // Count of published mentors
  publishedMentorIds?: mongoose.Types.ObjectId[]; // IDs of published mentor registrations
  menteeSelectionEmailsSent: boolean; // Whether mentee selection emails have been sent
  matchingProcessStartDate?: Date; // Optional date when matching process should begin
  createdBy: mongoose.Types.ObjectId;
  tenantId: mongoose.Types.ObjectId; // Multi-tenant support
  createdAt: Date;
  updatedAt: Date;
}

// Mentor Registration Status
export enum MentorRegistrationStatus {
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Mentor Registration Interface
export interface IMentorRegistration extends Document {
  _id: string;
  programId: mongoose.Types.ObjectId; // Reference to MentoringProgram
  userId: mongoose.Types.ObjectId; // Reference to User (the alumni)
  status: MentorRegistrationStatus; // "submitted" | "approved" | "rejected"
  title: "Mr" | "Mrs" | "Ms" | "Dr"; // Dropdown
  firstName: string; // Max 30 chars
  lastName: string; // Max 30 chars
  preferredName: string; // Max 100 chars
  mobileNumber?: string; // Optional, with country code
  dateOfBirth: Date; // Min age 16 years
  personalEmail: string; // Email, domain validation
  sitEmail: string; // SIT domain check
  classOf: number; // Year/Number
  sitStudentId?: string; // Max 10 chars, mandatory for post-2017
  sitMatricNumber?: string; // Max 10 chars, mandatory for pre-2017
  mentorCV?: string; // File path reference
  areasOfMentoring: string[]; // Array of strings, max 100 chars each
  fbPreference?: string; // Max 100 chars, optional
  dietaryRestrictions?: string; // Max 100 chars, optional
  optionToReceiveFB: boolean; // Checkbox
  preferredMailingAddress: string; // Email, defaulted to registered email
  eventSlotPreference?: {
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
  }; // Date and Time Range
  eventMeetupPreference?: string; // Max 100 chars, optional
  pdpaConsent: boolean; // Mandatory
  recaptchaToken: string; // Mandatory
  rejectionReason?: string; // Optional, for rejected registrations
  approvedBy?: mongoose.Types.ObjectId; // User Reference
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId; // User Reference
  rejectedAt?: Date;
  submittedAt: Date; // Auto-generated
  approvalHistory?: Array<{
    action: "approve" | "reject" | "reconsider" | "disapprove";
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    notes?: string;
    reason?: string;
  }>; // Approval history for audit
  canReconsider: boolean; // Flag to allow reconsideration
  tenantId: mongoose.Types.ObjectId; // Multi-tenant support
  createdAt: Date;
  updatedAt: Date;
}

// Mentee Registration Status (same as mentor)
export enum MenteeRegistrationStatus {
  SUBMITTED = "submitted",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Mentee Registration Interface
export interface IMenteeRegistration extends Document {
  _id: string;
  programId: mongoose.Types.ObjectId; // Reference to MentoringProgram
  registrationToken: string; // Unique token for public access
  status: MenteeRegistrationStatus; // "submitted" | "approved" | "rejected"
  title: "Mr" | "Mrs" | "Ms"; // Dropdown
  firstName: string; // Max 30 chars
  lastName: string; // Max 30 chars
  mobileNumber?: string; // Optional, with country code
  dateOfBirth: Date; // Min age 16 years
  personalEmail: string; // Email, domain validation
  sitEmail: string; // SIT domain check
  classOf: number; // Year/Number
  sitStudentId?: string; // Max 10 chars, mandatory for post-2017
  sitMatricNumber?: string; // Max 10 chars, mandatory for pre-2017
  menteeCV?: string; // File path reference
  areasOfMentoring: string[]; // Array of strings, mandatory
  fbPreference?: string; // Max 100 chars, optional
  dietaryRestrictions?: string; // Max 100 chars, optional
  preferredMailingAddress: string; // Email, mandatory
  eventSlotPreference: "Weekend afternoon" | "Weekday evenings"; // Dropdown, mandatory
  eventMeetupPreference: "Virtual" | "Physical"; // Dropdown, mandatory
  pdpaConsent: boolean; // Mandatory
  recaptchaToken: string; // Mandatory
  validatedStudentId?: string; // Student ID validated via token
  preferredMentors?: mongoose.Types.ObjectId[]; // Array of 3 mentor IDs in preference order
  rejectionReason?: string; // Optional
  approvedBy?: mongoose.Types.ObjectId; // User Reference
  approvedAt?: Date;
  rejectedBy?: mongoose.Types.ObjectId; // User Reference
  rejectedAt?: Date;
  submittedAt: Date;
  approvalHistory?: Array<{
    action: "approve" | "reject" | "reconsider" | "disapprove";
    performedBy: mongoose.Types.ObjectId;
    performedAt: Date;
    notes?: string;
    reason?: string;
  }>; // Approval history for audit
  canReconsider: boolean; // Flag to allow reconsideration
  tenantId: mongoose.Types.ObjectId; // Multi-tenant support
  createdAt: Date;
  updatedAt: Date;
}

// Donation Interface
export interface IDonation extends Document {
  _id: string;
  donorId: string;
  amount: number;
  currency: string;
  cause: string;
  description?: string;
  status: DonationStatus;
  paymentMethod: string;
  transactionId?: string;
  receiptUrl?: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Badge Interface
export interface IBadge extends Document {
  _id: string;
  userId: string;
  type: BadgeType;
  title: string;
  description: string;
  icon: string;
  awardedAt: Date;
  awardedBy: string;
  metadata?: Record<string, any>;
}

// Newsletter Interface
export interface INewsletter extends Document {
  _id: string;
  title: string;
  content: string;
  subject: string;
  sentBy: string;
  recipients: string[];
  sentAt?: Date;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAt?: Date;
  openRate?: number;
  clickRate?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Discussion Interface
export interface IDiscussion extends Document {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  category: string;
  tags: string[];
  isPublic: boolean;
  allowedRoles: UserRole[];
  likes: string[];
  replies: Array<{
    userId: string;
    content: string;
    createdAt: Date;
    likes: string[];
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Extended Request Interface
export interface AuthenticatedRequest extends Request {
  user?: IUser;
  alumniProfile?: IAlumniProfile;
  userId?: string;
  tenantId?: string;
}

// API Response Interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Pagination Interface
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

// Search Interface
export interface SearchQuery extends PaginationQuery {
  q?: string;
  filters?: Record<string, any>;
}

// File Upload Interface
export interface FileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer?: Buffer;
}

// Email Template Interface
export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Notification Interface
export interface INotification extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  category?: string;
  priority?: "low" | "medium" | "high" | "urgent";
  expiresAt?: Date;
  relatedEntity?: {
    type: string;
    id: mongoose.Types.ObjectId;
  };
  createdAt: Date;
  updatedAt: Date;
  timeAgo?: string;
}

// Analytics Interface
export interface IAnalytics extends Document {
  _id: string;
  type: "user" | "event" | "job" | "donation" | "engagement";
  metrics: Record<string, number>;
  date: Date;
  period: "daily" | "weekly" | "monthly" | "yearly";
  metadata?: Record<string, any>;
  createdAt: Date;
}

// Audit Log Interface
export interface IAuditLog extends Document {
  _id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// News Interface
export interface INews extends Document {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Community Types
export enum CommunityType {
  OPEN = "open",
  CLOSED = "closed",
  HIDDEN = "hidden",
}

export enum CommunityStatus {
  ACTIVE = "active",
  ARCHIVED = "archived",
  SUSPENDED = "suspended",
}

export enum CommunityPostType {
  TEXT = "text",
  IMAGE = "image",
  VIDEO = "video",
  POLL = "poll",
  ANNOUNCEMENT = "announcement",
}

export enum CommunityPostStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  DELETED = "deleted",
}

export enum CommunityMembershipRole {
  MEMBER = "member",
  MODERATOR = "moderator",
  ADMIN = "admin",
}

export enum CommunityMembershipStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  SUSPENDED = "suspended",
  LEFT = "left",
}

export enum CommunityCommentStatus {
  APPROVED = "approved",
  PENDING = "pending",
  REJECTED = "rejected",
  DELETED = "deleted",
}

// Email Template Types
export enum EmailTemplateType {
  MENTOR_INVITATION = "mentor_invitation",
  MENTEE_INVITATION = "mentee_invitation",
  REGISTRATION_ACKNOWLEDGEMENT = "registration_acknowledgement",
  WELCOME_MENTEE = "welcome_mentee",
  MENTOR_MATCH_REQUEST = "mentor_match_request",
  REJECTION_NOTIFICATION = "rejection_notification",
  APPROVAL_NOTIFICATION = "approval_notification",
}

// Email Template Interface
export interface IEmailTemplate extends Document {
  _id: string;
  name: string; // Template Name
  templateType: EmailTemplateType; // Template Type
  subject: string; // Email Subject
  body: string; // HTML Body
  variables: string[]; // Available variables/placeholders
  createdBy: mongoose.Types.ObjectId; // User Reference
  updatedBy?: mongoose.Types.ObjectId; // User Reference
  isActive: boolean; // Is Active
  tenantId: mongoose.Types.ObjectId; // Multi-tenant support
  createdAt: Date;
  updatedAt: Date;
}

// Email Tracking Interface
export interface IEmailTracking extends Document {
  _id: string;
  templateId?: mongoose.Types.ObjectId; // Reference to EmailTemplate
  recipientEmail: string;
  subject: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  status: "sent" | "delivered" | "opened" | "clicked" | "failed";
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, any>;
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Matching Status Enum
export enum MatchingStatus {
  PENDING_MENTOR_ACCEPTANCE = "pending_mentor_acceptance",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
  AUTO_REJECTED = "auto_rejected",
}

// Match Type Enum
export enum MatchType {
  ALGORITHM = "algorithm",
  PREFERRED = "preferred",
  MANUAL = "manual",
}

// Mentor-Mentee Matching Interface
export interface IMentorMenteeMatching extends Document {
  _id: string;
  programId: mongoose.Types.ObjectId; // Reference to MentoringProgram
  menteeId: mongoose.Types.ObjectId; // Reference to User
  menteeRegistrationId: mongoose.Types.ObjectId; // Reference to MenteeRegistration
  mentorId: mongoose.Types.ObjectId; // Reference to User
  mentorRegistrationId: mongoose.Types.ObjectId; // Reference to MentorRegistration
  matchScore: number; // Calculated algorithm score (0-100)
  matchType: MatchType; // "algorithm" | "preferred" | "manual"
  preferredChoiceOrder?: number; // 1-3 if in mentee's preferred list
  status: MatchingStatus; // Matching status
  menteeSelectedMentors: mongoose.Types.ObjectId[]; // Array of 3 mentor IDs in preference order
  matchedAt: Date;
  mentorResponseAt?: Date;
  autoRejectAt?: Date; // 3 days after match request sent
  rejectionReason?: string;
  matchedBy?: mongoose.Types.ObjectId; // User Reference (if manual matching)
  mentorshipCommunityId?: mongoose.Types.ObjectId; // Reference to Community
  scoreBreakdown?: {
    industryScore: number;
    programmeScore: number;
    skillsScore: number;
    preferenceScore: number;
  };
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Mentorship Communication Interface
export interface IMentorshipCommunication extends Document {
  _id: string;
  communityId: mongoose.Types.ObjectId; // Reference to Community
  fromUserId: mongoose.Types.ObjectId; // Reference to User (sender)
  toUserId: mongoose.Types.ObjectId; // Reference to User (recipient)
  subject: string; // Email subject
  body: string; // HTML email body
  attachments: string[]; // Array of file paths
  sentAt: Date; // Auto-generated
  readAt?: Date; // Optional
  isRead: boolean; // Default: false
  relatedMentorshipId?: mongoose.Types.ObjectId; // Reference to MentorMenteeMatching
  relatedProgramId?: mongoose.Types.ObjectId; // Reference to MentoringProgram
  replyToId?: mongoose.Types.ObjectId; // Reference to parent communication (for threading)
  tenantId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Community Interface
export interface ICommunity extends Document {
  _id: string;
  name: string;
  description: string;
  type: CommunityType;
  coverImage?: string;
  createdBy: mongoose.Types.ObjectId;
  moderators: mongoose.Types.ObjectId[];
  members: mongoose.Types.ObjectId[];
  settings: {
    allowMemberPosts: boolean;
    requirePostApproval: boolean;
    allowMediaUploads: boolean;
    allowComments: boolean;
    allowPolls: boolean;
    mentorshipMatchId?: mongoose.Types.ObjectId;
    mentorshipProgramId?: mongoose.Types.ObjectId;
  };
  status: CommunityStatus;
  tags: string[];
  memberCount: number;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Community Post Interface
export interface ICommunityPost extends Document {
  _id: string;
  communityId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  type: CommunityPostType;
  mediaUrls?: string[];
  pollOptions?: {
    option: string;
    votes: mongoose.Types.ObjectId[];
  }[];
  pollEndDate?: Date;
  likes: mongoose.Types.ObjectId[];
  comments: mongoose.Types.ObjectId[];
  shares: mongoose.Types.ObjectId[];
  status: CommunityPostStatus;
  isPinned: boolean;
  isAnnouncement: boolean;
  tags: string[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Community Membership Interface
export interface ICommunityMembership extends Document {
  _id: string;
  communityId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  role: CommunityMembershipRole;
  status: CommunityMembershipStatus;
  joinedAt?: Date;
  leftAt?: Date;
  invitedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  suspendedBy?: mongoose.Types.ObjectId;
  suspensionReason?: string;
  suspensionEndDate?: Date;
  permissions: {
    canPost: boolean;
    canComment: boolean;
    canInvite: boolean;
    canModerate: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Community Comment Interface
export interface ICommunityComment extends Document {
  _id: string;
  postId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  parentCommentId?: mongoose.Types.ObjectId;
  likes: mongoose.Types.ObjectId[];
  replies: mongoose.Types.ObjectId[];
  status: CommunityCommentStatus;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
