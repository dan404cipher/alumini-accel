import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, DollarSign, Calendar, MessageSquare, Activity } from "lucide-react";
import { EngagementMetrics as EngagementMetricsType } from "@/types/alumni360";
import { format } from "date-fns";

interface EngagementMetricsProps {
  metrics: EngagementMetricsType;
}

export const EngagementMetrics = ({ metrics }: EngagementMetricsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "Never";
    return format(new Date(date), "MMM dd, yyyy");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-blue-600";
    if (score >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Engagement Metrics</h2>
      
      {/* Engagement Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Engagement Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold" style={{ color: getScoreColor(metrics.score) }}>
                {metrics.score}
              </span>
              <span className="text-muted-foreground">/ 100</span>
            </div>
            <Progress value={metrics.score} className="h-2" />
            <p className="text-sm text-muted-foreground">
              Based on donations, events, and interactions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Donations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalDonated)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.donationCount} donation{metrics.donationCount !== 1 ? "s" : ""}
            </p>
            {metrics.lastDonationDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatDate(metrics.lastDonationDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.eventsAttended}</div>
            {metrics.lastEventDate && (
              <p className="text-xs text-muted-foreground mt-1">
                Last: {formatDate(metrics.lastEventDate)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.messageCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total exchanges</p>
          </CardContent>
        </Card>

        {/* Last Interaction */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Interaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {metrics.lastInteraction ? formatDate(metrics.lastInteraction) : "Never"}
            </div>
            {metrics.lastInteraction && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(
                  (new Date().getTime() - new Date(metrics.lastInteraction).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}{" "}
                days ago
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

