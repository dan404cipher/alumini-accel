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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  GraduationCap,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Plus,
  Upload,
  Settings,
  BarChart3,
  FileDown,
  UserPlus,
  Building2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userAPI, alumniAPI, eventAPI, jobAPI } from "@/lib/api";
import AlumniManagement from "../AlumniManagement";
import CampaignManagement from "../CampaignManagement";
// Note: College Admin only manages their own college, not all colleges

const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateHODOpen, setIsCreateHODOpen] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  // Alumni creation is now handled by AlumniManagement component

  // Real data states
  const [stats, setStats] = useState({
    totalAlumni: 0,
    activeStaff: 0,
    eventsPosted: 0,
    fundsRaised: 0,
    pendingAlumni: 0,
    pendingHOD: 0,
    pendingStaff: 0,
  });

  const [pendingAlumni, setPendingAlumni] = useState([]);
  const [hodStaff, setHodStaff] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState({
    stats: false,
    alumni: false,
    staff: false,
    events: false,
  });

  // Form states for creating HOD/Staff
  const [newHOD, setNewHOD] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
  });

  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
  });

  // Alumni form state is now handled by AlumniManagement component

  const [createLoading, setCreateLoading] = useState({
    hod: false,
    staff: false,
    admin: false,
  });

  // Fetch dashboard statistics
  const fetchStats = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, stats: true }));

      // Fetch alumni count
      const alumniResponse = await alumniAPI.getAllAlumni({
        limit: 1,
        tenantId: user.tenantId,
      });

      // Fetch staff count (HOD + Staff roles)
      const staffResponse = await userAPI.getAllUsers({
        role: "hod,staff",
        tenantId: user.tenantId,
        limit: 1,
      });

      // Fetch events count
      const eventsResponse = await eventAPI.getAllEvents({
        limit: 1,
        tenantId: user.tenantId,
      });

      // Fetch pending alumni requests
      const pendingAlumniResponse = await userAPI.getPendingUserRequests();
      const pendingAlumniCount =
        pendingAlumniResponse.data?.filter(
          (req: any) => req.role === "alumni" && req.tenantId === user.tenantId
        ).length || 0;

      // Fetch pending staff requests
      const pendingStaffCount =
        pendingAlumniResponse.data?.filter(
          (req: any) =>
            (req.role === "hod" || req.role === "staff") &&
            req.tenantId === user.tenantId
        ).length || 0;

      setStats({
        totalAlumni: alumniResponse.data?.pagination?.total || 0,
        activeStaff: staffResponse.data?.pagination?.total || 0,
        eventsPosted: eventsResponse.data?.pagination?.total || 0,
        fundsRaised: 125000, // Keep as mock for now
        pendingAlumni: pendingAlumniCount,
        pendingHOD: pendingStaffCount,
        pendingStaff: pendingStaffCount,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
    }
  }, [user?.tenantId, toast]);

  // Fetch pending requests (Admin, HOD, Staff, Alumni)
  const fetchPendingAlumni = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, alumni: true }));
      const response = await userAPI.getPendingUserRequests();

      if (response.success && response.data) {
        const allRequests = response.data.filter(
          (req: any) => req.tenantId === user.tenantId
        );
        setPendingAlumni(allRequests);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({
        title: "Error",
        description: "Failed to load pending requests",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, alumni: false }));
    }
  }, [user?.tenantId, toast]);

  // Fetch HOD and Staff
  const fetchHodStaff = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, staff: true }));
      const response = await userAPI.getAllUsers({
        role: "hod,staff",
        tenantId: user.tenantId,
      });

      if (response.success && response.data?.users) {
        setHodStaff(response.data.users);
      }
    } catch (error) {
      console.error("Error fetching HOD/Staff:", error);
      toast({
        title: "Error",
        description: "Failed to load HOD and Staff data",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, staff: false }));
    }
  }, [user?.tenantId, toast]);

  // Fetch recent events
  const fetchRecentEvents = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, events: true }));
      const response = await eventAPI.getAllEvents({
        limit: 5,
        tenantId: user.tenantId,
      });

      if (response.success && response.data?.events) {
        setRecentEvents(response.data.events);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load recent events",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, events: false }));
    }
  }, [user?.tenantId, toast]);

  // Alumni approval/rejection functions
  const handleApproveAlumni = async (requestId: string) => {
    try {
      const response = await userAPI.approveUserRequest(requestId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Alumni request approved successfully",
        });
        // Refresh data
        fetchPendingAlumni();
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to approve alumni request");
      }
    } catch (error) {
      console.error("Error approving alumni:", error);
      toast({
        title: "Error",
        description: "Failed to approve alumni request",
        variant: "destructive",
      });
    }
  };

  const handleRejectAlumni = async (requestId: string) => {
    try {
      const response = await userAPI.rejectUserRequest(
        requestId,
        "Rejected by College Admin"
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Alumni request rejected successfully",
        });
        // Refresh data
        fetchPendingAlumni();
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to reject alumni request");
      }
    } catch (error) {
      console.error("Error rejecting alumni:", error);
      toast({
        title: "Error",
        description: "Failed to reject alumni request",
        variant: "destructive",
      });
    }
  };

  // HOD/Staff creation functions
  const handleCreateHOD = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading((prev) => ({ ...prev, hod: true }));

    try {
      const userData = {
        firstName: newHOD.firstName.trim(),
        lastName: newHOD.lastName.trim(),
        email: newHOD.email.trim(),
        password: newHOD.password,
        role: "hod",
        tenantId: user?.tenantId,
        department: newHOD.department.trim(),
      };

      const response = await userAPI.createPendingUserRequest(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "HOD request submitted for approval",
        });
        // Reset form and close dialog
        setNewHOD({
          firstName: "",
          lastName: "",
          email: "",
          department: "",
          password: "",
        });
        setIsCreateHODOpen(false);
        // Refresh data
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to create HOD request");
      }
    } catch (error) {
      console.error("Error creating HOD:", error);
      toast({
        title: "Error",
        description: "Failed to create HOD request",
        variant: "destructive",
      });
    } finally {
      setCreateLoading((prev) => ({ ...prev, hod: false }));
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading((prev) => ({ ...prev, staff: true }));

    try {
      const userData = {
        firstName: newStaff.firstName.trim(),
        lastName: newStaff.lastName.trim(),
        email: newStaff.email.trim(),
        password: newStaff.password,
        role: "staff",
        tenantId: user?.tenantId,
        department: newStaff.department.trim(),
      };

      const response = await userAPI.createPendingUserRequest(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff request submitted for approval",
        });
        // Reset form and close dialog
        setNewStaff({
          firstName: "",
          lastName: "",
          email: "",
          department: "",
          password: "",
        });
        setIsCreateStaffOpen(false);
        // Refresh data
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to create staff request");
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        title: "Error",
        description: "Failed to create staff request",
        variant: "destructive",
      });
    } finally {
      setCreateLoading((prev) => ({ ...prev, staff: false }));
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading((prev) => ({ ...prev, admin: true }));

    try {
      const userData = {
        firstName: newAdmin.firstName.trim(),
        lastName: newAdmin.lastName.trim(),
        email: newAdmin.email.trim(),
        password: newAdmin.password,
        role: "college_admin",
        tenantId: user?.tenantId,
        department: newAdmin.department.trim(),
      };

      const response = await userAPI.createPendingUserRequest(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Admin request submitted for approval",
        });
        // Reset form and close dialog
        setNewAdmin({
          firstName: "",
          lastName: "",
          email: "",
          department: "",
          password: "",
        });
        setIsCreateAdminOpen(false);
        // Refresh data
        fetchStats();
      } else {
        throw new Error(response.message || "Failed to create admin request");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: "Failed to create admin request",
        variant: "destructive",
      });
    } finally {
      setCreateLoading((prev) => ({ ...prev, admin: false }));
    }
  };

  // Alumni creation is now handled by AlumniManagement component

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchPendingAlumni();
    fetchHodStaff();
    fetchRecentEvents();
  }, [fetchStats, fetchPendingAlumni, fetchHodStaff, fetchRecentEvents]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">College Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your college's alumni network and operations
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Building2 className="w-4 h-4 mr-2" />
          College Admin
        </Badge>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="college" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="hidden sm:inline">College Settings</span>
          </TabsTrigger>
          <TabsTrigger value="admin-staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Admin & Staff</span>
          </TabsTrigger>
          <TabsTrigger value="alumni" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Alumni</span>
          </TabsTrigger>
          <TabsTrigger value="fundraisers" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Fundraisers</span>
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Overview */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Dashboard Overview</h2>
            <Button
              variant="outline"
              onClick={() => {
                fetchStats();
                fetchPendingAlumni();
                fetchHodStaff();
                fetchRecentEvents();
              }}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>

          {/* Quick Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Alumni
                </CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading.stats ? "..." : stats.totalAlumni.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats.pendingAlumni} pending approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Staff
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading.stats ? "..." : stats.activeStaff}
                </div>
                <p className="text-xs text-muted-foreground">
                  +{stats.pendingStaff} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Events Posted
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {loading.stats ? "..." : stats.eventsPosted}
                </div>
                <p className="text-xs text-muted-foreground">+3 this month</p>
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
                  ${stats.fundsRaised.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>
                  Latest events and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading.events ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">Loading events...</p>
                    </div>
                  ) : recentEvents.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">No events found</p>
                    </div>
                  ) : (
                    recentEvents.map((event: any) => (
                      <div
                        key={event._id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{event.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {event.attendees || 0} attendees
                          </p>
                          <Badge
                            variant={
                              event.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {event.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  Alumni requests awaiting approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading.alumni ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        Loading pending requests...
                      </p>
                    </div>
                  ) : pendingAlumni.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground">
                        No pending requests
                      </p>
                    </div>
                  ) : (
                    pendingAlumni.slice(0, 3).map((alumni: any) => (
                      <div
                        key={alumni.requestId}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {alumni.firstName} {alumni.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {alumni.email}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRejectAlumni(alumni.requestId)}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApproveAlumni(alumni.requestId)
                            }
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* College Settings - Only for the admin's own college */}
        <TabsContent value="college" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">College Settings</h2>
            <Button>
              <Settings className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>College Logo</CardTitle>
                <CardDescription>
                  Upload your college logo (PNG, JPG, SVG)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Banner Image</CardTitle>
                <CardDescription>
                  Upload a banner image for your college page
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Click to upload or drag and drop
                  </p>
                  <Button variant="outline" className="mt-4">
                    Choose File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>About College</CardTitle>
              <CardDescription>
                Write a description about your college
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 p-3 border rounded-lg resize-none"
                placeholder="Enter a detailed description about your college, its history, achievements, and what makes it special..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin & Staff Management - Only for this college */}
        <TabsContent value="admin-staff" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Admin & Staff Management</h2>
            <div className="flex space-x-2">
              <Dialog
                open={isCreateAdminOpen}
                onOpenChange={setIsCreateAdminOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Admin
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Admin</DialogTitle>
                    <DialogDescription>
                      Add a new college admin to your college.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateAdmin} className="space-y-4">
                    <div>
                      <Label htmlFor="admin-firstName">First Name</Label>
                      <Input
                        id="admin-firstName"
                        placeholder="John"
                        value={newAdmin.firstName}
                        onChange={(e) =>
                          setNewAdmin((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-lastName">Last Name</Label>
                      <Input
                        id="admin-lastName"
                        placeholder="Smith"
                        value={newAdmin.lastName}
                        onChange={(e) =>
                          setNewAdmin((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-email">Email</Label>
                      <Input
                        id="admin-email"
                        type="email"
                        placeholder="john.smith@college.edu"
                        value={newAdmin.email}
                        onChange={(e) =>
                          setNewAdmin((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-department">Department</Label>
                      <Input
                        id="admin-department"
                        placeholder="Administration"
                        value={newAdmin.department}
                        onChange={(e) =>
                          setNewAdmin((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin-password">Default Password</Label>
                      <Input
                        id="admin-password"
                        type="password"
                        placeholder="Admin@1234"
                        value={newAdmin.password}
                        onChange={(e) =>
                          setNewAdmin((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateAdminOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLoading.admin}>
                        {createLoading.admin ? "Creating..." : "Create Admin"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={isCreateHODOpen} onOpenChange={setIsCreateHODOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create HOD
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New HOD</DialogTitle>
                    <DialogDescription>
                      Add a new Head of Department to your college.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateHOD} className="space-y-4">
                    <div>
                      <Label htmlFor="hod-firstName">First Name</Label>
                      <Input
                        id="hod-firstName"
                        placeholder="John"
                        value={newHOD.firstName}
                        onChange={(e) =>
                          setNewHOD((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-lastName">Last Name</Label>
                      <Input
                        id="hod-lastName"
                        placeholder="Smith"
                        value={newHOD.lastName}
                        onChange={(e) =>
                          setNewHOD((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-email">Email</Label>
                      <Input
                        id="hod-email"
                        type="email"
                        placeholder="john.smith@college.edu"
                        value={newHOD.email}
                        onChange={(e) =>
                          setNewHOD((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-department">Department</Label>
                      <Input
                        id="hod-department"
                        placeholder="Computer Science"
                        value={newHOD.department}
                        onChange={(e) =>
                          setNewHOD((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-password">Default Password</Label>
                      <Input
                        id="hod-password"
                        type="password"
                        placeholder="HOD@1234"
                        value={newHOD.password}
                        onChange={(e) =>
                          setNewHOD((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateHODOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLoading.hod}>
                        {createLoading.hod ? "Creating..." : "Create HOD"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isCreateStaffOpen}
                onOpenChange={setIsCreateStaffOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Staff Member</DialogTitle>
                    <DialogDescription>
                      Add a new staff member to your college.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateStaff} className="space-y-4">
                    <div>
                      <Label htmlFor="staff-firstName">First Name</Label>
                      <Input
                        id="staff-firstName"
                        placeholder="Jane"
                        value={newStaff.firstName}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-lastName">Last Name</Label>
                      <Input
                        id="staff-lastName"
                        placeholder="Doe"
                        value={newStaff.lastName}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-email">Email</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        placeholder="jane.doe@college.edu"
                        value={newStaff.email}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-department">Department</Label>
                      <Input
                        id="staff-department"
                        placeholder="Administration"
                        value={newStaff.department}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            department: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-password">Default Password</Label>
                      <Input
                        id="staff-password"
                        type="password"
                        placeholder="Staff@1234"
                        value={newStaff.password}
                        onChange={(e) =>
                          setNewStaff((prev) => ({
                            ...prev,
                            password: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateStaffOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createLoading.staff}>
                        {createLoading.staff ? "Creating..." : "Create Staff"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            {loading.staff ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Loading HOD and Staff data...
                </p>
              </div>
            ) : hodStaff.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No HOD or Staff members found
                </p>
              </div>
            ) : (
              hodStaff.map((member: any) => (
                <Card key={member._id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {member.firstName} {member.lastName}
                        </CardTitle>
                        <CardDescription>{member.email}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            member.role === "hod" ? "default" : "secondary"
                          }
                        >
                          {member.role?.toUpperCase()}
                        </Badge>
                        <Badge
                          variant={
                            member.status === "active" ? "default" : "secondary"
                          }
                        >
                          {member.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Department: {member.department || "N/A"}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <Settings className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Alumni Management */}
        <TabsContent value="alumni" className="space-y-6">
          <AlumniManagement />
        </TabsContent>

        {/* Fundraisers Management */}
        <TabsContent value="fundraisers" className="space-y-6">
          <CampaignManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollegeAdminDashboard;
