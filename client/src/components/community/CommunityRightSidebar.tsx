import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  Hash,
  Globe,
  Settings,
  UserPlus,
  Users,
  MessageCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Community, TrendingPost, PopularTag } from "./types";
import { communityAPI } from "@/lib/api";

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
  const { toast } = useToast();
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingTags, setLoadingTags] = useState(false);

  const fetchTrendingPosts = useCallback(async () => {
    if (!community?._id) return;

    setLoadingTrending(true);
    try {
      const response = await communityAPI.getTrendingPosts(community._id, 5);
      if (response.success && Array.isArray(response.data)) {
        // Transform backend data to match frontend interface
        const transformedPosts = response.data.map((post: any) => ({
          id: post._id,
          title: post.title,
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          views: post.viewCount || 0,
          author:
            `${post.authorId?.firstName || ""} ${
              post.authorId?.lastName || ""
            }`.trim() || "Unknown",
          timeAgo: formatTimeAgo(post.createdAt),
        }));
        setTrendingPosts(transformedPosts);
      }
    } catch (error) {
      console.error("Error fetching trending posts:", error);
      toast({
        title: "Error",
        description: "Failed to load trending posts",
        variant: "destructive",
      });
    } finally {
      setLoadingTrending(false);
    }
  }, [community?._id, toast]);

  const fetchPopularTags = useCallback(async () => {
    if (!community?._id) return;

    setLoadingTags(true);
    try {
      const response = await communityAPI.getPopularTags(community._id, 8);
      if (response.success && Array.isArray(response.data)) {
        setPopularTags(response.data as PopularTag[]);
      }
    } catch (error) {
      console.error("Error fetching popular tags:", error);
      toast({
        title: "Error",
        description: "Failed to load popular tags",
        variant: "destructive",
      });
    } finally {
      setLoadingTags(false);
    }
  }, [community?._id, toast]);

  // Fetch trending posts and popular tags
  useEffect(() => {
    if (community?._id) {
      fetchTrendingPosts();
      fetchPopularTags();
    }
  }, [community?._id, fetchTrendingPosts, fetchPopularTags]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000)
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

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
              {loadingTrending ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : trendingPosts.length > 0 ? (
                trendingPosts.map((post) => (
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
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No trending posts yet</p>
                </div>
              )}
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
              {loadingTags ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="ml-2 text-sm text-gray-500">Loading...</span>
                </div>
              ) : popularTags.length > 0 ? (
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
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No tags yet</p>
                </div>
              )}
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
              {isMember && !isAdmin ? (
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
              ) : !isMember && !isAdmin ? (
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
              ) : isAdmin ? (
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
              ) : null}
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
