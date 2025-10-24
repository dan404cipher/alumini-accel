import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Flag,
  UserX,
  Shield,
  Eye,
  EyeOff,
  Trash2,
  Ban,
  CheckCircle,
  XCircle,
  Users,
  MessageSquare,
  AlertCircle,
  Send,
} from "lucide-react";

interface ReportedPost {
  _id: string;
  postId: {
    _id: string;
    title: string;
    content: string;
    author: {
      _id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
    createdAt: string;
  };
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
}

interface ReportedComment {
  _id: string;
  commentId: {
    _id: string;
    content: string;
    author: {
      _id: string;
      firstName: string;
      lastName: string;
      profilePicture?: string;
    };
    createdAt: string;
  };
  reportedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: string;
}

interface Member {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  role: string;
  status: string;
  joinedAt: string;
  violations?: number;
}

interface ModeratorDashboardProps {
  communityId: string;
  isAdmin: boolean;
}

const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({
  communityId,
  isAdmin,
}) => {
  const { toast } = useToast();

  // Helper function to get auth token
  const getAuthToken = (): string => {
    // Check localStorage first (remember me), then sessionStorage
    let token = localStorage.getItem("token");
    if (!token) {
      token = sessionStorage.getItem("token");
    }
    if (!token) {
      throw new Error("Access token is required");
    }
    return token;
  };

  const [reportedPosts, setReportedPosts] = useState<ReportedPost[]>([]);
  const [reportedComments, setReportedComments] = useState<ReportedComment[]>(
    []
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState("reports");

  // Fetch reported content
  const fetchReportedContent = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API calls
      const mockReportedPosts: ReportedPost[] = [
        {
          _id: "1",
          postId: {
            _id: "post1",
            title: "Inappropriate Content Post",
            content: "This post contains inappropriate content...",
            author: {
              _id: "user1",
              firstName: "John",
              lastName: "Doe",
              profilePicture: "",
            },
            createdAt: "2024-01-15T10:00:00Z",
          },
          reportedBy: {
            _id: "user2",
            firstName: "Jane",
            lastName: "Smith",
          },
          reason: "Inappropriate content",
          status: "pending",
          createdAt: "2024-01-15T11:00:00Z",
        },
      ];

      const mockReportedComments: ReportedComment[] = [
        {
          _id: "1",
          commentId: {
            _id: "comment1",
            content: "This comment is offensive...",
            author: {
              _id: "user3",
              firstName: "Mike",
              lastName: "Johnson",
              profilePicture: "",
            },
            createdAt: "2024-01-15T12:00:00Z",
          },
          reportedBy: {
            _id: "user4",
            firstName: "Sarah",
            lastName: "Wilson",
          },
          reason: "Harassment",
          status: "pending",
          createdAt: "2024-01-15T13:00:00Z",
        },
      ];

      setReportedPosts(mockReportedPosts);
      setReportedComments(mockReportedComments);
    } catch (error) {
      console.error("Error fetching reported content:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch community members
  const fetchMembers = async () => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${communityId}/members`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setMembers(data.data.members);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchReportedContent();
    fetchMembers();
  }, [communityId]);

  // Handle post actions
  const handlePostAction = async (postId: string, action: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/${postId}/${action}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Post ${action}ed successfully`,
        });
        fetchReportedContent();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} post`,
        variant: "destructive",
      });
    }
  };

  // Handle member actions
  const handleMemberAction = async (membershipId: string, action: string) => {
    try {
      let endpoint = "";
      let method = "POST";

      switch (action) {
        case "suspend":
          endpoint = `community-memberships/${membershipId}/suspend`;
          break;
        case "remove":
          endpoint = `community-memberships/${membershipId}`;
          method = "DELETE";
          break;
        case "disable-photo":
          endpoint = `users/${membershipId}/disable-photo`;
          break;
        default:
          return;
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/${endpoint}`,
        {
          method,
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Member ${action}ed successfully`,
        });
        fetchMembers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} member`,
        variant: "destructive",
      });
    }
  };

  // Report to admin
  const reportToAdmin = async (type: string, id: string, reason: string) => {
    try {
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/reports/admin`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            targetId: id,
            reason,
            communityId,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Report sent to admin successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send report to admin",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Moderator Dashboard
          </h2>
          <p className="text-gray-600">Manage community content and members</p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Shield className="w-4 h-4" />
          {isAdmin ? "Admin" : "Moderator"}
        </Badge>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <Button
          variant={activeSection === "reports" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("reports")}
          className="flex items-center gap-2"
        >
          <Flag className="w-4 h-4" />
          Reports ({reportedPosts.length + reportedComments.length})
        </Button>
        <Button
          variant={activeSection === "members" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveSection("members")}
          className="flex items-center gap-2"
        >
          <Users className="w-4 h-4" />
          Members ({members.length})
        </Button>
      </div>

      {/* Reports Section */}
      {activeSection === "reports" && (
        <div className="space-y-6">
          {/* Reported Posts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Reported Posts ({reportedPosts.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-gray-500">Loading reported posts...</p>
              ) : reportedPosts.length > 0 ? (
                reportedPosts.map((report) => (
                  <div
                    key={report._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {report.postId.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {report.postId.content.substring(0, 100)}...
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            By: {report.postId.author.firstName}{" "}
                            {report.postId.author.lastName}
                          </span>
                          <span>
                            Reported by: {report.reportedBy.firstName}{" "}
                            {report.reportedBy.lastName}
                          </span>
                          <span>Reason: {report.reason}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          report.status === "pending"
                            ? "destructive"
                            : report.status === "reviewed"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePostAction(report.postId._id, "approve")
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePostAction(report.postId._id, "reject")
                        }
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePostAction(report.postId._id, "pin")
                        }
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Pin
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handlePostAction(report.postId._id, "delete")
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          reportToAdmin(
                            "post",
                            report.postId._id,
                            report.reason
                          )
                        }
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Report to Admin
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reported posts</p>
              )}
            </CardContent>
          </Card>

          {/* Reported Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                Reported Comments ({reportedComments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-gray-500">Loading reported comments...</p>
              ) : reportedComments.length > 0 ? (
                reportedComments.map((report) => (
                  <div
                    key={report._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-gray-900">
                          {report.commentId.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>
                            By: {report.commentId.author.firstName}{" "}
                            {report.commentId.author.lastName}
                          </span>
                          <span>
                            Reported by: {report.reportedBy.firstName}{" "}
                            {report.reportedBy.lastName}
                          </span>
                          <span>Reason: {report.reason}</span>
                        </div>
                      </div>
                      <Badge
                        variant={
                          report.status === "pending"
                            ? "destructive"
                            : report.status === "reviewed"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handlePostAction(report.commentId._id, "approve")
                        }
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handlePostAction(report.commentId._id, "delete")
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          reportToAdmin(
                            "comment",
                            report.commentId._id,
                            report.reason
                          )
                        }
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Report to Admin
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No reported comments</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Members Section */}
      {activeSection === "members" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Member Management ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-gray-500">Loading members...</p>
            ) : members.length > 0 ? (
              members.map((member) => (
                <div
                  key={member._id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {member.userId.profilePicture ? (
                          <img
                            src={member.userId.profilePicture}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium">
                            {member.userId.firstName[0]}
                            {member.userId.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.userId.firstName} {member.userId.lastName}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {member.userId.email}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {member.role}
                          </Badge>
                          <Badge
                            variant={
                              member.status === "approved"
                                ? "default"
                                : member.status === "suspended"
                                ? "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {member.status}
                          </Badge>
                          {member.violations && member.violations > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              {member.violations} violations
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMemberAction(member._id, "suspend")}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleMemberAction(member._id, "disable-photo")
                      }
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      Disable Photo
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleMemberAction(member._id, "remove")}
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() =>
                          handleMemberAction(member._id, "permanent-delete")
                        }
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Permanent Delete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        reportToAdmin("member", member._id, "Moderator concern")
                      }
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Report to Admin
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500">No members found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ModeratorDashboard;
