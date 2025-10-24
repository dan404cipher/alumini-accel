import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Globe,
  Users,
  UserCheck,
  Calendar,
  Hash,
  ExternalLink,
  Shield,
  Crown,
  Settings,
  UserPlus,
  MessageCircle,
} from "lucide-react";
import { Community } from "./types";

interface CommunityAboutTabProps {
  community: Community | null;
  isMember: boolean;
  isAdmin: boolean;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onCreatePost: () => void;
}

const CommunityAboutTab: React.FC<CommunityAboutTabProps> = ({
  community,
  isMember,
  isAdmin,
  onJoinCommunity,
  onLeaveCommunity,
  onCreatePost,
}) => {
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
    <div className="space-y-6 sm:space-y-8">
      {/* Community Description */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Globe className="w-5 h-5" />
            About This Community
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {community?.description || "No description available."}
          </p>
        </CardContent>
      </Card>

      {/* Community Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {community?.memberCount || 0}
                </p>
                <p className="text-sm text-gray-600">Members</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {community?.postCount || 0}
                </p>
                <p className="text-sm text-gray-600">Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {(community?.moderators?.length || 0) +
                    (community?.createdBy ? 1 : 0)}
                </p>
                <p className="text-sm text-gray-600">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Community Details */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
              Community Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Category</span>
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {getCategoryIcon(community?.category)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {community?.category?.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Type</span>
              <Badge
                variant={community?.type === "open" ? "default" : "secondary"}
                className="text-xs"
              >
                {community?.type}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Created</span>
              <span className="text-sm font-medium">
                {community?.createdAt
                  ? new Date(community.createdAt).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status</span>
              <Badge
                variant={
                  community?.status === "active" ? "default" : "secondary"
                }
                className="text-xs"
              >
                {community?.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Community Settings */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              Community Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Member Posts</span>
              <Badge
                variant={
                  community?.settings.allowMemberPosts ? "default" : "secondary"
                }
                className="text-xs"
              >
                {community?.settings.allowMemberPosts
                  ? "Allowed"
                  : "Not Allowed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Post Approval</span>
              <Badge
                variant={
                  community?.settings.requirePostApproval
                    ? "secondary"
                    : "default"
                }
                className="text-xs"
              >
                {community?.settings.requirePostApproval
                  ? "Required"
                  : "Not Required"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Media Uploads</span>
              <Badge
                variant={
                  community?.settings.allowMediaUploads
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {community?.settings.allowMediaUploads
                  ? "Allowed"
                  : "Not Allowed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Comments</span>
              <Badge
                variant={
                  community?.settings.allowComments ? "default" : "secondary"
                }
                className="text-xs"
              >
                {community?.settings.allowComments ? "Allowed" : "Not Allowed"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Polls</span>
              <Badge
                variant={
                  community?.settings.allowPolls ? "default" : "secondary"
                }
                className="text-xs"
              >
                {community?.settings.allowPolls ? "Allowed" : "Not Allowed"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags */}
      {community?.tags && community.tags.length > 0 && (
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {community.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-sm">
                  #{tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* External Links */}
      {community?.externalLinks &&
        Object.values(community.externalLinks).some((link) => link) && (
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                External Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {community.externalLinks.website && (
                <a
                  href={community.externalLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Website</p>
                    <p className="text-sm text-gray-500">
                      {community.externalLinks.website}
                    </p>
                  </div>
                </a>
              )}
              {community.externalLinks.github && (
                <a
                  href={community.externalLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">GitHub</p>
                    <p className="text-sm text-gray-500">
                      {community.externalLinks.github}
                    </p>
                  </div>
                </a>
              )}
              {community.externalLinks.slack && (
                <a
                  href={community.externalLinks.slack}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Slack</p>
                    <p className="text-sm text-gray-500">
                      {community.externalLinks.slack}
                    </p>
                  </div>
                </a>
              )}
              {community.externalLinks.discord && (
                <a
                  href={community.externalLinks.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900">Discord</p>
                    <p className="text-sm text-gray-500">
                      {community.externalLinks.discord}
                    </p>
                  </div>
                </a>
              )}
            </CardContent>
          </Card>
        )}

      {/* Community Rules */}
      {community?.rules && community.rules.length > 0 && (
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
              Community Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {community.rules.map((rule, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Community Admins */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
            Community Admins
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Creator */}
          {community?.createdBy && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {community.createdBy.firstName} {community.createdBy.lastName}
                </p>
                <p className="text-sm text-gray-600">Community Creator</p>
              </div>
              <Badge variant="default" className="text-xs">
                Creator
              </Badge>
            </div>
          )}

          {/* Moderators */}
          {community?.moderators?.map((moderator) => (
            <div
              key={moderator._id}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {moderator.firstName} {moderator.lastName}
                </p>
                <p className="text-sm text-gray-600">Community Moderator</p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Moderator
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {isMember && !isAdmin ? (
          <>
            <Button
              onClick={onCreatePost}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Create Post
            </Button>
            <Button
              variant="outline"
              onClick={onLeaveCommunity}
              className="flex-1 sm:flex-none"
              size="lg"
            >
              <Users className="w-4 h-4 mr-2" />
              Leave Community
            </Button>
          </>
        ) : !isMember && !isAdmin ? (
          <Button
            onClick={onJoinCommunity}
            className="flex-1 sm:flex-none"
            size="lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Join Community
          </Button>
        ) : isAdmin ? (
          <Button
            onClick={onCreatePost}
            className="flex-1 sm:flex-none"
            size="lg"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        ) : null}
        {isAdmin && (
          <Button variant="outline" className="flex-1 sm:flex-none" size="lg">
            <Settings className="w-4 h-4 mr-2" />
            Manage Community
          </Button>
        )}
      </div>
    </div>
  );
};

export default CommunityAboutTab;
