import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, MessageCircle, Hash, Globe, Users, Settings } from "lucide-react";
import { PostFilters, Community } from "./types";
import { Badge } from "@/components/ui/badge";
import { categoryAPI } from "@/lib/api";

interface CommunityLeftSidebarProps {
  filters: PostFilters;
  onFilterChange: (key: keyof PostFilters, value: string) => void;
  onClearFilters: () => void;
  onCreatePost: () => void;
  isMember: boolean;
  // Optional: When on a specific community page, we can show extra info
  community?: Community | null;
  isAdmin?: boolean;
  onJoinCommunity?: () => void;
  onLeaveCommunity?: () => void;
  onTagClick?: (tag: string) => void;
}

const CommunityLeftSidebar: React.FC<CommunityLeftSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onCreatePost,
  isMember,
  community,
  isAdmin,
  onJoinCommunity,
  onLeaveCommunity,
  onTagClick,
}) => {
  const [postCategoryOptions, setPostCategoryOptions] = React.useState<string[]>([]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({ entityType: "community_post_category", isActive: "true" });
        const names = Array.isArray(res.data)
          ? (res.data as any[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setPostCategoryOptions(names);
      } catch (_) {
        if (mounted) setPostCategoryOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="hidden lg:block w-96 flex-shrink-0 bg-gray-50 border-r border-gray-200 h-full">
      <div className="h-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {/* Create Post Button (only on listing view; hide on detail where Quick Actions shows it) */}
          {isMember && !community && (
            <Button
              onClick={onCreatePost}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          )}

          {/* Post Filters */}
          <Card className="bg-white shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Filter className="w-4 h-4" />
                Filter Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Search posts
                </label>
                <Input
                  placeholder="Search posts..."
                  value={filters.search}
                  onChange={(e) => onFilterChange("search", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>

              {/* Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Category
                </label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => onFilterChange("category", value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {postCategoryOptions.length === 0 ? (
                      <SelectItem value="__noopts__" disabled>
                        No saved categories
                      </SelectItem>
                    ) : (
                      postCategoryOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Priority
                </label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => onFilterChange("priority", value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">
                  Sort by
                </label>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value) => onFilterChange("sortBy", value)}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="most-liked">Most Liked</SelectItem>
                    <SelectItem value="most-commented">
                      Most Commented
                    </SelectItem>
                    <SelectItem value="most-viewed">Most Viewed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="w-full h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* If specific community is provided, show its info and tags on the left */}
        {community && (
          <div className="mt-4 space-y-4">
            {/* Community Info */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4" />
                  Community Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">
                    {community.createdAt
                      ? new Date(community.createdAt).toLocaleDateString()
                      : "Unknown"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Category</span>
                  <Badge variant="outline" className="text-[10px]">
                    {community.category?.replace(/_/g, " ")}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Type</span>
                  <Badge variant={community.type === "open" ? "default" : "secondary"} className="text-[10px]">
                    {community.type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600">Members</span>
                  <span className="font-medium">{community.memberCount || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Hash className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {community.tags && community.tags.length > 0 ? (
                    community.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px] cursor-pointer"
                        onClick={() => onTagClick && onTagClick(tag)}
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500">No tags available</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {isMember && !isAdmin ? (
                  <>
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={onCreatePost}>
                      <MessageCircle className="w-3 h-3 mr-2" /> Create Post
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs"
                      onClick={onLeaveCommunity}
                    >
                      <Users className="w-3 h-3 mr-2" /> Leave Community
                    </Button>
                  </>
                ) : !isMember && !isAdmin ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full justify-start text-xs"
                    onClick={onJoinCommunity}
                  >
                    <Users className="w-3 h-3 mr-2" /> Join Community
                  </Button>
                ) : isAdmin ? (
                  <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={onCreatePost}>
                    <MessageCircle className="w-3 h-3 mr-2" /> Create Post
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityLeftSidebar;
