import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileText,
  Calendar,
  Filter,
  RefreshCw,
  Award,
  Users,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { rewardsAPI, type ApiResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Period = "all" | "month" | "year" | "custom";

interface RewardReportData {
  totalRewards: number;
  activeRewards: number;
  totalEarned: number;
  totalClaimed: number;
  pendingVerifications: number;
  topRewards: Array<{
    _id: string;
    name: string;
    earned: number;
    claimed: number;
  }>;
  rewardsByCategory: Array<{
    category: string;
    count: number;
    earned: number;
  }>;
  verificationStats: {
    pending: number;
    approved: number;
    rejected: number;
  };
}

export const RewardsReport: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [reportData, setReportData] = useState<RewardReportData | null>(null);

  const getDateRange = (): { startDate?: string; endDate?: string } => {
    if (period === "custom" && startDate && endDate) {
      return { startDate, endDate };
    }
    const now = new Date();
    switch (period) {
      case "month":
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      case "year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      default:
        return {};
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange();
      
      // Fetch all data in parallel
      const [rewardsResponse, statsResponse, verificationResponse] = await Promise.all([
        rewardsAPI.getRewards({ scope: "admin" }) as Promise<ApiResponse<{ rewards: any[] }>>,
        rewardsAPI.getRewardStatistics(dateRange) as Promise<ApiResponse<{
          topRewards: Array<{ _id: string; name: string; earned: number; claimed: number }>;
          totals: { totalEarned: number; totalClaimed: number };
        }>>,
        rewardsAPI.getVerificationStats() as Promise<ApiResponse<{ stats: { pending: number; approved: number; rejected: number } }>>,
      ]);

      const rewards = rewardsResponse.data?.rewards || [];
      const stats = statsResponse.data || { topRewards: [], totals: { totalEarned: 0, totalClaimed: 0 } };
      const verificationStats = verificationResponse.data?.stats || { pending: 0, approved: 0, rejected: 0 };

      const reportData: RewardReportData = {
        totalRewards: rewards.length,
        activeRewards: rewards.filter((r: any) => r.isActive).length,
        totalEarned: stats.totals.totalEarned,
        totalClaimed: stats.totals.totalClaimed,
        pendingVerifications: verificationStats.pending,
        topRewards: stats.topRewards.slice(0, 5),
        rewardsByCategory: [],
        verificationStats: {
          pending: verificationStats.pending,
          approved: verificationStats.approved,
          rejected: verificationStats.rejected,
        },
      };

      setReportData(reportData);
    } catch (error) {
      toast({
        title: "Error loading report",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [period, startDate, endDate]);

  const handleExport = () => {
    toast({
      title: "Export functionality",
      description: "Report export will be available soon.",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Rewards Report</h2>
          <p className="text-sm sm:text-base text-gray-600">
            Comprehensive overview of rewards system performance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* <Button variant="outline" onClick={fetchReportData} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button> */}
         
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Time Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {period === "custom" && (
              <>
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Rewards</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportData?.totalRewards || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {reportData?.activeRewards || 0} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Earned</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportData?.totalEarned || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rewards earned by users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Claimed</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportData?.totalClaimed || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rewards claimed by users
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">
              Pending Verifications
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {reportData?.pendingVerifications || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting staff approval
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Rewards */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          {reportData?.topRewards && reportData.topRewards.length > 0 ? (
            <div className="space-y-3">
              {reportData.topRewards.map((reward) => (
                <div
                  key={reward._id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{reward.name}</p>
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Earned: {reward.earned}</span>
                      <span>Claimed: {reward.claimed}</span>
                    </div>
                  </div>
                  <Badge variant="outline" className="w-fit sm:w-auto">
                    {reward.earned > 0
                      ? Math.round((reward.claimed / reward.earned) * 100)
                      : 0}
                    % claim rate
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No reward data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Verification Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-amber-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold">
                {reportData?.verificationStats.pending || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-green-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold">
                {reportData?.verificationStats.approved || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <XCircle className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-red-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold">
                {reportData?.verificationStats.rejected || 0}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">Rejected</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

