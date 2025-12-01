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
import { DollarSign, TrendingUp, CreditCard, CheckCircle, Users, Calendar, ShoppingBag, Tag } from "lucide-react";
import { PIE_CHART_COLORS, COLORS } from "./chartConstants";

interface DonationsAnalyticsProps {
  data: {
    total: number;
    count: number;
    average: number;
    byCampaign: Array<{ name: string; amount: number; count: number }>;
    byMethod: Array<{ method: string; count: number; amount: number }>;
    byStatus: Array<{ status: string; count: number }>;
    timeline: Array<{ month: string; amount: number; count: number }>;
  };
}

export const DonationsAnalytics = ({ data }: DonationsAnalyticsProps) => {
  // Calculate percentages for pie charts
  const statusDataWithPercent = data.byStatus.map((item) => {
    const percent = data.count > 0 ? ((item.count / data.count) * 100).toFixed(1) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  const methodDataWithPercent = data.byMethod.map((item) => {
    const totalAmount = data.byMethod.reduce((sum, m) => sum + m.amount, 0);
    const percent = totalAmount > 0 ? ((item.amount / totalAmount) * 100).toFixed(1) : "0";
    return {
      ...item,
      percent: Number(percent),
    };
  });

  // Calculate conversion rate (completed donations / total donations)
  const completedDonations = data.byStatus.find(s => s.status === "completed" || s.status === "successful")?.count || 0;
  const conversionRate = data.count > 0 ? ((completedDonations / data.count) * 100).toFixed(2) : "0.00";

  // Calculate growth (compare last month to previous month)
  const lastMonth = data.timeline.length > 0 ? data.timeline[data.timeline.length - 1] : null;
  const prevMonth = data.timeline.length > 1 ? data.timeline[data.timeline.length - 2] : null;
  const growth = lastMonth && prevMonth && prevMonth.amount > 0
    ? (((lastMonth.amount - prevMonth.amount) / prevMonth.amount) * 100).toFixed(1)
    : "0.0";

  // Format timeline data for combined chart
  const chartData = data.timeline.map(item => ({
    month: item.month,
    amount: item.amount,
    count: item.count,
    average: item.amount / (item.count || 1),
  }));

  return (
    <div className="space-y-6">
      {/* Top Section: KPI Cards - 3x2 Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Total Donations</CardTitle>
            <Users className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data.count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Donations</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              ${data.total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Revenue</p>
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
            <CreditCard className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data.byStatus.find(s => s.status === "refunded" || s.status === "failed")?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Returns</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Downloads</CardTitle>
            <ShoppingBag className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {data.count.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Downloads</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wide">Order</CardTitle>
            <CheckCircle className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {conversionRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-1 uppercase">Order</p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Conversion Rate & Order Delivered Cards */}
        <div className="space-y-6">
          {/* Conversion Rate Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-purple-600">
                {conversionRate}% Conversion Rate
              </div>
              <p className="text-sm text-muted-foreground">
                Number of conversions divided by the total visitors.
              </p>
              <div className="h-[150px] w-full">
                <AreaChart width={undefined} height={150} data={data.timeline.slice(-3).reverse()}>
                  <defs>
                    <linearGradient id="colorConversion" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={COLORS.purple}
                    fillOpacity={1}
                    fill="url(#colorConversion)"
                  />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </AreaChart>
              </div>
            </CardContent>
          </Card>

          {/* Order Delivered Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Order Delivered</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-3xl font-bold text-purple-600">
                {completedDonations.toLocaleString()} Order Delivered
              </div>
              <p className="text-sm text-muted-foreground">
                Number of conversions divided by the total visitors.
              </p>
              <div className="h-[150px] w-full">
                <BarChart width={undefined} height={150} data={data.timeline.slice(-3).reverse()}>
                  <Bar dataKey="count" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                  <XAxis dataKey="month" hide />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </BarChart>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Department Wise Monthly Sales Report */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Donation Wise Monthly Report</CardTitle>
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <div className="text-sm font-semibold text-purple-600">
                    ${data.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total Sales
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ${data.average.toFixed(2)} Average
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={{
                amount: {
                  label: "Amount",
                  formatter: (value: number) => `$${value.toLocaleString()}`,
                },
                average: {
                  label: "Average",
                  formatter: (value: number) => `$${value.toFixed(2)}`,
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
                    tickFormatter={(value) => `$${value.toLocaleString()}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
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
                                    {entry.dataKey === "amount" ? "Total Sales" : "Average"}
                                  </span>
                                  <span className="font-bold text-xs">
                                    {entry.dataKey === "amount"
                                      ? `$${entry.value.toLocaleString()}`
                                      : `$${entry.value.toFixed(2)}`}
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
                      <span className="text-xs capitalize">{value === "amount" ? "Total Sales" : "Average"}</span>
                    )}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="amount"
                    fill={COLORS.purple}
                    radius={[4, 4, 0, 0]}
                    name="amount"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="average"
                    stroke={COLORS.orange}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    name="average"
                  />
                </ComposedChart>
            </ChartContainer>
            <div className="flex items-center justify-center gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span>Total Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500"></div>
                <span>Average</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Donation Satisfaction (Pie Chart) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Donation Satisfaction</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              It takes continuous effort to maintain high donation satisfaction levels Internal and external.
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
              <CardTitle className="text-xs font-medium">Total Profit</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Total Orders</CardTitle>
              <ShoppingBag className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.count.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Average Price</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.average.toFixed(0)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium">Product Sold</CardTitle>
              <Tag className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.count.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
