import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Users,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  AlertCircle,
  Download,
  CheckCircle,
  XCircle,
  Activity,
  Award,
  BarChart3,
  FileText,
  Bell,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { adminAnalyticsAPI, getImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { PIE_CHART_COLORS } from "./chartConstants";

interface DepartmentAnalyticsData {
  summary: {
    totalDepartments: number;
    totalHODs: number;
    totalStaff: number;
    activeStaff: number;
    inactiveStaff: number;
    pendingVerifications: number;
  };
  departments: Array<{
    name: string;
    hodCount: number;
    staffCount: number;
    activeStaff: number;
    inactiveStaff: number;
    engagementScore: number;
    monthlyActivity: Array<{ month: string; activity: number }>;
  }>;
  hods: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
    department: string;
    activityScore: number;
    pendingActions: number;
    eventsCreated: number;
    approvalsCount: number;
    alumniInteractions: number;
    performanceIndicator: "green" | "yellow" | "red";
  }>;
  staff: {
    registered: number;
    unregistered: number;
    eventParticipation: number;
    initiativesCreated: number;
    approvalResponseRate: number;
    monthlyEngagement: Array<{ month: string; engagement: number }>;
  };
  alerts: Array<{
    type: "low_engagement" | "pending_approval" | "new_staff";
    department?: string;
    message: string;
    priority: "high" | "medium" | "low";
    timestamp: string;
  }>;
}

const COLORS = {
  primary: "#3b82f6",
  secondary: "#8b5cf6",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#06b6d4",
};

export const DepartmentAnalytics = () => {
  const { toast } = useToast();
  const [data, setData] = useState<DepartmentAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAnalyticsAPI.getDepartmentAnalytics();
      if (response.success && response.data) {
        setData(response.data as DepartmentAnalyticsData);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load department analytics",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching department analytics:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load department analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadReport = () => {
    toast({
      title: "Report Download",
      description: "PDF report generation in progress...",
    });
    // TODO: Implement PDF generation
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  // Prepare chart data
  const departmentComparisonData = data.departments.map((dept) => ({
    name: dept.name.length > 12 ? dept.name.substring(0, 12) + "..." : dept.name,
    fullName: dept.name,
    staff: dept.staffCount,
    active: dept.activeStaff,
    inactive: dept.inactiveStaff,
    engagement: dept.engagementScore,
  }));

  const staffStatusData = [
    { name: "Registered", value: data.staff.registered, color: COLORS.success },
    { name: "Unregistered", value: data.staff.unregistered, color: COLORS.warning },
  ];

  const activeInactiveData = [
    { name: "Active", value: data.summary.activeStaff, color: COLORS.success },
    { name: "Inactive", value: data.summary.inactiveStaff, color: COLORS.danger },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Section 1: Department Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-blue-700">
              Total Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-blue-900">
                {data.summary.totalDepartments}
              </div>
              <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-purple-700">
              Total HODs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-purple-900">
                {data.summary.totalHODs}
              </div>
              <Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-green-700">
              Total Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-green-900">
                {data.summary.totalStaff}
              </div>
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-amber-700">
              Active Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-amber-900">
                {data.summary.activeStaff}
              </div>
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {data.summary.totalStaff > 0
                ? ((data.summary.activeStaff / data.summary.totalStaff) * 100).toFixed(1)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 border-rose-200">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-rose-700">
              Pending Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl sm:text-3xl font-bold text-rose-900">
                {data.summary.pendingVerifications}
              </div>
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-rose-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Section 2: Department-wise Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Staff Count per Department */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Staff Count per Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                staff: { label: "Total Staff", color: COLORS.primary },
                active: { label: "Active", color: COLORS.success },
                inactive: { label: "Inactive", color: COLORS.danger },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <BarChart data={departmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 9 }}
                  interval={0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                          <p className="font-semibold">{data.fullName}</p>
                          {payload.map((entry: any, index: number) => (
                            <p key={index} className="text-xs">
                              {entry.name}: {entry.value}
                            </p>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="staff" fill={COLORS.primary} name="Total Staff" />
                <Bar dataKey="active" fill={COLORS.success} name="Active" />
                <Bar dataKey="inactive" fill={COLORS.danger} name="Inactive" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Department Engagement Score */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Department Engagement Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                engagement: { label: "Engagement %", color: COLORS.secondary },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <BarChart data={departmentComparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 9 }}
                  interval={0}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs">
                          <p className="font-semibold">{data.fullName}</p>
                          <p className="text-xs">Engagement: {data.engagement}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="engagement"
                  fill={COLORS.secondary}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Monthly Staff Activity Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Monthly Staff Activity Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                activity: { label: "Activity", color: COLORS.info },
              }}
              className="h-[250px] sm:h-[300px]"
            >
              <LineChart
                data={
                  data.departments[0]?.monthlyActivity || []
                }
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                {data.departments.slice(0, 6).map((dept, index) => (
                  <Line
                    key={dept.name}
                    type="monotone"
                    dataKey="activity"
                    data={dept.monthlyActivity}
                    name={dept.name.length > 20 ? dept.name.substring(0, 20) + "..." : dept.name}
                    stroke={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 3: HOD Analytics Block */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            HOD Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {data.hods.map((hod) => (
              <Card key={hod._id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-2 sm:pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0">
                        {hod.profileImage ? (
                          <img
                            src={getImageUrl(hod.profileImage)}
                            alt={`${hod.firstName} ${hod.lastName}`}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          `${hod.firstName[0]}${hod.lastName[0]}`
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base font-semibold truncate">
                          {hod.firstName} {hod.lastName}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground truncate">
                          {hod.department}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        hod.performanceIndicator === "green"
                          ? "default"
                          : hod.performanceIndicator === "yellow"
                          ? "secondary"
                          : "destructive"
                      }
                      className={`flex-shrink-0 ${
                        hod.performanceIndicator === "green"
                          ? "bg-green-500"
                          : hod.performanceIndicator === "yellow"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    >
                      {hod.performanceIndicator === "green" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : hod.performanceIndicator === "yellow" ? (
                        <AlertCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <XCircle className="h-3 w-3 mr-1" />
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <p className="text-muted-foreground">Activity Score</p>
                      <p className="font-semibold">{hod.activityScore}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Pending Actions</p>
                      <p className="font-semibold text-warning">{hod.pendingActions}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Events Created</p>
                      <p className="font-semibold">{hod.eventsCreated}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Approvals</p>
                      <p className="font-semibold">{hod.approvalsCount}</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">Alumni Interactions</p>
                    <p className="text-sm font-semibold">{hod.alumniInteractions}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Staff Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Staff Registration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Count" },
              }}
              className="h-[200px] sm:h-[250px]"
            >
              <RechartsPieChart>
                <Pie
                  data={staffStatusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {staffStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltipContent />} />
              </RechartsPieChart>
            </ChartContainer>
            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span>Registered: {data.staff.registered}</span>
                <span>Unregistered: {data.staff.unregistered}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Active vs Inactive Staff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                value: { label: "Count" },
              }}
              className="h-[200px] sm:h-[250px]"
            >
              <RechartsPieChart>
                <Pie
                  data={activeInactiveData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                >
                  {activeInactiveData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltipContent />} />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Staff Engagement Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Event Participation</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">
                  {data.staff.eventParticipation}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Initiatives Created</p>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">
                  {data.staff.initiativesCreated}
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Approval Response Rate</p>
                <p className="text-xl sm:text-2xl font-bold text-green-700">
                  {data.staff.approvalResponseRate}%
                </p>
              </div>
              <div className="p-3 sm:p-4 bg-amber-50 rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">Avg. Monthly Engagement</p>
                <p className="text-xl sm:text-2xl font-bold text-amber-700">
                  {data.staff.monthlyEngagement.length > 0
                    ? Math.round(
                        data.staff.monthlyEngagement.reduce(
                          (sum, item) => sum + item.engagement,
                          0
                        ) / data.staff.monthlyEngagement.length
                      )
                    : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg font-semibold">
              Monthly Staff Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                engagement: { label: "Engagement", color: COLORS.info },
              }}
              className="h-[200px] sm:h-[250px]"
            >
              <LineChart data={data.staff.monthlyEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke={COLORS.info}
                  strokeWidth={2}
                  name="Engagement"
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Section 5: Reports Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              Reports & Analytics
            </CardTitle>
            <Button onClick={handleDownloadReport} className="gap-2 w-full sm:w-auto">
              <Download className="h-4 w-4" />
              Download PDF Report
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">Department Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-blue-700">+12%</p>
                <p className="text-xs text-muted-foreground mt-1">Last 6 months</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">HOD Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-green-700">85%</p>
                <p className="text-xs text-muted-foreground mt-1">Average score</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="text-xs sm:text-sm font-medium">Staff Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl sm:text-2xl font-bold text-purple-700">78%</p>
                <p className="text-xs text-muted-foreground mt-1">Average engagement</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Section 6: Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 sm:space-y-3">
            {data.alerts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No alerts at this time
              </p>
            ) : (
              data.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`p-3 sm:p-4 rounded-lg border-l-4 ${
                    alert.priority === "high"
                      ? "bg-red-50 border-red-500"
                      : alert.priority === "medium"
                      ? "bg-yellow-50 border-yellow-500"
                      : "bg-blue-50 border-blue-500"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <Badge
                          variant={
                            alert.priority === "high"
                              ? "destructive"
                              : alert.priority === "medium"
                              ? "secondary"
                              : "default"
                          }
                          className="text-xs"
                        >
                          {alert.priority}
                        </Badge>
                        {alert.department && (
                          <Badge variant="outline" className="text-xs">
                            {alert.department}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm font-medium break-words">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <AlertCircle
                      className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 mt-1 ${
                        alert.priority === "high"
                          ? "text-red-500"
                          : alert.priority === "medium"
                          ? "text-yellow-500"
                          : "text-blue-500"
                      }`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

