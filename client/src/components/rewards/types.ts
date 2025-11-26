export type RewardType = "badge" | "voucher" | "points" | "perk";

export interface RewardTask {
  _id: string;
  title: string;
  description?: string;
  actionType: string;
  metric: "count" | "amount" | "duration";
  targetValue: number;
  points?: number;
  badge?: {
    _id: string;
    name: string;
    icon?: string;
    color?: string;
  };
  isAutomated: boolean;
  displayOrder?: number;
}

export interface RewardTemplate {
  _id: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  color?: string;
  heroImage?: string;
  rewardType: RewardType;
  level?: string;
  points?: number;
  tags?: string[];
  tasks: RewardTask[];
  voucherTemplate?: {
    partner?: string;
    value?: number;
    currency?: string;
    terms?: string;
  };
  eligibility?: {
    roles?: string[];
    departments?: string[];
    graduationYears?: number[];
    programs?: string[];
  };
  isFeatured?: boolean;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface RewardActivity {
  _id: string;
  reward: RewardTemplate;
  taskId?: string;
  status: "pending" | "in_progress" | "earned" | "redeemed" | "expired";
  progressValue: number;
  progressTarget: number;
  pointsAwarded?: number;
  voucherCode?: string;
  earnedAt?: string;
  redeemedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RewardSummary {
  totalRewards: number;
  earnedRewards: number;
  redeemedRewards: number;
  pendingRewards: number;
  totalPoints: number;
}

export type UserTier = "bronze" | "silver" | "gold" | "platinum";

export interface TierInfo {
  currentTier: UserTier;
  tierPoints: number;
  pointsToNextTier: number;
  nextTier: UserTier | null;
  progressPercentage: number;
  totalPoints: number;
}

export interface Badge {
  _id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  color: string;
  points: number;
  isRare: boolean;
}

export interface TaskVerification {
  required: boolean;
  status: "pending" | "approved" | "rejected";
  verifiedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface VerificationActivity extends RewardActivity {
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  reward: RewardTemplate;
  verification?: TaskVerification;
}

export interface VerificationStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
  recent: {
    approved: number;
    rejected: number;
  };
}

export interface PointsDistributionData {
  byCategory: Array<{
    category: string;
    totalPoints: number;
    count: number;
    avgPoints: number;
  }>;
  total: {
    totalPoints: number;
    totalActivities: number;
    avgPointsPerActivity: number;
  };
}

export interface TaskCompletionData {
  byCategory: Record<string, {
    pending: number;
    in_progress: number;
    earned: number;
    redeemed: number;
  }>;
  topTasks: Array<{
    name: string;
    completed: number;
    inProgress: number;
    pending: number;
  }>;
}

export interface RewardClaimsData {
  claimsOverTime: Array<{
    month: string;
    count: number;
  }>;
  popularRewards: Array<{
    name: string;
    count: number;
    type: string;
  }>;
  totalClaims: number;
}

export interface DepartmentAnalyticsData {
  departments: Array<{
    department: string;
    totalPoints: number;
    totalActivities: number;
    completedTasks: number;
    uniqueUsers: number;
  }>;
}

export interface AlumniActivityData {
  activities: RewardActivity[];
  pointsTimeline: Array<{
    month: string;
    points: number;
    count: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    totalPoints: number;
    count: number;
  }>;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  email: string;
  profilePicture?: string;
  department?: string;
  // Points leaderboard
  points?: number;
  tier?: string;
  // Mentors leaderboard
  completedMentorships?: number;
  activeMentorships?: number;
  totalSessions?: number;
  // Donors leaderboard
  totalAmount?: number;
  donationCount?: number;
  // Volunteers leaderboard
  eventCount?: number;
}

export interface DepartmentLeaderboardEntry {
  rank: number;
  department: string;
  totalPoints: number;
  userCount: number;
  avgPoints: number;
}

