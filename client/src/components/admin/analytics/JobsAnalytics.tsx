import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  CartesianGrid,
} from "recharts";
import { Briefcase, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { PIE_CHART_COLORS } from "./chartConstants";

interface JobsAnalyticsProps {
  data: {
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
    pending: number;
  };
}

export const JobsAnalytics = ({ data }: JobsAnalyticsProps) => {
  // Calculate summary statistics
  const totalJobs = data.byStatus.reduce((sum, item) => sum + item.count, 0);
  const activeJobs =
    data.byStatus.find((item) => item.status === "active")?.count || 0;
  const closedJobs =
    data.byStatus.find((item) => item.status === "closed")?.count || 0;

  // Calculate percentages for pie chart
  const statusDataWithPercent = data.byStatus.map((item) => {
    const percent = totalJobs > 0 ? ((item.count / totalJobs) * 100).toFixed(0) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  // Calculate percentages for type chart
  const typeDataWithPercent = data.byType.map((item) => {
    const percent = totalJobs > 0 ? ((item.count / totalJobs) * 100).toFixed(0) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" />
          <CardTitle>Jobs Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
              <Briefcase className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{totalJobs}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {activeJobs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently open</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {data.pending}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed Jobs</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {closedJobs}
              </div>
              <p className="text-xs text-muted-foreground mt-1">No longer active</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Jobs by Status - Pie Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Jobs by Status</h3>
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                },
              }}
              className="h-[250px] sm:h-[300px] lg:h-[350px]"
            >
              <PieChart>
                  <Pie
                    data={statusDataWithPercent}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius="60%"
                    innerRadius="0%"
                    paddingAngle={2}
                    label={({ status, percent }) => `${status} ${percent}%`}
                    labelLine={false}
                  >
                    {statusDataWithPercent.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-xs sm:text-sm capitalize">{value}</span>
                    )}
                  />
                </PieChart>
            </ChartContainer>
          </div>

          {/* Jobs by Type - Bar Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Jobs by Type</h3>
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                },
              }}
              className="h-[250px] sm:h-[300px] lg:h-[350px]"
            >
              <BarChart data={typeDataWithPercent}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="type"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    className="text-xs"
                    tick={{ fontSize: 10 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill={PIE_CHART_COLORS[5]}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
            </ChartContainer>
          </div>
        </div>

        {/* Jobs Timeline - Line Chart */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Jobs Posted Timeline (Last 12 Months)</h3>
          <ChartContainer
            config={{
              count: {
                label: "Jobs",
              },
            }}
            className="h-[250px] sm:h-[300px] lg:h-[350px]"
          >
            <LineChart data={data.timeline}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  className="text-xs"
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={PIE_CHART_COLORS[5]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
};
