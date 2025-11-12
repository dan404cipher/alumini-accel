import mongoose from "mongoose";
import { logger } from "../utils/logger";
import MentorRegistration from "../models/MentorRegistration";
import MenteeRegistration from "../models/MenteeRegistration";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import MentorMenteeMatching from "../models/MentorMenteeMatching";
import { MatchingStatus } from "../types";
import { MAX_MENTEES_PER_MENTOR } from "../constants/mentoring";

interface MatchScore {
  mentorId: string;
  mentorRegistrationId: string;
  industryScore: number;
  programmeScore: number;
  skillsScore: number;
  preferenceScore: number;
  totalScore: number;
  isInPreferredList: boolean;
  preferredOrder?: number;
}

interface MenteeData {
  menteeRegistration: any;
  menteeProfile?: any;
  preferredMentorIds: string[];
}

interface MentorData {
  mentorRegistration: any;
  mentorUser: any;
  mentorProfile?: any;
}

// Industry matching (30% weight)
const calculateIndustryScore = (
  menteeIndustry: string | undefined,
  menteeCompany: string | undefined,
  mentorIndustry: string | undefined,
  mentorCompany: string | undefined
): number => {
  // Normalize strings for comparison
  const normalize = (str: string | undefined): string => {
    if (!str) return "";
    return str.toLowerCase().trim();
  };

  const menteeInd = normalize(menteeIndustry);
  const menteeComp = normalize(menteeCompany);
  const mentorInd = normalize(mentorIndustry);
  const mentorComp = normalize(mentorCompany);

  // Exact industry match
  if (menteeInd && mentorInd && menteeInd === mentorInd) {
    return 100;
  }

  // Company industry match (extract industry from company if needed)
  if (menteeComp && mentorComp && menteeComp === mentorComp) {
    return 100;
  }

  // Related industries (simplified - can be enhanced with industry taxonomy)
  const relatedIndustries: { [key: string]: string[] } = {
    technology: ["software", "it", "tech", "computing", "ai", "data"],
    finance: ["banking", "investment", "accounting", "consulting"],
    healthcare: ["medical", "pharmaceutical", "biotech"],
    education: ["academic", "teaching", "research"],
    engineering: ["manufacturing", "construction", "automotive"],
  };

  // Check if industries are related
  for (const [key, values] of Object.entries(relatedIndustries)) {
    const menteeMatch = values.some((v) => menteeInd.includes(v) || menteeComp.includes(v));
    const mentorMatch = values.some((v) => mentorInd.includes(v) || mentorComp.includes(v));
    if (menteeMatch && mentorMatch) {
      return 60;
    }
  }

  // Partial match
  if (menteeInd && mentorInd) {
    const menteeWords = menteeInd.split(/[\s-]+/);
    const mentorWords = mentorInd.split(/[\s-]+/);
    const commonWords = menteeWords.filter((w) => mentorWords.includes(w) && w.length > 3);
    if (commonWords.length > 0) {
      return 40;
    }
  }

  return 0;
};

// Programme matching (20% weight)
const calculateProgrammeScore = (
  menteeProgram: string | undefined,
  mentorProgram: string | undefined
): number => {
  if (!menteeProgram || !mentorProgram) return 0;

  const normalize = (str: string): string => {
    return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, "");
  };

  const menteeProg = normalize(menteeProgram);
  const mentorProg = normalize(mentorProgram);

  // Exact match
  if (menteeProg === mentorProg) {
    return 100;
  }

  // Check if one contains the other (related fields)
  if (menteeProg.includes(mentorProg) || mentorProg.includes(menteeProg)) {
    return 80;
  }

  // Partial word match
  const menteeWords = menteeProg.split(/\s+/).filter((w) => w.length > 3);
  const mentorWords = mentorProg.split(/\s+/).filter((w) => w.length > 3);
  const commonWords = menteeWords.filter((w) => mentorWords.includes(w));

  if (commonWords.length >= 2) {
    return 60;
  } else if (commonWords.length === 1) {
    return 30;
  }

  return 0;
};

// Skills matching (10% weight)
const calculateSkillsScore = (
  menteeAreas: string[],
  mentorAreas: string[]
): number => {
  if (!mentorAreas || mentorAreas.length === 0) return 0;
  if (!menteeAreas || menteeAreas.length === 0) return 0;

  const normalize = (str: string): string => {
    return str.toLowerCase().trim();
  };

  const normalizedMenteeAreas = menteeAreas.map(normalize);
  const normalizedMentorAreas = mentorAreas.map(normalize);

  // Count matching areas
  let matches = 0;
  for (const menteeArea of normalizedMenteeAreas) {
    for (const mentorArea of normalizedMentorAreas) {
      if (menteeArea === mentorArea || mentorArea.includes(menteeArea) || menteeArea.includes(mentorArea)) {
        matches++;
        break; // Count each mentee area only once
      }
    }
  }

  // Calculate percentage: (matching areas / total mentor areas) * 100
  // But also consider mentee areas covered
  const menteeCoverage = matches / Math.max(menteeAreas.length, 1);
  const mentorMatch = matches / Math.max(mentorAreas.length, 1);

  // Average of both perspectives
  return Math.round((menteeCoverage + mentorMatch) / 2 * 100);
};

// Preference matching (40% weight)
const calculatePreferenceScore = (
  mentorId: string,
  preferredMentorIds: string[]
): { score: number; order?: number } => {
  if (!preferredMentorIds || preferredMentorIds.length === 0) {
    return { score: 0 };
  }

  const index = preferredMentorIds.indexOf(mentorId);
  if (index === -1) {
    return { score: 0 };
  }

  // 1st choice = 100%, 2nd choice = 80%, 3rd choice = 60%
  const preferenceScores = [100, 80, 60];
  const score = preferenceScores[index] || 0;

  return { score, order: index + 1 };
};

// Main matching function
export const calculateMatchScore = async (
  menteeId: string, // Can be registration ID or user ID
  menteeRegistrationId: string,
  mentorId: string,
  mentorRegistrationId: string,
  preferredMentorIds: string[]
): Promise<MatchScore> => {
  try {
    // Get mentee registration and profile
    const menteeRegistration = await MenteeRegistration.findById(menteeRegistrationId);
    
    // Try to find user by email from registration
    let menteeUser = null;
    let menteeProfile = null;
    
    if (menteeRegistration?.personalEmail) {
      menteeUser = await User.findOne({ email: menteeRegistration.personalEmail });
      if (menteeUser) {
        menteeProfile = await AlumniProfile.findOne({ userId: menteeUser._id });
      }
    }
    
    // Fallback: try menteeId as user ID
    if (!menteeUser && menteeId && menteeId !== menteeRegistrationId) {
      menteeUser = await User.findById(menteeId);
      if (menteeUser) {
        menteeProfile = await AlumniProfile.findOne({ userId: menteeUser._id });
      }
    }

    // Get mentor registration and profile
    const mentorRegistration = await MentorRegistration.findById(mentorRegistrationId);
    const mentorUser = await User.findById(mentorId);
    const mentorProfile = mentorUser
      ? await AlumniProfile.findOne({ userId: mentorUser._id })
      : null;

    // Get company information
    const menteeCompany = menteeProfile?.currentCompany;
    const mentorCompany = mentorProfile?.currentCompany;

    // Get programme information
    const menteeProgram = menteeProfile?.program || menteeProfile?.department;
    const mentorProgram = mentorProfile?.program || mentorProfile?.department;

    // Get areas of mentoring
    const menteeAreas = menteeRegistration?.areasOfMentoring || [];
    const mentorAreas = mentorRegistration?.areasOfMentoring || [];

    // Calculate individual scores
    const industryScore = calculateIndustryScore(
      undefined, // menteeIndustry - not available in profile
      menteeCompany,
      undefined, // mentorIndustry - not available in profile
      mentorCompany
    );

    const programmeScore = calculateProgrammeScore(menteeProgram, mentorProgram);

    const skillsScore = calculateSkillsScore(menteeAreas, mentorAreas);

    const preferenceResult = calculatePreferenceScore(mentorId, preferredMentorIds);

    // Calculate weighted total score
    const totalScore =
      industryScore * 0.3 +
      programmeScore * 0.2 +
      skillsScore * 0.1 +
      preferenceResult.score * 0.4;

    return {
      mentorId: mentorId.toString(),
      mentorRegistrationId: mentorRegistrationId.toString(),
      industryScore: Math.round(industryScore * 10) / 10,
      programmeScore: Math.round(programmeScore * 10) / 10,
      skillsScore: Math.round(skillsScore * 10) / 10,
      preferenceScore: Math.round(preferenceResult.score * 10) / 10,
      totalScore: Math.round(totalScore * 10) / 10,
      isInPreferredList: preferenceResult.order !== undefined,
      preferredOrder: preferenceResult.order,
    };
  } catch (error) {
    logger.error("Calculate match score error:", error);
    throw error;
  }
};

// Calculate match scores for all approved mentors for a mentee
export const calculateAllMatchScores = async (
  menteeId: string,
  menteeRegistrationId: string,
  programId: string,
  preferredMentorIds: string[]
): Promise<MatchScore[]> => {
  try {
    // Get all approved mentor registrations for the program
    const mentorRegistrations = await MentorRegistration.find({
      programId,
      status: "approved",
    }).populate("userId");

    const matchScores: MatchScore[] = [];

    // Calculate score for each mentor
    for (const mentorReg of mentorRegistrations) {
      try {
        const mentorUserId = mentorReg.userId.toString();
        const score = await calculateMatchScore(
          menteeId,
          menteeRegistrationId,
          mentorUserId,
          mentorReg._id.toString(),
          preferredMentorIds
        );
        matchScores.push(score);
      } catch (error) {
        logger.error(`Failed to calculate score for mentor ${mentorReg._id}:`, error);
      }
    }

    // Sort by total score (descending)
    matchScores.sort((a, b) => b.totalScore - a.totalScore);

    return matchScores;
  } catch (error) {
    logger.error("Calculate all match scores error:", error);
    throw error;
  }
};

// Find best match (highest score from preferred list, or algorithm-based)
export const findBestMatch = async (
  menteeId: string,
  menteeRegistrationId: string,
  programId: string,
  preferredMentorIds: string[],
  excludedMentorIds: string[] = [],
  tenantId?: string
): Promise<MatchScore | null> => {
  try {
    // Calculate all scores
    const allScores = await calculateAllMatchScores(
      menteeId,
      menteeRegistrationId,
      programId,
      preferredMentorIds
    );

    // Filter out excluded mentors
    let availableScores = allScores.filter(
      (score) => !excludedMentorIds.includes(score.mentorId)
    );

    // Filter out mentors who have reached maximum capacity (20 mentees)
    if (tenantId) {
      const mentorIds = availableScores.map((score) => score.mentorId);
      
      // Convert string IDs to ObjectId for proper MongoDB query
      const mentorObjectIds = mentorIds.map((id) => new mongoose.Types.ObjectId(id));
      
      const mentorMatchCounts = await MentorMenteeMatching.aggregate([
        {
          $match: {
            programId: new mongoose.Types.ObjectId(programId),
            mentorId: { $in: mentorObjectIds },
            status: MatchingStatus.ACCEPTED,
            tenantId: new mongoose.Types.ObjectId(tenantId),
          },
        },
        {
          $group: {
            _id: "$mentorId",
            count: { $sum: 1 },
          },
        },
      ]);

      const mentorsAtCapacity = new Set(
        mentorMatchCounts
          .filter((item) => item.count >= MAX_MENTEES_PER_MENTOR)
          .map((item) => item._id.toString())
      );

      availableScores = availableScores.filter(
        (score) => !mentorsAtCapacity.has(score.mentorId)
      );
    }

    if (availableScores.length === 0) {
      return null;
    }

    // First, try to find from preferred list (in order)
    for (const preferredId of preferredMentorIds) {
      const preferredScore = availableScores.find(
        (score) => score.mentorId === preferredId
      );
      if (preferredScore) {
        return preferredScore;
      }
    }

    // If no preferred match available, return highest algorithm score
    return availableScores[0];
  } catch (error) {
    logger.error("Find best match error:", error);
    return null;
  }
};

