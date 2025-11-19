import AlumniProfile from "../models/AlumniProfile";
import User from "../models/User";
import Donation from "../models/Donation";
import { logger } from "../utils/logger";

export interface TargetAudienceFilters {
  batchYears?: number[];
  locations?: string[];
  professions?: string[];
  interests?: string[];
  donationHistory?: {
    minAmount?: number;
    minDonations?: number;
  };
  departments?: string[];
  graduationYears?: number[];
}

/**
 * Build MongoDB query from targeting filters
 */
export const buildTargetAudience = (
  filters: TargetAudienceFilters
): any => {
  const query: any = {};

  // Build alumni profile query
  const profileQuery: any = {};

  if (filters.batchYears && filters.batchYears.length > 0) {
    profileQuery.batchYear = { $in: filters.batchYears };
  }

  if (filters.graduationYears && filters.graduationYears.length > 0) {
    profileQuery.graduationYear = { $in: filters.graduationYears };
  }

  if (filters.locations && filters.locations.length > 0) {
    profileQuery.currentLocation = {
      $in: filters.locations.map((loc) => new RegExp(loc, "i")),
    };
  }

  if (filters.professions && filters.professions.length > 0) {
    profileQuery.$or = [
      { currentPosition: { $in: filters.professions.map((p) => new RegExp(p, "i")) } },
      { "careerTimeline.position": { $in: filters.professions.map((p) => new RegExp(p, "i")) } },
    ];
  }

  if (filters.departments && filters.departments.length > 0) {
    profileQuery.department = { $in: filters.departments.map((d) => new RegExp(d, "i")) };
  }

  if (filters.interests && filters.interests.length > 0) {
    profileQuery.$or = [
      ...(profileQuery.$or || []),
      { careerInterests: { $in: filters.interests } },
      { skills: { $in: filters.interests } },
    ];
  }

  return profileQuery;
};

/**
 * Get alumni matching targeting criteria
 */
export const getTargetedAlumni = async (
  filters: TargetAudienceFilters,
  tenantId?: string
): Promise<any[]> => {
  try {
    const profileQuery = buildTargetAudience(filters);

    // Get matching alumni profiles
    let profiles = await AlumniProfile.find(profileQuery)
      .populate("userId", "firstName lastName email role status")
      .lean();

    // Filter by tenant if provided
    if (tenantId) {
      const users = await User.find({
        _id: { $in: profiles.map((p: any) => p.userId?._id || p.userId) },
        tenantId,
        role: "alumni",
        status: { $in: ["active", "verified"] },
      }).select("_id");

      const userIds = new Set(users.map((u) => u._id.toString()));
      profiles = profiles.filter(
        (p: any) => userIds.has((p.userId?._id || p.userId)?.toString())
      );
    }

    // Filter by donation history if specified
    if (filters.donationHistory) {
      const { minAmount, minDonations } = filters.donationHistory;

      if (minAmount || minDonations) {
        const userIds = profiles.map((p: any) => p.userId?._id || p.userId);
        
        const donationStats = await Donation.aggregate([
          {
            $match: {
              donor: { $in: userIds },
              paymentStatus: { $in: ["completed", "successful"] },
            },
          },
          {
            $group: {
              _id: "$donor",
              totalAmount: { $sum: "$amount" },
              donationCount: { $sum: 1 },
            },
          },
        ]);

        const statsMap = new Map();
        donationStats.forEach((stat) => {
          statsMap.set(stat._id.toString(), {
            totalAmount: stat.totalAmount,
            donationCount: stat.donationCount,
          });
        });

        profiles = profiles.filter((p: any) => {
          const userId = (p.userId?._id || p.userId)?.toString();
          const stats = statsMap.get(userId);

          if (!stats) {
            return minAmount === undefined && minDonations === undefined;
          }

          if (minAmount && stats.totalAmount < minAmount) {
            return false;
          }

          if (minDonations && stats.donationCount < minDonations) {
            return false;
          }

          return true;
        });
      }
    }

    return profiles;
  } catch (error) {
    logger.error("Error getting targeted alumni:", error);
    throw error;
  }
};

/**
 * Preview audience - return count and sample
 */
export const previewAudience = async (
  filters: TargetAudienceFilters,
  tenantId?: string
): Promise<{
  count: number;
  sample: any[];
}> => {
  try {
    const profiles = await getTargetedAlumni(filters, tenantId);

    return {
      count: profiles.length,
      sample: profiles.slice(0, 10), // Return first 10 as sample
    };
  } catch (error) {
    logger.error("Error previewing audience:", error);
    throw error;
  }
};

