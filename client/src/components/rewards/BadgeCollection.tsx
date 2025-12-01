import { Badge as BadgeType } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/api";

interface BadgeCollectionProps {
  badges: BadgeType[];
  showTitle?: boolean;
  limit?: number;
}

interface UserBadge extends BadgeType {
  awardedAt?: string;
  reason?: string;
}

export const BadgeCollection: React.FC<BadgeCollectionProps> = ({
  badges,
  showTitle = true,
  limit,
}) => {
  const displayBadges = limit ? badges.slice(0, limit) : badges;
  const remainingCount = limit && badges.length > limit ? badges.length - limit : 0;

  if (badges.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Award className="w-12 h-12 mx-auto text-gray-400" />
            <p className="text-gray-600 mt-3">No badges earned yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Complete tasks to earn badges!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Badges ({badges.length})
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col gap-3">
          {displayBadges.map((badge) => (
            <Dialog key={badge._id}>
              <DialogTrigger asChild>
                <button className="w-full">
                  <div className="flex items-center gap-4 p-3 border rounded-xl hover:border-primary/50 transition-colors">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center text-3xl shrink-0 overflow-hidden"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        border: `2px solid ${badge.color}30`,
                        color: badge.color,
                      }}
                    >
                      {badge.icon &&
                      (badge.icon.startsWith("/") || badge.icon.startsWith("http")) ? (
                        <img
                          src={getImageUrl(badge.icon)}
                          alt={badge.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.textContent = "🏅";
                          }}
                        />
                      ) : (
                        badge.icon || "🏅"
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {badge.name}
                        </p>
                        {badge.isRare && (
                          <Sparkles className="w-4 h-4 text-yellow-500 shrink-0" />
                        )}
                      </div>
                      {badge.category && (
                        <p className="text-xs text-muted-foreground truncate">
                          {badge.category}
                        </p>
                      )}
                      {(badge as UserBadge).awardedAt && (
                        <p className="text-xs text-muted-foreground">
                          Earned{" "}
                          {format(
                            new Date((badge as UserBadge).awardedAt!),
                            "MMM d, yyyy"
                          )}
                        </p>
                      )}
                    </div>
                    {badge.points ? (
                      <div className="text-right">
                        <p className="text-sm font-semibold text-blue-600">
                          +{badge.points}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          points
                        </p>
                      </div>
                    ) : null}
                  </div>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl overflow-hidden"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        border: `2px solid ${badge.color}40`,
                      }}
                    >
                      {badge.icon && (badge.icon.startsWith("/") || badge.icon.startsWith("http")) ? (
                        <img
                          src={getImageUrl(badge.icon)}
                          alt={badge.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to emoji if image fails to load
                            e.currentTarget.style.display = "none";
                            e.currentTarget.parentElement!.textContent = "🏅";
                          }}
                        />
                      ) : (
                        badge.icon || "🏅"
                      )}
                    </div>
                    {badge.name}
                    {badge.isRare && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300">
                        Rare
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>{badge.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Category</p>
                    <Badge variant="secondary" className="mt-1">
                      {badge.category}
                    </Badge>
                  </div>
                  {badge.points > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Points</p>
                      <p className="text-lg font-semibold text-blue-600">
                        +{badge.points} pts
                      </p>
                    </div>
                  )}
                  {(badge as UserBadge).awardedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Awarded</p>
                      <p className="text-sm text-gray-600">
                        {format(
                          new Date((badge as UserBadge).awardedAt!),
                          "MMMM d, yyyy"
                        )}
                      </p>
                    </div>
                  )}
                  {(badge as UserBadge).reason && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason</p>
                      <p className="text-sm text-gray-600">
                        {(badge as UserBadge).reason}
                      </p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
        {remainingCount > 0 && (
          <p className="text-xs text-gray-500 text-center mt-4">
            +{remainingCount} more badges
          </p>
        )}
      </CardContent>
    </Card>
  );
};

