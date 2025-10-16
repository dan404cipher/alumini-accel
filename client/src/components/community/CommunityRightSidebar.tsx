import React, { useState, useEffect } from "react";
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
  Shield,
  UserCheck,
  UserX,
  Crown,
} from "lucide-react";
import { Community, TrendingPost, PopularTag } from "./types";

interface JoinRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  status: string;
  createdAt: string;
}

interface Moderator {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  role: string;
  permissions: {
    canPost: boolean;
    canComment: boolean;
    canInvite: boolean;
    canModerate: boolean;
  };
}

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
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingModerators, setLoadingModerators] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Fetch join requests
  const fetchJoinRequests = async () => {
    if (!community?._id || !isAdmin) return;

    setLoadingRequests(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/community/${community._id}/requests`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setJoinRequests(data.data);
      }
    } catch (error) {
      console.error("Error fetching join requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Fetch moderators
  const fetchModerators = async () => {
    if (!community?._id) return;

    setLoadingModerators(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/community/${community._id}/moderators`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setModerators(data.data);
      }
    } catch (error) {
      console.error("Error fetching moderators:", error);
    } finally {
      setLoadingModerators(false);
    }
  };

  // Fetch community members
  const fetchMembers = async () => {
    if (!community?._id || !isAdmin) return;

    setLoadingMembers(true);
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${community._id}/members`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Filter out moderators and admins to show only regular members
        const regularMembers = data.data.members.filter(
          (member: any) => member.role === "member"
        );
        setMembers(regularMembers);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  // Approve join request
  const approveJoinRequest = async (membershipId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/${membershipId}/approve`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Join request approved successfully",
        });
        fetchJoinRequests();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to approve request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  // Reject join request
  const rejectJoinRequest = async (membershipId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/${membershipId}/reject`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Join request rejected",
        });
        fetchJoinRequests();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to reject request",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Promote to moderator
  const promoteToModerator = async (membershipId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/${membershipId}/promote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "User promoted to moderator",
        });
        fetchModerators();
        fetchMembers(); // Refresh members list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to promote user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to promote user",
        variant: "destructive",
      });
    }
  };

  // Demote moderator
  const demoteModerator = async (membershipId: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-memberships/${membershipId}/demote`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Moderator demoted to member",
        });
        fetchModerators();
        fetchMembers(); // Refresh members list
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to demote moderator",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to demote moderator",
        variant: "destructive",
      });
    }
  };

  // Load data when component mounts or community changes
  useEffect(() => {
    if (community?._id) {
      fetchJoinRequests();
      fetchModerators();
      fetchMembers();
    }
  }, [community?._id, isAdmin]);
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

          {/* Moderator Tools - Only show for admins */}
          {isAdmin && (
            <>
              {/* Join Requests */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4" />
                    Join Requests ({joinRequests.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingRequests ? (
                    <p className="text-sm text-gray-500">Loading requests...</p>
                  ) : joinRequests.length > 0 ? (
                    joinRequests.map((request) => (
                      <div
                        key={request._id}
                        className="space-y-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {request.userId.firstName}{" "}
                              {request.userId.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {request.userId.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {request.status}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 text-xs"
                            onClick={() => approveJoinRequest(request._id)}
                          >
                            <UserCheck className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => rejectJoinRequest(request._id)}
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No pending requests</p>
                  )}
                </CardContent>
              </Card>

              {/* Moderators */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4" />
                    Moderators ({moderators.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingModerators ? (
                    <p className="text-sm text-gray-500">
                      Loading moderators...
                    </p>
                  ) : moderators.length > 0 ? (
                    moderators.map((moderator) => (
                      <div
                        key={moderator._id}
                        className="space-y-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-yellow-500" />
                            <div>
                              <p className="text-sm font-medium">
                                {moderator.userId.firstName}{" "}
                                {moderator.userId.lastName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {moderator.userId.email}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {moderator.role}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => demoteModerator(moderator._id)}
                          >
                            <UserX className="w-3 h-3 mr-1" />
                            Demote
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      No moderators assigned
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Members - Only show for admins */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4" />
                    Members ({members.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingMembers ? (
                    <p className="text-sm text-gray-500">Loading members...</p>
                  ) : members.length > 0 ? (
                    members.slice(0, 5).map((member) => (
                      <div
                        key={member._id}
                        className="space-y-2 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {member.userId.firstName} {member.userId.lastName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {member.userId.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="flex-1 text-xs"
                            onClick={() => promoteToModerator(member._id)}
                          >
                            <Crown className="w-3 h-3 mr-1" />
                            Promote
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No members found</p>
                  )}
                  {members.length > 5 && (
                    <p className="text-xs text-gray-500 text-center">
                      Showing first 5 members
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityRightSidebar;
