import { Request, Response } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger";
import User from "../models/User";
import Event from "../models/Event";
import AlumniProfile from "../models/AlumniProfile";
import { UserRole, UserStatus } from "../types";

// Get department-wise HOD and Staff analytics
export const getDepartmentAnalytics = async (req: Request, res: Response) => {
  try {
    // Multi-tenant filtering
    const tenantFilter: any = {};
    if (req.user?.role !== "super_admin" && req.user?.tenantId) {
      tenantFilter.tenantId = req.user.tenantId;
    }

    // Calculate date ranges (last 6 months for monthly activity)
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    // Get all HODs and Staff with their departments
    const [hods, staff, allUsers] = await Promise.all([
      User.find({
        ...tenantFilter,
        role: UserRole.HOD,
        status: { $nin: [UserStatus.SUSPENDED] },
      })
        .select("_id firstName lastName email profilePicture department status createdAt")
        .lean(),
      User.find({
        ...tenantFilter,
        role: UserRole.STAFF,
        status: { $nin: [UserStatus.SUSPENDED] },
      })
        .select("_id firstName lastName email profilePicture department status createdAt")
        .lean(),
      User.find({
        ...tenantFilter,
        role: { $in: [UserRole.HOD, UserRole.STAFF] },
        status: { $nin: [UserStatus.SUSPENDED] },
      })
        .select("_id role department status createdAt")
        .lean(),
    ]);

    // Get events and alumni profiles
    const [events, alumniProfiles] = await Promise.all([
      Event.find({
        ...tenantFilter,
        createdAt: { $gte: sixMonthsAgo },
      })
        .select("organizer department createdAt")
        .lean(),
      AlumniProfile.find({
        userId: { $in: allUsers.map((u) => u._id) },
      })
        .select("userId department")
        .lean(),
    ]);

    // Get unique departments
    const departmentsSet = new Set<string>();
    hods.forEach((hod) => {
      if (hod.department) departmentsSet.add(hod.department);
    });
    staff.forEach((s) => {
      if (s.department) departmentsSet.add(s.department);
    });
    const departments = Array.from(departmentsSet);

    // Calculate summary statistics
    const totalDepartments = departments.length;
    const totalHODs = hods.length;
    const totalStaff = staff.length;
    const activeStaff = staff.filter((s) => s.status === UserStatus.ACTIVE).length;
    const inactiveStaff = staff.filter((s) => s.status !== UserStatus.ACTIVE).length;
    const pendingVerifications = staff.filter((s) => s.status === UserStatus.PENDING).length;

    // Calculate department-wise analytics
    const departmentAnalytics = departments.map((dept) => {
      const deptHODs = hods.filter((h) => h.department === dept);
      const deptStaff = staff.filter((s) => s.department === dept);
      const activeDeptStaff = deptStaff.filter((s) => s.status === UserStatus.ACTIVE).length;
      const inactiveDeptStaff = deptStaff.filter((s) => s.status !== UserStatus.ACTIVE).length;

      // Calculate monthly activity (events created by department staff/HODs)
      const deptUserIds = [
        ...deptHODs.map((h) => h._id.toString()),
        ...deptStaff.map((s) => s._id.toString()),
      ];
      const deptEvents = events.filter((e) =>
        deptUserIds.includes((e.organizer as any)?.toString() || "")
      );

      // Group events by month
      const monthlyActivityMap = new Map<string, number>();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(now.getMonth() - i);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        monthlyActivityMap.set(monthKey, 0);
      }

      deptEvents.forEach((event) => {
        if (event.createdAt) {
          const eventDate = new Date(event.createdAt);
          const monthKey = `${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear().toString().slice(-2)}`;
          monthlyActivityMap.set(
            monthKey,
            (monthlyActivityMap.get(monthKey) || 0) + 1
          );
        }
      });

      const monthlyActivity = Array.from(monthlyActivityMap.entries()).map(([month, activity]) => ({
        month,
        activity,
      }));

      // Calculate engagement score (based on active staff ratio, events, and activity)
      const activeRatio = deptStaff.length > 0 ? activeDeptStaff / deptStaff.length : 0;
      const eventScore = Math.min(deptEvents.length * 2, 30); // Max 30 points for events
      const activityScore = Math.min(monthlyActivity.reduce((sum, m) => sum + m.activity, 0) * 2, 40); // Max 40 points
      const engagementScore = Math.round(activeRatio * 30 + eventScore + activityScore);

      return {
        name: dept,
        hodCount: deptHODs.length,
        staffCount: deptStaff.length,
        activeStaff: activeDeptStaff,
        inactiveStaff: inactiveDeptStaff,
        engagementScore: Math.min(engagementScore, 100),
        monthlyActivity,
      };
    });

    // Calculate HOD analytics
    const hodAnalytics = await Promise.all(
      hods.map(async (hod) => {
        const hodId = hod._id.toString();

        // Count events created by this HOD
        const eventsCreated = events.filter(
          (e) => (e.organizer as any)?.toString() === hodId
        ).length;

        // Count approvals (pending staff requests approved by this HOD)
        // This would need to be tracked in a separate collection or calculated differently
        // For now, we'll use a placeholder
        const approvalsCount = 0; // TODO: Implement actual approval tracking

        // Count alumni interactions (alumni from same department)
        const deptAlumni = alumniProfiles.filter(
          (ap) => ap.department === hod.department
        ).length;

        // Calculate activity score
        const activityScore = Math.min(
          eventsCreated * 5 + approvalsCount * 2 + Math.min(deptAlumni / 2, 30),
          100
        );

        // Calculate pending actions (staff pending verification in same department)
        const pendingActions = staff.filter(
          (s) => s.department === hod.department && s.status === UserStatus.PENDING
        ).length;

        // Determine performance indicator
        let performanceIndicator: "green" | "yellow" | "red" = "green";
        if (activityScore < 50) {
          performanceIndicator = "red";
        } else if (activityScore < 75) {
          performanceIndicator = "yellow";
        }

        return {
          _id: hod._id.toString(),
          firstName: hod.firstName,
          lastName: hod.lastName,
          email: hod.email,
          profileImage: hod.profilePicture,
          department: hod.department || "Unknown",
          activityScore: Math.round(activityScore),
          pendingActions,
          eventsCreated,
          approvalsCount,
          alumniInteractions: deptAlumni,
          performanceIndicator,
        };
      })
    );

    // Calculate staff analytics
    const registeredStaff = staff.filter((s) => s.status === UserStatus.ACTIVE).length;
    const unregisteredStaff = staff.filter((s) => s.status !== UserStatus.ACTIVE).length;

    // Calculate event participation (events where staff are attendees or creators)
    const eventParticipation = events.length; // Simplified - could be more detailed

    // Calculate initiatives created (events created by staff)
    const initiativesCreated = events.filter((e) => {
      const creator = staff.find((s) => s._id.toString() === (e.organizer as any)?.toString());
      return !!creator;
    }).length;

    // Calculate approval response rate (placeholder - would need actual approval tracking)
    const approvalResponseRate = 87; // TODO: Implement actual calculation

    // Calculate monthly engagement
    const monthlyEngagementMap = new Map<string, number>();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(now.getMonth() - i);
      const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
      monthlyEngagementMap.set(monthKey, 0);
    }

    // Count staff activity per month (events, logins, etc.)
    events.forEach((event) => {
      if (event.createdAt) {
        const eventDate = new Date(event.createdAt);
        const monthKey = `${monthNames[eventDate.getMonth()]} ${eventDate.getFullYear().toString().slice(-2)}`;
        monthlyEngagementMap.set(
          monthKey,
          (monthlyEngagementMap.get(monthKey) || 0) + 1
        );
      }
    });

    // Normalize engagement scores (0-100)
    const maxEngagement = Math.max(...Array.from(monthlyEngagementMap.values()), 1);
    const monthlyEngagement = Array.from(monthlyEngagementMap.entries()).map(([month, count]) => ({
      month,
      engagement: Math.round((count / maxEngagement) * 100),
    }));

    // Generate alerts
    const alerts: Array<{
      type: "low_engagement" | "pending_approval" | "new_staff";
      department?: string;
      message: string;
      priority: "high" | "medium" | "low";
      timestamp: string;
    }> = [];

    // Low engagement alerts
    departmentAnalytics.forEach((dept) => {
      if (dept.engagementScore < 50) {
        alerts.push({
          type: "low_engagement",
          department: dept.name,
          message: `Low engagement detected in ${dept.name} department`,
          priority: "medium",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Pending approval alerts
    departmentAnalytics.forEach((dept) => {
      const pendingCount = staff.filter(
        (s) => s.department === dept.name && s.status === UserStatus.PENDING
      ).length;
      if (pendingCount > 0) {
        alerts.push({
          type: "pending_approval",
          department: dept.name,
          message: `${pendingCount} pending staff verification${pendingCount > 1 ? "s" : ""}`,
          priority: pendingCount > 3 ? "high" : "medium",
          timestamp: new Date().toISOString(),
        });
      }
    });

    // New staff alerts (staff created in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    const newStaff = staff.filter(
      (s) => s.createdAt && new Date(s.createdAt) >= sevenDaysAgo
    );

    if (newStaff.length > 0) {
      const deptGroups = new Map<string, number>();
      newStaff.forEach((s) => {
        const dept = s.department || "Unknown";
        deptGroups.set(dept, (deptGroups.get(dept) || 0) + 1);
      });

      deptGroups.forEach((count, dept) => {
        alerts.push({
          type: "new_staff",
          department: dept,
          message: `${count} new staff member${count > 1 ? "s" : ""} joined`,
          priority: "low",
          timestamp: new Date().toISOString(),
        });
      });
    }

    // Sort alerts by priority (high > medium > low)
    alerts.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalDepartments,
          totalHODs,
          totalStaff,
          activeStaff,
          inactiveStaff,
          pendingVerifications,
        },
        departments: departmentAnalytics,
        hods: hodAnalytics,
        staff: {
          registered: registeredStaff,
          unregistered: unregisteredStaff,
          eventParticipation,
          initiativesCreated,
          approvalResponseRate,
          monthlyEngagement,
        },
        alerts,
      },
    });
  } catch (error) {
    logger.error("Error fetching department analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department analytics",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

