import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  Settings,
  Eye,
  Plus,
  BarChart3,
  FileText,
  Shield,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantAPI, userAPI } from "@/lib/api";
import TenantManagement from "../TenantManagement";
import UserManagement from "../UserManagement";
import AlumniManagement from "../AlumniManagement";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [colleges, setColleges] = useState([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loadingRecentUsers, setLoadingRecentUsers] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // User request states
  const [pendingUserRequests, setPendingUserRequests] = useState([]);
  const [loadingUserRequests, setLoadingUserRequests] = useState(false);
  const [requestStats, setRequestStats] = useState({
    alumni: 0,
    admin: 0,
    hod: 0,
    staff: 0,
  });

  // Request tracking to prevent duplicate calls
  const [requestInProgress, setRequestInProgress] = useState({
    colleges: false,
    users: false,
    userRequests: false,
  });

  // Debounce utility
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  };

  // Format time ago utility
  const formatTimeAgo = (date: string | Date | undefined) => {
    if (!date) return "Unknown time";

    try {
      const dateObj = typeof date === "string" ? new Date(date) : date;

      // Check if the date is valid
      if (isNaN(dateObj.getTime())) {
        return "Invalid date";
      }

      const now = new Date();
      const diffInSeconds = Math.floor(
        (now.getTime() - dateObj.getTime()) / 1000
      );

      if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400)
        return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return `${Math.floor(diffInSeconds / 86400)}d ago`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return "Unknown time";
    }
  };

  // Simple cache to prevent duplicate requests
  const [lastFetchTime, setLastFetchTime] = useState({
    colleges: 0,
    users: 0,
    userRequests: 0,
  });

  // Form states for creating users
  const [createAdminForm, setCreateAdminForm] = useState({
    collegeId: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [createHODForm, setCreateHODForm] = useState({
    collegeId: "",
    department: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [createStaffForm, setCreateStaffForm] = useState({
    collegeId: "",
    department: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const [isCreating, setIsCreating] = useState({
    admin: false,
    hod: false,
    staff: false,
  });

  // Fetch colleges for dropdown
  const fetchColleges = async () => {
    if (requestInProgress.colleges) return;

    // Check if we've fetched recently (within 30 seconds)
    const now = Date.now();
    if (now - lastFetchTime.colleges < 30000) return;

    try {
      setRequestInProgress((prev) => ({ ...prev, colleges: true }));
      setLoadingColleges(true);
      setLastFetchTime((prev) => ({ ...prev, colleges: now }));
      const response = await tenantAPI.getAllTenants();
      if (response.success) {
        setColleges(response.data.tenants || []);
      }
    } catch (error) {
      console.error("Error fetching colleges:", error);
    } finally {
      setLoadingColleges(false);
      setRequestInProgress((prev) => ({ ...prev, colleges: false }));
    }
  };

  // Fetch recent users (last 7 days)
  const fetchRecentUsers = async () => {
    if (requestInProgress.users) return;

    // Check if we've fetched recently (within 30 seconds)
    const now = Date.now();
    if (now - lastFetchTime.users < 30000) return;

    try {
      setRequestInProgress((prev) => ({ ...prev, users: true }));
      setLoadingRecentUsers(true);
      setLastFetchTime((prev) => ({ ...prev, users: now }));
      const response = await userAPI.getAllUsers();
      if (response.success && response.data?.users) {
        // Filter users created in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsers = response.data.users.filter((user: any) => {
          const createdAt = new Date(user.createdAt);
          return createdAt >= sevenDaysAgo;
        });

        // Sort by creation date (newest first) and limit to 5
        const sortedRecentUsers = recentUsers
          .sort(
            (a: any, b: any) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .slice(0, 5);

        setRecentUsers(sortedRecentUsers);
      }
    } catch (error) {
      console.error("Error fetching recent users:", error);
    } finally {
      setLoadingRecentUsers(false);
      setRequestInProgress((prev) => ({ ...prev, users: false }));
    }
  };

  // Helper function to get role icon and color
  const getRoleIconAndColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return {
          icon: Shield,
          bgColor: "bg-red-100",
          iconColor: "text-red-600",
        };
      case "college_admin":
        return {
          icon: Building2,
          bgColor: "bg-blue-100",
          iconColor: "text-blue-600",
        };
      case "hod":
        return {
          icon: Users,
          bgColor: "bg-green-100",
          iconColor: "text-green-600",
        };
      case "staff":
        return {
          icon: Settings,
          bgColor: "bg-purple-100",
          iconColor: "text-purple-600",
        };
      default:
        return {
          icon: Users,
          bgColor: "bg-gray-100",
          iconColor: "text-gray-600",
        };
    }
  };

  // Helper function to format time ago
  const getTimeAgo = (createdAt: string) => {
    const now = currentTime; // Use currentTime state instead of new Date()
    const created = new Date(createdAt);
    const diffInMilliseconds = now.getTime() - created.getTime();

    const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7)
      return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

    return `${Math.floor(diffInDays / 7)} week${
      Math.floor(diffInDays / 7) > 1 ? "s" : ""
    } ago`;
  };

  useEffect(() => {
    fetchColleges();
    fetchRecentUsers();
  }, []);

  // Fetch user requests when approvals tab is active
  useEffect(() => {
    if (activeTab === "approvals") {
      fetchPendingUserRequests();
    }
  }, [activeTab]);

  // Update current time every minute to refresh time display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Handler functions for creating users
  const handleCreateAdmin = async () => {
    if (
      !createAdminForm.collegeId ||
      !createAdminForm.email ||
      !createAdminForm.firstName ||
      !createAdminForm.lastName
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating((prev) => ({ ...prev, admin: true }));

      const userData = {
        email: createAdminForm.email,
        firstName: createAdminForm.firstName,
        lastName: createAdminForm.lastName,
        role: "college_admin",
        tenantId: createAdminForm.collegeId,
        password: "TempPassword123!", // Temporary password
        status: "pending", // Set to pending for approval
      };

      console.log("Creating admin request with data:", userData);
      const response = await userAPI.createPendingUserRequest(userData);
      console.log("Admin request creation response:", response);

      if (response.success) {
        toast({
          title: "Success",
          description: "College Admin request submitted for approval!",
        });

        setCreateAdminForm({
          collegeId: "",
          email: "",
          firstName: "",
          lastName: "",
        });
        debouncedFetchColleges(); // Refresh colleges list
        debouncedFetchRecentUsers(); // Refresh recent users
        // Refresh user requests if on approvals tab
        if (activeTab === "approvals") {
          debouncedFetchPendingUserRequests();
        }
      } else {
        throw new Error(response.message || "Failed to create admin");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create college admin",
        variant: "destructive",
      });
    } finally {
      setIsCreating((prev) => ({ ...prev, admin: false }));
    }
  };

  const handleCreateHOD = async () => {
    if (
      !createHODForm.collegeId ||
      !createHODForm.department ||
      !createHODForm.email ||
      !createHODForm.firstName ||
      !createHODForm.lastName
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating((prev) => ({ ...prev, hod: true }));

      const userData = {
        email: createHODForm.email,
        firstName: createHODForm.firstName,
        lastName: createHODForm.lastName,
        role: "hod",
        tenantId: createHODForm.collegeId,
        department: createHODForm.department,
        password: "TempPassword123!", // Temporary password
        status: "pending", // Set to pending for approval
      };

      console.log("Creating HOD request with data:", userData);
      const response = await userAPI.createPendingUserRequest(userData);
      console.log("HOD request creation response:", response);

      if (response.success) {
        toast({
          title: "Success",
          description: "HOD request submitted for approval!",
        });

        setCreateHODForm({
          collegeId: "",
          department: "",
          email: "",
          firstName: "",
          lastName: "",
        });
        debouncedFetchColleges(); // Refresh colleges list
        debouncedFetchRecentUsers(); // Refresh recent users
        // Refresh user requests if on approvals tab
        if (activeTab === "approvals") {
          debouncedFetchPendingUserRequests();
        }
      } else {
        throw new Error(response.message || "Failed to create HOD");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create HOD",
        variant: "destructive",
      });
    } finally {
      setIsCreating((prev) => ({ ...prev, hod: false }));
    }
  };

  const handleCreateStaff = async () => {
    if (
      !createStaffForm.collegeId ||
      !createStaffForm.department ||
      !createStaffForm.email ||
      !createStaffForm.firstName ||
      !createStaffForm.lastName
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCreating((prev) => ({ ...prev, staff: true }));

      const userData = {
        email: createStaffForm.email,
        firstName: createStaffForm.firstName,
        lastName: createStaffForm.lastName,
        role: "staff",
        tenantId: createStaffForm.collegeId,
        department: createStaffForm.department,
        password: "TempPassword123!", // Temporary password
        status: "pending", // Set to pending for approval
      };

      console.log("Creating staff request with data:", userData);
      const response = await userAPI.createPendingUserRequest(userData);
      console.log("Staff request creation response:", response);

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff request submitted for approval!",
        });

        setCreateStaffForm({
          collegeId: "",
          department: "",
          email: "",
          firstName: "",
          lastName: "",
        });
        debouncedFetchColleges(); // Refresh colleges list
        debouncedFetchRecentUsers(); // Refresh recent users
        // Refresh user requests if on approvals tab
        if (activeTab === "approvals") {
          debouncedFetchPendingUserRequests();
        }
      } else {
        throw new Error(response.message || "Failed to create staff");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create staff member",
        variant: "destructive",
      });
    } finally {
      setIsCreating((prev) => ({ ...prev, staff: false }));
    }
  };

  // Handler functions for college management
  const handleViewCollege = (collegeId: string) => {
    console.log("View college:", collegeId);
    // TODO: Implement view college details
    // Could open a modal or navigate to college details page
  };

  const handleManageCollege = (collegeId: string) => {
    console.log("Manage college:", collegeId);
    // TODO: Implement college management
    // Could open a management modal or navigate to college admin panel
  };

  // User request functions
  const fetchPendingUserRequests = async () => {
    if (requestInProgress.userRequests) return;

    // Check if we've fetched recently (within 30 seconds)
    const now = Date.now();
    if (now - lastFetchTime.userRequests < 30000) return;

    try {
      setRequestInProgress((prev) => ({ ...prev, userRequests: true }));
      setLoadingUserRequests(true);
      setLastFetchTime((prev) => ({ ...prev, userRequests: now }));
      console.log("Fetching pending user requests...");
      const response = await userAPI.getPendingUserRequests();
      console.log("Pending user requests response:", response);
      console.log("Response data:", response.data);
      console.log("Response success:", response.success);
      console.log("Response data type:", typeof response.data);
      console.log("Response data length:", response.data?.length);
      console.log(
        "Response data keys:",
        response.data ? Object.keys(response.data) : "no keys"
      );

      if (response.success && response.data) {
        console.log("Setting pending user requests:", response.data);
        setPendingUserRequests(response.data);

        // Calculate stats by role
        const stats = {
          alumni: response.data.filter(
            (request: any) => request.role === "alumni"
          ).length,
          admin: response.data.filter(
            (request: any) => request.role === "college_admin"
          ).length,
          hod: response.data.filter((request: any) => request.role === "hod")
            .length,
          staff: response.data.filter(
            (request: any) => request.role === "staff"
          ).length,
        };
        setRequestStats(stats);
      }
    } catch (error) {
      console.error("Error fetching pending user requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch pending user requests",
        variant: "destructive",
      });
    } finally {
      setLoadingUserRequests(false);
      setRequestInProgress((prev) => ({ ...prev, userRequests: false }));
    }
  };

  const handleApproveUserRequest = async (
    requestId: string,
    userName: string
  ) => {
    try {
      const response = await userAPI.approveUserRequest(requestId);
      if (response.success) {
        toast({
          title: "Success",
          description: `${userName} has been approved and user account created!`,
        });
        // Refresh the user requests list
        debouncedFetchPendingUserRequests();
      } else {
        throw new Error(response.message || "Failed to approve user request");
      }
    } catch (error) {
      console.error("Error approving user request:", error);
      toast({
        title: "Error",
        description: "Failed to approve user request",
        variant: "destructive",
      });
    }
  };

  const handleRejectUserRequest = async (
    requestId: string,
    userName: string
  ) => {
    try {
      const response = await userAPI.rejectUserRequest(
        requestId,
        "Rejected by Super Admin"
      );
      if (response.success) {
        toast({
          title: "Success",
          description: `${userName} request has been rejected`,
        });
        // Refresh the user requests list
        debouncedFetchPendingUserRequests();
      } else {
        throw new Error(response.message || "Failed to reject user request");
      }
    } catch (error) {
      console.error("Error rejecting user request:", error);
      toast({
        title: "Error",
        description: "Failed to reject user request",
        variant: "destructive",
      });
    }
  };

  // Create debounced versions of fetch functions (after all functions are defined)
  const debouncedFetchColleges = useCallback(debounce(fetchColleges, 300), []);

  const debouncedFetchRecentUsers = useCallback(
    debounce(fetchRecentUsers, 300),
    []
  );

  const debouncedFetchPendingUserRequests = useCallback(
    debounce(fetchPendingUserRequests, 300),
    []
  );

  // Calculate real stats from fetched data
  const stats = {
    totalColleges: colleges.length,
    totalUsers: recentUsers.length > 0 ? recentUsers.length * 100 : 0, // Estimate based on recent users
    totalFundsRaised: 2450000, // Keep as mock for now
    activeUsers: Math.floor(recentUsers.length * 60), // Estimate 60% active
    pendingApprovals:
      requestStats.alumni +
      requestStats.admin +
      requestStats.hod +
      requestStats.staff,
    systemAlerts: 3, // Keep as mock for now
  };

  // Generate recent activity from real data
  const recentActivity = [
    // Show recent user registrations
    ...(recentUsers || []).slice(0, 3).map((user: any, index: number) => ({
      id: `user_${index + 1}`,
      action: `New ${user?.role || "user"} registered`,
      college: user?.tenantId?.name || "Unknown College",
      time: formatTimeAgo(user?.createdAt),
      type: "info" as const,
    })),
    // Show pending requests
    ...(pendingUserRequests || [])
      .slice(0, 2)
      .map((request: any, index: number) => ({
        id: `request_${index + 1}`,
        action: `${request?.role || "user"} approval pending`,
        college: request?.tenantId || "Unknown College",
        time: formatTimeAgo(request?.requestedAt),
        type: "warning" as const,
      })),
    // Add system activity if no real data
    ...(recentUsers.length === 0 && pendingUserRequests.length === 0
      ? [
          {
            id: "system_1",
            action: "System initialized",
            college: "System",
            time: "Just now",
            type: "success" as const,
          },
        ]
      : []),
  ].slice(0, 5); // Limit to 5 items

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Global system overview and management
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Shield className="w-4 h-4 mr-2" />
          Super Admin
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Colleges
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalColleges}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funds Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalFundsRaised.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeUsers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="colleges" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">Colleges</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Admin & Staff</span>
          </TabsTrigger>
          <TabsTrigger value="create-users" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Users</span>
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">System Overview</h2>
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Colleges
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalColleges}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Funds Raised
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ${(stats.totalFundsRaised / 1000000).toFixed(1)}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Users
                  </CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.activeUsers.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    +5% from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-center space-x-4"
                    >
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "success"
                            ? "bg-green-500"
                            : activity.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.college}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {activity.time}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* College Management */}
        <TabsContent value="colleges" className="space-y-6">
          <TenantManagement />
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="activity" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">System Activity Logs</h2>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Logs
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                System-wide activity across all colleges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          activity.type === "success"
                            ? "bg-green-500"
                            : activity.type === "warning"
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                        }`}
                      />
                      <div>
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.college}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Create Users Tab */}
        <TabsContent value="create-users" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">
              Create Admin/HOD/Staff Users
            </h2>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Bulk Import
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create College Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  College Admin
                </CardTitle>
                <CardDescription>
                  Create a new college administrator
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="admin-college">College</Label>
                  <select
                    id="admin-college"
                    className="w-full p-2 border rounded-md"
                    disabled={loadingColleges}
                    value={createAdminForm.collegeId}
                    onChange={(e) =>
                      setCreateAdminForm((prev) => ({
                        ...prev,
                        collegeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select College</option>
                    {colleges.map((college: any) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Email</Label>
                  <Input
                    id="admin-email"
                    type="email"
                    placeholder="admin@college.edu"
                    value={createAdminForm.email}
                    onChange={(e) =>
                      setCreateAdminForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-firstname">First Name</Label>
                  <Input
                    id="admin-firstname"
                    type="text"
                    placeholder="John"
                    value={createAdminForm.firstName}
                    onChange={(e) =>
                      setCreateAdminForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-lastname">Last Name</Label>
                  <Input
                    id="admin-lastname"
                    type="text"
                    placeholder="Doe"
                    value={createAdminForm.lastName}
                    onChange={(e) =>
                      setCreateAdminForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateAdmin}
                  disabled={isCreating.admin}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isCreating.admin ? "Creating..." : "Create Admin"}
                </Button>
              </CardContent>
            </Card>

            {/* Create HOD */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Head of Department
                </CardTitle>
                <CardDescription>
                  Create a new HOD for a department
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hod-college">College</Label>
                  <select
                    id="hod-college"
                    className="w-full p-2 border rounded-md"
                    disabled={loadingColleges}
                    value={createHODForm.collegeId}
                    onChange={(e) =>
                      setCreateHODForm((prev) => ({
                        ...prev,
                        collegeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select College</option>
                    {colleges.map((college: any) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-department">Department</Label>
                  <select
                    id="hod-department"
                    className="w-full p-2 border rounded-md"
                    value={createHODForm.department}
                    onChange={(e) =>
                      setCreateHODForm((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Engineering">Engineering</option>
                    <option value="MBA">MBA</option>
                    <option value="Finance">Finance</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Nursing">Nursing</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-email">Email</Label>
                  <Input
                    id="hod-email"
                    type="email"
                    placeholder="hod@college.edu"
                    value={createHODForm.email}
                    onChange={(e) =>
                      setCreateHODForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-firstname">First Name</Label>
                  <Input
                    id="hod-firstname"
                    type="text"
                    placeholder="Dr. Jane"
                    value={createHODForm.firstName}
                    onChange={(e) =>
                      setCreateHODForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hod-lastname">Last Name</Label>
                  <Input
                    id="hod-lastname"
                    type="text"
                    placeholder="Smith"
                    value={createHODForm.lastName}
                    onChange={(e) =>
                      setCreateHODForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateHOD}
                  disabled={isCreating.hod}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isCreating.hod ? "Creating..." : "Create HOD"}
                </Button>
              </CardContent>
            </Card>

            {/* Create Staff */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Staff Member
                </CardTitle>
                <CardDescription>Create a new staff member</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staff-college">College</Label>
                  <select
                    id="staff-college"
                    className="w-full p-2 border rounded-md"
                    disabled={loadingColleges}
                    value={createStaffForm.collegeId}
                    onChange={(e) =>
                      setCreateStaffForm((prev) => ({
                        ...prev,
                        collegeId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select College</option>
                    {colleges.map((college: any) => (
                      <option key={college._id} value={college._id}>
                        {college.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-department">Department</Label>
                  <select
                    id="staff-department"
                    className="w-full p-2 border rounded-md"
                    value={createStaffForm.department}
                    onChange={(e) =>
                      setCreateStaffForm((prev) => ({
                        ...prev,
                        department: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="Administration">Administration</option>
                    <option value="Student Affairs">Student Affairs</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Admissions">Admissions</option>
                    <option value="Clinical Affairs">Clinical Affairs</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-email">Email</Label>
                  <Input
                    id="staff-email"
                    type="email"
                    placeholder="staff@college.edu"
                    value={createStaffForm.email}
                    onChange={(e) =>
                      setCreateStaffForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-firstname">First Name</Label>
                  <Input
                    id="staff-firstname"
                    type="text"
                    placeholder="Mike"
                    value={createStaffForm.firstName}
                    onChange={(e) =>
                      setCreateStaffForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staff-lastname">Last Name</Label>
                  <Input
                    id="staff-lastname"
                    type="text"
                    placeholder="Johnson"
                    value={createStaffForm.lastName}
                    onChange={(e) =>
                      setCreateStaffForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleCreateStaff}
                  disabled={isCreating.staff}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isCreating.staff ? "Creating..." : "Create Staff"}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recent Created Users */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Created Users</CardTitle>
              <CardDescription>
                Users created in the last 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecentUsers ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    Loading recent users...
                  </div>
                </div>
              ) : recentUsers.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-sm text-muted-foreground">
                    No users created in the last 7 days
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentUsers.map((user: any) => {
                    const {
                      icon: Icon,
                      bgColor,
                      iconColor,
                    } = getRoleIconAndColor(user.role);
                    const roleDisplayName = user.role
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase());
                    const collegeName = user.tenantId?.name || "No College";
                    const departmentInfo = user.department
                      ? ` - ${user.department}`
                      : "";

                    return (
                      <div
                        key={user._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center`}
                          >
                            <Icon className={`w-4 h-4 ${iconColor}`} />
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {roleDisplayName} - {collegeName}
                              {departmentInfo}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {getTimeAgo(user.createdAt)}
                          </p>
                          <Badge
                            variant={
                              user.status === "active" ? "default" : "secondary"
                            }
                          >
                            {user.status.charAt(0).toUpperCase() +
                              user.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Pending Approvals</h2>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Alumni Applications
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {loadingUserRequests ? "..." : requestStats.alumni}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting verification
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Admin Applications
                </CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {loadingUserRequests ? "..." : requestStats.admin}
                </div>
                <p className="text-xs text-muted-foreground">
                  New college admins
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  HOD Applications
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {loadingUserRequests ? "..." : requestStats.hod}
                </div>
                <p className="text-xs text-muted-foreground">
                  Department heads
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Staff Applications
                </CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {loadingUserRequests ? "..." : requestStats.staff}
                </div>
                <p className="text-xs text-muted-foreground">Staff members</p>
              </CardContent>
            </Card>
          </div>

          {/* Approval Lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Alumni Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Alumni Applications
                </CardTitle>
                <CardDescription>Verify alumni credentials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingUserRequests ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      Loading approvals...
                    </div>
                  </div>
                ) : pendingUserRequests.filter(
                    (request: any) => request.role === "alumni"
                  ).length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      No pending alumni approvals
                    </div>
                  </div>
                ) : (
                  pendingUserRequests
                    .filter((request: any) => request.role === "alumni")
                    .map((request: any) => (
                      <div
                        key={request.requestId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {request.firstName?.[0]}
                              {request.lastName?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {request.firstName} {request.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.department} -{" "}
                              {request.graduationYear || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {request.currentCompany || "N/A"} -{" "}
                              {request.currentPosition || "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() =>
                              handleRejectUserRequest(
                                request.requestId,
                                `${request.firstName} ${request.lastName}`
                              )
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleApproveUserRequest(
                                request.requestId,
                                `${request.firstName} ${request.lastName}`
                              )
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Admin/HOD/Staff Approvals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  Admin/HOD/Staff Applications
                </CardTitle>
                <CardDescription>Approve administrative users</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingUserRequests ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      Loading approvals...
                    </div>
                  </div>
                ) : pendingUserRequests.filter((request: any) =>
                    ["college_admin", "hod", "staff"].includes(request.role)
                  ).length === 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="text-muted-foreground">
                      No pending admin/staff approvals
                    </div>
                  </div>
                ) : (
                  pendingUserRequests
                    .filter((request: any) =>
                      ["college_admin", "hod", "staff"].includes(request.role)
                    )
                    .map((request: any) => (
                      <div
                        key={request.requestId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            {request.role === "college_admin" ? (
                              <Building2 className="w-4 h-4 text-blue-600" />
                            ) : request.role === "hod" ? (
                              <Users className="w-4 h-4 text-green-600" />
                            ) : (
                              <Settings className="w-4 h-4 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">
                              {request.firstName} {request.lastName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {request.role === "college_admin"
                                ? "College Admin"
                                : request.role === "hod"
                                ? "HOD"
                                : "Staff"}{" "}
                              - {request.department || "N/A"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Applied{" "}
                              {formatTimeAgo(new Date(request.requestedAt))}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600"
                            onClick={() =>
                              handleRejectUserRequest(
                                request.requestId,
                                `${request.firstName} ${request.lastName}`
                              )
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() =>
                              handleApproveUserRequest(
                                request.requestId,
                                `${request.firstName} ${request.lastName}`
                              )
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">System Settings</h2>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Database Status</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>API Status</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Storage Usage</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-medium">1,234</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Failed Login Attempts</span>
                    <Badge variant="secondary">23</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Suspicious Activity</span>
                    <Badge variant="destructive">2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Password Resets</span>
                    <Badge variant="secondary">45</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Account Lockouts</span>
                    <Badge variant="secondary">3</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SuperAdminDashboard;
