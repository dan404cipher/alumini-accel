import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
import { CommunityPost } from "./types";
import CommunityPostCard from "./CommunityPostCard";

interface CommunityPostsTabProps {
  posts: CommunityPost[];
  postsLoading: boolean;
  filteredPosts: CommunityPost[];
  onRefreshPosts: () => void;
  isModerator?: boolean;
  isAdmin?: boolean;
}

const CommunityPostsTab: React.FC<CommunityPostsTabProps> = ({
  posts,
  postsLoading,
  filteredPosts,
  onRefreshPosts,
  isModerator = false,
  isAdmin = false,
}) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Posts Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Posts
          </h2>
          <span className="text-sm text-gray-500">
            ({filteredPosts.length} of {posts.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshPosts}
            disabled={postsLoading}
            className="text-xs sm:text-sm"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 ${
                postsLoading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {postsLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2 text-gray-500">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading posts...</span>
          </div>
        </div>
      )}

      {/* Posts List */}
      {!postsLoading && (
        <div className="space-y-4 sm:space-y-6">
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <CommunityPostCard
                key={post._id}
                post={post}
                isModerator={isModerator}
                isAdmin={isAdmin}
              />
            ))
          ) : (
            <div className="text-center py-8 sm:py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No posts found
              </h3>
              <p className="text-gray-500">
                {posts.length === 0
                  ? "Be the first to start a discussion in this community! Use the Create Post button in the sidebar."
                  : "Try adjusting your filters to see more posts."}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPostsTab;
