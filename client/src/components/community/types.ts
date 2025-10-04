// Community Types
export interface Community {
  _id: string;
  name: string;
  description: string;
  type: "open" | "closed" | "hidden";
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "academic_research"
    | "professional_career"
    | "entrepreneurship_startups"
    | "social_hobby"
    | "mentorship_guidance"
    | "events_meetups"
    | "community_support_volunteering"
    | "technology_deeptech"
    | "regional_chapter_based"
    | "other";
  coverImage?: string;
  logo?: string;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    fullName?: string;
  };
  moderators?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    fullName?: string;
  }>;
  members?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    fullName?: string;
  }>;
  settings: {
    allowMemberPosts: boolean;
    requirePostApproval: boolean;
    allowMediaUploads: boolean;
    allowComments: boolean;
    allowPolls: boolean;
  };
  status: "active" | "archived" | "suspended";
  tags: string[];
  rules: string[];
  externalLinks: {
    website?: string;
    github?: string;
    slack?: string;
    discord?: string;
  };
  memberCount: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  _id: string;
  communityId: string;
  authorId: string;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    graduationYear?: string;
    currentCompany?: string;
    currentPosition?: string;
  };
  title: string;
  content: string;
  type: "text" | "image" | "video" | "poll" | "announcement";
  priority?: "high" | "medium" | "low";
  category?: string;
  mediaUrls?: string[];
  likes: string[];
  comments: string[];
  shares: string[];
  // Enhanced engagement data
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  status: "pending" | "approved" | "rejected" | "deleted";
  isPinned: boolean;
  isAnnouncement: boolean;
  tags: string[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrendingPost {
  id: string;
  title: string;
  likes: number;
  comments: number;
  views: number;
  author: string;
  timeAgo: string;
}

export interface PopularTag {
  name: string;
  count: number;
}

export interface PostFilters {
  search: string;
  category: string;
  priority: string;
  sortBy: string;
}

export interface CommunityStats {
  memberCount: number;
  postCount: number;
  moderatorCount: number;
}
