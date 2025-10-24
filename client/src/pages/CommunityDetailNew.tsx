import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
  ModeratorDashboard,
  CommunityMembersTab,
  CommunityJoinRequestsTab,
  CommunityModeratorsTab,
  ReportsTab,
  EditCommunityModal,
  DeleteCommunityModal,
  Community,
  CommunityPost,
  PostFilters,
} from "@/components/community/index";

const CommunityDetailNew: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  // Helper function to get auth token
  const getAuthToken = (): string => {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem("token");
    if (!token) {
      token = sessionStorage.getItem("token");
    }
    if (!token) {
      // Redirect to login if no token found
      console.log("No token found, redirecting to login");
      navigate("/login");
      throw new Error("Access token is required");
    }

    // Debug: Log token info (remove in production)
    console.log(
      "Token found:",
      token ? "Yes" : "No",
      "Length:",
      token?.length || 0
    );

    return token;
  };

  // State
  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("posts");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [requiresMembership, setRequiresMembership] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<PostFilters>({
    search: "",
    category: "all",
    priority: "all",
    sortBy: "newest",
  });

  // Check user's membership status
  const checkMembershipStatus = useCallback(async () => {
    if (!id || !user?._id) return;

    try {
      // Try to fetch community details - this will tell us if user is a member
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${id}`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const communityData = data.data.community || data.data;

        // If we get full community data (not just basic info), user is a member
        if (communityData.members && Array.isArray(communityData.members)) {
          const userMembership = communityData.members.find(
            (member: { _id: string }) => member._id === user._id
          );

          if (userMembership) {
            setIsMember(true);
          }
        }
      } else if (response.status === 403) {
        // User is not a member of private community
        // Pending request status will be checked separately
      }
    } catch (error) {
      console.error("Error checking membership status:", error);
    }
  }, [id, user?._id]);

  // Check if user has a pending request
  const checkPendingRequest = useCallback(async () => {
    if (!id || !user?._id) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${id}/membership-status`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const responseData = await response.json();

      if (responseData.success && responseData.data) {
        const { isMember, hasPendingRequest } = responseData.data;
        setIsMember(isMember);
        setHasPendingRequest(hasPendingRequest);
      }
    } catch (error) {
      console.error("🔍 Error checking membership status:", error);
    }
  }, [id, user?._id]);

  // Fetch community data
  const fetchCommunity = useCallback(async () => {
    if (!id) {
      console.error("No community ID found in URL params");
      return;
    }

    const url = `${
      import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
    }/communities/${id}`;

    try {
      setLoading(true);
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
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

        // Handle 401 Unauthorized - redirect to login
        if (response.status === 401) {
          console.log("401 Unauthorized - redirecting to login");
          toast({
            title: "Session Expired",
            description: "Please log in again to continue",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        throw new Error(
          `Failed to fetch community: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const communityData = data.data.community || data.data;
      setCommunity(communityData);
      setRequiresMembership(data.data.requiresMembership || false);

      // Check if user is member, moderator, or admin
      const userId = user?._id;
      if (userId && communityData) {
        const memberCheck = communityData.members?.some(
          (member: { _id: string }) => member._id === userId
        );
        const moderatorCheck = communityData.moderators?.some(
          (mod: { _id: string }) => mod._id === userId
        );
        const adminCheck =
          communityData.createdBy?._id === userId ||
          user?.role === "super_admin" ||
          user?.role === "college_admin";

        setIsMember(!!memberCheck);
        setIsModerator(!!moderatorCheck);
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
  }, [id, user?._id, user?.role, toast]);

  // Fetch community posts
  const fetchCommunityPosts = useCallback(async () => {
    if (!id) return;

    try {
      setPostsLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.category !== "all") {
        params.append("category", filters.category);
      }

      const queryString = params.toString();
      const url = `${
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
      }/community-posts/community/${id}${queryString ? `?${queryString}` : ""}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

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
  }, [id, filters.category, toast]);

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

    // Don't allow joining if already a member or has pending request
    if (isMember) {
      toast({
        title: "Already a Member",
        description: "You are already a member of this community.",
        variant: "default",
      });
      return;
    }

    if (hasPendingRequest) {
      toast({
        title: "Request Already Pending",
        description: "You already have a pending request for this community.",
        variant: "default",
      });
      return;
    }

    const targetId = id;

    // Use the ID from URL params (always a string)
    const communityIdString = targetId;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${communityIdString}/join`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        // Check if it's an "already pending" error
        if (
          response.status === 400 &&
          responseData.message?.includes("pending")
        ) {
          setHasPendingRequest(true);
          toast({
            title: "Request Already Pending",
            description:
              "You already have a pending request for this community.",
            variant: "default",
          });
          return;
        }
        throw new Error("Failed to join community");
      }

      // Check if it's a direct join or pending request
      if (responseData.message === "Successfully joined community") {
        setIsMember(true);
        setHasPendingRequest(false);
        toast({
          title: "Success",
          description: "You have joined the community!",
        });
      } else if (responseData.message === "Membership request sent") {
        setHasPendingRequest(true);
        toast({
          title: "Request Sent",
          description:
            "Your request to join has been sent to the community admins.",
        });
      } else {
        // Handle other success cases (like "Request processed successfully")
        if (
          responseData.message?.includes("pending") ||
          responseData.message?.includes("request")
        ) {
          setHasPendingRequest(true);
        }
        toast({
          title: "Success",
          description: responseData.message || "Request processed successfully",
        });
      }
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
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${id}/leave`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
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

  // Handle edit community
  const handleEditCommunity = () => {
    setShowEditModal(true);
  };

  // Handle delete community
  const handleDeleteCommunity = () => {
    setShowDeleteModal(true);
  };

  // Handle successful edit/delete
  const handleCommunityUpdate = () => {
    fetchCommunity(); // Refresh community data
  };

  // Handle successful delete - redirect to communities page
  const handleCommunityDelete = () => {
    // Redirect to communities page after successful deletion
    window.location.href = "/community";
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
    checkMembershipStatus();
    checkPendingRequest(); // Always check pending request status
  }, [fetchCommunity, checkMembershipStatus, checkPendingRequest]);

  useEffect(() => {
    if (activeTab === "posts" && community) {
      fetchCommunityPosts();
    }
  }, [activeTab, community, fetchCommunityPosts]);

  useEffect(() => {
    fetchCommunityPosts();
  }, [fetchCommunityPosts]);

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
        onEditCommunity={handleEditCommunity}
        onDeleteCommunity={handleDeleteCommunity}
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
            {requiresMembership && !isMember ? (
              /* Membership Required Section */
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Join {community?.name} to Access Content
                  </h2>
                  <p className="text-gray-600 mb-6">
                    This is a private community. You need to be a member to view
                    posts, discussions, and other content.
                  </p>
                  <div className="space-y-4">
                    {hasPendingRequest ? (
                      <>
                        <Button
                          disabled
                          className="w-full bg-gray-400 text-white px-6 py-3 rounded-lg font-medium cursor-not-allowed"
                        >
                          Request Pending
                        </Button>
                        <p className="text-sm text-gray-500">
                          Your request is pending approval from community
                          administrators
                        </p>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={handleJoinCommunity}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
                        >
                          Request to Join Community
                        </Button>
                        <p className="text-sm text-gray-500">
                          Your request will be reviewed by community
                          administrators
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <CommunityDetailTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isModerator={isModerator || isAdmin}
                isAdmin={isAdmin}
              >
                {activeTab === "posts" ? (
                  <CommunityPostsTab
                    posts={posts}
                    postsLoading={postsLoading}
                    filteredPosts={filteredPosts}
                    onRefreshPosts={fetchCommunityPosts}
                  />
                ) : activeTab === "about" ? (
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
                ) : activeTab === "members" ? (
                  <CommunityMembersTab
                    communityId={id || ""}
                    isAdmin={isAdmin}
                    onRoleChange={fetchCommunity}
                  />
                ) : activeTab === "join-requests" ? (
                  <CommunityJoinRequestsTab communityId={id || ""} />
                ) : activeTab === "moderators" ? (
                  <CommunityModeratorsTab
                    communityId={id || ""}
                    isAdmin={isAdmin}
                    onRoleChange={fetchCommunity}
                  />
                ) : activeTab === "reports" ? (
                  <ReportsTab
                    communityId={id || ""}
                    isAdmin={isAdmin}
                    isModerator={isModerator}
                  />
                ) : activeTab === "admin" ? (
                  <ModeratorDashboard
                    communityId={id || ""}
                    isAdmin={isAdmin}
                  />
                ) : (
                  <ModeratorDashboard
                    communityId={id || ""}
                    isAdmin={isAdmin}
                  />
                )}
              </CommunityDetailTabs>
            )}
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

      {/* Edit Community Modal */}
      <EditCommunityModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        community={community}
        onSuccess={handleCommunityUpdate}
      />

      {/* Delete Community Modal */}
      <DeleteCommunityModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        community={community}
        onSuccess={handleCommunityDelete}
      />
    </div>
  );
};

export default CommunityDetailNew;
