import { Request } from "express";
import { Document } from "mongoose";
import mongoose from "mongoose";

// User Roles
export enum UserRole {
  SUPER_ADMIN = "super_admin",
  ADMIN = "admin",
  COORDINATOR = "coordinator",
  ALUMNI = "alumni",
  STUDENT = "student",
  BATCH_REP = "batch_rep",
}

// User Status
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  PENDING = "pending",
  SUSPENDED = "suspended",
  VERIFIED = "verified",
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

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  getFullName(): string;
}

// Alumni Profile Interface
export interface IAlumniProfile extends Document {
  _id: string;
  userId: string;
  university: string;
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
    company: string;
    position: string;
    startDate: Date;
    endDate?: Date;
    isCurrent: boolean;
    description?: string;
    logo?: string;
  }>;
  isHiring: boolean;
  availableForMentorship: boolean;
  mentorshipDomains: string[];
  availableSlots: Array<{
    day: string;
    timeSlots: string[];
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
  createdAt: Date;
  updatedAt: Date;
}

// Student Profile Interface
export interface IStudentProfile extends Document {
  _id: string;
  userId: string;
  // Educational Details
  university: string;
  department: string;
  program: string;
  batchYear: number;
  graduationYear: number;
  rollNumber: string;
  studentId?: string;
  achievements: string[];
  certifications: Array<{
    name: string;
    issuer: string;
    date: Date;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  // Current Academic Details
  currentYear:
    | "1st Year"
    | "2nd Year"
    | "3rd Year"
    | "4th Year"
    | "5th Year"
    | "Final Year"
    | "Graduate";
  currentCGPA?: number;
  currentGPA?: number;
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
  researchWork: Array<{
    title: string;
    description: string;
    supervisor?: string;
    startDate: Date;
    endDate?: Date;
    isOngoing: boolean;
    publicationUrl?: string;
    conferenceUrl?: string;
    keywords?: string[];
    status: "ongoing" | "completed" | "published" | "presented";
  }>;
  internshipExperience: Array<{
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
    certificateUrl?: string;
  }>;
  careerInterests: string[];
  // Social & Networking
  linkedinProfile?: string;
  githubProfile?: string;
  portfolioUrl?: string;
  twitterHandle?: string;
  otherSocialHandles: Array<{
    platform: string;
    handle: string;
    url?: string;
  }>;
  // Connection Requests
  connectionRequests: Array<{
    _id?: string;
    userId: string;
    status: "pending" | "accepted" | "rejected";
    requestedAt: Date;
    respondedAt?: Date;
    message?: string;
  }>;
  connections: string[];
  // Skills & Interests
  skills: string[];
  interests: string[];
  // Job Preferences
  preferredJobLocation: string[];
  preferredJobTypes: (
    | "full-time"
    | "part-time"
    | "internship"
    | "contract"
    | "freelance"
  )[];
  expectedSalary?: {
    min?: number;
    max?: number;
    currency: string;
  };
  // Events
  eventsRegistered: Array<{
    eventId: string;
    registeredAt: Date;
    status: "registered" | "attended" | "cancelled";
  }>;
  eventsAttended: Array<{
    eventId: string;
    attendedAt: Date;
    feedback?: {
      rating: number;
      comment?: string;
    };
  }>;
  // Additional Info
  isAvailableForInternships: boolean;
  isAvailableForProjects: boolean;
  isAvailableForMentorship: boolean;
  mentorshipDomains: string[];
  resumeUrl?: string;
  coverLetterUrl?: string;
  additionalDocuments: Array<{
    name: string;
    url: string;
    type: "transcript" | "certificate" | "portfolio" | "other";
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// Job Post Interface
export interface IJobPost extends Document {
  _id: string;
  postedBy: string;
  company: string;
  position: string;
  location: string;
  type: "full-time" | "part-time" | "internship" | "contract";
  remote: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
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
  type: EventType;
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
    status: "registered" | "attended" | "cancelled";
  }>;
  photos: string[];
  feedback: Array<{
    userId: string;
    rating: number;
    comment?: string;
    date: Date;
  }>;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
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
  startDate: Date;
  endDate?: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  completedAt?: Date;
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
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
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
