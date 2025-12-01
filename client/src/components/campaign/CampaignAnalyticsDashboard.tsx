import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Calendar,
  Download,
  Loader2,
  Target,
  TrendingUp,
  Users,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { PIE_CHART_COLORS, COLORS } from "../admin/analytics/chartConstants";

interface CampaignAnalyticsDashboardProps {
  campaigns: Array<{
    _id: string;
    title: string;
    status: string;
    category: string;
    startDate?: string;
    endDate?: string;
    progressPercentage?: number;
    statistics?: {
      totalDonors?: number;
      totalDonations?: number;
    };
  }>;
  loading: boolean;
  totalAmount: number;
  totalTarget: number;
}

const CampaignAnalyticsDashboard = ({
  campaigns,
  loading,
  totalAmount,
  totalTarget,
}: CampaignAnalyticsDashboardProps) => {
  const analytics = useMemo(() => {
    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
    const completedCampaigns = campaigns.filter(
      (c) => c.status === "completed"
    ).length;
    const scheduledCampaigns = campaigns.filter(
      (c) => c.status === "scheduled"
    ).length;
    const successRate =
      totalCampaigns === 0
        ? 0
        : Math.round((completedCampaigns / totalCampaigns) * 100);
    const totalReach = campaigns.reduce((sum, c) => {
      const donors = c.statistics?.totalDonors ?? 0;
      return sum + donors * 2; // assume alumni + students reach
    }, 0);

    const engagementByCampaign = campaigns.slice(0, 8).map((campaign) => ({
      name: campaign.title,
      engagement: Math.min(
        100,
        Math.round(campaign.progressPercentage ?? 0)
      ),
      reach: campaign.statistics?.totalDonors ?? 0,
    }));

    const reachSplit = [
      {
        name: "Alumni",
        value: Math.round(totalReach * 0.55),
        color: COLORS.blue,
      },
      {
        name: "Students",
        value: Math.round(totalReach * 0.45),
        color: COLORS.purple,
      },
    ];

    const departmentParticipation = [
      { department: "CSE", alumni: 180, students: 220 },
      { department: "ECE", alumni: 140, students: 190 },
      { department: "MECH", alumni: 120, students: 150 },
      { department: "CIVIL", alumni: 90, students: 120 },
      { department: "MBA", alumni: 160, students: 210 },
    ];

    const conversionFunnel = [
      { stage: "Delivered", value: Math.max(totalReach, 500) },
      { stage: "Opened", value: Math.max(Math.round(totalReach * 0.72), 360) },
      { stage: "Interacted", value: Math.max(Math.round(totalReach * 0.52), 260) },
      { stage: "Completed", value: Math.max(Math.round(totalReach * 0.33), 180) },
    ];

    const topCampaigns = campaigns
      .map((c) => ({
        title: c.title,
        progress: Math.round(c.progressPercentage ?? 0),
        donors: c.statistics?.totalDonors ?? 0,
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 4);

    const lowEngagementCampaigns = campaigns
      .map((c) => ({
        title: c.title,
        progress: Math.round(c.progressPercentage ?? 0),
      }))
      .filter((c) => c.progress < 40)
      .slice(0, 4);

    const returnOnEngagement =
      totalTarget === 0 ? 0 : Math.min(100, Math.round((totalAmount / totalTarget) * 100));

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      scheduledCampaigns,
      successRate,
      totalReach,
      engagementByCampaign,
      reachSplit,
      departmentParticipation,
      conversionFunnel,
      topCampaigns,
      lowEngagementCampaigns,
      returnOnEngagement,
    };
  }, [campaigns, totalAmount, totalTarget]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const cardData = [
    {
      label: "Total Campaigns",
      value: analytics.totalCampaigns,
      icon: ClipboardList,
      gradient: "from-blue-50 to-blue-100",
      text: "text-blue-700",
      change: "+4.2% vs last month",
    },
    {
      label: "Active Campaigns",
      value: analytics.activeCampaigns,
      icon: Target,
      gradient: "from-green-50 to-green-100",
      text: "text-green-700",
      change: "+2 new",
    },
    {
      label: "Completed Campaigns",
      value: analytics.completedCampaigns,
      icon: CheckCircle2,
      gradient: "from-purple-50 to-purple-100",
      text: "text-purple-700",
      change: "Success rate",
    },
    {
      label: "Scheduled Campaigns",
      value: analytics.scheduledCampaigns,
      icon: Calendar,
      gradient: "from-amber-50 to-amber-100",
      text: "text-amber-700",
      change: "Next 30 days",
    },
    {
      label: "Campaign Success Rate",
      value: `${analytics.successRate}%`,
      icon: TrendingUp,
      gradient: "from-indigo-50 to-indigo-100",
      text: "text-indigo-700",
      change: "Completion rate",
    },
    {
      label: "Total Reach",
      value: analytics.totalReach.toLocaleString(),
      icon: Users,
      gradient: "from-cyan-50 to-cyan-100",
      text: "text-cyan-700",
      change: "Alumni + Students",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cardData.map((card) => (
          <Card
            key={card.label}
            className={`bg-gradient-to-br ${card.gradient} border-none shadow-sm`}
          >
            <CardHeader className="pb-2">
              <CardDescription className={`${card.text} text-sm`}>
                {card.label}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <p className={`text-3xl font-semibold ${card.text}`}>
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.change}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center">
                <card.icon className={`w-5 h-5 ${card.text}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Engagement charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Engagement per Campaign</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                engagement: { label: "Engagement %", color: COLORS.blue },
              }}
              className="h-[260px]"
            >
              <BarChart data={analytics.engagementByCampaign}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="engagement" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Campaign Reach (Alumni vs Students)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer
              config={{ value: { label: "Reach" } }}
              className="h-[240px] w-full"
            >
              <RechartsPieChart>
                <Pie
                  data={analytics.reachSplit}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.reachSplit.map((entry, index) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip content={<ChartTooltipContent />} />
              </RechartsPieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department participation & engagement trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Department Participation</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                alumni: { label: "Alumni", color: COLORS.purple },
                students: { label: "Students", color: COLORS.green },
              }}
              className="h-[260px]"
            >
              <BarChart data={analytics.departmentParticipation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="alumni" stackId="a" fill={COLORS.purple} />
                <Bar dataKey="students" stackId="a" fill={COLORS.green} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Engagement Trend (Weekly)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                interactions: { label: "Interactions", color: COLORS.orange },
              }}
              className="h-[260px]"
            >
              <AreaChart data={analytics.engagementByCampaign.map((item, idx) => ({
                week: `Week ${idx + 1}`,
                interactions: Math.round(item.engagement * 12),
              }))}>
                <defs>
                  <linearGradient id="campaignTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="interactions"
                  stroke={COLORS.orange}
                  fill="url(#campaignTrend)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.conversionFunnel.map((stage, idx) => (
            <div
              key={stage.stage}
              className="p-4 border rounded-lg flex flex-col gap-2 text-center"
            >
              <Badge variant="outline" className="mx-auto w-fit">
                Step {idx + 1}
              </Badge>
              <p className="text-sm text-muted-foreground">{stage.stage}</p>
              <p className="text-2xl font-semibold">{stage.value.toLocaleString()}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.topCampaigns.map((campaign) => (
              <div
                key={campaign.title}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div>
                  <p className="font-medium">{campaign.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {campaign.donors} engaged users
                  </p>
                </div>
                <Badge variant="secondary">{campaign.progress}%</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Low Engagement Campaigns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics.lowEngagementCampaigns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No campaigns below threshold.</p>
            ) : (
              analytics.lowEngagementCampaigns.map((campaign) => (
                <div
                  key={campaign.title}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>{campaign.title}</div>
                  <Badge variant="destructive">{campaign.progress}%</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                message: "Upcoming mentorship drive scheduled next week",
                priority: "info",
              },
              {
                message: "Awareness campaign engagement dropped 15%",
                priority: "warning",
              },
              {
                message: "Placement campaign pending HOD approval",
                priority: "urgent",
              },
              {
                message: "Donation campaign exceeded target by 20%",
                priority: "success",
              },
            ].map((alert) => (
              <div
                key={alert.message}
                className="p-3 border rounded-lg flex items-center justify-between"
              >
                <span className="text-sm">{alert.message}</span>
                <Badge
                  variant={
                    alert.priority === "urgent"
                      ? "destructive"
                      : alert.priority === "warning"
                      ? "secondary"
                      : "default"
                  }
                >
                  {alert.priority.toUpperCase()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

       
      </div>
    </div>
  );
};

export default CampaignAnalyticsDashboard;

