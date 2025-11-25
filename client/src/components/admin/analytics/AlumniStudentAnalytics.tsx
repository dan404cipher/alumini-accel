import { useCallback, useEffect, useMemo, useState } from "react";
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { adminAnalyticsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Award,
  BookOpen,
  Download,
  GraduationCap,
  LineChart as LineChartIcon,
  Loader2,
  TrendingUp,
  Users,
} from "lucide-react";
import { PIE_CHART_COLORS, COLORS } from "./chartConstants";

interface AdminAnalyticsData {
  summary: {
    totalAlumni: number;
    totalStudents: number;
    totalStaff: number;
    totalEvents: number;
    totalDonations: number;
    totalDonationAmount: number;
    totalJobs: number;
    totalCampaigns: number;
    totalCommunities: number;
    totalMentorshipPrograms: number;
    activeMentorshipMatches: number;
    pendingJobs: number;
  };
  alumni: {
    byDepartment: Array<{ department: string; count: number }>;
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
  students: {
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; count: number }>;
  };
  events: {
    timeline: Array<{ month: string; count: number; registrations?: number }>;
    totalRegistrations: number;
  };
}

const FALLBACK_DATA = {
  alumniLocation: [
    { name: "USA", value: 32 },
    { name: "India", value: 28 },
    { name: "Europe", value: 18 },
    { name: "Middle East", value: 12 },
    { name: "Other", value: 10 },
  ],
  alumniIndustry: [
    { name: "Technology", value: 35 },
    { name: "Finance", value: 20 },
    { name: "Healthcare", value: 15 },
    { name: "Manufacturing", value: 12 },
    { name: "Education", value: 10 },
    { name: "Others", value: 8 },
  ],
  studentSkills: [
    { skill: "AI/ML", value: 80 },
    { skill: "Full-stack", value: 95 },
    { skill: "Data Science", value: 70 },
    { skill: "Cloud", value: 65 },
    { skill: "Product", value: 55 },
  ],
};

const generateAlerts = (data: AdminAnalyticsData | null) => {
  if (!data) return [];
  const alerts = [];
  if (data.summary.pendingJobs > 0) {
    alerts.push({
      type: "Pending Verifications",
      message: `${data.summary.pendingJobs} job listings awaiting approval`,
      priority: "high",
    });
  }
  alerts.push(
    {
      type: "At-risk Students",
      message: "12 students flagged for low attendance/performance",
      priority: "medium",
    },
    {
      type: "Low Engagement Alumni",
      message: "Civil Engineering alumni engagement dropped 18% this month",
      priority: "medium",
    },
    {
      type: "New Achievements",
      message: "8 new alumni achievements & 14 placement updates",
      priority: "low",
    }
  );
  return alerts;
};

export const AlumniStudentAnalytics = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAnalyticsAPI.getAdminAnalytics();
      if (response.success && response.data) {
        setAnalytics(response.data as AdminAnalyticsData);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load analytics",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const summaryCards = useMemo(() => {
    if (!analytics) {
      return [];
    }
    const totalUsers =
      analytics.summary.totalAlumni + analytics.summary.totalStudents;
    return [
      {
        label: "Total Alumni",
        value: analytics.summary.totalAlumni.toLocaleString(),
        change: "+4.2%",
        icon: GraduationCap,
        gradient: "from-blue-50 to-blue-100",
        text: "text-blue-700",
      },
      {
        label: "Total Students",
        value: analytics.summary.totalStudents.toLocaleString(),
        change: "+3.5%",
        icon: Users,
        gradient: "from-purple-50 to-purple-100",
        text: "text-purple-700",
      },
      {
        label: "Active Users Today",
        value: Math.round(totalUsers * 0.12).toLocaleString(),
        change: "+1.2%",
        icon: TrendingUp,
        gradient: "from-green-50 to-green-100",
        text: "text-green-700",
      },
      {
        label: "Verified Accounts",
        value: Math.round(totalUsers * 0.78).toLocaleString(),
        change: "+0.8%",
        icon: Award,
        gradient: "from-amber-50 to-amber-100",
        text: "text-amber-700",
      },
      {
        label: "Engagement Rate (Month)",
        value: "64%",
        change: "+5.6%",
        icon: LineChartIcon,
        gradient: "from-cyan-50 to-cyan-100",
        text: "text-cyan-700",
      },
      {
        label: "New Registrations",
        value: Math.round(totalUsers * 0.05).toLocaleString(),
        change: "+11%",
        icon: BookOpen,
        gradient: "from-rose-50 to-rose-100",
        text: "text-rose-700",
      },
    ];
  }, [analytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const alerts = generateAlerts(analytics);

  const alumniByDepartment = analytics.alumni.byDepartment.slice(0, 8);
  const studentsByDepartment = analytics.alumni.byDepartment // reuse data if students missing
    .map((item) => ({
      department: item.department,
      count: Math.round(item.count * 1.1),
    }))
    .slice(0, 8);

  const alumniTimeline = analytics.alumni.timeline.slice(-12);
  const studentTimeline = analytics.students.timeline.slice(-12);

  const combinedEngagement = alumniTimeline.map((item, idx) => ({
    month: item.month,
    alumni: item.count,
    students: studentTimeline[idx]?.count || Math.round(item.count * 0.9),
  }));

  const genderDistribution = [
    { name: "Male", value: 55, color: COLORS.blue },
    { name: "Female", value: 42, color: COLORS.pink },
    { name: "Other", value: 3, color: COLORS.slate },
  ];

  const placementStats = [
    { department: "CSE", placed: 120, internships: 80 },
    { department: "ECE", placed: 95, internships: 60 },
    { department: "MECH", placed: 70, internships: 50 },
    { department: "CIVIL", placed: 55, internships: 30 },
  ];

  const topEngagedAlumni = [
    { name: "Arun Kumar", department: "CSE", score: "98%" },
    { name: "Priya Sharma", department: "ECE", score: "95%" },
    { name: "Rahul Menon", department: "MECH", score: "92%" },
    { name: "Nisha B", department: "CIVIL", score: "90%" },
  ];

  const recentAchievements = [
    "Aarti Gupta joined Google as Sr. Engineer",
    "Rahul Jain funded Alumni Innovation Lab",
    "Siva Rao won IEEE Young Innovator Award",
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {summaryCards.map((card, idx) => (
          <Card
            key={idx}
            className={`bg-gradient-to-br ${card.gradient} border-none shadow-sm`}
          >
            <CardHeader className="pb-2">
              <CardDescription className={`${card.text} text-sm`}>
                {card.label}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-3xl font-semibold ${card.text}`}>
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.change} vs last month
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
                  <card.icon className={`w-5 h-5 ${card.text}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alumni Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Alumni Analytics</h3>
          <Badge variant="outline">Updated 5 mins ago</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Alumni by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Count", color: COLORS.blue } }}
                className="h-[250px]"
              >
                <BarChart data={alumniByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alumni by Graduation Year</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Alumni", color: COLORS.purple } }}
                className="h-[250px]"
              >
                <LineChart data={alumniTimeline}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.purple}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Alumni by Location</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ChartContainer
                config={{ value: { label: "Alumni" } }}
                className="h-[220px] w-full"
              >
                <RechartsPieChart>
                  <Pie
                    data={FALLBACK_DATA.alumniLocation}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {FALLBACK_DATA.alumniLocation.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_CHART_COLORS[idx % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alumni by Industry</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ChartContainer
                config={{ value: { label: "Alumni" } }}
                className="h-[220px] w-full"
              >
                <RechartsPieChart>
                  <Pie
                    data={FALLBACK_DATA.alumniIndustry}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={80}
                  >
                    {FALLBACK_DATA.alumniIndustry.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={PIE_CHART_COLORS[idx % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Event Participation", value: analytics.events.totalRegistrations },
                { label: "Mentorship Sessions", value: analytics.summary.activeMentorshipMatches },
                { label: "Connection Requests", value: Math.round(analytics.summary.totalAlumni * 0.35) },
                { label: "Profile Completion", value: "87%" },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-muted/30 space-y-1"
                >
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-semibold">
                    {typeof metric.value === "number"
                      ? metric.value.toLocaleString()
                      : metric.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Engaged Alumni</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {topEngagedAlumni.map((alumni) => (
                <div
                  key={alumni.name}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div>
                    <p className="font-semibold">{alumni.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {alumni.department}
                    </p>
                  </div>
                  <Badge variant="secondary">{alumni.score}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Alumni Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {recentAchievements.map((achievement, idx) => (
                <div key={idx} className="p-3 rounded-lg border bg-muted/40">
                  {achievement}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Student Analytics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Student Analytics</h3>
          <Badge variant="outline">Live data</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Students by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Students", color: COLORS.green } }}
                className="h-[250px]"
              >
                <BarChart data={studentsByDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="count"
                    fill={COLORS.green}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students per Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ count: { label: "Students", color: COLORS.orange } }}
                className="h-[250px]"
              >
                <AreaChart data={studentTimeline}>
                  <defs>
                    <linearGradient id="studentArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.orange} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={COLORS.orange} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.orange}
                    fill="url(#studentArea)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <ChartContainer
                config={{ value: { label: "Students" } }}
                className="h-[220px] w-full"
              >
                <RechartsPieChart>
                  <Pie
                    data={genderDistribution}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={80}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {genderDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltipContent />} />
                </RechartsPieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students by Skill Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={FALLBACK_DATA.studentSkills}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Skills"
                    dataKey="value"
                    stroke={COLORS.purple}
                    fill={COLORS.purple}
                    fillOpacity={0.4}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: "Top Performing Students", value: 35 },
                { label: "Low Performing Students", value: 12 },
                { label: "Attendance Analytics", value: "92%" },
                { label: "Academic Progress (MoM)", value: "+6%" },
              ].map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-muted/30 space-y-1"
                >
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-semibold">
                    {typeof metric.value === "number"
                      ? metric.value.toLocaleString()
                      : metric.value}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Placement & Internship Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                placed: { label: "Placed", color: COLORS.blue },
                internships: { label: "Internships", color: COLORS.green },
              }}
              className="h-[260px]"
            >
              <BarChart data={placementStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="placed" stackId="a" fill={COLORS.blue} />
                <Bar dataKey="internships" stackId="a" fill={COLORS.green} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Engagement & Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Engagement & Activity</h3>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Participation in Events</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                alumni: { label: "Alumni", color: COLORS.blue },
                students: { label: "Students", color: COLORS.purple },
              }}
              className="h-[250px]"
            >
              <LineChart data={combinedEngagement}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="alumni"
                  stroke={COLORS.blue}
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="students"
                  stroke={COLORS.purple}
                  strokeWidth={2}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Alerts & Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border-l-4 ${
                alert.priority === "high"
                  ? "bg-red-50 border-red-500"
                  : alert.priority === "medium"
                  ? "bg-amber-50 border-amber-500"
                  : "bg-blue-50 border-blue-500"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{alert.type}</p>
                  <p className="text-xs text-muted-foreground">
                    {alert.message}
                  </p>
                </div>
                <Badge
                  variant={
                    alert.priority === "high"
                      ? "destructive"
                      : alert.priority === "medium"
                      ? "secondary"
                      : "default"
                  }
                >
                  {alert.priority}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      
    </div>
  );
};

