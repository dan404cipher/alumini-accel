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
import { Target, DollarSign, TrendingUp, CheckCircle } from "lucide-react";
import { PIE_CHART_COLORS } from "./chartConstants";

interface CampaignsAnalyticsProps {
  data: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number; raised: number }>;
    totalRaised: number;
  };
}

export const CampaignsAnalytics = ({ data }: CampaignsAnalyticsProps) => {
  // Calculate summary statistics
  const totalCampaigns = data.byStatus.reduce((sum, item) => sum + item.count, 0);
  const activeCampaigns =
    data.byStatus.find((item) => item.status === "active")?.count || 0;
  const completedCampaigns =
    data.byStatus.find((item) => item.status === "completed")?.count || 0;

  // Calculate percentages for pie chart
  const statusDataWithPercent = data.byStatus.map((item) => {
    const percent = totalCampaigns > 0 ? ((item.count / totalCampaigns) * 100).toFixed(0) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <CardTitle>Campaigns Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Target className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold">{totalCampaigns}</div>
              <p className="text-xs text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                ${data.totalRaised.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All campaigns</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                {activeCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Currently running</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {completedCampaigns}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Finished campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Campaigns by Status - Pie Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Campaigns by Status</h3>
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

          {/* Campaigns Timeline - Line Chart */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Campaigns Timeline (Last 12 Months)</h3>
            <ChartContainer
              config={{
                count: {
                  label: "Campaigns",
                },
                raised: {
                  label: "Raised",
                  formatter: (value: number) => `$${value.toLocaleString()}`,
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
                  <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="count"
                    stroke={PIE_CHART_COLORS[0]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Campaigns"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="raised"
                    stroke={PIE_CHART_COLORS[1]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Amount Raised"
                  />
                </LineChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
