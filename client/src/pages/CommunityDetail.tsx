import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Users,
  MessageCircle,
  Clock,
  Globe,
  BookOpen,
  Settings,
  MoreVertical,
  Heart,
  Share2,
  Users2,
  Calendar,
  MapPin,
  GraduationCap,
  Building,
  Star,
  TrendingUp,
  Zap,
  Briefcase,
  UserPlus,
  Pin,
  Flag,
  Megaphone,
  Microscope,
  Sparkles,
  Target,
  HandHeart,
  Telescope,
  Lightbulb,
  UserCheck,
  Crown,
  Shield,
  Activity,
  BarChart3,
  User,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Github,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import CreateDiscussionModal from "@/components/CreateDiscussionModal";

// Interfaces
interface Community {
  _id: string;
  name: string;
  description: string;
  type: "open" | "closed" | "hidden";
  category:
    | "department"
    | "batch"
    | "interest"
    | "professional"
    | "location"
    | "academic_research"
    | "professional_career"
    | "entrepreneurship_startups"
    | "social_hobby"
    | "mentorship_guidance"
    | "events_meetups"
    | "community_support_volunteering"
    | "technology_deeptech"
    | "regional_chapter_based"
    | "other";
  banner?: string;
  logo?: string;
  coverImage?: string;
  isPublic: boolean;
  owner?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email?: string;
    fullName?: string;
  };
  admins?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email?: string;
    fullName?: string;
  }>;
  members?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email?: string;
    fullName?: string;
  }>;
  moderators?: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    email?: string;
    fullName?: string;
  }>;
  rules?: string[];
  tags: string[];
  externalLinks?: {
    website?: string;
    github?: string;
    slack?: string;
    discord?: string;
    other?: string;
  };
  memberCount: number;
  postCount: number;
  isActive: boolean;
  createdAt: string;
}

interface CommunityPost {
  _id: string;
  title?: string;
  content: string;
  author?: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    graduationYear?: string;
    company?: string;
    position?: string;
  };
  community: string;
  type: "text" | "image" | "file" | "link" | "poll" | "event";
  mediaUrls?: string[];
  tags?: string[];
  likes: number;
  comments: number;
  views: number;
  isPinned: boolean;
  isAnnouncement: boolean;
  priority?: "high" | "medium" | "low";
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const CommunityDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  console.log("CommunityDetail component rendered for ID:", id);

  // State management
  const [community, setCommunity] = useState<Community | null>(null);
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [activeTab, setActiveTab] = useState("posts");
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showCreateDiscussion, setShowCreateDiscussion] = useState(false);

  // Category icons mapping
  const getCategoryIcon = (category: string | undefined) => {
    if (!category) return Globe;

    const categoryIcons: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      department: Building,
      batch: GraduationCap,
      interest: Heart,
      professional: Briefcase,
      location: MapPin,
      academic_research: Microscope,
      professional_career: TrendingUp,
      entrepreneurship_startups: Zap,
      social_hobby: Users2,
      mentorship_guidance: UserCheck,
      events_meetups: Calendar,
      community_support_volunteering: HandHeart,
      technology_deeptech: Telescope,
      regional_chapter_based: Pin,
      sports: Star,
      cultural: Sparkles,
      other: Globe,
    };
    return categoryIcons[category] || Globe;
  };

  // Fetch community details
  const fetchCommunity = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/communities/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      console.log("Community API response:", data);

      if (data.success) {
        // Handle nested community data structure
        const communityData = data.data.community || data.data;
        console.log("Community data:", communityData);
        setCommunity(communityData);

        // Check if user is member or admin
        if (user) {
          const memberCheck = communityData.members?.some(
            (member: { _id: string }) => member._id === user._id
          );
          const adminCheck =
            communityData.admins?.some(
              (admin: { _id: string }) => admin._id === user._id
            ) ||
            communityData.moderators?.some(
              (moderator: { _id: string }) => moderator._id === user._id
            ) ||
            communityData.createdBy?._id === user._id ||
            communityData.owner?._id === user._id;

          setIsMember(memberCheck || false);
          setIsAdmin(adminCheck || false);
        }
      } else {
        setError("Community not found");
      }
    } catch (err) {
      setError("Failed to fetch community");
      console.error("Error fetching community:", err);
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  // Fetch community posts
  const fetchCommunityPosts = useCallback(async () => {
    if (!id) return;

    try {
      setPostsLoading(true);
      console.log("Fetching posts for community:", id);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/community-posts/community/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      console.log("Posts API response:", data);

      if (data.success) {
        setCommunityPosts(data.data.posts || []);
      }
    } catch (err) {
      console.error("Error fetching community posts:", err);
    } finally {
      setPostsLoading(false);
    }
  }, [id]);

  // Join community
  const handleJoinCommunity = async () => {
    if (!community) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/communities/${community._id}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setIsMember(true);
        fetchCommunity(); // Refresh community data
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to join community.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to join community. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle post creation success
  const handlePostCreated = () => {
    fetchCommunityPosts(); // Refresh posts list
    fetchCommunity(); // Refresh community data to update post count
  };

  // Leave community
  const handleLeaveCommunity = async () => {
    if (!community) return;

    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/communities/${community._id}/leave`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: data.message,
        });
        setIsMember(false);
        fetchCommunity(); // Refresh community data
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to leave community.",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to leave community. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [fetchCommunity]);

  useEffect(() => {
    if (activeTab === "posts" && community) {
      fetchCommunityPosts();
    }
  }, [activeTab, fetchCommunityPosts, community]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading community...</p>
        </div>
      </div>
    );
  }

  if (error || !community) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {error || "Community not found"}
          </h3>
          <Button onClick={() => navigate("/community")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Communities
          </Button>
        </div>
      </div>
    );
  }

  const CategoryIcon = getCategoryIcon(community?.category);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Back to Communities Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="w-full px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/community")}
                className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">
                  Back to Communities
                </span>
              </Button>
              <div className="h-4 sm:h-6 w-px bg-gray-300 hidden sm:block flex-shrink-0"></div>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
                  {community?.logo ? (
                    <img
                      src={community.logo}
                      alt={`${community.name} logo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CategoryIcon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  )}
                </div>
                <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
                  {community?.name || "Community"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {isMember ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLeaveCommunity}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Leave
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleJoinCommunity}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Join
                </Button>
              )}
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  <Settings className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Manage</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Container - Full Screen */}
      <div className="flex-1 overflow-hidden">
        <div className="w-full h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
          <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 h-full">
            {/* Main Content Area */}
            <div className="flex-1 min-w-0 overflow-y-auto">
              <div className="space-y-4 sm:space-y-6">
                {/* Community Description Card */}
                <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 flex-shrink-0">
                      {community?.logo ? (
                        <img
                          src={community.logo}
                          alt={`${community.name} logo`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <CategoryIcon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        {community?.name || "Community"}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CategoryIcon className="w-4 h-4" />
                          <span className="capitalize">
                            {community?.category?.replace(/_/g, " ")}
                          </span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <span>{community?.memberCount || 0} members</span>
                        {community?.isPublic ? (
                          <Badge variant="secondary" className="text-xs">
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                    {community?.description || "No description available"}
                  </p>
                </div>
                {/* Community Cover Image */}
                {community?.coverImage && (
                  <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="relative h-32 sm:h-48 lg:h-64 xl:h-72 bg-gradient-to-r from-blue-600 to-purple-600">
                      <img
                        src={community.coverImage}
                        alt={`${community.name} cover`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    </div>
                  </div>
                )}

                {/* Community Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                            Discussions
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                            {community?.postCount || 0}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-blue-50 rounded-full flex-shrink-0">
                          <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                            Members
                          </p>
                          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                            {community?.memberCount || 0}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-green-50 rounded-full flex-shrink-0">
                          <Users className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white shadow-sm col-span-2 sm:col-span-1">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">
                            Created
                          </p>
                          <p className="text-sm sm:text-lg font-semibold text-gray-900">
                            {community?.createdAt
                              ? new Date(
                                  community.createdAt
                                ).toLocaleDateString()
                              : "Unknown"}
                          </p>
                        </div>
                        <div className="p-2 sm:p-3 bg-orange-50 rounded-full flex-shrink-0">
                          <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Community Tabs */}
                <div className="bg-white rounded-lg shadow-sm">
                  <Tabs
                    value={activeTab}
                    onValueChange={setActiveTab}
                    className="w-full"
                  >
                    <div className="p-4 sm:p-6 pb-0">
                      <TabsList className="grid w-full grid-cols-3 h-auto">
                        <TabsTrigger
                          value="posts"
                          className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
                        >
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Posts</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="about"
                          className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
                        >
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">About</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="members"
                          className="flex items-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm"
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden xs:inline">Members</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Posts Tab Content */}
                    <TabsContent
                      value="posts"
                      className="p-4 sm:p-6 pt-4 space-y-4"
                    >
                      {postsLoading ? (
                        <div className="text-center py-12">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                          <p className="text-gray-600">Loading posts...</p>
                        </div>
                      ) : communityPosts.length === 0 ? (
                        <div className="text-center py-12">
                          <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No posts yet
                          </h3>
                          <p className="text-gray-500 mb-4">
                            Be the first to start a discussion in this
                            community!
                          </p>
                          <div className="flex gap-2 justify-center">
                            {isMember && (
                              <Button
                                onClick={() => setShowCreateDiscussion(true)}
                              >
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Create Post
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              onClick={fetchCommunityPosts}
                              disabled={postsLoading}
                            >
                              <Activity className="w-4 h-4 mr-2" />
                              {postsLoading ? "Refreshing..." : "Refresh Posts"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {/* Posts Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <h3 className="text-base sm:text-lg font-semibold">
                              Community Posts ({communityPosts.length})
                            </h3>
                            <div className="flex gap-2 flex-wrap">
                              {isMember && (
                                <Button
                                  size="sm"
                                  className="text-xs sm:text-sm"
                                  onClick={() => setShowCreateDiscussion(true)}
                                >
                                  <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                  <span className="hidden sm:inline">
                                    Create Post
                                  </span>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchCommunityPosts}
                                disabled={postsLoading}
                                className="text-xs sm:text-sm"
                              >
                                <Activity className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                                <span className="hidden sm:inline">
                                  {postsLoading ? "Refreshing..." : "Refresh"}
                                </span>
                                <span className="sm:hidden">
                                  {postsLoading ? "..." : "↻"}
                                </span>
                              </Button>
                            </div>
                          </div>

                          {communityPosts.map((post) => (
                            <Card
                              key={post._id}
                              className="hover:shadow-md transition-shadow"
                            >
                              <CardContent className="p-4 sm:p-6">
                                {/* Post Header */}
                                <div className="flex items-start gap-3 sm:gap-4 mb-4">
                                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
                                    {post.author?.profileImage ? (
                                      <img
                                        src={post.author?.profileImage}
                                        alt={`${post.author?.firstName} ${post.author?.lastName}`}
                                        className="w-full h-full rounded-full object-cover"
                                      />
                                    ) : (
                                      <span className="text-white font-semibold text-sm sm:text-base">
                                        {post.author?.firstName?.[0] || "?"}
                                        {post.author?.lastName?.[0] || "?"}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    {/* Author Info */}
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                        {post.author?.firstName || "Unknown"}{" "}
                                        {post.author?.lastName || "User"}
                                      </h3>
                                      {post.author?.graduationYear && (
                                        <span className="text-xs sm:text-sm text-gray-500">
                                          Class of {post.author.graduationYear}
                                        </span>
                                      )}
                                    </div>

                                    {/* Company Info */}
                                    {post.author?.company && (
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-blue-600">
                                          {post.author.position || "Employee"}{" "}
                                          at {post.author.company}
                                        </span>
                                      </div>
                                    )}

                                    {/* Post Meta */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                      <span>•</span>
                                      <span>
                                        {new Date(
                                          post.createdAt
                                        ).toLocaleString()}
                                      </span>
                                      {post.isPinned && (
                                        <>
                                          <span>•</span>
                                          <Badge
                                            variant="secondary"
                                            className="text-xs"
                                          >
                                            <Pin className="w-3 h-3 mr-1" />
                                            Pinned
                                          </Badge>
                                        </>
                                      )}
                                      {post.isAnnouncement && (
                                        <>
                                          <span>•</span>
                                          <Badge
                                            variant="default"
                                            className="text-xs"
                                          >
                                            <Megaphone className="w-3 h-3 mr-1" />
                                            Announcement
                                          </Badge>
                                        </>
                                      )}
                                      {post.priority && (
                                        <>
                                          <span>•</span>
                                          <Badge
                                            variant={
                                              post.priority === "high"
                                                ? "destructive"
                                                : post.priority === "medium"
                                                ? "default"
                                                : "secondary"
                                            }
                                            className="text-xs"
                                          >
                                            {post.priority === "high"
                                              ? "High Priority"
                                              : post.priority === "medium"
                                              ? "Medium Priority"
                                              : "Low Priority"}
                                          </Badge>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Post Title */}
                                {post.title && (
                                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                                    {post.title}
                                  </h2>
                                )}

                                {/* Post Category */}
                                {post.category && (
                                  <div className="mb-3">
                                    <Badge
                                      variant="outline"
                                      className="text-xs font-medium"
                                    >
                                      {post.category}
                                    </Badge>
                                  </div>
                                )}

                                {/* Post Content */}
                                <div className="mb-4">
                                  <p className="text-gray-700 text-sm sm:text-base leading-relaxed whitespace-pre-wrap">
                                    {post.content.length > 300 ? (
                                      <>
                                        {post.content.substring(0, 300)}...
                                        <button className="text-blue-600 hover:text-blue-800 ml-1 font-medium">
                                          Read more
                                        </button>
                                      </>
                                    ) : (
                                      post.content
                                    )}
                                  </p>
                                </div>

                                {/* Post Images */}
                                {post.mediaUrls &&
                                  post.mediaUrls.length > 0 && (
                                    <div className="mb-4">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {post.mediaUrls.map(
                                          (imageUrl, index) => (
                                            <div
                                              key={index}
                                              className="relative group"
                                            >
                                              <div className="relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                                <img
                                                  src={imageUrl}
                                                  alt={`Post image ${
                                                    index + 1
                                                  }`}
                                                  className="w-full h-48 sm:h-56 object-cover hover:scale-105 transition-transform duration-200 cursor-pointer"
                                                  onError={(e) => {
                                                    console.error(
                                                      "Post image failed to load:",
                                                      imageUrl
                                                    );
                                                    const img =
                                                      e.target as HTMLImageElement;
                                                    img.style.display = "none";
                                                  }}
                                                  onLoad={() => {
                                                    console.log(
                                                      "Post image loaded successfully:",
                                                      imageUrl
                                                    );
                                                  }}
                                                  onClick={() => {
                                                    // Open image in new tab
                                                    window.open(
                                                      imageUrl,
                                                      "_blank"
                                                    );
                                                  }}
                                                />
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center">
                                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2">
                                                    <svg
                                                      className="w-6 h-6 text-gray-700"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      viewBox="0 0 24 24"
                                                    >
                                                      <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                                      />
                                                    </svg>
                                                  </div>
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-500 mt-1 text-center">
                                                Click to view full size
                                              </p>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}

                                {/* Tags */}
                                {post.tags && post.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {post.tags.map((tag, index) => (
                                      <Badge
                                        key={index}
                                        variant="secondary"
                                        className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100"
                                      >
                                        #{tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {/* Engagement Stats */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                  <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500">
                                    <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                                      <Heart className="w-4 h-4" />
                                      {post.likes}
                                    </span>
                                    <span className="flex items-center gap-1 hover:text-blue-600 cursor-pointer">
                                      <MessageCircle className="w-4 h-4" />
                                      {post.comments} replies
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {post.views} views
                                    </span>
                                  </div>

                                  {/* Last Reply Info */}
                                  {post.comments > 0 && (
                                    <div className="text-xs text-gray-500">
                                      Last reply by{" "}
                                      <span className="font-medium text-gray-700">
                                        Vikram Singh
                                      </span>{" "}
                                      <span className="text-gray-400">
                                        15m ago
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* About Tab Content */}
                    <TabsContent
                      value="about"
                      className="p-4 sm:p-6 pt-4 space-y-4 sm:space-y-6"
                    >
                      {/* Community Overview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Info className="w-5 h-5" />
                            Community Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Description */}
                          <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              About This Community
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                              {community?.description ||
                                "No description available"}
                            </p>
                          </div>

                          {/* Category and Tags */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Category
                              </h3>
                              <Badge
                                variant="outline"
                                className="flex items-center gap-1 w-fit"
                              >
                                <CategoryIcon className="w-3 h-3" />
                                {community?.category
                                  ? community.category
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())
                                  : "Unknown"}
                              </Badge>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Visibility
                              </h3>
                              <Badge
                                variant={
                                  community?.isPublic ? "default" : "secondary"
                                }
                              >
                                {community?.isPublic ? (
                                  <>
                                    <Globe className="w-3 h-3 mr-1" />
                                    Public
                                  </>
                                ) : (
                                  <>
                                    <Shield className="w-3 h-3 mr-1" />
                                    Private
                                  </>
                                )}
                              </Badge>
                            </div>
                          </div>

                          {/* Tags */}
                          {community?.tags && community.tags.length > 0 && (
                            <div>
                              <h3 className="text-sm font-medium text-gray-700 mb-2">
                                Topics & Tags
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {community.tags.map((tag, index) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Community Leadership */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5" />
                            Community Leadership
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Owner/Creator */}
                          {(community?.owner || community?.createdBy) && (
                            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                {community.owner?.profileImage ||
                                community.createdBy?.profileImage ? (
                                  <img
                                    src={
                                      community.owner?.profileImage ||
                                      community.createdBy?.profileImage
                                    }
                                    alt={`${
                                      community.owner?.firstName ||
                                      community.createdBy?.firstName
                                    } ${
                                      community.owner?.lastName ||
                                      community.createdBy?.lastName
                                    }`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-lg">
                                    {
                                      (community.owner?.firstName ||
                                        community.createdBy?.firstName)?.[0]
                                    }
                                    {
                                      (community.owner?.lastName ||
                                        community.createdBy?.lastName)?.[0]
                                    }
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">
                                    {community.owner?.firstName ||
                                      community.createdBy?.firstName}{" "}
                                    {community.owner?.lastName ||
                                      community.createdBy?.lastName}
                                  </h4>
                                  <Badge variant="default" className="text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Owner
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">
                                  Community Founder
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Admins */}
                          {community?.admins && community.admins.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Administrators ({community.admins.length})
                              </h4>
                              <div className="space-y-2">
                                {community.admins.map((admin, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                      {admin.profileImage ? (
                                        <img
                                          src={admin.profileImage}
                                          alt={`${admin.firstName} ${admin.lastName}`}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-white font-semibold text-sm">
                                          {admin.firstName[0]}
                                          {admin.lastName[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {admin.firstName} {admin.lastName}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          <Shield className="w-3 h-3 mr-1" />
                                          Admin
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Community Statistics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Community Statistics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-blue-600">
                                {community?.memberCount || 0}
                              </p>
                              <p className="text-sm text-gray-600">
                                Total Members
                              </p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <MessageCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-green-600">
                                {community?.postCount || 0}
                              </p>
                              <p className="text-sm text-gray-600">
                                Total Posts
                              </p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600">
                                {community?.isActive ? "Active" : "Inactive"}
                              </p>
                              <p className="text-sm text-gray-600">Status</p>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                              <p className="text-lg font-bold text-orange-600">
                                {community?.createdAt
                                  ? new Date(
                                      community.createdAt
                                    ).toLocaleDateString()
                                  : "Unknown"}
                              </p>
                              <p className="text-sm text-gray-600">Created</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* External Links */}
                      {community?.externalLinks && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <ExternalLink className="w-5 h-5" />
                              External Resources
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {community.externalLinks.website && (
                                <a
                                  href={community.externalLinks.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <Globe className="w-5 h-5 text-blue-600" />
                                  <div>
                                    <p className="font-medium">Website</p>
                                    <p className="text-sm text-gray-600">
                                      Official website
                                    </p>
                                  </div>
                                </a>
                              )}
                              {community.externalLinks.github && (
                                <a
                                  href={community.externalLinks.github}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <Github className="w-5 h-5 text-gray-800" />
                                  <div>
                                    <p className="font-medium">GitHub</p>
                                    <p className="text-sm text-gray-600">
                                      Code repository
                                    </p>
                                  </div>
                                </a>
                              )}
                              {community.externalLinks.slack && (
                                <a
                                  href={community.externalLinks.slack}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <MessageCircle className="w-5 h-5 text-purple-600" />
                                  <div>
                                    <p className="font-medium">Slack</p>
                                    <p className="text-sm text-gray-600">
                                      Team communication
                                    </p>
                                  </div>
                                </a>
                              )}
                              {community.externalLinks.discord && (
                                <a
                                  href={community.externalLinks.discord}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <Users className="w-5 h-5 text-indigo-600" />
                                  <div>
                                    <p className="font-medium">Discord</p>
                                    <p className="text-sm text-gray-600">
                                      Community chat
                                    </p>
                                  </div>
                                </a>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      {/* Community Rules */}
                      {community?.rules && community.rules.length > 0 && (
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <BookOpen className="w-5 h-5" />
                              Community Guidelines
                            </CardTitle>
                            <CardDescription>
                              Please follow these guidelines to maintain a
                              positive community environment
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {community.rules.map((rule, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                                >
                                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-gray-700">{rule}</p>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Members Tab Content */}
                    <TabsContent
                      value="members"
                      className="p-4 sm:p-6 pt-4 space-y-4 sm:space-y-6"
                    >
                      {/* Member Statistics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Member Directory
                          </CardTitle>
                          <CardDescription>
                            {community?.memberCount || 0} members in this
                            community
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-blue-600">
                                {community?.memberCount || 0}
                              </p>
                              <p className="text-sm text-gray-600">
                                Total Members
                              </p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                              <UserCheck className="w-8 h-8 text-green-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-green-600">
                                {(community?.admins?.length || 0) +
                                  (community?.moderators?.length || 0) +
                                  1}
                              </p>
                              <p className="text-sm text-gray-600">Admins</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                              <p className="text-2xl font-bold text-purple-600">
                                {community?.isActive ? "Active" : "Inactive"}
                              </p>
                              <p className="text-sm text-gray-600">
                                Community Status
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Community Leadership */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5" />
                            Community Leadership
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Owner/Creator */}
                          {(community?.owner || community?.createdBy) && (
                            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                {community.owner?.profileImage ||
                                community.createdBy?.profileImage ? (
                                  <img
                                    src={
                                      community.owner?.profileImage ||
                                      community.createdBy?.profileImage
                                    }
                                    alt={`${
                                      community.owner?.firstName ||
                                      community.createdBy?.firstName
                                    } ${
                                      community.owner?.lastName ||
                                      community.createdBy?.lastName
                                    }`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-xl">
                                    {
                                      (community.owner?.firstName ||
                                        community.createdBy?.firstName)?.[0]
                                    }
                                    {
                                      (community.owner?.lastName ||
                                        community.createdBy?.lastName)?.[0]
                                    }
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-lg font-semibold">
                                    {community.owner?.firstName ||
                                      community.createdBy?.firstName}{" "}
                                    {community.owner?.lastName ||
                                      community.createdBy?.lastName}
                                  </h4>
                                  <Badge variant="default" className="text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Owner
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  Community Founder & Leader
                                </p>
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Joined{" "}
                                    {community?.createdAt
                                      ? new Date(
                                          community.createdAt
                                        ).toLocaleDateString()
                                      : "Unknown"}
                                  </span>
                                </div>
                              </div>
                              <Button variant="outline" size="sm">
                                <User className="w-4 h-4 mr-1" />
                                View Profile
                              </Button>
                            </div>
                          )}

                          {/* Admins */}
                          {community?.admins && community.admins.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-3">
                                Administrators ({community.admins.length})
                              </h4>
                              <div className="space-y-3">
                                {community.admins.map((admin, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-4 p-3 bg-blue-50 rounded-lg border"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                                      {admin.profileImage ? (
                                        <img
                                          src={admin.profileImage}
                                          alt={`${admin.firstName} ${admin.lastName}`}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-white font-semibold text-sm">
                                          {admin.firstName[0]}
                                          {admin.lastName[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium">
                                          {admin.firstName} {admin.lastName}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          <Shield className="w-3 h-3 mr-1" />
                                          Admin
                                        </Badge>
                                      </div>
                                      <p className="text-sm text-gray-600">
                                        Community Administrator
                                      </p>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <User className="w-4 h-4 mr-1" />
                                      View Profile
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Moderators */}
                          {community?.moderators &&
                            community.moderators.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                  Moderators ({community.moderators.length})
                                </h4>
                                <div className="space-y-3">
                                  {community.moderators.map(
                                    (moderator, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border"
                                      >
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-500 flex items-center justify-center">
                                          {moderator.profileImage ? (
                                            <img
                                              src={moderator.profileImage}
                                              alt={`${moderator.firstName} ${moderator.lastName}`}
                                              className="w-full h-full rounded-full object-cover"
                                            />
                                          ) : (
                                            <span className="text-white font-semibold text-sm">
                                              {moderator.firstName[0]}
                                              {moderator.lastName[0]}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium">
                                              {moderator.firstName}{" "}
                                              {moderator.lastName}
                                            </span>
                                            <Badge
                                              variant="secondary"
                                              className="text-xs"
                                            >
                                              <Shield className="w-3 h-3 mr-1" />
                                              Moderator
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-gray-600">
                                            Community Moderator
                                          </p>
                                        </div>
                                        <Button variant="outline" size="sm">
                                          <User className="w-4 h-4 mr-1" />
                                          View Profile
                                        </Button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </CardContent>
                      </Card>

                      {/* Member List */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users2 className="w-5 h-5" />
                            All Members
                          </CardTitle>
                          <CardDescription>
                            Browse through all community members
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {community?.members &&
                          community.members.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {community.members
                                .slice(0, 12)
                                .map((member, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
                                      {member.profileImage ? (
                                        <img
                                          src={member.profileImage}
                                          alt={`${member.firstName} ${member.lastName}`}
                                          className="w-full h-full rounded-full object-cover"
                                        />
                                      ) : (
                                        <span className="text-white font-semibold text-sm">
                                          {member.firstName[0]}
                                          {member.lastName[0]}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-sm">
                                        {member.firstName} {member.lastName}
                                      </h5>
                                      <p className="text-xs text-gray-500">
                                        Community Member
                                      </p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                      <User className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              {community.members.length > 12 && (
                                <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
                                  <div className="text-center">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">
                                      +{community.members.length - 12} more
                                      members
                                    </p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                    >
                                      View All
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No Members Yet
                              </h3>
                              <p className="text-gray-500 mb-4">
                                This community doesn't have any members yet.
                              </p>
                              {!isMember && (
                                <Button onClick={handleJoinCommunity}>
                                  <UserPlus className="w-4 h-4 mr-2" />
                                  Be the First Member
                                </Button>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="hidden xl:block w-80 flex-shrink-0">
                <div className="sticky top-4 space-y-4 sm:space-y-6">
                  {/* Community Info Card */}
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
                          {community?.category}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Type
                        </span>
                        <Badge
                          variant={
                            community?.isPublic ? "secondary" : "outline"
                          }
                          className="text-xs"
                        >
                          {community?.isPublic ? "Public" : "Private"}
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
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">
                          Posts
                        </span>
                        <span className="text-xs sm:text-sm font-medium">
                          {community?.postCount || 0}
                        </span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Tags */}
                  {community?.tags && community.tags.length > 0 && (
                    <Card className="bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                          Tags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {community.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* External Links */}
                  {community?.externalLinks && (
                    <Card className="bg-white shadow-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                          Links
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {community.externalLinks.website && (
                          <a
                            href={community.externalLinks.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                            Website
                          </a>
                        )}
                        {community.externalLinks.github && (
                          <a
                            href={community.externalLinks.github}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                            GitHub
                          </a>
                        )}
                        {community.externalLinks.slack && (
                          <a
                            href={community.externalLinks.slack}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
                            Slack
                          </a>
                        )}
                        {community.externalLinks.discord && (
                          <a
                            href={community.externalLinks.discord}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Globe className="w-3 h-3 sm:w-4 sm:h-4" />
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
                            onClick={() => setShowCreateDiscussion(true)}
                          >
                            <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              Create Post
                            </span>
                            <span className="sm:hidden">Create</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start text-xs sm:text-sm"
                            onClick={handleLeaveCommunity}
                          >
                            <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                            <span className="hidden sm:inline">
                              Leave Community
                            </span>
                            <span className="sm:hidden">Leave</span>
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleJoinCommunity}
                          size="sm"
                          className="w-full text-xs sm:text-sm"
                        >
                          <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            Join Community
                          </span>
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
                          <span className="hidden sm:inline">
                            Manage Community
                          </span>
                          <span className="sm:hidden">Manage</span>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Mobile Sidebar Content */}
              <div className="xl:hidden mt-4 sm:mt-6 space-y-4 sm:space-y-6">
                {/* Community Info Card */}
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
                      <span className="text-xs sm:text-sm text-gray-600">
                        Type
                      </span>
                      <Badge
                        variant={community?.isPublic ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {community?.isPublic ? "Public" : "Private"}
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">
                        Posts
                      </span>
                      <span className="text-xs sm:text-sm font-medium">
                        {community?.postCount || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Tags */}
                {community?.tags && community.tags.length > 0 && (
                  <Card className="bg-white shadow-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5" />
                        Tags
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {community.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs"
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
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
                          onClick={() => setShowCreateDiscussion(true)}
                        >
                          <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Create Post</span>
                          <span className="sm:hidden">Create</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full justify-start text-xs sm:text-sm"
                          onClick={handleLeaveCommunity}
                        >
                          <Users className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            Leave Community
                          </span>
                          <span className="sm:hidden">Leave</span>
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleJoinCommunity}
                        size="sm"
                        className="w-full text-xs sm:text-sm"
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
                        <span className="hidden sm:inline">
                          Manage Community
                        </span>
                        <span className="sm:hidden">Manage</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Create Discussion Modal */}
        <CreateDiscussionModal
          isOpen={showCreateDiscussion}
          onClose={() => setShowCreateDiscussion(false)}
          communityId={id || ""}
          onPostCreated={handlePostCreated}
        />
      </div>
    </div>
  );
};

export default CommunityDetail;
