export interface AlumniNote {
  _id: string;
  alumniId: string;
  staffId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  content: string;
  category?: "general" | "meeting" | "call" | "email" | "event" | "donation" | "issue" | "other";
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlumniIssue {
  _id: string;
  alumniId: string;
  raisedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  responses: Array<{
    _id?: string;
    staffId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      profilePicture?: string;
    };
    content: string;
    createdAt: string;
  }>;
  resolvedAt?: string;
  resolvedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AlumniFlag {
  _id: string;
  alumniId: string;
  flagType: "vip" | "major_donor" | "inactive" | "at_risk" | "high_engagement" | "mentor" | "speaker" | "volunteer" | "custom";
  flagValue: string;
  description?: string;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CommunicationItem {
  type: "message" | "mentorship";
  id: string;
  from: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  to: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  content?: string;
  subject?: string;
  date: string;
  isRead: boolean;
}

export interface EngagementMetrics {
  score: number;
  totalDonated: number;
  donationCount: number;
  lastDonationDate: string | null;
  eventsAttended: number;
  lastEventDate: string | null;
  lastInteraction: string | null;
  messageCount: number;
  jobsPosted: number;
  jobsApplied: number;
  lastJobPostedDate: string | null;
  lastJobAppliedDate: string | null;
}

export interface Alumni360Data {
  alumni: any; // AlumniProfile type
  notes: AlumniNote[];
  issues: AlumniIssue[];
  flags: AlumniFlag[];
  donations: any[]; // Donation type
  events: any[]; // Event type
  jobsPosted?: any[]; // JobPost type
  jobsApplied?: any[]; // JobApplication type
  communicationHistory: CommunicationItem[];
  engagementMetrics: EngagementMetrics;
}

export interface CreateNoteRequest {
  content: string;
  category?: AlumniNote["category"];
  isPrivate?: boolean;
}

export interface CreateIssueRequest {
  title: string;
  description: string;
  priority?: AlumniIssue["priority"];
  assignedTo?: string;
  tags?: string[];
}

export interface UpdateIssueRequest {
  status?: AlumniIssue["status"];
  priority?: AlumniIssue["priority"];
  assignedTo?: string;
  response?: string;
  tags?: string[];
}

export interface AddFlagRequest {
  flagType: AlumniFlag["flagType"];
  flagValue: string;
  description?: string;
}

