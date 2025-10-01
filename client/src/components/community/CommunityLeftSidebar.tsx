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
import { Filter, X, MessageCircle } from "lucide-react";
import { PostFilters } from "./types";

interface CommunityLeftSidebarProps {
  filters: PostFilters;
  onFilterChange: (key: keyof PostFilters, value: string) => void;
  onClearFilters: () => void;
  onCreatePost: () => void;
  isMember: boolean;
}

const CommunityLeftSidebar: React.FC<CommunityLeftSidebarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  onCreatePost,
  isMember,
}) => {
  return (
    <div className="hidden lg:block w-96 flex-shrink-0 bg-gray-50 border-r border-gray-200 h-full">
      <div className="h-full px-4 py-6 overflow-y-auto">
        <div className="space-y-4">
          {/* Create Post Button */}
          {isMember && (
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
      </div>
    </div>
  );
};

export default CommunityLeftSidebar;
