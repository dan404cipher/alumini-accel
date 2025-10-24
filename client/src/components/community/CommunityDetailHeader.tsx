import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Settings, Edit, Trash2 } from "lucide-react";
import { Community } from "./types";

interface CommunityDetailHeaderProps {
  community: Community | null;
  isMember: boolean;
  isAdmin: boolean;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onEditCommunity?: () => void;
  onDeleteCommunity?: () => void;
}

const CommunityDetailHeader: React.FC<CommunityDetailHeaderProps> = ({
  community,
  isMember,
  isAdmin,
  onJoinCommunity,
  onLeaveCommunity,
  onEditCommunity,
  onDeleteCommunity,
}) => {
  const navigate = useNavigate();

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "department":
        return "🎓";
      case "batch":
        return "👥";
      case "interest":
        return "🎯";
      case "professional":
        return "💼";
      case "location":
        return "📍";
      case "academic_research":
        return "🔬";
      case "professional_career":
        return "🚀";
      case "entrepreneurship_startups":
        return "💡";
      case "social_hobby":
        return "🎨";
      case "mentorship_guidance":
        return "🤝";
      case "events_meetups":
        return "📅";
      case "community_support_volunteering":
        return "❤️";
      case "technology_deeptech":
        return "💻";
      case "regional_chapter_based":
        return "🌍";
      default:
        return "👥";
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border-b border-gray-200/50 flex-shrink-0 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/community")}
              className="flex items-center gap-2 flex-shrink-0 hover:bg-white/60 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Communities</span>
            </Button>

            <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>

            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="relative">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex items-center justify-center bg-gray-100 flex-shrink-0 shadow-lg">
                  {community?.logo ? (
                    <img
                      src={community.logo}
                      alt={community.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 text-lg sm:text-xl font-bold">
                      {getCategoryIcon(community?.category)}
                    </span>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">
                  {community?.name || "Community"}
                </h1>
                <p className="text-sm text-gray-600 truncate">
                  {community?.category?.replace(/_/g, " ")} Community
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {isMember && !isAdmin ? (
              <Button
                variant="outline"
                onClick={onLeaveCommunity}
                size="sm"
                className="bg-white/80 hover:bg-white border-gray-300 text-gray-700 hover:text-gray-900 transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Leave</span>
                <span className="sm:hidden">Leave</span>
              </Button>
            ) : !isMember && !isAdmin ? (
              <Button
                onClick={onJoinCommunity}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Join Community</span>
                <span className="sm:hidden">Join</span>
              </Button>
            ) : null}
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEditCommunity}
                  className="bg-white/80 hover:bg-white border-gray-300 text-gray-700 hover:text-gray-900 transition-all"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDeleteCommunity}
                  className="bg-white/80 hover:bg-white border-red-300 text-red-700 hover:text-red-900 hover:border-red-400 transition-all"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetailHeader;
