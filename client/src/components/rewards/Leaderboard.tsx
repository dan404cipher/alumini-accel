import { useEffect, useState } from "react";
import { LeaderboardEntry, DepartmentLeaderboardEntry } from "./types";
import { rewardsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Users, TrendingUp, Calendar } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

export const Leaderboard: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboardType, setLeaderboardType] = useState<
    "points" | "mentors" | "donors" | "volunteers" | "departments"
  >("points");
  const [period, setPeriod] = useState<"all" | "month" | "year">("all");
  const [department, setDepartment] = useState<string>("");
  const [leaderboard, setLeaderboard] = useState<
    LeaderboardEntry[] | DepartmentLeaderboardEntry[]
  >([]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await rewardsAPI.getLeaderboard({
        type: leaderboardType,
        period,
        department: department || undefined,
        limit: 100,
      });

      if (response.success && response.data?.leaderboard) {
        setLeaderboard(response.data.leaderboard);
      }
    } catch (error) {
      toast({
        title: "Unable to load leaderboard",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [leaderboardType, period, department]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return (
      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-sm font-semibold text-gray-600">
        {rank}
      </div>
    );
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;
    const colors = {
      bronze: "bg-amber-100 text-amber-800 border-amber-300",
      silver: "bg-gray-100 text-gray-800 border-gray-300",
      gold: "bg-yellow-100 text-yellow-800 border-yellow-300",
      platinum: "bg-purple-100 text-purple-800 border-purple-300",
    };
    return (
      <Badge
        variant="outline"
        className={`text-xs ${colors[tier as keyof typeof colors] || colors.bronze}`}
      >
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </Badge>
    );
  };

  const renderPointsLeaderboard = () => {
    const entries = leaderboard as LeaderboardEntry[];
    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry.userId}
            className={`${
              entry.userId === user?._id ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entry.profilePicture ? (
                    <img
                      src={getImageUrl(entry.profilePicture)}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {entry.name}
                    </h4>
                    {entry.userId === user?._id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.department && (
                      <span className="text-xs text-gray-500">
                        {entry.department}
                      </span>
                    )}
                    {getTierBadge(entry.tier)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {entry.points?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500">points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderMentorsLeaderboard = () => {
    const entries = leaderboard as LeaderboardEntry[];
    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry.userId}
            className={`${
              entry.userId === user?._id ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entry.profilePicture ? (
                    <img
                      src={getImageUrl(entry.profilePicture)}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {entry.name}
                    </h4>
                    {entry.userId === user?._id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  {entry.department && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      {entry.department}
                    </span>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div className="text-lg font-bold text-green-600">
                    {entry.completedMentorships || 0}
                  </div>
                  <div className="text-xs text-gray-500">completed</div>
                  <div className="text-sm text-gray-600">
                    {entry.totalSessions || 0} sessions
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderDonorsLeaderboard = () => {
    const entries = leaderboard as LeaderboardEntry[];
    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry.userId}
            className={`${
              entry.userId === user?._id ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entry.profilePicture ? (
                    <img
                      src={getImageUrl(entry.profilePicture)}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {entry.name}
                    </h4>
                    {entry.userId === user?._id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  {entry.department && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      {entry.department}
                    </span>
                  )}
                </div>
                <div className="text-right space-y-1">
                  <div className="text-2xl font-bold text-purple-600">
                    ${(entry.totalAmount || 0).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.donationCount || 0} donations
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderVolunteersLeaderboard = () => {
    const entries = leaderboard as LeaderboardEntry[];
    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card
            key={entry.userId}
            className={`${
              entry.userId === user?._id ? "border-blue-500 bg-blue-50" : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {entry.profilePicture ? (
                    <img
                      src={getImageUrl(entry.profilePicture)}
                      alt={entry.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {entry.name}
                    </h4>
                    {entry.userId === user?._id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  {entry.department && (
                    <span className="text-xs text-gray-500 mt-1 block">
                      {entry.department}
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">
                    {entry.eventCount || 0}
                  </div>
                  <div className="text-xs text-gray-500">events</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderDepartmentsLeaderboard = () => {
    const entries = leaderboard as DepartmentLeaderboardEntry[];
    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <Card key={entry.department}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">{getRankIcon(entry.rank)}</div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 text-lg">
                    {entry.department}
                  </h4>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span>{entry.userCount} members</span>
                    <span>Avg: {Math.round(entry.avgPoints)} pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {entry.totalPoints.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">total points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leaderboard</h2>
          <p className="text-gray-600 mt-1">
            Top performers across different categories
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as typeof period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={leaderboardType} onValueChange={(value) => setLeaderboardType(value as typeof leaderboardType)}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="points">Points</TabsTrigger>
          <TabsTrigger value="mentors">Mentors</TabsTrigger>
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="volunteers">Volunteers</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="points" className="mt-6">
          {renderPointsLeaderboard()}
        </TabsContent>

        <TabsContent value="mentors" className="mt-6">
          {renderMentorsLeaderboard()}
        </TabsContent>

        <TabsContent value="donors" className="mt-6">
          {renderDonorsLeaderboard()}
        </TabsContent>

        <TabsContent value="volunteers" className="mt-6">
          {renderVolunteersLeaderboard()}
        </TabsContent>

        <TabsContent value="departments" className="mt-6">
          {renderDepartmentsLeaderboard()}
        </TabsContent>
      </Tabs>

      {leaderboard.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-gray-600 mt-3">No data available yet</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

