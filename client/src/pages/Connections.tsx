import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  ExternalLink,
} from "lucide-react";
import { connectionAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import ConnectionButton from "@/components/ConnectionButton";
import Navigation from "@/components/Navigation";

interface Connection {
  _id: string;
  requester: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
    bio?: string;
    location?: string;
    university?: string;
  };
  recipient: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    role: string;
    bio?: string;
    location?: string;
    university?: string;
  };
  status: string;
  type: string;
  message?: string;
  createdAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  blockedAt?: string;
  blockedBy?: string;
}

interface ConnectionStats {
  totalConnections: number;
  pendingRequests: number;
  sentRequests: number;
  receivedRequests: number;
  blockedUsers: number;
}

const Connections = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Connection[]>([]);
  const [sentRequests, setSentRequests] = useState<Connection[]>([]);
  const [stats, setStats] = useState<ConnectionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("connections");
  const [connectionTypeFilter, setConnectionTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [blockedConnections, setBlockedConnections] = useState<Connection[]>(
    []
  );
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced refresh function to prevent rapid API calls
  const debouncedRefresh = useCallback(() => {
    const timeoutId = setTimeout(() => {
      fetchAllData(false);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    fetchAllData();
  }, []);

  // Handle URL-based tab switching
  useEffect(() => {
    const path = location.pathname;
    if (path.includes("/connections/my-connections")) {
      setActiveTab("connections");
    } else if (path.includes("/connections/pending")) {
      setActiveTab("pending");
    } else if (path.includes("/connections/sent")) {
      setActiveTab("sent");
    } else if (path.includes("/connections/find")) {
      setActiveTab("find");
    } else {
      setActiveTab("connections");
    }
  }, [location.pathname]);

  const fetchAllData = async (showLoading = true) => {
    if (isRefreshing) return; // Prevent multiple simultaneous calls

    if (showLoading) {
      setLoading(true);
    }
    setIsRefreshing(true);

    try {
      // Add small delays between API calls to prevent rate limiting
      const [connectionsRes, pendingRes, sentRes, blockedRes, statsRes] =
        await Promise.all([
          connectionAPI.getUserConnections({ status: "accepted" }),
          new Promise((resolve) =>
            setTimeout(() => resolve(connectionAPI.getPendingRequests()), 100)
          ),
          new Promise((resolve) =>
            setTimeout(() => resolve(connectionAPI.getSentRequests()), 200)
          ),
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve(
                  connectionAPI.getUserConnections({ status: "blocked" })
                ),
              300
            )
          ),
          new Promise((resolve) =>
            setTimeout(() => resolve(connectionAPI.getConnectionStats()), 400)
          ),
        ]);

      if (connectionsRes.success) {
        setConnections(connectionsRes.data.connections || []);
      }
      if (pendingRes.success) {
        setPendingRequests(pendingRes.data || []);
      }
      if (sentRes.success) {
        setSentRequests(sentRes.data || []);
      }
      if (blockedRes.success) {
        setBlockedConnections(blockedRes.data.connections || []);
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
      setIsRefreshing(false);
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
        case "unblock":
          response = await connectionAPI.unblockUser(connectionId);
          break;
        default:
          return;
      }

      if (response.success) {
        toast({
          title: "Success",
          description: `Connection ${action}ed successfully`,
        });
        // Use debounced refresh to prevent rapid API calls
        debouncedRefresh();
      } else {
        console.error(`Action ${action} failed:`, response);
        toast({
          title: "Error",
          description: response.message || `Failed to ${action} connection`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error(`Error in ${action} action:`, error);
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
    const currentUserId = currentUser?._id;

    if (!currentUserId) {
      return connection.requester;
    }

    // Convert both IDs to strings for comparison
    const requesterId = String(connection.requester._id);
    const recipientId = String(connection.recipient._id);
    const currentId = String(currentUserId);

    const user =
      requesterId === currentId ? connection.recipient : connection.requester;

    return user;
  };

  const getImageUrl = (profilePicture?: string, name?: string) => {
    if (profilePicture) {
      return profilePicture.startsWith("http")
        ? profilePicture
        : profilePicture;
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
      <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
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
    <div className="min-h-screen bg-gray-50 flex flex-col pt-16">
      <Navigation activeTab="connections" onTabChange={() => {}} />
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
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
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-green-50 ${
                activeTab === "connections"
                  ? "ring-2 ring-green-500 bg-green-50"
                  : ""
              }`}
              onClick={() => setActiveTab("connections")}
            >
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

            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-yellow-50 ${
                activeTab === "pending"
                  ? "ring-2 ring-yellow-500 bg-yellow-50"
                  : ""
              }`}
              onClick={() => setActiveTab("pending")}
            >
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

            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-blue-50 ${
                activeTab === "sent" ? "ring-2 ring-blue-500 bg-blue-50" : ""
              }`}
              onClick={() => setActiveTab("sent")}
            >
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

            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-purple-50 ${
                activeTab === "pending"
                  ? "ring-2 ring-purple-500 bg-purple-50"
                  : ""
              }`}
              onClick={() => setActiveTab("pending")}
            >
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

            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow duration-200 hover:bg-red-50 ${
                activeTab === "blocked" ? "ring-2 ring-red-500 bg-red-50" : ""
              }`}
              onClick={() => {
                setActiveTab("blocked");
                setStatusFilter("blocked");
              }}
            >
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger
              value="connections"
              onClick={() => navigate("/connections/my-connections")}
            >
              My Connections
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              onClick={() => navigate("/connections/pending")}
            >
              Pending Requests
            </TabsTrigger>
            <TabsTrigger
              value="sent"
              onClick={() => navigate("/connections/sent")}
            >
              Sent Requests
            </TabsTrigger>
            <TabsTrigger
              value="find"
              onClick={() => navigate("/connections/find")}
            >
              Find Alumni
            </TabsTrigger>
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
                          <Link
                            to={`/alumni/${user._id}`}
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={getImageUrl(
                                user.profilePicture,
                                `${user.firstName} ${user.lastName}`
                              )}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/alumni/${user._id}`}
                              onClick={() => {
                                // Navigate to user profile
                              }}
                              className="hover:text-blue-600 transition-colors"
                            >
                              <h3 className="font-semibold truncate flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-600">{user.role}</p>
                            {user.university && (
                              <p className="text-xs text-gray-500 mt-1">
                                {user.university}
                              </p>
                            )}
                            {user.location && (
                              <p className="text-xs text-gray-500">
                                📍 {user.location}
                              </p>
                            )}
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
                          <Link
                            to={`/alumni/${user._id}`}
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={getImageUrl(
                                user.profilePicture,
                                `${user.firstName} ${user.lastName}`
                              )}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/alumni/${user._id}`}
                              onClick={() => {
                                // Navigate to user profile
                              }}
                              className="hover:text-blue-600 transition-colors"
                            >
                              <h3 className="font-semibold truncate flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </h3>
                            </Link>
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
                          <Link
                            to={`/alumni/${user._id}`}
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={getImageUrl(
                                user.profilePicture,
                                `${user.firstName} ${user.lastName}`
                              )}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/alumni/${user._id}`}
                              onClick={() => {
                                // Navigate to user profile
                              }}
                              className="hover:text-blue-600 transition-colors"
                            >
                              <h3 className="font-semibold truncate flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </h3>
                            </Link>
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

          {/* Blocked Users Tab */}
          <TabsContent value="blocked" className="space-y-4">
            <h2 className="text-xl font-semibold">Blocked Users</h2>
            {blockedConnections.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">
                    No blocked users
                  </h3>
                  <p className="text-gray-600">
                    You haven't blocked any users yet.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {blockedConnections.map((connection) => {
                  const user = getConnectionUser(connection);
                  return (
                    <Card key={connection._id}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <Link
                            to={`/alumni/${user._id}`}
                            className="flex-shrink-0 hover:opacity-80 transition-opacity"
                          >
                            <img
                              src={getImageUrl(
                                user.profilePicture,
                                `${user.firstName} ${user.lastName}`
                              )}
                              alt={`${user.firstName} ${user.lastName}`}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/alumni/${user._id}`}
                              onClick={() => {
                                // Navigate to user profile
                              }}
                              className="hover:text-blue-600 transition-colors"
                            >
                              <h3 className="font-semibold truncate flex items-center gap-1">
                                {user.firstName} {user.lastName}
                                <ExternalLink className="w-3 h-3 opacity-60" />
                              </h3>
                            </Link>
                            <p className="text-sm text-gray-600">{user.role}</p>
                            <Badge
                              variant="destructive"
                              className="text-xs mt-1"
                            >
                              Blocked
                            </Badge>
                            <p className="text-xs text-gray-500 mt-2">
                              Blocked on{" "}
                              {new Date(
                                connection.blockedAt || connection.updatedAt
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() =>
                              handleConnectionAction("unblock", connection._id)
                            }
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Unblock User
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Find Alumni Tab */}
          <TabsContent value="find" className="space-y-4">
            <h2 className="text-xl font-semibold">Find Alumni</h2>
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Discover Alumni</h3>
                <p className="text-gray-600 mb-4">
                  Search and connect with alumni from your university or other
                  institutions.
                </p>
                <Button
                  onClick={() => navigate("/alumni")}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Browse Alumni Directory
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default Connections;
