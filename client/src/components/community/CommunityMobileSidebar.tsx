import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Filter,
  X,
  Globe,
  Hash,
  ExternalLink,
  Settings,
  UserPlus,
  Users,
  MessageCircle,
} from "lucide-react";
import { Community, PostFilters } from "./types";

interface CommunityMobileSidebarProps {
  community: Community | null;
  isMember: boolean;
  isAdmin: boolean;
  onJoinCommunity: () => void;
  onLeaveCommunity: () => void;
  onCreatePost: () => void;
  filters: PostFilters;
  onFilterChange: (key: keyof PostFilters, value: string) => void;
  onClearFilters: () => void;
}

const CommunityMobileSidebar: React.FC<CommunityMobileSidebarProps> = ({
  community,
  isMember,
  isAdmin,
  onJoinCommunity,
  onLeaveCommunity,
  onCreatePost,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  return (
    <div className="lg:hidden px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Mobile Filters */}
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
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="discussion">Discussion</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="job">Job Opportunity</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="poll">Poll</SelectItem>
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
                  <SelectItem value="most-commented">Most Commented</SelectItem>
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
              <span className="text-xs sm:text-sm text-gray-600">Created</span>
              <span className="text-xs sm:text-sm font-medium">
                {community?.createdAt
                  ? new Date(community.createdAt).toLocaleDateString()
                  : "Unknown"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm text-gray-600">Category</span>
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
              <span className="text-xs sm:text-sm text-gray-600">Members</span>
              <span className="text-xs sm:text-sm font-medium">
                {community?.memberCount || 0}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Tags - Only show on About tab */}
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
              )) || <p className="text-sm text-gray-500">No tags available</p>}
            </div>
          </CardContent>
        </Card>

        {/* External Links - Only show on About tab */}
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

        {/* Quick Actions - Only show on About tab */}
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
  );
};

export default CommunityMobileSidebar;
