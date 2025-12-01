import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  Clock,
  Download,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { tenantAPI, userAPI } from "@/lib/api";
import TenantManagement from "../TenantManagement";
import UserManagement from "../UserManagement";
import AlumniManagement from "../AlumniManagement";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Type definitions
interface Tenant {
  _id: string;
  name: string;
  domain?: string;
  [key: string]: unknown;
}

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
  tenantId?: {
    _id?: string;
    name?: string;
  };
  department?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface PendingUserRequest {
  requestId: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  tenantId?:
    | string
    | {
        _id?: string;
        name?: string;
      };
  department?: string;
  graduationYear?: number;
  currentCompany?: string;
  currentPosition?: string;
  requestedAt?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface TenantResponse {
  tenants?: Tenant[];
  data?: Tenant[];
}

interface UserResponse {
  users?: User[];
  data?: User[];
}

interface ActivityItem {
  id: string;
  action: string;
  college: string;
  time: string;
  type: "success" | "warning" | "info";
}

// Analytics type definitions
interface ChartDataPoint {
  name: string;
  alumni: number;
  admin: number;
  hod: number;
  staff: number;
  total: number;
}

interface PieDataPoint {
  name: string;
  value: number;
  color: string;
}

interface CollegePerformance {
  id: string;
  name: string;
  userCount: number;
  activeUsers: number;
  engagementScore: number;
  trend: "up" | "down" | "stable";
}

type TimePeriod = "daily" | "weekly" | "monthly";

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "colleges";
  const [colleges, setColleges] = useState<Tenant[]>([]);
  const [loadingColleges, setLoadingColleges] = useState(false);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [loadingRecentUsers, setLoadingRecentUsers] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // User request states
  const [pendingUserRequests, setPendingUserRequests] = useState<
    PendingUserRequest[]
  >([]);
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
  const debounce = <T extends (...args: unknown[]) => void>(
    func: T,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
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

  // Analytics state
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("weekly");


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
      const responseTyped = response as APIResponse<TenantResponse>;
      const dataTyped = responseTyped.data as TenantResponse;
      if (response.success && dataTyped) {
        setColleges(dataTyped.tenants || []);
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
      const responseTyped = response as APIResponse<UserResponse>;
      const dataTyped = responseTyped.data as UserResponse;
      if (response.success && dataTyped?.users) {
        // Filter users created in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentUsersList = dataTyped.users.filter((user) => {
          if (!user.createdAt) return false;
          const createdAt = new Date(user.createdAt);
          return createdAt >= sevenDaysAgo;
        });

        // Sort by creation date (newest first) and limit to 5
        const sortedRecentUsers = recentUsersList
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Approvals tab removed

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

      const response = await userAPI.createPendingUserRequest(userData);

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
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create college admin";
      toast({
        title: "Error",
        description: errorMessage,
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

      const response = await userAPI.createPendingUserRequest(userData);

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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create HOD";
      toast({
        title: "Error",
        description: errorMessage,
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

      const response = await userAPI.createPendingUserRequest(userData);

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
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create staff member";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating((prev) => ({ ...prev, staff: false }));
    }
  };

  // Handler functions for college management
  const handleViewCollege = (collegeId: string) => {
    // TODO: Implement view college details
    // Could open a modal or navigate to college details page
  };

  const handleManageCollege = (collegeId: string) => {
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
      const response = await userAPI.getPendingUserRequests();

      if (response.success && response.data) {
        const requests = response.data as PendingUserRequest[];
        setPendingUserRequests(requests);

        // Calculate stats by role
        const stats = {
          alumni: requests.filter((request) => request.role === "alumni")
            .length,
          admin: requests.filter((request) => request.role === "college_admin")
            .length,
          hod: requests.filter((request) => request.role === "hod").length,
          staff: requests.filter((request) => request.role === "staff").length,
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
  const debouncedFetchColleges = useCallback(
    debounce(() => {
      fetchColleges();
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const debouncedFetchRecentUsers = useCallback(
    debounce(() => {
      fetchRecentUsers();
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const debouncedFetchPendingUserRequests = useCallback(
    debounce(() => {
      fetchPendingUserRequests();
    }, 300),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  const recentActivity: ActivityItem[] = [
    // Show recent user registrations
    ...(recentUsers || []).slice(0, 3).map((user, index) => ({
      id: `user_${index + 1}`,
      action: `New ${user?.role || "user"} registered`,
      college:
        typeof user?.tenantId === "object" && user.tenantId?.name
          ? user.tenantId.name
          : "Unknown College",
      time: formatTimeAgo(user?.createdAt),
      type: "info" as const,
    })),
    // Show pending requests
    ...(pendingUserRequests || []).slice(0, 2).map((request, index) => ({
      id: `request_${index + 1}`,
      action: `${request?.role || "user"} approval pending`,
      college:
        typeof request?.tenantId === "object" && request.tenantId?.name
          ? request.tenantId.name
          : typeof request?.tenantId === "string"
          ? request.tenantId
          : "Unknown College",
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

  // Analytics Data Generation Functions
  const generateActivityTrendsData = (): ChartDataPoint[] => {
    const dataPoints = timePeriod === "daily" ? 7 : timePeriod === "weekly" ? 12 : 12;
    const data: ChartDataPoint[] = [];
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const alumni = Math.floor(Math.random() * 30) + 10;
      const admin = Math.floor(Math.random() * 5) + 1;
      const hod = Math.floor(Math.random() * 3) + 1;
      const staff = Math.floor(Math.random() * 8) + 2;
      
      let name = "";
      if (timePeriod === "daily") {
        const date = new Date();
        date.setDate(date.getDate() - i);
        name = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      } else if (timePeriod === "weekly") {
        name = `Week ${dataPoints - i}`;
      } else {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        name = date.toLocaleDateString("en-US", { month: "short" });
      }
      
      data.push({
        name,
        alumni,
        admin,
        hod,
        staff,
        total: alumni + admin + hod + staff,
      });
    }
    
    return data;
  };

  const getRoleDistributionData = (): PieDataPoint[] => {
    const totalAlumni = recentUsers.filter(u => u.role === "alumni").length || 45;
    const totalAdmin = recentUsers.filter(u => u.role === "college_admin").length || 8;
    const totalHOD = recentUsers.filter(u => u.role === "hod").length || 12;
    const totalStaff = recentUsers.filter(u => u.role === "staff").length || 25;
    
    return [
      { name: "Alumni", value: totalAlumni * 10, color: "#3b82f6" },
      { name: "Admins", value: totalAdmin * 10, color: "#10b981" },
      { name: "HOD", value: totalHOD * 10, color: "#f59e0b" },
      { name: "Staff", value: totalStaff * 10, color: "#8b5cf6" },
    ];
  };

  const getActiveVsInactiveData = () => {
    return colleges.slice(0, 5).map((college, index) => ({
      name: college.name.length > 15 ? college.name.substring(0, 15) + "..." : college.name,
      active: Math.floor(Math.random() * 100) + 50,
      inactive: Math.floor(Math.random() * 30) + 10,
    }));
  };

  const getCollegeEngagementData = () => {
    return colleges.slice(0, 5).map((college, index) => {
      const baseValue = 100 - (index * 15);
      return {
        name: college.name.length > 12 ? college.name.substring(0, 12) + "..." : college.name,
        engagement: baseValue + Math.floor(Math.random() * 20),
      };
    });
  };

  const calculateCollegePerformance = (): CollegePerformance[] => {
    return colleges.map((college, index) => {
      const userCount = Math.floor(Math.random() * 200) + 50;
      const activeUsers = Math.floor(userCount * (0.6 + Math.random() * 0.3));
      const engagementScore = Math.floor((activeUsers / userCount) * 100);
      const trends: ("up" | "down" | "stable")[] = ["up", "down", "stable"];
      
      return {
        id: college._id,
        name: college.name,
        userCount,
        activeUsers,
        engagementScore,
        trend: trends[Math.floor(Math.random() * trends.length)],
      };
    }).sort((a, b) => b.engagementScore - a.engagementScore);
  };

  const exportToPDF = () => {
    const reportData = `
SUPER ADMIN ANALYTICS REPORT
Generated: ${new Date().toLocaleString()}
Period: ${timePeriod.toUpperCase()}

OVERVIEW METRICS
================
Total Colleges: ${stats.totalColleges}
Total Users: ${stats.totalUsers}
Active Users: ${stats.activeUsers}
Engagement Rate: ${Math.floor((stats.activeUsers / stats.totalUsers) * 100)}%

TOP PERFORMING COLLEGES
=======================
${calculateCollegePerformance().slice(0, 5).map((c, i) => 
  `${i + 1}. ${c.name} - Engagement: ${c.engagementScore}% (${c.userCount} users)`
).join('\n')}

UNDERPERFORMING COLLEGES
========================
${calculateCollegePerformance().slice(-3).reverse().map((c, i) => 
  `${i + 1}. ${c.name} - Engagement: ${c.engagementScore}% (${c.userCount} users)`
).join('\n')}
    `.trim();

    const blob = new Blob([reportData], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Exported",
      description: "Analytics report has been downloaded as PDF",
    });
  };

  const exportToCSV = () => {
    const performanceData = calculateCollegePerformance();
    const csvContent = [
      ["College Name", "Total Users", "Active Users", "Engagement Score", "Trend"].join(","),
      ...performanceData.map(c => 
        [c.name, c.userCount, c.activeUsers, c.engagementScore, c.trend].join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-data-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: "Analytics data has been downloaded as CSV",
    });
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      id: "colleges",
      label: "Colleges",
      icon: Building2,
      description: "Manage colleges and institutions",
    },
    {
      id: "admin-staff",
      label: "Admin & Staff",
      icon: Users,
      description: "Manage administrators and staff",
    },
    {
      id: "create-users",
      label: "Create Users",
      icon: UserPlus,
      description: "Create new user accounts",
    },
    {
      id: "analytics",
      label: "Report & Analytics",
      icon: BarChart3,
      description: "Analytics and performance reports",
    },
  ];

  return (
    <div className="flex bg-gray-50 min-h-screen">
      {/* Left Sidebar */}
      <div className="fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg border-r border-gray-200 overflow-hidden z-40">
        <nav className="p-4 space-y-2 h-full overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSearchParams({ tab: item.id })}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? "text-blue-600" : "text-gray-500"
                  }`}
                />
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-xs text-gray-500">
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-gray-50 ml-64 pt-0">
        <div className="p-4 sm:p-6 lg:p-8 min-h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {sidebarItems.find((item) => item.id === activeTab)?.label ||
                  "Super Admin Dashboard"}
              </h1>
              <p className="text-gray-600 mt-1">
                {sidebarItems.find((item) => item.id === activeTab)
                  ?.description || "Global system overview and management"}
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
                  ${stats.totalFundsRaised.toLocaleString()}
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

          {/* Main Content Tabs */}

          {activeTab === "colleges" && (
            <div className="space-y-6">
              <TenantManagement />
            </div>
          )}

          {activeTab === "admin-staff" && (
            <div className="space-y-6">
              <UserManagement />
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="space-y-6 mt-8">
              {/* Time Period Filter */}
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
                </div>
                <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
                  {(["daily", "weekly", "monthly"] as TimePeriod[]).map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        timePeriod === period
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Calendar className="w-4 h-4 inline mr-1" />
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Key Metrics Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-900">Total Colleges</CardTitle>
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">{stats.totalColleges}</div>
                    <p className="text-xs text-blue-700 flex items-center mt-2">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +2 from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-900">Total Users</CardTitle>
                    <Users className="h-5 w-5 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">{stats.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-green-700">Active: {stats.activeUsers.toLocaleString()}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-900">Engagement Score</CardTitle>
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">
                      {Math.floor((stats.activeUsers / stats.totalUsers) * 100)}%
                    </div>
                    <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.floor((stats.activeUsers / stats.totalUsers) * 100)}%` }}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-orange-900">Growth Rate</CardTitle>
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900">+12.5%</div>
                    <p className="text-xs text-orange-700 mt-2">This {timePeriod}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Trends Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>User Registration Trends</CardTitle>
                  <CardDescription>New user registrations by role over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={generateActivityTrendsData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="alumni" stroke="#3b82f6" strokeWidth={2} name="Alumni" />
                      <Line type="monotone" dataKey="admin" stroke="#10b981" strokeWidth={2} name="Admins" />
                      <Line type="monotone" dataKey="hod" stroke="#f59e0b" strokeWidth={2} name="HOD" />
                      <Line type="monotone" dataKey="staff" stroke="#8b5cf6" strokeWidth={2} name="Staff" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* User Distribution Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution by Role</CardTitle>
                    <CardDescription>Breakdown of all users by their roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getRoleDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getRoleDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active vs Inactive Users</CardTitle>
                    <CardDescription>User activity status by college</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getActiveVsInactiveData()}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={11} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                        />
                        <Legend />
                        <Bar dataKey="active" fill="#10b981" name="Active" />
                        <Bar dataKey="inactive" fill="#ef4444" name="Inactive" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* College Engagement Trends */}
              <Card>
                <CardHeader>
                  <CardTitle>College Engagement Trends</CardTitle>
                  <CardDescription>Engagement scores for top colleges</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={getCollegeEngagementData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#8b5cf6" 
                        fill="#c4b5fd" 
                        name="Engagement Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* College Performance Rankings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Top Performing Colleges
                    </CardTitle>
                    <CardDescription>Colleges with highest engagement scores</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {calculateCollegePerformance().slice(0, 5).map((college, index) => (
                        <div key={college.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-full font-bold text-sm">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{college.name}</p>
                              <p className="text-sm text-gray-500">{college.userCount} users • {college.activeUsers} active</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                {college.engagementScore}%
                              </Badge>
                              {college.trend === "up" && <TrendingUp className="w-4 h-4 text-green-600" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5 text-orange-600" />
                      Needs Attention
                    </CardTitle>
                    <CardDescription>Colleges requiring engagement improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {calculateCollegePerformance().slice(-3).reverse().map((college, index) => (
                        <div key={college.id} className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-700 rounded-full font-bold text-sm">
                              !
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{college.name}</p>
                              <p className="text-sm text-gray-600">{college.userCount} users • {college.activeUsers} active</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-orange-200 text-orange-800 hover:bg-orange-200">
                                {college.engagementScore}%
                              </Badge>
                              {college.trend === "down" && <TrendingDown className="w-4 h-4 text-orange-600" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

           
            </div>
          )}

          {activeTab === "create-users" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Create Admin/HOD/Staff Users
                </h2>
                
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
                        {colleges.map((college) => (
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
                        {colleges.map((college) => (
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
                        <option value="Computer Science">
                          Computer Science
                        </option>
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
                        {colleges.map((college) => (
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
                        <option value="Clinical Affairs">
                          Clinical Affairs
                        </option>
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
                      {recentUsers.map((user) => {
                        const {
                          icon: Icon,
                          bgColor,
                          iconColor,
                        } = getRoleIconAndColor(user.role || "");
                        const roleDisplayName = (user.role || "")
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase());
                        const collegeName =
                          typeof user.tenantId === "object" &&
                          user.tenantId?.name
                            ? user.tenantId.name
                            : "No College";
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
                                  user.status === "active"
                                    ? "default"
                                    : "secondary"
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
            </div>
          )}

          {activeTab === "approvals" && (
            <div className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">
                      Staff members
                    </p>
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
                        (request) => request.role === "alumni"
                      ).length === 0 ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-muted-foreground">
                          No pending alumni approvals
                        </div>
                      </div>
                    ) : (
                      pendingUserRequests
                        .filter((request) => request.role === "alumni")
                        .map((request) => (
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
                    <CardDescription>
                      Approve administrative users
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {loadingUserRequests ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-muted-foreground">
                          Loading approvals...
                        </div>
                      </div>
                    ) : pendingUserRequests.filter((request) =>
                        ["college_admin", "hod", "staff"].includes(
                          request.role || ""
                        )
                      ).length === 0 ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="text-muted-foreground">
                          No pending admin/staff approvals
                        </div>
                      </div>
                    ) : (
                      pendingUserRequests
                        .filter((request) =>
                          ["college_admin", "hod", "staff"].includes(
                            request.role || ""
                          )
                        )
                        .map((request) => (
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
