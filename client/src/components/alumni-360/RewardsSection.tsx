import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Award,
  Trophy,
  Star,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Gift,
} from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { format } from "date-fns";
import { TierInfo, Badge as BadgeType, RewardActivity } from "@/components/rewards/types";
import { getImageUrl } from "@/lib/api";

interface RewardsSectionProps {
  tierInfo?: TierInfo;
  badges?: BadgeType[];
  activities?: RewardActivity[];
  summary?: {
    totalRewards: number;
    earnedRewards: number;
    redeemedRewards: number;
    pendingRewards: number;
    totalPoints: number;
  };
}

const COLORS = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
};

const PIE_CHART_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.orange,
  COLORS.purple,
  COLORS.teal,
  COLORS.pink,
];

const getTierColor = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "bronze":
      return COLORS.bronze;
    case "silver":
      return COLORS.silver;
    case "gold":
      return COLORS.gold;
    case "platinum":
      return COLORS.platinum;
    default:
      return COLORS.blue;
  }
};

const getTierIcon = (tier: string) => {
  switch (tier?.toLowerCase()) {
    case "bronze":
      return "🥉";
    case "silver":
      return "🥈";
    case "gold":
      return "🥇";
    case "platinum":
      return "💎";
    default:
      return "⭐";
  }
};

export const RewardsSection = ({
  tierInfo,
  badges = [],
  activities = [],
  summary,
}: RewardsSectionProps) => {
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPoints = tierInfo?.totalPoints || summary?.totalPoints || 0;
    const earnedCount = activities.filter(
      (a) => a.status === "earned" || a.status === "redeemed"
    ).length;
    const redeemedCount = activities.filter(
      (a) => a.status === "redeemed"
    ).length;
    const pendingCount = activities.filter(
      (a) => a.status === "pending" || a.status === "in_progress"
    ).length;
    const totalPointsEarned = activities
      .filter((a) => a.pointsAwarded && a.pointsAwarded > 0)
      .reduce((sum, a) => sum + (a.pointsAwarded || 0), 0);

    return {
      totalPoints,
      totalPointsEarned,
      earnedCount,
      redeemedCount,
      pendingCount,
      badgesCount: badges.length,
    };
  }, [tierInfo, badges, activities, summary]);

  // Prepare activity timeline data (last 12 months)
  const timelineData = useMemo(() => {
    const months: Record<
      string,
      { month: string; points: number; count: number }
    > = {};
    const now = new Date();

    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, "MMM yyyy");
      months[key] = { month: key, points: 0, count: 0 };
    }

    // Aggregate activities by month
    activities.forEach((activity) => {
      if (activity.earnedAt && activity.pointsAwarded) {
        const date = new Date(activity.earnedAt);
        const key = format(date, "MMM yyyy");
        if (months[key]) {
          months[key].points += activity.pointsAwarded || 0;
          months[key].count += 1;
        }
      }
    });

    return Object.values(months);
  }, [activities]);

  // Prepare status breakdown
  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    activities.forEach((activity) => {
      const status = activity.status || "pending";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([status, count]) => ({
      status:
        status.charAt(0).toUpperCase() +
        status.slice(1).replace("_", " "),
      count,
    }));
  }, [activities]);

  // Prepare category breakdown
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, { points: number; count: number }> = {};
    activities.forEach((activity) => {
      const category = activity.reward?.category || "Other";
      if (!categoryMap[category]) {
        categoryMap[category] = { points: 0, count: 0 };
      }
      categoryMap[category].points += activity.pointsAwarded || 0;
      categoryMap[category].count += 1;
    });

    return Object.entries(categoryMap)
      .map(([name, data]) => ({
        name,
        points: data.points,
        count: data.count,
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 6);
  }, [activities]);

  // Prepare badge category breakdown
  const badgeCategoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    badges.forEach((badge) => {
      const category = badge.category || "Other";
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [badges]);

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    switch (statusLower) {
      case "earned":
      case "redeemed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            {statusLower === "redeemed" ? "Redeemed" : "Earned"}
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            In Progress
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
          </Badge>
        );
    }
  };

  if (!tierInfo && activities.length === 0 && badges.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              No rewards data available for this alumni
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tier Card */}
        {tierInfo && (
          <Card
            className="border-l-4"
            style={{ borderLeftColor: getTierColor(tierInfo.currentTier) }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
              <Trophy
                className="h-4 w-4"
                style={{ color: getTierColor(tierInfo.currentTier) }}
              />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getTierIcon(tierInfo.currentTier)}</span>
                <div>
                  <div className="text-2xl font-bold capitalize">
                    {tierInfo.currentTier}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tierInfo.pointsToNextTier > 0
                      ? `${tierInfo.pointsToNextTier} pts to ${tierInfo.nextTier}`
                      : "Max tier achieved"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Total Points Card */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {summaryStats.totalPoints.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime points
            </p>
          </CardContent>
        </Card>

        {/* Badges Card */}
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Badges Earned</CardTitle>
            <Award className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {summaryStats.badgesCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.badgesCount === 1 ? "Badge" : "Badges"}
            </p>
          </CardContent>
        </Card>

        {/* Rewards Earned Card */}
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
            <Gift className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summaryStats.earnedCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.redeemedCount} redeemed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {activities.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Activity Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Points Timeline</CardTitle>
              <p className="text-sm text-muted-foreground">Last 12 months</p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  points: { label: "Points", color: COLORS.blue },
                  count: { label: "Activities", color: COLORS.green },
                }}
                className="h-[250px] sm:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="grid gap-2">
                                {payload.map((entry: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between gap-4"
                                  >
                                    <span className="text-sm text-muted-foreground">
                                      {entry.name === "points"
                                        ? "Points"
                                        : "Activities"}
                                    </span>
                                    <span className="font-bold">
                                      {entry.name === "points"
                                        ? entry.value.toLocaleString()
                                        : entry.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="points"
                      stroke={COLORS.blue}
                      strokeWidth={2}
                      name="Points"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={COLORS.green}
                      strokeWidth={2}
                      name="Activities"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Status</CardTitle>
              <p className="text-sm text-muted-foreground">By status</p>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={statusData.reduce(
                  (acc, item) => ({
                    ...acc,
                    [item.status]: {
                      label: item.status,
                      color:
                        item.status === "Earned" || item.status === "Redeemed"
                          ? COLORS.green
                          : item.status === "Pending" ||
                            item.status === "In Progress"
                          ? COLORS.orange
                          : COLORS.red,
                    },
                  }),
                  {}
                )}
                className="h-[250px] sm:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fontSize: 10 }}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium">
                                  {data.status}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  Count: {data.count}
                                </span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.status === "Earned" ||
                            entry.status === "Redeemed"
                              ? COLORS.green
                              : entry.status === "Pending" ||
                                entry.status === "In Progress"
                              ? COLORS.orange
                              : COLORS.red
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown & Badge Distribution */}
      {(categoryData.length > 0 || badgeCategoryData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          {categoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Points by Category</CardTitle>
                <p className="text-sm text-muted-foreground">Top categories</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={categoryData.reduce(
                    (acc, item, index) => ({
                      ...acc,
                      [item.name]: {
                        label: item.name,
                        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                      },
                    }),
                    {}
                  )}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 10 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 10 }}
                      />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium">
                                    {data.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Points: {data.points.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    Activities: {data.count}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}

          {/* Badge Category Distribution */}
          {badgeCategoryData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Badge Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">By category</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={badgeCategoryData.reduce(
                    (acc, item, index) => ({
                      ...acc,
                      [item.name]: {
                        label: item.name,
                        color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                      },
                    }),
                    {}
                  )}
                  className="h-[250px] sm:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm">
                                <div className="flex flex-col gap-1">
                                  <span className="text-sm font-medium">
                                    {data.name}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {data.value} {data.value === 1 ? "badge" : "badges"}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={badgeCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius="60%"
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {badgeCategoryData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Badges Grid */}
      {badges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earned Badges</CardTitle>
            <p className="text-sm text-muted-foreground">
              {badges.length} {badges.length === 1 ? "badge" : "badges"} earned
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge._id}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl mb-2 overflow-hidden"
                    style={{
                      backgroundColor: `${badge.color || COLORS.blue}20`,
                      color: badge.color || COLORS.blue,
                    }}
                  >
                    {badge.icon &&
                    (badge.icon.startsWith("/") || badge.icon.startsWith("http")) ? (
                      <img
                        src={getImageUrl(badge.icon)}
                        alt={badge.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.textContent = "🏅";
                        }}
                      />
                    ) : (
                      badge.icon || "🏅"
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-center truncate w-full">
                    {badge.name}
                  </p>
                  {badge.isRare && (
                    <Badge variant="outline" className="mt-1 text-xs">
                      Rare
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activities Table */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <p className="text-sm text-muted-foreground">
              Recent reward activities ({activities.length} total)
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="inline-block min-w-full align-middle">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                        Reward
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                        Progress
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                        Points
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">
                        Earned
                      </th>
                      <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.slice(0, 10).map((activity) => (
                      <tr
                        key={activity._id}
                        className="border-b hover:bg-muted/50"
                      >
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                          <div className="max-w-[150px] sm:max-w-none truncate">
                            {activity.reward?.name || "Unknown Reward"}
                          </div>
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                          {activity.progressValue} / {activity.progressTarget}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                          {activity.pointsAwarded || 0}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                          {activity.earnedAt ? formatDate(activity.earnedAt) : "N/A"}
                        </td>
                        <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                          {getStatusBadge(activity.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {activities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No activities found
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

