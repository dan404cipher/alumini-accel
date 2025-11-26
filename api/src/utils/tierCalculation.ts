/**
 * Tier calculation utility for Alumni Rewards System
 * 
 * Tier thresholds:
 * - Bronze: 0-499 points
 * - Silver: 500-1499 points
 * - Gold: 1500-4999 points
 * - Platinum: 5000+ points
 */

export type UserTier = "bronze" | "silver" | "gold" | "platinum";

export interface TierInfo {
  currentTier: UserTier;
  tierPoints: number; // Points in current tier
  pointsToNextTier: number; // Points needed for next tier
  nextTier: UserTier | null;
  progressPercentage: number; // Progress within current tier (0-100)
}

const TIER_THRESHOLDS = {
  bronze: { min: 0, max: 499 },
  silver: { min: 500, max: 1499 },
  gold: { min: 1500, max: 4999 },
  platinum: { min: 5000, max: Infinity },
};

/**
 * Calculate user tier based on total points
 */
export function calculateTier(totalPoints: number): UserTier {
  if (totalPoints >= TIER_THRESHOLDS.platinum.min) {
    return "platinum";
  } else if (totalPoints >= TIER_THRESHOLDS.gold.min) {
    return "gold";
  } else if (totalPoints >= TIER_THRESHOLDS.silver.min) {
    return "silver";
  }
  return "bronze";
}

/**
 * Get detailed tier information including progress
 */
export function getTierInfo(totalPoints: number): TierInfo {
  const currentTier = calculateTier(totalPoints);
  const tierThreshold = TIER_THRESHOLDS[currentTier];
  
  // Calculate points within current tier
  const tierPoints = totalPoints - tierThreshold.min;
  
  // Determine next tier
  let nextTier: UserTier | null = null;
  let pointsToNextTier = 0;
  let progressPercentage = 0;
  
  if (currentTier === "bronze") {
    nextTier = "silver";
    pointsToNextTier = TIER_THRESHOLDS.silver.min - totalPoints;
    progressPercentage = (tierPoints / (TIER_THRESHOLDS.silver.min - TIER_THRESHOLDS.bronze.min)) * 100;
  } else if (currentTier === "silver") {
    nextTier = "gold";
    pointsToNextTier = TIER_THRESHOLDS.gold.min - totalPoints;
    progressPercentage = (tierPoints / (TIER_THRESHOLDS.gold.min - TIER_THRESHOLDS.silver.min)) * 100;
  } else if (currentTier === "gold") {
    nextTier = "platinum";
    pointsToNextTier = TIER_THRESHOLDS.platinum.min - totalPoints;
    progressPercentage = (tierPoints / (TIER_THRESHOLDS.platinum.min - TIER_THRESHOLDS.gold.min)) * 100;
  } else {
    // Platinum tier - no next tier
    nextTier = null;
    pointsToNextTier = 0;
    progressPercentage = 100; // Max tier reached
  }
  
  return {
    currentTier,
    tierPoints,
    pointsToNextTier,
    nextTier,
    progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
  };
}

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: UserTier): string {
  return tier.charAt(0).toUpperCase() + tier.slice(1);
}

/**
 * Get tier color for UI
 */
export function getTierColor(tier: UserTier): string {
  const colors = {
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    platinum: "#e5e4e2",
  };
  return colors[tier];
}

