import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  UserPlus,
  Check,
  X,
  MessageCircle,
  Calendar,
  Search,
  Filter,
} from "lucide-react";

interface Connection {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePicture?: string;
  role: string;
}

interface ConnectionRequest {
  _id: string;
  userId: Connection;
  status: "pending" | "accepted" | "rejected";
  requestedAt: string;
  respondedAt?: string;
  message?: string;
}

interface ConnectionsSectionProps {
  connections: string[];
  connectionRequests: ConnectionRequest[];
  isEditing: boolean;
  onUpdate: () => void;
}

export const ConnectionsSection = ({
  connections,
  connectionRequests,
  isEditing,
  onUpdate,
}: ConnectionsSectionProps) => {
  const { toast } = useToast();
  const [isSendRequestOpen, setIsSendRequestOpen] = useState(false);
  const [searchEmail, setSearchEmail] = useState("");
  const [requestMessage, setRequestMessage] = useState("");
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequest[]>(
    []
  );
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);

  useEffect(() => {
    // Separate pending requests into received and sent
    const received = connectionRequests.filter(
      (req) => req.status === "pending"
    );
    const sent = connectionRequests.filter((req) => req.status === "pending");
    setPendingRequests(received);
    setSentRequests(sent);
  }, [connectionRequests]);

  const handleSendConnectionRequest = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/students/connections/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          targetUserId: searchEmail, // This should be user ID, but for demo using email
          message: requestMessage,
        }),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        onUpdate();
        setIsSendRequestOpen(false);
        setSearchEmail("");
        setRequestMessage("");
        toast({
          title: "Success",
          description: "Connection request sent successfully",
        });
      } else {
        throw new Error(result.message || "Failed to send connection request");
      }
    } catch (error) {
      console.error("Error sending connection request:", error);
      toast({
        title: "Error",
        description: "Failed to send connection request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRespondToRequest = async (
    requestId: string,
    status: "accepted" | "rejected"
  ) => {
    try {
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(
        `${apiUrl}/students/connections/request/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        onUpdate();
        toast({
          title: "Success",
          description: `Connection request ${status} successfully`,
        });
      } else {
        throw new Error(
          result.message || "Failed to respond to connection request"
        );
      }
    } catch (error) {
      console.error("Error responding to connection request:", error);
      toast({
        title: "Error",
        description:
          "Failed to respond to connection request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connections</CardTitle>
            <CardDescription>
              Connect with other students and alumni
            </CardDescription>
          </div>
          {isEditing && (
            <Dialog
              open={isSendRequestOpen}
              onOpenChange={setIsSendRequestOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Send Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Connection Request</DialogTitle>
                  <DialogDescription>
                    Send a connection request to another user
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="searchEmail">Email Address</Label>
                    <Input
                      id="searchEmail"
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requestMessage">Message (Optional)</Label>
                    <Textarea
                      id="requestMessage"
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      placeholder="Add a personal message..."
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsSendRequestOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSendConnectionRequest}>
                      Send Request
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Pending Requests ({pendingRequests.length})
              </h4>
              <div className="space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.userId.firstName} {request.userId.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.userId.email}
                        </p>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-1">
                            "{request.message}"
                          </p>
                        )}
                        <p className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    {isEditing && (
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleRespondToRequest(request._id, "accepted")
                          }
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespondToRequest(request._id, "rejected")
                          }
                        >
                          <X className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">
                Sent Requests ({sentRequests.length})
              </h4>
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <div
                    key={request._id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {request.userId.firstName} {request.userId.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {request.userId.email}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Sent {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connections */}
          <div>
            <h4 className="font-semibold mb-3">
              Connections ({connections.length})
            </h4>
            {connections.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No connections yet</p>
                {isEditing && (
                  <Button onClick={() => setIsSendRequestOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Send Your First Request
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connections.map((connectionId, index) => (
                  <div
                    key={connectionId || index}
                    className="flex items-center space-x-3 p-3 border rounded-lg"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-400" />
                    </div>
                    <div>
                      <p className="font-medium">Connection {index + 1}</p>
                      <p className="text-sm text-gray-500">Connected</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
