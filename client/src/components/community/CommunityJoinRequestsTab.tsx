import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, CheckCircle, XCircle, Clock, User } from "lucide-react";

interface JoinRequest {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  communityId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  message?: string;
}

interface CommunityJoinRequestsTabProps {
  communityId: string;
}

const CommunityJoinRequestsTab: React.FC<CommunityJoinRequestsTabProps> = ({
  communityId,
}) => {
  const { toast } = useToast();
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch join requests
  const fetchJoinRequests = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/community-memberships/community/${communityId}/requests`,
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
      toast({
        title: "Error",
        description: "Failed to fetch join requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJoinRequests();
  }, [communityId]);

  // Handle approve/reject requests
  const handleRequestAction = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    try {
      const response = await fetch(
        `http://localhost:3000/api/v1/community-memberships/${requestId}/${action}`,
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
          description: `Request ${action}d successfully`,
        });
        fetchJoinRequests();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} request`,
        variant: "destructive",
      });
    }
  };

  // Filter requests by status
  const pendingRequests = joinRequests.filter(
    (req) => req.status === "pending"
  );
  const approvedRequests = joinRequests.filter(
    (req) => req.status === "approved"
  );
  const rejectedRequests = joinRequests.filter(
    (req) => req.status === "rejected"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Join Requests</h2>
          <p className="text-gray-600">
            Review and manage community join requests
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <UserPlus className="w-4 h-4" />
          {pendingRequests.length} Pending
        </Badge>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingRequests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvedRequests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {rejectedRequests.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pending Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <p className="text-gray-500">Loading requests...</p>
          ) : pendingRequests.length > 0 ? (
            pendingRequests.map((request) => (
              <div
                key={request._id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      {request.userId.profilePicture ? (
                        <img
                          src={request.userId.profilePicture}
                          alt="Profile"
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {request.userId.firstName[0]}
                          {request.userId.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {request.userId.firstName} {request.userId.lastName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {request.userId.email}
                      </p>
                      {request.message && (
                        <p className="text-sm text-gray-500 mt-1">
                          "{request.message}"
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Requested{" "}
                          {new Date(request.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleRequestAction(request._id, "approve")}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRequestAction(request._id, "reject")}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No pending requests</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Approved/Rejected Requests */}
      {(approvedRequests.length > 0 || rejectedRequests.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-500" />
              Recent Decisions (
              {approvedRequests.length + rejectedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...approvedRequests, ...rejectedRequests]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .slice(0, 5)
              .map((request) => (
                <div
                  key={request._id}
                  className="border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {request.userId.profilePicture ? (
                          <img
                            src={request.userId.profilePicture}
                            alt="Profile"
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-medium text-sm">
                            {request.userId.firstName[0]}
                            {request.userId.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">
                          {request.userId.firstName} {request.userId.lastName}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {request.status === "approved" ? (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      ) : (
                        <XCircle className="w-3 h-3 mr-1" />
                      )}
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityJoinRequestsTab;
