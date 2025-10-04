// Types and interfaces for the Mentorship System
// Author: AI Assistant
// Purpose: Define all TypeScript interfaces and types for mentorship functionality

export interface Mentor {
  name: string;
  title: string;
  company: string;
  yearsExp: number | "";
  slots: number | "";
  expertise: string[];
  style: string;
  hours: string;
  timezone: string;
  testimonial: string;
  rating?: number;
  mentees?: number;
  profile?: string;
  industry?: string;
}

export interface MentorshipRequest {
  id: string;
  applicantName: string;
  applicantProfile?: string;
  applicantEducation: string;
  applicantYear: string;
  mentorName: string;
  mentorTitle: string;
  mentorCompany: string;
  careerGoals: string;
  challenges: string;
  background: string;
  expectations: string;
  timeCommitment: string;
  communicationMethod: string;
  specificQuestions: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedAt: Date;
  skills?: string[];
  goals?: string[];
}

// Request form local state type
export interface RequestFormData {
  applicantName: string;
  applicantProfile?: string;
  applicantEducation: string;
  applicantYear: string;
  careerGoals: string;
  challenges: string;
  background: string;
  expectations: string;
  timeCommitment: string;
  communicationMethod: string;
  specificQuestions: string;
}

export interface ContentModalProps {
  open: boolean;
  title: string;
  content: string;
}

export interface MentorshipTabs {
  DISCOVER: "discover";
  REQUESTS: "requests";
  ACTIVE: "active";
}

export interface MentorFormData extends Mentor {}

export interface MentorshipError {
  [key: string]: string;
}

export interface MentorshipFilters {
  searchTerm: string;
  selectedIndustry: string;
  selectedExperienceLevel: string;
}

export interface MentorshipStats {
  totalMentors: number;
  totalRequests: number;
  activeMentorships: number;
  completedMentorships: number;
}

export type MentorshipStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Active"
  | "Completed";

// Export all types for easy importing
export type {
  Mentor,
  MentorshipRequest,
  RequestFormData,
  ContentModalProps,
  MentorFormData,
  MentorshipError,
  MentorshipFilters,
  MentorshipStats,
  MentorshipStatus,
};
