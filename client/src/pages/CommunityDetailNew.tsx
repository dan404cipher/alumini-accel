import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CreateDiscussionModal from "@/components/CreateDiscussionModal";

// Import the new components and types
import {
  CommunityDetailHeader,
  CommunityDetailTabs,
  CommunityLeftSidebar,
  CommunityRightSidebar,
  CommunityMobileSidebar,
  CommunityPostsTab,
  CommunityAboutTab,
  Community,
  CommunityPost,
  PostFilters,
} from "@/components/community/index";

const CommunityDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  // State
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<PostFilters>({
    search: "",
    category: "all",
    priority: "all",
    sortBy: "newest",
  });

  // Fetch community data
  const fetchCommunity = useCallback(async () => {
    if (!id) {
      console.error("No community ID found in URL params");
      return;
    }

    console.log("Fetching community with ID:", id);
    const url = `http://localhost:3000/api/v1/communities/${id}`;
    console.log("Fetching from URL:", url);

    try {
      setLoading(true);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("API Error Response:", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorData,
        });
        throw new Error(
          `Failed to fetch community: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const communityData = data.data.community || data.data;
      setCommunity(communityData);

      // Check if user is member or admin
      const userId = user?._id;
      if (userId && communityData) {
        const memberCheck = communityData.members?.some(
          (member: { _id: string }) => member._id === userId
        );
        const adminCheck =
          communityData.createdBy?._id === userId ||
          communityData.moderators?.some(
            (mod: { _id: string }) => mod._id === userId
          );

        setIsMember(!!memberCheck);
        setIsAdmin(!!adminCheck);
      }
    } catch (error) {
      console.error("Error fetching community:", error);
      toast({
        title: "Error",
        description: "Failed to load community details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [id, user?._id, toast]);

  // Fetch community posts
  const fetchCommunityPosts = useCallback(async () => {
    if (!id) return;

    try {
      setPostsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/v1/community-posts/community/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }

      const data = await response.json();
      setPosts(data.data.posts || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load community posts",
        variant: "destructive",
      });
    } finally {
      setPostsLoading(false);
    }
  }, [id, toast]);

  // Apply filters to posts
  const applyFilters = useCallback(() => {
    let filtered = [...posts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.content.toLowerCase().includes(searchLower) ||
          post.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (filters.category !== "all") {
      filtered = filtered.filter((post) => post.category === filters.category);
    }

    // Priority filter
    if (filters.priority !== "all") {
      filtered = filtered.filter((post) => post.priority === filters.priority);
    }

    // Sort posts
    switch (filters.sortBy) {
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "most-liked":
        filtered.sort((a, b) => b.likes.length - a.likes.length);
        break;
      case "most-commented":
        filtered.sort((a, b) => b.comments.length - a.comments.length);
        break;
      case "most-viewed":
        filtered.sort((a, b) => b.viewCount - a.viewCount);
        break;
      default: // newest
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    setFilteredPosts(filtered);
  }, [posts, filters]);

  // Update filter
  const updateFilter = useCallback((key: keyof PostFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      search: "",
      category: "all",
      priority: "all",
      sortBy: "newest",
    });
  }, []);

  // Handle tag click
  const handleTagClick = useCallback((tag: string) => {
    setFilters((prev) => ({ ...prev, search: tag }));
  }, []);

  // Community actions
  const handleJoinCommunity = async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/communities/${id}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to join community");
      }

      setIsMember(true);
      toast({
        title: "Success",
        description: "You have joined the community!",
      });
    } catch (error) {
      console.error("Error joining community:", error);
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive",
      });
    }
  };

  const handleLeaveCommunity = async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/communities/${id}/leave`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to leave community");
      }

      setIsMember(false);
      toast({
        title: "Success",
        description: "You have left the community",
      });
    } catch (error) {
      console.error("Error leaving community:", error);
      toast({
        title: "Error",
        description: "Failed to leave community",
        variant: "destructive",
      });
    }
  };

  const handleCreatePost = () => {
    setShowCreateModal(true);
  };

  const handlePostCreated = () => {
    setShowCreateModal(false);
    fetchCommunityPosts();
    toast({
      title: "Success",
      description: "Post created successfully!",
    });
  };

  // Effects
  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  useEffect(() => {
    if (activeTab === "posts" && community) {
      fetchCommunityPosts();
    }
  }, [activeTab, community, fetchCommunityPosts]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  if (!community) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Community Not Found
          </h1>
          <p className="text-gray-600">
            The community you're looking for doesn't exist or you don't have
            access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <CommunityDetailHeader
        community={community}
        isMember={isMember}
        isAdmin={isAdmin}
        onJoinCommunity={handleJoinCommunity}
        onLeaveCommunity={handleLeaveCommunity}
      />

      {/* Main Content */}
      <div className="flex-1 flex h-0">
        {/* Left Sidebar */}
        <CommunityLeftSidebar
          filters={filters}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          onCreatePost={handleCreatePost}
          isMember={isMember}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <CommunityDetailTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
            >
              {activeTab === "posts" ? (
                <CommunityPostsTab
                  posts={posts}
                  postsLoading={postsLoading}
                  filteredPosts={filteredPosts}
                  onRefreshPosts={fetchCommunityPosts}
                />
              ) : (
                <>
                  <CommunityAboutTab
                    community={community}
                    isMember={isMember}
                    isAdmin={isAdmin}
                    onJoinCommunity={handleJoinCommunity}
                    onLeaveCommunity={handleLeaveCommunity}
                    onCreatePost={handleCreatePost}
                  />
                  <CommunityMobileSidebar
                    community={community}
                    isMember={isMember}
                    isAdmin={isAdmin}
                    onJoinCommunity={handleJoinCommunity}
                    onLeaveCommunity={handleLeaveCommunity}
                    onCreatePost={handleCreatePost}
                    filters={filters}
                    onFilterChange={updateFilter}
                    onClearFilters={clearFilters}
                  />
                </>
              )}
            </CommunityDetailTabs>
          </div>
        </div>

        {/* Right Sidebar */}
        <CommunityRightSidebar
          community={community}
          isMember={isMember}
          isAdmin={isAdmin}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
          onCreatePost={handleCreatePost}
          onTagClick={handleTagClick}
        />
      </div>

      {/* Create Discussion Modal */}
      {showCreateModal && (
        <CreateDiscussionModal
          isOpen={showCreateModal}
          communityId={id!}
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default CommunityDetailNew;
