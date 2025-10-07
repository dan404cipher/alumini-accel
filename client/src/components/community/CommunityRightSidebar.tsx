import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Hash,
  Globe,
  Settings,
  UserPlus,
  Users,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Community, TrendingPost, PopularTag } from "./types";

interface CommunityRightSidebarProps {
  community: Community | null;
  isMember: boolean;
  isAdmin: boolean;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onCreatePost: () => void;
  onTagClick: (tag: string) => void;
}

const CommunityRightSidebar: React.FC<CommunityRightSidebarProps> = ({
  community,
  isMember,
  isAdmin,
  onJoinCommunity,
  onLeaveCommunity,
  onCreatePost,
  onTagClick,
}) => {
  // Mock data for trending posts and popular tags
  const trendingPosts: TrendingPost[] = [
    {
      id: "1",
      title: "Best practices for React development",
      likes: 24,
      comments: 8,
      views: 156,
      author: "John Doe",
      timeAgo: "2h ago",
    },
    {
      id: "2",
      title: "Career advice for new graduates",
      likes: 18,
      comments: 12,
      views: 203,
      author: "Jane Smith",
      timeAgo: "4h ago",
    },
    {
      id: "3",
      title: "Networking tips for alumni events",
      likes: 15,
      comments: 6,
      views: 98,
      author: "Mike Johnson",
      timeAgo: "6h ago",
    },
  ];

  const popularTags: PopularTag[] = [
    { name: "career", count: 45 },
    { name: "networking", count: 32 },
    { name: "job-opportunities", count: 28 },
    { name: "mentorship", count: 22 },
    { name: "events", count: 18 },
    { name: "alumni", count: 15 },
    { name: "industry", count: 12 },
    { name: "startup", count: 10 },
  ];

  return (
    <div className="hidden xl:block w-[28rem] flex-shrink-0 bg-gray-50 border-l border-gray-200 h-full">
      <div className="h-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4 sm:space-y-6">
          {/* Trending Discussions - Only show on Posts tab */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                Trending Discussions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {trendingPosts.map((post) => (
                <div key={post.id} className="space-y-1">
                  <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <span>{post.likes}</span>
                      <span>likes</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>{post.comments}</span>
                      <span>comments</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span>{post.views}</span>
                      <span>views</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    by {post.author} • {post.timeAgo}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Popular Tags - Only show on Posts tab */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Hash className="w-4 h-4" />
                Popular Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {popularTags.map((tag) => (
                  <Badge
                    key={tag.name}
                    variant="secondary"
                    className="cursor-pointer hover:bg-blue-100 text-xs"
                    onClick={() => onTagClick(tag.name)}
                  >
                    {tag.name} ({tag.count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Community Info - Only show on About tab */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                Community Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Created
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  {community?.createdAt
                    ? new Date(community.createdAt).toLocaleDateString()
                    : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Category
                </span>
                <Badge variant="outline" className="text-xs">
                  {community?.category?.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">Type</span>
                <Badge
                  variant={community?.type === "open" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {community?.type}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-600">
                  Members
                </span>
                <span className="text-xs sm:text-sm font-medium">
                  {community?.memberCount || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Hash className="w-4 h-4 sm:w-5 sm:h-5" />
                Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {community?.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                )) || (
                  <p className="text-sm text-gray-500">No tags available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* External Links */}
          {community?.externalLinks &&
            Object.values(community.externalLinks).some((link) => link) && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                    Links
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {community.externalLinks.website && (
                    <a
                      href={community.externalLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  {community.externalLinks.github && (
                    <a
                      href={community.externalLinks.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      GitHub
                    </a>
                  )}
                  {community.externalLinks.slack && (
                    <a
                      href={community.externalLinks.slack}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Slack
                    </a>
                  )}
                  {community.externalLinks.discord && (
                    <a
                      href={community.externalLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Discord
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Quick Actions */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              {isMember ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={onCreatePost}
                  >
                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Create Post</span>
                    <span className="sm:hidden">Create</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-xs sm:text-sm"
                    onClick={onLeaveCommunity}
                  >
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Leave Community</span>
                    <span className="sm:hidden">Leave</span>
                  </Button>
                </>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                  onClick={onJoinCommunity}
                >
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Join Community</span>
                  <span className="sm:hidden">Join</span>
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs sm:text-sm"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Manage Community</span>
                  <span className="sm:hidden">Manage</span>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CommunityRightSidebar;
