import { Request, Response } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import User from "../models/User";
import AlumniProfile from "../models/AlumniProfile";
import Event from "../models/Event";
import Donation from "../models/Donation";
import JobPost from "../models/JobPost";
import JobApplication from "../models/JobApplication";
import Campaign from "../models/Campaign";
import Community from "../models/Community";
import CommunityPost from "../models/CommunityPost";
import CommunityMembership from "../models/CommunityMembership";
import Mentorship from "../models/Mentorship";
import { JobPostStatus } from "../types";

// Get comprehensive admin analytics
export const getAdminAnalytics = async (req: Request, res: Response) => {
  try {
    // Multi-tenant filtering
    const tenantFilter: any = {};
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      tenantFilter.tenantId = req.user.tenantId;
    }

    // Get tenant users for filtering
    const tenantUsers = await User.find(tenantFilter).select("_id");
    const tenantUserIds = tenantUsers.map((u) => u._id);

    // Get tenant communities for filtering CommunityPost and CommunityMembership
    // Communities are filtered by createdBy (matching tenant users), not directly by tenantId
    let tenantCommunityIds: mongoose.Types.ObjectId[] = [];
    if (req.user?.role === "super_admin") {
      // Super admin can see all communities
      const allCommunities = await Community.find({}).select("_id");
      tenantCommunityIds = allCommunities.map(
        (c: any) => c._id as mongoose.Types.ObjectId
      );
    } else if (tenantUserIds.length > 0) {
      // Filter communities by createdBy matching tenant users
      const tenantCommunities = await Community.find({
        createdBy: { $in: tenantUserIds },
      }).select("_id");
      tenantCommunityIds = tenantCommunities.map(
        (c: any) => c._id as mongoose.Types.ObjectId
      );
    }

    // Calculate date ranges (last 12 months)
    const now = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    // Aggregate all analytics in parallel
    const [
      // Summary Statistics
      totalAlumni,
      totalStudents,
      totalStaff,
      totalEvents,
      totalDonations,
      totalJobs,
      totalCampaigns,
      totalCommunities,
      totalMentorshipPrograms,
      activeMentorshipMatches,

      // Events Analytics
      eventsByStatus,
      eventsByType,
      eventsTimeline,
      eventsAttendanceMetrics,

      // Donations Analytics
      donationsTotal,
      donationsCount,
      donationsByCampaign,
      donationsByMethod,
      donationsTimeline,
      donationsByStatus,

      // Alumni Analytics
      alumniByDepartment,
      alumniByStatus,
      alumniTimeline,

      // Students Analytics
      studentsByStatus,
      studentsTimeline,

      // Jobs Analytics
      jobsByStatus,
      jobsByType,
      jobsTimeline,
      pendingJobsCount,

      // Campaign Analytics
      campaignsByStatus,
      campaignsTimeline,
      totalRaised,

      // Community Analytics
      communityPostsCount,
      communityMembersCount,
      communitiesByType,

      // Mentorship Analytics
      mentorshipByStatus,
      mentorshipTimeline,
    ] = await Promise.all([
      // Summary Statistics
      AlumniProfile.countDocuments({
        userId: { $in: tenantUserIds },
      }),
      User.countDocuments({
        ...tenantFilter,
        role: "student",
      }),
      User.countDocuments({
        ...tenantFilter,
        role: { $in: ["staff", "hod", "college_admin"] },
      }),
      Event.countDocuments({
        organizer: { $in: tenantUserIds },
      }),
      Donation.countDocuments({
        tenantId: req.user?.tenantId || { $exists: true },
        paymentStatus: { $in: ["completed", "successful"] },
      }),
      JobPost.countDocuments({
        tenantId: req.user?.tenantId || { $exists: true },
      }),
      Campaign.countDocuments({
        tenantId: req.user?.tenantId || { $exists: true },
      }),
      // Count communities by createdBy matching tenant users (same logic as Community Analytics)
      req.user?.role === "super_admin"
        ? Community.countDocuments({})
        : tenantUserIds.length > 0
          ? Community.countDocuments({
              createdBy: { $in: tenantUserIds },
            })
          : Promise.resolve(0),
      Mentorship.countDocuments({}),
      Mentorship.countDocuments({
        status: "active",
      }),

      // Events Analytics
      Event.aggregate([
        { $match: { organizer: { $in: tenantUserIds } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Event.aggregate([
        { $match: { organizer: { $in: tenantUserIds } } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
      Event.aggregate([
        {
          $match: {
            organizer: { $in: tenantUserIds },
            startDate: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$startDate" },
              month: { $month: "$startDate" },
            },
            count: { $sum: 1 },
            registrations: { $sum: "$currentAttendees" },
            attendance: { $sum: "$currentAttendees" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      // Events Attendance Metrics
      Event.aggregate([
        { $match: { organizer: { $in: tenantUserIds } } },
        {
          $group: {
            _id: null,
            totalRegistrations: { $sum: "$currentAttendees" },
            totalCapacity: { $sum: "$maxAttendees" },
          },
        },
      ]),

      // Donations Analytics
      Donation.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            paymentStatus: { $in: ["completed", "successful"] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),
      Donation.countDocuments({
        tenantId: req.user?.tenantId || { $exists: true },
        paymentStatus: { $in: ["completed", "successful"] },
      }),
      Donation.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            paymentStatus: { $in: ["completed", "successful"] },
            campaignId: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$campaignId",
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
        { $limit: 10 },
      ]),
      Donation.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            paymentStatus: { $in: ["completed", "successful"] },
          },
        },
        {
          $group: {
            _id: "$paymentMethod",
            count: { $sum: 1 },
            amount: { $sum: "$amount" },
          },
        },
      ]),
      Donation.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            paymentStatus: { $in: ["completed", "successful"] },
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            amount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Donation.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
          },
        },
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
          },
        },
      ]),

      // Alumni Analytics
      AlumniProfile.aggregate([
        {
          $match: {
            userId: { $in: tenantUserIds },
            department: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: "$department",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      User.aggregate([
        {
          $match: {
            ...tenantFilter,
            role: "alumni",
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      AlumniProfile.aggregate([
        {
          $match: {
            userId: { $in: tenantUserIds },
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Students Analytics
      User.aggregate([
        {
          $match: {
            ...tenantFilter,
            role: "student",
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      User.aggregate([
        {
          $match: {
            ...tenantFilter,
            role: "student",
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),

      // Jobs Analytics
      JobPost.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      JobPost.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
      JobPost.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      JobPost.countDocuments({
        tenantId: req.user?.tenantId || { $exists: true },
        status: JobPostStatus.PENDING,
      }),

      // Campaign Analytics
      Campaign.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Campaign.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
            raised: { $sum: "$currentAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
      Campaign.aggregate([
        {
          $match: {
            tenantId: req.user?.tenantId || { $exists: true },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$currentAmount" },
          },
        },
      ]),

      // Community Analytics
      CommunityPost.countDocuments(
        tenantCommunityIds.length > 0
          ? { communityId: { $in: tenantCommunityIds } }
          : { _id: { $exists: false } } // Return 0 if no communities
      ),
      CommunityMembership.countDocuments(
        tenantCommunityIds.length > 0
          ? {
              status: "approved",
              communityId: { $in: tenantCommunityIds },
            }
          : { _id: { $exists: false } } // Return 0 if no communities
      ),
      Community.aggregate([
        {
          $match:
            req.user?.role === "super_admin"
              ? {}
              : tenantUserIds.length > 0
                ? { createdBy: { $in: tenantUserIds } }
                : { _id: { $exists: false } }, // Return empty if no users
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]),

      // Mentorship Analytics
      Mentorship.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
      Mentorship.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    // Format timeline data for charts (last 12 months)
    const formatTimeline = (
      data: Array<{
        _id: { year: number; month: number };
        count?: number;
        amount?: number;
        raised?: number;
        registrations?: number;
        attendance?: number;
      }>
    ) => {
      const months: Record<
        string,
        {
          month: string;
          count: number;
          amount: number;
          registrations?: number;
          attendance?: number;
        }
      > = {};
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        months[key] = {
          month: date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          }),
          count: 0,
          amount: 0,
          registrations: 0,
          attendance: 0,
        };
      }

      data.forEach(
        (item: {
          _id: { year: number; month: number };
          count?: number;
          amount?: number;
          raised?: number;
          registrations?: number;
          attendance?: number;
        }) => {
          const year = item._id.year;
          const month = String(item._id.month).padStart(2, "0");
          const key = `${year}-${month}`;
          if (months[key]) {
            months[key].count = item.count || 0;
            months[key].amount = item.amount || item.raised || 0;
            months[key].registrations = item.registrations || 0;
            months[key].attendance = item.attendance || 0;
          }
        }
      );

      return Object.values(months);
    };

    // Populate campaign names for donations
    const donationsByCampaignPopulated = await Promise.all(
      donationsByCampaign.map(
        async (item: {
          _id: mongoose.Types.ObjectId | null;
          amount: number;
          count: number;
        }) => {
          if (item._id) {
            const campaign = await Campaign.findById(item._id).select("title");
            return {
              name: campaign?.title || "Unknown Campaign",
              amount: item.amount || 0,
              count: item.count || 0,
            };
          }
          return null;
        }
      )
    );

    return res.json({
      success: true,
      data: {
        summary: {
          totalAlumni,
          totalStudents,
          totalStaff,
          totalEvents,
          totalDonations: donationsCount,
          totalDonationAmount: donationsTotal[0]?.total || 0,
          totalJobs,
          totalCampaigns,
          totalCommunities,
          totalMentorshipPrograms,
          activeMentorshipMatches,
          pendingJobs: pendingJobsCount,
        },
        events: {
          byStatus: eventsByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          byType: eventsByType.map(
            (item: { _id: string | null; count: number }) => ({
              type: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(eventsTimeline),
          totalRegistrations:
            eventsAttendanceMetrics[0]?.totalRegistrations || 0,
          totalCapacity: eventsAttendanceMetrics[0]?.totalCapacity || 0,
          averageAttendanceRate:
            eventsAttendanceMetrics[0]?.totalCapacity > 0
              ? (
                  (eventsAttendanceMetrics[0].totalRegistrations /
                    eventsAttendanceMetrics[0].totalCapacity) *
                  100
                ).toFixed(2)
              : "0.00",
          averageRegistrationRate:
            totalEvents > 0
              ? (
                  (eventsAttendanceMetrics[0]?.totalRegistrations || 0) /
                  totalEvents
                ).toFixed(2)
              : "0.00",
        },
        donations: {
          total: donationsTotal[0]?.total || 0,
          count: donationsCount,
          average:
            donationsCount > 0
              ? (donationsTotal[0]?.total || 0) / donationsCount
              : 0,
          byCampaign: donationsByCampaignPopulated.filter(
            (
              item: { name: string; amount: number; count: number } | null
            ): item is { name: string; amount: number; count: number } =>
              item !== null
          ),
          byMethod: donationsByMethod.map(
            (item: { _id: string | null; count: number; amount: number }) => ({
              method: item._id || "unknown",
              count: item.count,
              amount: item.amount || 0,
            })
          ),
          byStatus: donationsByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(donationsTimeline),
        },
        alumni: {
          byDepartment: alumniByDepartment.map(
            (item: { _id: string | null; count: number }) => ({
              department: item._id || "Unknown",
              count: item.count,
            })
          ),
          byStatus: alumniByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(alumniTimeline),
        },
        students: {
          byStatus: studentsByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(studentsTimeline),
        },
        jobs: {
          byStatus: jobsByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          byType: jobsByType.map(
            (item: { _id: string | null; count: number }) => ({
              type: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(jobsTimeline),
          pending: pendingJobsCount,
        },
        campaigns: {
          byStatus: campaignsByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(campaignsTimeline),
          totalRaised: totalRaised[0]?.total || 0,
        },
        community: {
          totalPosts: communityPostsCount,
          totalMembers: communityMembersCount,
          byType: communitiesByType.map(
            (item: {
              _id: string | mongoose.Types.ObjectId | null;
              count: number;
            }) => {
              // Handle both string categories and ObjectId categories
              const categoryId = item._id;
              const categoryName =
                typeof categoryId === "string"
                  ? categoryId
                  : categoryId instanceof mongoose.Types.ObjectId
                    ? categoryId.toString()
                    : "unknown";
              return {
                type: categoryName,
                count: item.count,
              };
            }
          ),
        },
        mentorship: {
          byStatus: mentorshipByStatus.map(
            (item: { _id: string | null; count: number }) => ({
              status: item._id || "unknown",
              count: item.count,
            })
          ),
          timeline: formatTimeline(mentorshipTimeline),
        },
      },
    });
  } catch (error) {
    logger.error("Get admin analytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch admin analytics",
    });
  }
};

export default {
  getAdminAnalytics,
};
