import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
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
import { Users, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { PIE_CHART_COLORS } from "./chartConstants";

interface StudentsAnalyticsProps {
  data: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
}

export const StudentsAnalytics = ({ data }: StudentsAnalyticsProps) => {
  // Calculate summary statistics
  const totalStudents = data.byStatus.reduce((sum, item) => sum + item.count, 0);
  const activeStudents =
    data.byStatus.find((item) => item.status === "active")?.count || 0;
  const pendingStudents =
    data.byStatus.find((item) => item.status === "pending")?.count || 0;
  const inactiveStudents =
    data.byStatus.find((item) => item.status === "inactive")?.count || 0;

  // Calculate percentages for pie chart
  const statusDataWithPercent = data.byStatus.map((item) => {
    const percent = totalStudents > 0 ? ((item.count / totalStudents) * 100).toFixed(0) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Students Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {activeStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {pendingStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500 bg-red-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-red-600">
                {inactiveStudents}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Inactive accounts</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students by Status - Pie Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Students by Status</h3>
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

          {/* Students Timeline - Line Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">
              Students Registration Timeline (Last 12 Months)
            </h3>
            <ChartContainer
              config={{
                count: {
                  label: "Students",
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
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={PIE_CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
