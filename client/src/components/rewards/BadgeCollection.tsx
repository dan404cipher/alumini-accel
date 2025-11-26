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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {displayBadges.map((badge) => (
            <Dialog key={badge._id}>
              <DialogTrigger asChild>
                <button className="group relative">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-3xl transition-transform duration-200 group-hover:scale-110 group-hover:shadow-lg"
                    style={{
                      backgroundColor: `${badge.color}20`,
                      border: `2px solid ${badge.color}40`,
                    }}
                  >
                    {badge.icon || "🏅"}
                  </div>
                  {badge.isRare && (
                    <div className="absolute -top-1 -right-1">
                      <Sparkles className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                  <p className="text-xs font-medium text-center text-gray-700 mt-2 line-clamp-2">
                    {badge.name}
                  </p>
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        border: `2px solid ${badge.color}40`,
                      }}
                    >
                      {badge.icon || "🏅"}
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

