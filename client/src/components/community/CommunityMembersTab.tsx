import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Users, UserX, Ban, EyeOff, Trash2, Crown, Shield } from "lucide-react";

interface Member {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  role: "member" | "moderator" | "admin";
  status: "approved" | "pending" | "suspended" | "rejected";
  joinedAt: string;
  violations?: number;
}

interface CommunityMembersTabProps {
  communityId: string;
  isAdmin: boolean;
  onRoleChange?: () => void;
}

const CommunityMembersTab: React.FC<CommunityMembersTabProps> = ({
  communityId,
  isAdmin,
  onRoleChange,
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
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<
    "all" | "member" | "moderator" | "admin"
  >("all");

  // Fetch community members
  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/communities/${communityId}/members`,
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
      toast({
        title: "Error",
        description: "Failed to fetch members",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [communityId]);

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
        case "promote-to-moderator":
          endpoint = `community-memberships/${membershipId}/promote`;
          break;
        case "demote-to-member":
          endpoint = `community-memberships/${membershipId}/demote`;
          break;
        default:
          return;
      }

      const response = await fetch(`http://localhost:3000/api/v1/${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      const data = await response.json();

      // Handle 401 Unauthorized - redirect to login
      if (response.status === 401) {
        console.log("401 Unauthorized - redirecting to login");
        toast({
          title: "Session Expired",
          description: "Please log in again to continue",
          variant: "destructive",
        });
        window.location.href = "/login";
        return;
      }

      if (data.success) {
        toast({
          title: "Success",
          description: `Member ${action}ed successfully`,
        });
        fetchMembers();
        // Refresh community data to update role states
        if (onRoleChange) {
          onRoleChange();
        }
      } else {
        toast({
          title: "Error",
          description: data.message || `Failed to ${action} member`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} member`,
        variant: "destructive",
      });
    }
  };

  // Filter members by role
  const filteredMembers = members.filter(
    (member) => roleFilter === "all" || member.role === roleFilter
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Community Members
          </h2>
          <p className="text-gray-600">
            Manage community members and their roles
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          {members.length} Members
        </Badge>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2">
        <Button
          variant={roleFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("all")}
        >
          All ({members.length})
        </Button>
        <Button
          variant={roleFilter === "member" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("member")}
        >
          Members ({members.filter((m) => m.role === "member").length})
        </Button>
        <Button
          variant={roleFilter === "moderator" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("moderator")}
        >
          Moderators ({members.filter((m) => m.role === "moderator").length})
        </Button>
        <Button
          variant={roleFilter === "admin" ? "default" : "outline"}
          size="sm"
          onClick={() => setRoleFilter("admin")}
        >
          Admins ({members.filter((m) => m.role === "admin").length})
        </Button>
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Members ({filteredMembers.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading members...</p>
          ) : filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <div key={member._id} className="border rounded-lg p-4 space-y-3">
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
                        <Badge
                          variant={
                            member.role === "admin"
                              ? "destructive"
                              : member.role === "moderator"
                              ? "default"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {member.role === "admin" && (
                            <Crown className="w-3 h-3 mr-1" />
                          )}
                          {member.role === "moderator" && (
                            <Shield className="w-3 h-3 mr-1" />
                          )}
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

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {isAdmin && member.role === "member" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleMemberAction(member._id, "promote-to-moderator")
                      }
                    >
                      <Crown className="w-4 h-4 mr-1" />
                      Promote to Moderator
                    </Button>
                  )}
                  {isAdmin && member.role === "moderator" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        handleMemberAction(member._id, "demote-to-member")
                      }
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Demote to Member
                    </Button>
                  )}
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
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No members found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityMembersTab;
