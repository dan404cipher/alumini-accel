import { TierInfo } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Award, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface TierDisplayProps {
  tierInfo: TierInfo;
  className?: string;
}

const TIER_COLORS = {
  bronze: {
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800 border-amber-300",
    progress: "bg-amber-500",
  },
  silver: {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    badge: "bg-gray-100 text-gray-800 border-gray-300",
    progress: "bg-gray-400",
  },
  gold: {
    bg: "bg-yellow-50 border-yellow-200",
    text: "text-yellow-700",
    badge: "bg-yellow-100 text-yellow-800 border-yellow-300",
    progress: "bg-yellow-500",
  },
  platinum: {
    bg: "bg-purple-50 border-purple-200",
    text: "text-purple-700",
    badge: "bg-purple-100 text-purple-800 border-purple-300",
    progress: "bg-purple-500",
  },
};

const TIER_ICONS = {
  bronze: "🥉",
  silver: "🥈",
  gold: "🥇",
  platinum: "💎",
};

export const TierDisplay: React.FC<TierDisplayProps> = ({
  tierInfo,
  className,
}) => {
  const tierColor = TIER_COLORS[tierInfo.currentTier];
  const tierIcon = TIER_ICONS[tierInfo.currentTier];
  const tierName =
    tierInfo.currentTier.charAt(0).toUpperCase() +
    tierInfo.currentTier.slice(1);

  return (
    <Card className={cn("border-2", tierColor.bg, className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Award className={cn("w-5 h-5", tierColor.text)} />
            <span className={cn("font-bold", tierColor.text)}>
              {tierName} Tier
            </span>
            <span className="text-2xl">{tierIcon}</span>
          </span>
          <Badge
            variant="outline"
            className={cn("text-sm font-semibold", tierColor.badge)}
          >
            {tierInfo.totalPoints.toLocaleString()} pts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {tierInfo.nextTier ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress to {tierInfo.nextTier.charAt(0).toUpperCase() + tierInfo.nextTier.slice(1)}</span>
                <span className="font-medium text-gray-700">
                  {tierInfo.pointsToNextTier} pts needed
                </span>
              </div>
              <Progress
                value={tierInfo.progressPercentage}
                className="h-3"
              />
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  {tierInfo.tierPoints} pts in {tierName}
                </span>
                <span>{Math.round(tierInfo.progressPercentage)}%</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>
                Keep earning to unlock {tierInfo.nextTier.charAt(0).toUpperCase() + tierInfo.nextTier.slice(1)} tier!
              </span>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">🏆</div>
            <p className="text-sm font-medium text-gray-700">
              You've reached the highest tier!
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Continue earning points to maintain your {tierName} status
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

