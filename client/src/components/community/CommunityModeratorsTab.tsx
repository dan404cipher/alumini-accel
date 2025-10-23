import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Crown, Shield, UserPlus, UserX, Users, Settings } from "lucide-react";

interface Moderator {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  role: "moderator" | "admin";
  status: "approved";
  joinedAt: string;
  permissions: {
    canPost: boolean;
    canComment: boolean;
    canInvite: boolean;
    canModerate: boolean;
  };
}

interface CommunityModeratorsTabProps {
  communityId: string;
  isAdmin: boolean;
}

const CommunityModeratorsTab: React.FC<CommunityModeratorsTabProps> = ({
  communityId,
  isAdmin,
}) => {
  const { toast } = useToast();
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch moderators
  const fetchModerators = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/communities/${communityId}/members?role=moderator,admin`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        setModerators(data.data.members);
      }
    } catch (error) {
      console.error("Error fetching moderators:", error);
      toast({
        title: "Error",
        description: "Failed to fetch moderators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModerators();
  }, [communityId]);

  // Handle moderator actions
  const handleModeratorAction = async (moderatorId: string, action: string) => {
    try {
      let endpoint = "";
      let method = "POST";

      switch (action) {
        case "demote-to-member":
          endpoint = `community-memberships/${moderatorId}/demote`;
          break;
        case "remove":
          endpoint = `community-memberships/${moderatorId}`;
          method = "DELETE";
          break;
        case "update-permissions":
          // This would open a modal or form to update permissions
          toast({
            title: "Info",
            description: "Permission update feature coming soon",
          });
          return;
        default:
          return;
      }

      const response = await fetch(`http://localhost:3000/api/v1/${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: `Moderator ${action}ed successfully`,
        });
        fetchModerators();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} moderator`,
        variant: "destructive",
      });
    }
  };

  // Separate admins and moderators
  const admins = moderators.filter((mod) => mod.role === "admin");
  const regularModerators = moderators.filter(
    (mod) => mod.role === "moderator"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Moderators & Admins
          </h2>
          <p className="text-gray-600">
            Manage community moderators and their permissions
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Crown className="w-4 h-4" />
          {moderators.length} Total
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-red-600">
                  {admins.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Moderators</p>
                <p className="text-2xl font-bold text-blue-600">
                  {regularModerators.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-red-500" />
            Community Admins ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading admins...</p>
          ) : admins.length > 0 ? (
            admins.map((admin) => (
              <div key={admin._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {admin.userId.profilePicture ? (
                        <img
                          src={admin.userId.profilePicture}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {admin.userId.firstName[0]}
                          {admin.userId.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {admin.userId.firstName} {admin.userId.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {admin.userId.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="destructive" className="text-xs">
                          <Crown className="w-3 h-3 mr-1" />
                          Admin
                        </Badge>
                        <Badge variant="default" className="text-xs">
                          Joined {new Date(admin.joinedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin Permissions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        admin.permissions.canPost
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Post</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        admin.permissions.canComment
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Comment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        admin.permissions.canInvite
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Invite</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        admin.permissions.canModerate
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Moderate</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No admins found</p>
          )}
        </CardContent>
      </Card>

      {/* Moderators Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-500" />
            Community Moderators ({regularModerators.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading moderators...</p>
          ) : regularModerators.length > 0 ? (
            regularModerators.map((moderator) => (
              <div
                key={moderator._id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {moderator.userId.profilePicture ? (
                        <img
                          src={moderator.userId.profilePicture}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {moderator.userId.firstName[0]}
                          {moderator.userId.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {moderator.userId.firstName} {moderator.userId.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {moderator.userId.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="default" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Moderator
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Joined{" "}
                          {new Date(moderator.joinedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Moderator Permissions */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        moderator.permissions.canPost
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Post</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        moderator.permissions.canComment
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Comment</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        moderator.permissions.canInvite
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Invite</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        moderator.permissions.canModerate
                          ? "bg-green-500"
                          : "bg-gray-300"
                      }`}
                    />
                    <span className="text-gray-600">Can Moderate</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {isAdmin && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleModeratorAction(
                          moderator._id,
                          "update-permissions"
                        )
                      }
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Update Permissions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleModeratorAction(moderator._id, "demote-to-member")
                      }
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Demote to Member
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() =>
                        handleModeratorAction(moderator._id, "remove")
                      }
                    >
                      <UserX className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No moderators found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityModeratorsTab;
