import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RewardTemplate,
  RewardSummary,
  RewardActivity,
  TierInfo,
  Badge as BadgeType,
} from "./types";
import { rewardsAPI, type ApiResponse } from "@/lib/api";
import { RewardCard } from "./RewardCard";
import { RewardProgressList } from "./RewardProgressList";
import { TierDisplay } from "./TierDisplay";
import { BadgeCollection } from "./BadgeCollection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, RefreshCw, Sparkles, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CelebrationModal } from "./CelebrationModal";

interface RewardsDashboardProps {
  showHeader?: boolean;
}

export const RewardsDashboard: React.FC<RewardsDashboardProps> = ({
  showHeader = true,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<RewardTemplate[]>([]);
  const [summary, setSummary] = useState<RewardSummary | null>(null);
  const [activities, setActivities] = useState<RewardActivity[]>([]);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [filter, setFilter] = useState<
    "all" | "featured" | "points" | "voucher"
  >("all");
  const [celebrationModal, setCelebrationModal] = useState<{
    open: boolean;
    reward?: RewardTemplate;
    voucherCode?: string;
  }>({ open: false });

  type RewardsListResponse = { rewards: RewardTemplate[] };
  type RewardsSummaryResponse = { summary: RewardSummary };
  type RewardActivitiesResponse = { activities: RewardActivity[] };
  type UserTierResponse = { tierInfo: TierInfo };
  type UserBadgesResponse = { badges: BadgeType[] };

  const fetchRewards = useCallback(async () => {
    try {
      setLoading(true);
      const [
        rewardResponse,
        summaryResponse,
        activityResponse,
        tierResponse,
        badgesResponse,
      ] = await Promise.all([
        rewardsAPI.getRewards({}) as Promise<ApiResponse<RewardsListResponse>>,
        rewardsAPI.getSummary() as Promise<ApiResponse<RewardsSummaryResponse>>,
        rewardsAPI.getActivities() as Promise<
          ApiResponse<RewardActivitiesResponse>
        >,
        rewardsAPI.getUserTier() as Promise<ApiResponse<UserTierResponse>>,
        rewardsAPI.getUserBadges() as Promise<ApiResponse<UserBadgesResponse>>,
      ]);

      if (rewardResponse.success && rewardResponse.data?.rewards) {
        setRewards(rewardResponse.data.rewards as RewardTemplate[]);
      }

      if (summaryResponse.success && summaryResponse.data?.summary) {
        setSummary(summaryResponse.data.summary as RewardSummary);
      }

      if (activityResponse.success && activityResponse.data?.activities) {
        setActivities(activityResponse.data.activities as RewardActivity[]);
      }

      if (tierResponse.success && tierResponse.data?.tierInfo) {
        setTierInfo(tierResponse.data.tierInfo as TierInfo);
      }

      if (badgesResponse.success && badgesResponse.data?.badges) {
        const fetchedBadges = badgesResponse.data.badges as BadgeType[];
        console.log("[RewardsDashboard] Badges API Response:", badgesResponse);
        console.log(
          "[RewardsDashboard] Fetched badges count:",
          fetchedBadges.length
        );
        console.log("[RewardsDashboard] Fetched badges:", fetchedBadges);
        setBadges(fetchedBadges);
      } else {
        console.log(
          "[RewardsDashboard] Badges response not successful or no badges:",
          badgesResponse
        );
      }
    } catch (error) {
      toast({
        title: "Unable to load rewards",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRewards();
  }, [fetchRewards]);

  const filteredRewards = useMemo(() => {
    if (filter === "featured") {
      return rewards.filter((reward) => reward.isFeatured);
    }
    if (filter === "points") {
      return rewards.filter((reward) => reward.rewardType === "points");
    }
    if (filter === "voucher") {
      return rewards.filter((reward) => reward.rewardType === "voucher");
    }
    return rewards;
  }, [filter, rewards]);

  const handleClaim = async (reward: RewardTemplate) => {
    try {
      type ClaimRewardResponse = {
        activity?: {
          voucherCode?: string;
        };
      };

      const response = (await rewardsAPI.claimReward(
        reward._id
      )) as ApiResponse<ClaimRewardResponse>;

      let title = "Reward claimed!";
      let description = `${reward.name} has been redeemed.`;

      // Handle different reward types
      if (reward.rewardType === "points") {
        title = "Points added!";
        description = `${
          reward.points || 0
        } points have been added to your wallet!`;
      } else if (reward.rewardType === "voucher") {
        const voucherCode = response.data?.activity?.voucherCode;
        title = "Voucher redeemed!";
        description = voucherCode
          ? `Your voucher code is: ${voucherCode}. Please save this code and check your email for redemption details.`
          : `Voucher has been redeemed. Check your email for the code.`;
      } else if (reward.rewardType === "badge") {
        title = "Badge earned!";
        description = `Badge "${reward.name}" has been added to your collection!`;
      } else if (reward.rewardType === "perk") {
        title = "Perk activated!";
        description = `Access to "${reward.name}" perk has been enabled!`;
      }

      // Show celebration modal instead of toast
      setCelebrationModal({
        open: true,
        reward,
        voucherCode: response.data?.activity?.voucherCode,
      });

      fetchRewards();
    } catch (error) {
      toast({
        title: "Unable to claim reward",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const renderSummary = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
      {[
        {
          label: "Total Points",
          value: summary?.totalPoints ?? 0,
          accent: "text-indigo-600",
        },
        {
          label: "Rewards Earned",
          value: summary?.earnedRewards ?? 0,
          accent: "text-green-600",
        },
        {
          label: "Rewards Redeemed",
          value: summary?.redeemedRewards ?? 0,
          accent: "text-blue-600",
        },
        {
          label: "In Progress",
          value: summary?.pendingRewards ?? 0,
          accent: "text-amber-600",
        },
      ].map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 shadow-sm p-4"
        >
          <p className="text-xs uppercase tracking-widest text-gray-500">
            {item.label}
          </p>
          <p className={`text-3xl font-semibold mt-2 ${item.accent}`}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {showHeader && (
        <header className="rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-white/70 mb-2">
                Alumni Rewards
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                Celebrate your contributions, unlock exclusive perks
              </h1>
              <p className="text-white/80 mt-2 max-w-3xl">
                Complete alumni initiatives, earn custom badges, and redeem gift
                vouchers from curated partners — all from a single, intuitive
                hub.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                className="bg-white/20 border-white/30 hover:bg-white/30 text-white"
                onClick={fetchRewards}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
          {renderSummary()}
        </header>
      )}

      {/* Tier and Badges Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {tierInfo && (
          <TierDisplay tierInfo={tierInfo} className="lg:col-span-2" />
        )}
        <BadgeCollection badges={badges} showTitle={true} limit={6} />
      </div>

      <Tabs defaultValue="catalog" className="w-full">
        <TabsList className="w-full overflow-x-auto justify-start rounded-2xl bg-gray-100/60">
          <TabsTrigger value="catalog" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Reward Catalog
          </TabsTrigger>
          <TabsTrigger value="progress">My Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="mt-6 space-y-6">
          <div className="flex flex-wrap gap-2">
            {["all", "featured", "points", "voucher"].map((item) => (
              <Badge
                key={item}
                variant={filter === item ? "default" : "outline"}
                className="cursor-pointer capitalize"
                onClick={() =>
                  setFilter(item as "all" | "featured" | "points" | "voucher")
                }
              >
                {item}
              </Badge>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRewards.map((reward) => (
              <RewardCard
                key={reward._id}
                reward={reward}
                activity={activities.find(
                  (activity) => activity.reward._id === reward._id
                )}
                onClaim={handleClaim}
              />
            ))}
          </div>

          {filteredRewards.length === 0 && (
            <div className="text-center py-12 border border-dashed rounded-3xl">
              <Gift className="w-10 h-10 mx-auto text-gray-400" />
              <p className="text-gray-600 mt-3">No rewards available yet</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="mt-6">
          <RewardProgressList rewards={rewards} activities={activities} />
        </TabsContent>
      </Tabs>

      {/* Celebration Modal */}
      <CelebrationModal
        open={celebrationModal.open}
        onClose={() => setCelebrationModal({ open: false })}
        rewardName={celebrationModal.reward?.name}
        rewardType={celebrationModal.reward?.rewardType}
        voucherCode={celebrationModal.voucherCode}
      />
    </div>
  );
};

export default RewardsDashboard;
