import { useEffect, useState, useCallback } from "react";
import {
  PointsDistributionData,
  TaskCompletionData,
  RewardClaimsData,
  DepartmentAnalyticsData,
} from "./types";
import { rewardsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Award,
  CheckCircle,
  Users,
  Download,
  BarChart3,
} from "lucide-react";
import {
  PIE_CHART_COLORS,
  COLORS,
} from "@/components/admin/analytics/chartConstants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Period = "all" | "month" | "year";

export const RewardsAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [pointsDistribution, setPointsDistribution] =
    useState<PointsDistributionData | null>(null);
  const [taskCompletion, setTaskCompletion] =
    useState<TaskCompletionData | null>(null);
  const [rewardClaims, setRewardClaims] = useState<RewardClaimsData | null>(
    null
  );
  const [departmentAnalytics, setDepartmentAnalytics] =
    useState<DepartmentAnalyticsData | null>(null);

  const getDateRange = (
    period: Period
  ): { startDate?: string; endDate?: string } => {
    const now = new Date();
    switch (period) {
      case "month": {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return {
          startDate: monthStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      }
      case "year": {
        const yearStart = new Date(now.getFullYear(), 0, 1);
        return {
          startDate: yearStart.toISOString().split("T")[0],
          endDate: now.toISOString().split("T")[0],
        };
      }
      default:
        return {};
    }
  };

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const dateRange = getDateRange(period);
      const [pointsRes, tasksRes, claimsRes, deptRes] = await Promise.all([
        rewardsAPI.getPointsDistribution(dateRange),
        rewardsAPI.getTaskCompletion(dateRange),
        rewardsAPI.getRewardClaims(dateRange),
        rewardsAPI.getDepartmentAnalytics(dateRange),
      ]);

      if (pointsRes.success && pointsRes.data) {
        setPointsDistribution(pointsRes.data as PointsDistributionData);
      }
      if (tasksRes.success && tasksRes.data) {
        setTaskCompletion(tasksRes.data as TaskCompletionData);
      }
      if (claimsRes.success && claimsRes.data) {
        setRewardClaims(claimsRes.data as RewardClaimsData);
      }
      if (deptRes.success && deptRes.data) {
        setDepartmentAnalytics(deptRes.data as DepartmentAnalyticsData);
      }
    } catch (error) {
      toast({
        title: "Unable to load analytics",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [period, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // Prepare data for charts
  const pointsByCategoryData = pointsDistribution?.byCategory || [];
  const taskCompletionByCategory = taskCompletion?.byCategory
    ? Object.entries(taskCompletion.byCategory).map(([category, data]) => ({
        category,
        ...data,
      }))
    : [];
  const claimsTimelineData = rewardClaims?.claimsOverTime || [];
  const departmentData = departmentAnalytics?.departments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
            Rewards Analytics
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Comprehensive insights into rewards performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as Period)}
          >
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="flex-shrink-0"
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="points" className="text-xs sm:text-sm">
            Points Distribution
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs sm:text-sm">
            Task Completion
          </TabsTrigger>
          <TabsTrigger value="claims" className="text-xs sm:text-sm">
            Reward Claims
          </TabsTrigger>
          <TabsTrigger value="departments" className="text-xs sm:text-sm">
            Departments
          </TabsTrigger>
        </TabsList>

        {/* Points Distribution Tab */}
        <TabsContent value="points" className="space-y-6">
          {pointsDistribution && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Points Awarded
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                      {pointsDistribution.total.totalPoints.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Activities
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-green-600">
                      {pointsDistribution.total.totalActivities.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Completed tasks
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Points per Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {Math.round(
                        pointsDistribution.total.avgPointsPerActivity
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Average</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Points by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        totalPoints: { label: "Points", color: COLORS.blue },
                      }}
                      className="h-[250px] sm:h-[300px] lg:h-[350px] w-full"
                    >
                      <BarChart
                        data={pointsByCategoryData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="category"
                          tick={{ fontSize: 10 }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          interval={0}
                          className="text-xs"
                        />
                        <YAxis
                          tick={{ fontSize: 10 }}
                          width={60}
                          className="text-xs"
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar
                          dataKey="totalPoints"
                          fill={COLORS.blue}
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Points Distribution %
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={pointsByCategoryData.reduce(
                        (acc, item, index) => ({
                          ...acc,
                          [item.category]: {
                            label: item.category,
                            color:
                              PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                          },
                        }),
                        {}
                      )}
                      className="h-[250px] sm:h-[300px] lg:h-[350px]"
                    >
                      <PieChart>
                        <Pie
                          data={pointsByCategoryData}
                          dataKey="totalPoints"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius="60%"
                          label={({ category, percent }) =>
                            `${category}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {pointsByCategoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                PIE_CHART_COLORS[
                                  index % PIE_CHART_COLORS.length
                                ]
                              }
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend wrapperStyle={{ fontSize: "12px" }} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Task Completion Tab */}
        <TabsContent value="tasks" className="space-y-6">
          {taskCompletion && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Task Completion by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pending: { label: "Pending", color: COLORS.orange },
                      in_progress: { label: "In Progress", color: COLORS.blue },
                      earned: { label: "Earned", color: COLORS.green },
                      redeemed: { label: "Redeemed", color: COLORS.purple },
                    }}
                    className="h-[300px] sm:h-[350px] lg:h-[400px] w-full"
                  >
                    <BarChart
                      data={taskCompletionByCategory}
                      margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="category"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        className="text-xs"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={60}
                        className="text-xs"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend
                        wrapperStyle={{ fontSize: "10px" }}
                        iconSize={12}
                        verticalAlign="top"
                      />
                      <Bar
                        dataKey="pending"
                        stackId="a"
                        fill={COLORS.orange}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="in_progress"
                        stackId="a"
                        fill={COLORS.blue}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="earned"
                        stackId="a"
                        fill={COLORS.green}
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="redeemed"
                        stackId="a"
                        fill={COLORS.purple}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Top Performing Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taskCompletion.topTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base">
                            {task.name}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                            <span>Completed: {task.completed}</span>
                            <span>In Progress: {task.inProgress}</span>
                            <span>Pending: {task.pending}</span>
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {task.completed}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Reward Claims Tab */}
        <TabsContent value="claims" className="space-y-6">
          {rewardClaims && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Total Claims
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                      {rewardClaims.totalClaims.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">All time</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Popular Rewards
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {rewardClaims.popularRewards
                        .slice(0, 5)
                        .map((reward, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-xs sm:text-sm"
                          >
                            <span className="truncate mr-2">{reward.name}</span>
                            <span className="font-semibold flex-shrink-0">
                              {reward.count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Claims Over Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: "Claims", color: COLORS.purple },
                    }}
                    className="h-[250px] sm:h-[300px] lg:h-[350px] w-full"
                  >
                    <AreaChart
                      data={claimsTimelineData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="month"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        className="text-xs"
                      />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        width={60}
                        className="text-xs"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke={COLORS.purple}
                        fill={COLORS.purple}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments" className="space-y-6">
          {departmentAnalytics && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Department Participation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      totalPoints: { label: "Points", color: COLORS.blue },
                      uniqueUsers: { label: "Users", color: COLORS.green },
                    }}
                    className="h-[300px] sm:h-[350px] lg:h-[400px] w-full"
                  >
                    <BarChart
                      data={departmentData}
                      margin={{ top: 10, right: 10, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="department"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        className="text-xs"
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 10 }}
                        width={60}
                        className="text-xs"
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 10 }}
                        width={60}
                        className="text-xs"
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend
                        wrapperStyle={{ fontSize: "10px" }}
                        iconSize={12}
                        verticalAlign="top"
                      />
                      <Bar
                        yAxisId="left"
                        dataKey="totalPoints"
                        fill={COLORS.blue}
                        name="Total Points"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="uniqueUsers"
                        fill={COLORS.green}
                        name="Unique Users"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg">
                    Department Leaderboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentData.map((dept, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border rounded-lg gap-3"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-sm sm:text-base">
                            {dept.department}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-gray-600">
                            <span>{dept.uniqueUsers} users</span>
                            <span>{dept.completedTasks} completed</span>
                            <span>{dept.totalActivities} activities</span>
                          </div>
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {dept.totalPoints.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
