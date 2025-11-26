import { useEffect, useState } from "react";
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
  Calendar,
  User,
} from "lucide-react";
import { PIE_CHART_COLORS, COLORS } from "@/components/admin/analytics/chartConstants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlumniActivityData } from "./types";

type Period = "all" | "month" | "year";

export const RewardsAnalytics: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");
  const [pointsDistribution, setPointsDistribution] = useState<PointsDistributionData | null>(null);
  const [taskCompletion, setTaskCompletion] = useState<TaskCompletionData | null>(null);
  const [rewardClaims, setRewardClaims] = useState<RewardClaimsData | null>(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState<DepartmentAnalyticsData | null>(null);
  const [userActivity, setUserActivity] = useState<AlumniActivityData | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const getDateRange = (period: Period): { startDate?: string; endDate?: string } => {
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

  const fetchAnalytics = async () => {
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
  };

  const fetchUserActivity = async () => {
    if (!selectedUserId.trim()) return;
    try {
      const dateRange = getDateRange(period);
      const res = await rewardsAPI.getAlumniActivity(selectedUserId, dateRange);
      if (res.success && res.data) {
        setUserActivity(res.data as AlumniActivityData);
      }
    } catch (error) {
      toast({
        title: "Unable to load user activity",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  useEffect(() => {
    if (selectedUserId) {
      fetchUserActivity();
    }
  }, [selectedUserId, period]);

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rewards Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into rewards performance and engagement
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="points" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="points">Points Distribution</TabsTrigger>
          <TabsTrigger value="tasks">Task Completion</TabsTrigger>
          <TabsTrigger value="claims">Reward Claims</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="activity">User Activity</TabsTrigger>
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
                    <div className="text-3xl font-bold text-blue-600">
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
                    <div className="text-3xl font-bold text-green-600">
                      {pointsDistribution.total.totalActivities.toLocaleString()}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Completed tasks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Avg Points per Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {Math.round(pointsDistribution.total.avgPointsPerActivity)}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Average</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Points by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={{
                        totalPoints: { label: "Points", color: COLORS.blue },
                      }}
                      className="h-[350px]"
                    >
                      <BarChart data={pointsByCategoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="totalPoints" fill={COLORS.blue} />
                      </BarChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Points Distribution %</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer
                      config={pointsByCategoryData.reduce(
                        (acc, item, index) => ({
                          ...acc,
                          [item.category]: {
                            label: item.category,
                            color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                          },
                        }),
                        {}
                      )}
                      className="h-[350px]"
                    >
                      <PieChart>
                        <Pie
                          data={pointsByCategoryData}
                          dataKey="totalPoints"
                          nameKey="category"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {pointsByCategoryData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
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
                  <CardTitle>Task Completion by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      pending: { label: "Pending", color: COLORS.orange },
                      in_progress: { label: "In Progress", color: COLORS.blue },
                      earned: { label: "Earned", color: COLORS.green },
                      redeemed: { label: "Redeemed", color: COLORS.purple },
                    }}
                    className="h-[400px]"
                  >
                    <BarChart data={taskCompletionByCategory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="pending" stackId="a" fill={COLORS.orange} />
                      <Bar dataKey="in_progress" stackId="a" fill={COLORS.blue} />
                      <Bar dataKey="earned" stackId="a" fill={COLORS.green} />
                      <Bar dataKey="redeemed" stackId="a" fill={COLORS.purple} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {taskCompletion.topTasks.map((task, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{task.name}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>Completed: {task.completed}</span>
                            <span>In Progress: {task.inProgress}</span>
                            <span>Pending: {task.pending}</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
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
                    <div className="text-3xl font-bold text-purple-600">
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
                      {rewardClaims.popularRewards.slice(0, 5).map((reward, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between text-sm"
                        >
                          <span>{reward.name}</span>
                          <span className="font-semibold">{reward.count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Claims Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      count: { label: "Claims", color: COLORS.purple },
                    }}
                    className="h-[350px]"
                  >
                    <AreaChart data={claimsTimelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
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
                  <CardTitle>Department Participation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      totalPoints: { label: "Points", color: COLORS.blue },
                      uniqueUsers: { label: "Users", color: COLORS.green },
                    }}
                    className="h-[400px]"
                  >
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="department" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar
                        yAxisId="left"
                        dataKey="totalPoints"
                        fill={COLORS.blue}
                        name="Total Points"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="uniqueUsers"
                        fill={COLORS.green}
                        name="Unique Users"
                      />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Department Leaderboard</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentData.map((dept, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{dept.department}</h4>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>{dept.uniqueUsers} users</span>
                            <span>{dept.completedTasks} completed</span>
                            <span>{dept.totalActivities} activities</span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
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

        {/* User Activity History Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity History</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                View individual user timelines, points earned, and badges earned
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter User ID to view activity..."
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={fetchUserActivity} disabled={!selectedUserId.trim()}>
                  <User className="w-4 h-4 mr-2" />
                  Load Activity
                </Button>
              </div>

              {userActivity && (
                <div className="space-y-6">
                  {/* Points Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Points Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          points: { label: "Points", color: COLORS.blue },
                          count: { label: "Activities", color: COLORS.green },
                        }}
                        className="h-[300px]"
                      >
                        <AreaChart data={userActivity.pointsTimeline}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Legend />
                          <Area
                            yAxisId="left"
                            type="monotone"
                            dataKey="points"
                            stroke={COLORS.blue}
                            fill={COLORS.blue}
                            fillOpacity={0.6}
                            name="Points"
                          />
                          <Area
                            yAxisId="right"
                            type="monotone"
                            dataKey="count"
                            stroke={COLORS.green}
                            fill={COLORS.green}
                            fillOpacity={0.6}
                            name="Activities"
                          />
                        </AreaChart>
                      </ChartContainer>
                    </CardContent>
                  </Card>

                  {/* Category Breakdown */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Points by Category</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userActivity.categoryBreakdown.map((category, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <h4 className="font-semibold">{category.category}</h4>
                              <p className="text-sm text-gray-600">{category.count} activities</p>
                            </div>
                            <div className="text-xl font-bold text-blue-600">
                              {category.totalPoints.toLocaleString()} pts
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Timeline */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Activity Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userActivity.activities.map((activity, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-4 p-4 border rounded-lg"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Award className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{activity.reward?.name || "Reward"}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Status: {activity.status.replace("_", " ")}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span>
                                  Progress: {activity.progressValue}/{activity.progressTarget}
                                </span>
                                {activity.pointsAwarded && (
                                  <span className="font-semibold text-green-600">
                                    +{activity.pointsAwarded} pts
                                  </span>
                                )}
                                {activity.earnedAt && (
                                  <span>
                                    {new Date(activity.earnedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {!userActivity && selectedUserId && (
                <div className="text-center py-12 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Enter a User ID and click "Load Activity" to view their history</p>
                </div>
              )}

              {!selectedUserId && (
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>Enter a User ID to view their activity history</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

