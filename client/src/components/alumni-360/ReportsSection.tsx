import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Activity, TrendingUp, MessageSquare, AlertCircle } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { alumni360API } from "@/lib/api";
import { AlumniAnalytics } from "@/types/alumni360";
import { useToast } from "@/hooks/use-toast";

interface ReportsSectionProps {
  alumniId: string;
}

const COLORS = {
  blue: "#3b82f6",
  green: "#10b981",
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#8b5cf6",
  teal: "#14b8a6",
  pink: "#ec4899",
  indigo: "#6366f1",
};

const PIE_CHART_COLORS = [
  COLORS.blue,
  COLORS.green,
  COLORS.orange,
  COLORS.purple,
  COLORS.teal,
  COLORS.pink,
];

export const ReportsSection = ({ alumniId }: ReportsSectionProps) => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AlumniAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(
    new Set()
  );

  const fetchAnalytics = useCallback(async () => {
    if (!alumniId) return;

    try {
      setLoading(true);
      const response = await alumni360API.getAlumniAnalytics(alumniId);
      if (response.success && response.data) {
        const analyticsData = response.data as AlumniAnalytics;
        setAnalytics(analyticsData);
        // Initialize all activities as selected
        const activityNames = new Set<string>(
          analyticsData.activityBreakdown.map((item) => item.name)
        );
        setSelectedActivities(activityNames);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load analytics",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Error fetching analytics:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load analytics";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [alumniId, toast]);

  useEffect(() => {
    if (alumniId) {
      fetchAnalytics();
    }
  }, [alumniId, fetchAnalytics]);

  const handleActivityToggle = (name: string) => {
    const newSelected = new Set(selectedActivities);
    if (newSelected.has(name)) {
      newSelected.delete(name);
    } else {
      newSelected.add(name);
    }
    setSelectedActivities(newSelected);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No analytics data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter activity breakdown based on selected items
  const filteredActivityBreakdown = analytics.activityBreakdown.filter((item) =>
    selectedActivities.has(item.name)
  );

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Activities Card */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Activities
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {analytics.summaryStats.totalActivities}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              All time activities
            </p>
          </CardContent>
        </Card>

        {/* Engagement Score Card */}
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Engagement Score
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {analytics.summaryStats.engagementScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Out of 100</p>
          </CardContent>
        </Card>

        {/* Active Interactions Card */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Interactions
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {analytics.summaryStats.activeInteractions}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        {/* Pending Items Card */}
        <Card className="border-l-4 border-l-red-500 bg-red-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Items</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {analytics.summaryStats.pendingItems}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Open issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <ChartContainer
                  config={analytics.activityBreakdown.reduce(
                    (acc, item, index) => ({
                      ...acc,
                      [item.name]: {
                        label: item.name,
                        color:
                          PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                      },
                    }),
                    {} as Record<string, { label: string; color: string }>
                  )}
                  className="h-[200px] xs:h-[250px] sm:h-[280px] md:h-[300px] w-full"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="rounded-lg border bg-background p-2 shadow-sm text-xs sm:text-sm">
                                <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                                  <div className="flex flex-col">
                                    <span className="text-[0.65rem] sm:text-[0.70rem] uppercase text-muted-foreground">
                                      {data.name}
                                    </span>
                                    <span className="font-bold text-muted-foreground text-xs sm:text-sm">
                                      {data.count}
                                    </span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[0.65rem] sm:text-[0.70rem] uppercase text-muted-foreground">
                                      Percentage
                                    </span>
                                    <span className="font-bold text-xs sm:text-sm">
                                      {data.value}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Pie
                        data={filteredActivityBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={false}
                        outerRadius="60%"
                        innerRadius="0%"
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {filteredActivityBreakdown.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]
                            }
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </div>
              <div className="w-full lg:w-48 space-y-2">
                <div className="text-sm font-medium mb-3">Activity Type</div>
                <div className="max-h-[200px] sm:max-h-[300px] overflow-y-auto pr-2">
                  {analytics.activityBreakdown.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center space-x-2 py-1"
                    >
                      <Checkbox
                        id={`activity-${item.name}`}
                        checked={selectedActivities.has(item.name)}
                        onCheckedChange={() => handleActivityToggle(item.name)}
                        className="flex-shrink-0"
                      />
                      <label
                        htmlFor={`activity-${item.name}`}
                        className="text-xs sm:text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 truncate"
                      >
                        {item.name}
                      </label>
                      <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                        ({item.count})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engagement Status Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Engagement Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={analytics.engagementStatus.reduce(
                (acc, item) => ({
                  ...acc,
                  [item.status]: {
                    label: item.status,
                    color:
                      item.status === "High Engagement"
                        ? COLORS.green
                        : item.status === "Medium Engagement"
                        ? COLORS.blue
                        : item.status === "Low Engagement"
                        ? COLORS.orange
                        : COLORS.red,
                  },
                }),
                {} as Record<string, { label: string; color: string }>
              )}
              className="h-[250px] sm:h-[300px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.engagementStatus}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <XAxis type="number" />
                  <YAxis
                    dataKey="status"
                    type="category"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {data.status}
                              </span>
                              <span className="font-bold">{data.count}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {analytics.engagementStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.status === "High Engagement"
                            ? COLORS.green
                            : entry.status === "Medium Engagement"
                            ? COLORS.blue
                            : entry.status === "Low Engagement"
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
    </div>
  );
};
