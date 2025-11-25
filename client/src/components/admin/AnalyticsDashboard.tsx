import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminAnalyticsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { EventsAnalytics } from "./analytics/EventsAnalytics";
import { DonationsAnalytics } from "./analytics/DonationsAnalytics";
import { AlumniAnalytics } from "./analytics/AlumniAnalytics";
import { StudentsAnalytics } from "./analytics/StudentsAnalytics";
import { JobsAnalytics } from "./analytics/JobsAnalytics";
import { CampaignsAnalytics } from "./analytics/CampaignsAnalytics";
import { CommunityAnalytics } from "./analytics/CommunityAnalytics";
import { MentorshipAnalytics } from "./analytics/MentorshipAnalytics";
import { SummaryCards } from "./analytics/SummaryCards";

interface AdminAnalyticsData {
  summary: {
    totalAlumni: number;
    totalStudents: number;
    totalStaff: number;
    totalEvents: number;
    totalDonations: number;
    totalDonationAmount: number;
    totalJobs: number;
    totalCampaigns: number;
    totalCommunities: number;
    totalMentorshipPrograms: number;
    activeMentorshipMatches: number;
    pendingJobs: number;
  };
  events: {
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    timeline: Array<{
      month: string;
      count: number;
      registrations?: number;
      attendance?: number;
    }>;
    totalRegistrations: number;
    totalCapacity: number;
    averageAttendanceRate: string;
    averageRegistrationRate: string;
  };
  donations: {
    total: number;
    count: number;
    average: number;
    byCampaign: Array<{ name: string; amount: number; count: number }>;
    byMethod: Array<{ method: string; count: number; amount: number }>;
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; amount: number; count: number }>;
  };
  alumni: {
    byDepartment: Array<{ department: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
  students: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
  jobs: {
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
    pending: number;
  };
  campaigns: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number; raised: number }>;
    totalRaised: number;
  };
  community: {
    totalPosts: number;
    totalMembers: number;
    byType: Array<{ type: string; count: number }>;
  };
  mentorship: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
}

interface AnalyticsDashboardProps {
  hideSummaryCards?: boolean;
}

export const AnalyticsDashboard = ({
  hideSummaryCards = false,
}: AnalyticsDashboardProps) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAnalyticsAPI.getAdminAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data as AdminAnalyticsData);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load analytics",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching admin analytics:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards - Only show if not hidden */}
      {!hideSummaryCards && <SummaryCards summary={analytics.summary} />}

      {/* Events Analytics */}
      <EventsAnalytics data={analytics.events} />

      {/* Donations Analytics */}
      <DonationsAnalytics data={analytics.donations} />

      {/* Alumni Analytics */}
      <AlumniAnalytics data={analytics.alumni} />

      {/* Students Analytics */}
      <StudentsAnalytics data={analytics.students} />

      {/* Jobs Analytics */}
      <JobsAnalytics data={analytics.jobs} />

      {/* Campaigns Analytics */}
      <CampaignsAnalytics data={analytics.campaigns} />

      {/* Community Analytics */}
      <CommunityAnalytics data={analytics.community} />

      {/* Mentorship Analytics */}
      <MentorshipAnalytics data={analytics.mentorship} />
    </div>
  );
};
