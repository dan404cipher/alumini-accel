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
  CartesianGrid,
} from "recharts";
import { UsersRound, MessageSquare, Users } from "lucide-react";
import { PIE_CHART_COLORS } from "./chartConstants";

interface CommunityAnalyticsProps {
  data: {
    totalPosts: number;
    totalMembers: number;
    byType: Array<{ type: string; count: number }>;
  };
}

export const CommunityAnalytics = ({ data }: CommunityAnalyticsProps) => {
  // Calculate percentages for pie chart
  const totalCommunities = data.byType.reduce((sum, item) => sum + item.count, 0);
  const typeDataWithPercent = data.byType.map((item) => {
    const percent = totalCommunities > 0 ? ((item.count / totalCommunities) * 100).toFixed(0) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UsersRound className="h-5 w-5 text-primary" />
          <CardTitle>Community Analytics</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                {data.totalPosts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All communities</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                {data.totalMembers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Active members</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Communities</CardTitle>
              <UsersRound className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {totalCommunities}
              </div>
              <p className="text-xs text-muted-foreground mt-1">All types</p>
            </CardContent>
          </Card>
        </div>

        {/* Communities by Type - Bar Chart */}
        {data.byType.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Communities by Type</h3>
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
        )}
      </CardContent>
    </Card>
  );
};
