import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { format } from "date-fns";

interface Donation {
  _id: string;
  amount: number;
  currency: string;
  paymentStatus: string;
  paymentMethod: string;
  donationType: string;
  campaignId?: {
    _id: string;
    title: string;
  };
  campaign?: string;
  createdAt: string;
  paidAt?: string;
  message?: string;
}

interface DonationsSectionProps {
  donations: Donation[];
  engagementMetrics?: {
    totalDonated: number;
    donationCount: number;
    lastDonationDate: string | null;
  };
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

export const DonationsSection = ({ donations, engagementMetrics }: DonationsSectionProps) => {
  // Filter completed/successful donations
  const completedDonations = donations.filter(
    (d) => d.paymentStatus === "completed" || d.paymentStatus === "successful"
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalDonated = completedDonations.reduce((sum, d) => sum + d.amount, 0);
    const totalCount = completedDonations.length;
    const averageDonation = totalCount > 0 ? totalDonated / totalCount : 0;
    const lastDonation = completedDonations.length > 0 
      ? completedDonations[0].createdAt 
      : null;

    return {
      totalDonated,
      totalCount,
      averageDonation,
      lastDonation,
    };
  }, [completedDonations]);

  // Prepare donation timeline data (last 12 months)
  const timelineData = useMemo(() => {
    const months: Record<string, { month: string; amount: number; count: number }> = {};
    const now = new Date();
    
    // Initialize last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = format(date, "MMM yyyy");
      months[key] = { month: key, amount: 0, count: 0 };
    }

    // Aggregate donations by month
    completedDonations.forEach((donation) => {
      const date = new Date(donation.createdAt);
      const key = format(date, "MMM yyyy");
      if (months[key]) {
        months[key].amount += donation.amount;
        months[key].count += 1;
      }
    });

    return Object.values(months);
  }, [completedDonations]);

  // Prepare campaign breakdown data
  const campaignData = useMemo(() => {
    const campaignMap: Record<string, { name: string; amount: number; count: number }> = {};
    
    completedDonations.forEach((donation) => {
      const campaignName = donation.campaignId?.title || donation.campaign || "General";
      if (!campaignMap[campaignName]) {
        campaignMap[campaignName] = { name: campaignName, amount: 0, count: 0 };
      }
      campaignMap[campaignName].amount += donation.amount;
      campaignMap[campaignName].count += 1;
    });

    return Object.values(campaignMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [completedDonations]);

  // Prepare payment method data
  const paymentMethodData = useMemo(() => {
    const methodMap: Record<string, number> = {};
    
    completedDonations.forEach((donation) => {
      const method = donation.paymentMethod || "Other";
      methodMap[method] = (methodMap[method] || 0) + donation.amount;
    });

    return Object.entries(methodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [completedDonations]);

  // Prepare status breakdown
  const statusData = useMemo(() => {
    const statusMap: Record<string, number> = {};
    donations.forEach((donation) => {
      const status = donation.paymentStatus || "pending";
      statusMap[status] = (statusMap[status] || 0) + 1;
    });
    return Object.entries(statusMap).map(([status, count]) => ({
      status: status.charAt(0).toUpperCase() + status.slice(1),
      count,
    }));
  }, [donations]);

  const formatCurrency = (amount: number, currency: string = "INR") => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      case "completed":
      case "successful":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "refunded":
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-600">
            Refunded
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

  if (donations.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No donation history available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Donated Card */}
        <Card className="border-l-4 border-l-blue-500 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatCurrency(summaryStats.totalDonated)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Lifetime giving
            </p>
          </CardContent>
        </Card>

        {/* Total Donations Card */}
        <Card className="border-l-4 border-l-green-500 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {summaryStats.totalCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summaryStats.totalCount === 1 ? "Donation" : "Donations"}
            </p>
          </CardContent>
        </Card>

        {/* Average Donation Card */}
        <Card className="border-l-4 border-l-orange-500 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
            <CreditCard className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {formatCurrency(summaryStats.averageDonation)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per donation
            </p>
          </CardContent>
        </Card>

        {/* Last Donation Card */}
        <Card className="border-l-4 border-l-purple-500 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Donation</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {summaryStats.lastDonation ? formatDate(summaryStats.lastDonation) : "Never"}
            </div>
            {summaryStats.lastDonation && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(
                  (new Date().getTime() - new Date(summaryStats.lastDonation).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donation Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Timeline</CardTitle>
            <p className="text-sm text-muted-foreground">Last 12 months</p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: { label: "Amount", color: COLORS.blue },
                count: { label: "Count", color: COLORS.green },
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
                                <div key={idx} className="flex items-center justify-between gap-4">
                                  <span className="text-sm text-muted-foreground">
                                    {entry.name === "amount" ? "Amount" : "Count"}
                                  </span>
                                  <span className="font-bold">
                                    {entry.name === "amount"
                                      ? formatCurrency(entry.value)
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
                    dataKey="amount"
                    stroke={COLORS.blue}
                    strokeWidth={2}
                    name="Amount"
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.green}
                    strokeWidth={2}
                    name="Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Campaign Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">By campaign</p>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={campaignData.reduce(
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
                <BarChart data={campaignData} layout="vertical">
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
                              <span className="text-sm font-medium">{data.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Amount: {formatCurrency(data.amount)}
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
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                    {campaignData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_CHART_COLORS[index % PIE_CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method & Status Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Method Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Method Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={paymentMethodData.reduce(
                (acc, item, index) => ({
                  ...acc,
                  [item.name]: {
                    label: item.name,
                    color: PIE_CHART_COLORS[index % PIE_CHART_COLORS.length],
                  },
                }),
                {}
              )}
              className="h-[200px] sm:h-[250px]"
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
                              <span className="text-sm font-medium">{data.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(data.value)}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentMethodData.map((entry, index) => (
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

        {/* Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Donation Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={statusData.reduce(
                (acc, item) => ({
                  ...acc,
                  [item.status]: {
                    label: item.status,
                    color:
                      item.status === "Completed" || item.status === "Successful"
                        ? COLORS.green
                        : item.status === "Pending"
                        ? COLORS.orange
                        : COLORS.red,
                  },
                }),
                {}
              )}
              className="h-[200px] sm:h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium">{data.status}</span>
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
                          entry.status === "Completed" || entry.status === "Successful"
                            ? COLORS.green
                            : entry.status === "Pending"
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

      {/* Donation History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Donation History</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent donations ({donations.length} total)
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Campaign
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">
                      Method
                    </th>
                    <th className="text-left py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {donations.slice(0, 10).map((donation) => (
                    <tr key={donation._id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {formatDate(donation.createdAt)}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        <div className="max-w-[150px] sm:max-w-none truncate">
                          {donation.campaignId?.title || donation.campaign || "General"}
                        </div>
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm font-medium">
                        {formatCurrency(donation.amount, donation.currency)}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-muted-foreground hidden sm:table-cell">
                        {donation.paymentMethod}
                      </td>
                      <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                        {getStatusBadge(donation.paymentStatus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {donations.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No donations found
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

