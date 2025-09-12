import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  UserCheck,
  Clock,
  X,
  Shield,
  MessageSquare,
  Filter,
  Search,
} from "lucide-react";
import { connectionAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ConnectionButton from "@/components/ConnectionButton";

interface Connection {
  _id: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
  };
  status: string;
  type: string;
  message?: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  blockedAt?: string;
}

interface ConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  receivedRequests: number;
  blockedUsers: number;
}

const Connections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connections");
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [connectionsRes, pendingRes, sentRes, statsRes] = await Promise.all(
        [
          connectionAPI.getUserConnections({ status: "accepted" }),
          connectionAPI.getPendingRequests(),
          connectionAPI.getSentRequests(),
          connectionAPI.getConnectionStats(),
        ]
      );

      if (connectionsRes.success) {
        setConnections(connectionsRes.data.connections || []);
      }
      if (pendingRes.success) {
        setPendingRequests(pendingRes.data || []);
      }
      if (sentRes.success) {
        setSentRequests(sentRes.data || []);
      }
      if (statsRes.success) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Error fetching connections data:", error);
      toast({
        title: "Error",
        description: "Failed to load connections data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConnectionAction = async (
    action: string,
    connectionId: string
  ) => {
    try {
      let response;
      switch (action) {
        case "accept":
          response = await connectionAPI.acceptConnection(connectionId);
          break;
        case "reject":
          response = await connectionAPI.rejectConnection(connectionId);
          break;
        case "cancel":
          response = await connectionAPI.cancelConnection(connectionId);
          break;
        case "remove":
          response = await connectionAPI.removeConnection(connectionId);
          break;
        case "block":
          response = await connectionAPI.blockUser(connectionId);
          break;
        default:
          return;
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Connection ${action}ed successfully`,
        });
        fetchAllData();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || `Failed to ${action} connection`,
        variant: "destructive",
      });
    }
  };

  const getConnectionUser = (connection: Connection) => {
    // Determine which user is not the current user
    const currentUserId = localStorage.getItem("userId");
    return connection.requester._id === currentUserId
      ? connection.recipient
      : connection.requester;
  };

  const getImageUrl = (profilePicture?: string, name?: string) => {
    if (profilePicture) {
      return profilePicture.startsWith("http")
        ? profilePicture
        : `${
            import.meta.env.VITE_API_URL || "http://localhost:3000"
          }${profilePicture}`;
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "User"
    )}&background=random`;
  };

  const filteredConnections = connections.filter((connection) => {
    if (connectionTypeFilter === "all") return true;
    return connection.type === connectionTypeFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab="connections" onTabChange={() => {}} />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading connections...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab="connections" onTabChange={() => {}} />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connections</h1>
          <p className="text-gray-600">
            Manage your professional network and connections
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserCheck className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Connected
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalConnections}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pendingRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <UserPlus className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Sent</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.sentRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Received
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.receivedRequests}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Shield className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Blocked</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.blockedUsers}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="connections">Connections</TabsTrigger>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="sent">Sent Requests</TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Connections</h2>
              <Select
                value={connectionTypeFilter}
                onValueChange={setConnectionTypeFilter}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="connection">General</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredConnections.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    No connections yet
                  </h3>
                  <p className="text-gray-600">
                    Start connecting with alumni and students to build your
                    network.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredConnections.map((connection) => {
                  const user = getConnectionUser(connection);
                  return (
                    <Card key={connection._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <img
                            src={getImageUrl(
                              user.profilePicture,
                              `${user.firstName} ${user.lastName}`
                            )}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{user.role}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {connection.type}
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              handleConnectionAction("remove", connection._id)
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleConnectionAction("block", connection._id)
                            }
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Block
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            {pendingRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    No pending requests
                  </h3>
                  <p className="text-gray-600">
                    You don't have any pending connection requests.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingRequests.map((connection) => {
                  const user = connection.requester;
                  return (
                    <Card key={connection._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <img
                            src={getImageUrl(
                              user.profilePicture,
                              `${user.firstName} ${user.lastName}`
                            )}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{user.role}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {connection.type}
                            </Badge>
                            {connection.message && (
                              <p className="text-xs text-gray-500 mt-2 truncate">
                                "{connection.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1"
                            onClick={() =>
                              handleConnectionAction("accept", connection._id)
                            }
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleConnectionAction("reject", connection._id)
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests Tab */}
          <TabsContent value="sent" className="space-y-4">
            <h2 className="text-xl font-semibold">Sent Requests</h2>
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    No sent requests
                  </h3>
                  <p className="text-gray-600">
                    You haven't sent any connection requests yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sentRequests.map((connection) => {
                  const user = connection.recipient;
                  return (
                    <Card key={connection._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <img
                            src={getImageUrl(
                              user.profilePicture,
                              `${user.firstName} ${user.lastName}`
                            )}
                            alt={`${user.firstName} ${user.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate">
                              {user.firstName} {user.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{user.role}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {connection.type}
                            </Badge>
                            {connection.message && (
                              <p className="text-xs text-gray-500 mt-2 truncate">
                                "{connection.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              handleConnectionAction("cancel", connection._id)
                            }
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel Request
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Connections;
