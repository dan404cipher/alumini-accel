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
  AreaChart,
  Area,
  CartesianGrid,
  ComposedChart,
} from "recharts";
import { Calendar, TrendingUp, CheckCircle, Clock, Users, XCircle, UsersRound } from "lucide-react";
import { PIE_CHART_COLORS, COLORS } from "./chartConstants";

interface EventsAnalyticsProps {
  data: {
    byStatus: Array<{ status: string; count: number }>;
    byType: Array<{ type: string; count: number }>;
    timeline: Array<{ month: string; count: number; registrations?: number; attendance?: number }>;
    totalRegistrations: number;
    totalCapacity: number;
    averageAttendanceRate: string;
    averageRegistrationRate: string;
  };
}

export const EventsAnalytics = ({ data }: EventsAnalyticsProps) => {
  // Calculate summary statistics
  const totalEvents = data.byStatus.reduce((sum, item) => sum + item.count, 0);
  const activeEvents =
    data.byStatus.find((item) => item.status === "active")?.count || 0;
  const completedEvents =
    data.byStatus.find((item) => item.status === "completed")?.count || 0;
  const upcomingEvents =
    data.byStatus.find((item) => item.status === "upcoming")?.count || 0;
  const cancelledEvents =
    data.byStatus.find((item) => item.status === "cancelled")?.count || 0;

  // Calculate percentages for pie chart labels
  const statusDataWithPercent = data.byStatus.map((item) => {
    const percent = totalEvents > 0 ? ((item.count / totalEvents) * 100).toFixed(1) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  // Calculate growth (compare last month to previous month)
  const lastMonth = data.timeline.length > 0 ? data.timeline[data.timeline.length - 1] : null;
  const prevMonth = data.timeline.length > 1 ? data.timeline[data.timeline.length - 2] : null;
  const growth = lastMonth && prevMonth && prevMonth.count > 0
    ? (((lastMonth.count - prevMonth.count) / prevMonth.count) * 100).toFixed(1)
    : "0.0";

  // Calculate completion rate
  const completionRate = totalEvents > 0
    ? ((completedEvents / totalEvents) * 100).toFixed(2)
    : "0.00";

  // Calculate average attendance per event
  const averageAttendance = totalEvents > 0
    ? (data.totalRegistrations / totalEvents).toFixed(0)
    : "0";

  // Find peak month
  const peakMonth = data.timeline.length > 0
    ? data.timeline.reduce((max, item) => (item.count > max.count ? item : max), data.timeline[0])
    : null;

  // Format timeline data for combined chart
  const chartData = data.timeline.map(item => ({
    month: item.month,
    count: item.count,
    registrations: item.registrations || 0,
    attendance: item.attendance || 0,
    averageAttendance: item.count > 0 ? (item.attendance || 0) / item.count : 0,
  }));

  // Get last 3 months for small charts
  const recentData = data.timeline.slice(-3).reverse();

  return (
    <div className="space-y-6">
      {/* Top Section: KPI Cards - 3x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Total Events</CardTitle>
            <Calendar className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {totalEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Events</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Total Registrations</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data.totalRegistrations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Registrations</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Growth</CardTitle>
            <TrendingUp className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {growth}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Growth</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Returns</CardTitle>
            <XCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {cancelledEvents.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Cancelled</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Downloads</CardTitle>
            <UsersRound className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data.totalRegistrations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Attendees</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Order</CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {completionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Completion Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Attendance Rate & Registration Rate Cards */}
        <div className="space-y-6">
          {/* Attendance Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-purple-600">
                {data.averageAttendanceRate}% Attendance Rate
              </div>
              <p className="text-sm text-muted-foreground">
                Number of attendees divided by total registrations.
              </p>
              <div className="h-[150px] w-full">
                <AreaChart width={undefined} height={150} data={recentData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke={COLORS.purple}
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                  />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </AreaChart>
              </div>
            </CardContent>
          </Card>

          {/* Registration Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Registration Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-purple-600">
                {data.totalRegistrations.toLocaleString()} Registrations
              </div>
              <p className="text-sm text-muted-foreground">
                Number of registrations divided by total events.
              </p>
              <div className="h-[150px] w-full">
                <BarChart width={undefined} height={150} data={recentData}>
                  <Bar dataKey="registrations" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Event Performance Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Event Wise Monthly Report</CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-semibold text-purple-600">
                    {totalEvents.toLocaleString()} Total Events
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {averageAttendance} Average Attendance
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                count: {
                  label: "Events",
                },
                averageAttendance: {
                  label: "Average Attendance",
                  formatter: (value: number) => value.toFixed(0),
                },
              }}
              className="h-[300px] sm:h-[350px] lg:h-[400px]"
            >
              <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    className="text-xs"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => value.toFixed(0)}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="space-y-1">
                              {payload.map((entry: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between gap-4">
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {entry.dataKey === "count" ? "Total Events" : "Average Attendance"}
                                  </span>
                                  <span className="font-bold text-xs">
                                    {entry.dataKey === "count"
                                      ? entry.value
                                      : entry.value.toFixed(0)}
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
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs capitalize">{value === "count" ? "Total Events" : "Average Attendance"}</span>
                    )}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    fill={COLORS.purple}
                    radius={[4, 4, 0, 0]}
                    name="count"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="averageAttendance"
                    stroke={COLORS.orange}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="averageAttendance"
                  />
                </ComposedChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span>Total Events</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span>Average Attendance</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Event Satisfaction/Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Event Satisfaction</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              It takes continuous effort to maintain high event satisfaction levels Internal and external.
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-6">
              <div className="flex-1">
                <ChartContainer
                  config={{
                    value: {
                      label: "Value",
                    },
                  }}
                  className="h-[250px] w-full"
                >
                  <PieChart>
                    <Pie
                      data={statusDataWithPercent}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius="70%"
                      innerRadius="0%"
                      paddingAngle={2}
                      label={({ percent }) => `${percent}%`}
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
                  </PieChart>
                </ChartContainer>
              </div>
              <div className="space-y-3">
                {statusDataWithPercent.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length] }}
                    ></div>
                    <span className="text-sm capitalize">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right: Additional Key Metrics - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Total Capacity</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalCapacity.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Total Registrations</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.totalRegistrations.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Average Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageAttendance}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Peak Month</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{peakMonth ? peakMonth.month : "N/A"}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
