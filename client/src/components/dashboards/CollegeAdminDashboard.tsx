import React, { useState } from "react";
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

const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const [isCreateHODOpen, setIsCreateHODOpen] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);

  // Mock data - replace with actual API calls
  const stats = {
    totalAlumni: 3240,
    activeStaff: 45,
    eventsPosted: 23,
    fundsRaised: 125000,
    pendingAlumni: 12,
    pendingHOD: 3,
    pendingStaff: 8,
  };

  const pendingAlumni = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@email.com",
      graduationYear: 2020,
      department: "Computer Science",
      appliedDate: "2024-01-15",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      graduationYear: 2019,
      department: "Business",
      appliedDate: "2024-01-14",
    },
    {
      id: 3,
      name: "Mike Chen",
      email: "mike.chen@email.com",
      graduationYear: 2021,
      department: "Engineering",
      appliedDate: "2024-01-13",
    },
  ];

  const hodStaff = [
    {
      id: 1,
      name: "Dr. Lisa Wang",
      email: "lisa.wang@college.edu",
      role: "HOD",
      department: "Computer Science",
      status: "active",
    },
    {
      id: 2,
      name: "Dr. Robert Brown",
      email: "robert.brown@college.edu",
      role: "HOD",
      department: "Engineering",
      status: "active",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily.r@college.edu",
      role: "Staff",
      department: "Administration",
      status: "active",
    },
    {
      id: 4,
      name: "David Kim",
      email: "david.kim@college.edu",
      role: "Staff",
      department: "Student Affairs",
      status: "pending",
    },
  ];

  const recentEvents = [
    {
      id: 1,
      title: "Annual Alumni Reunion",
      date: "2024-02-15",
      attendees: 150,
      status: "upcoming",
    },
    {
      id: 2,
      title: "Career Workshop",
      date: "2024-01-20",
      attendees: 75,
      status: "completed",
    },
    {
      id: 3,
      title: "Tech Talk Series",
      date: "2024-02-01",
      attendees: 45,
      status: "upcoming",
    },
  ];

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalAlumni.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{stats.pendingAlumni} pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeStaff}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.pendingStaff} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Posted</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsPosted}</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funds Raised</CardTitle>
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

      {/* Main Content Tabs */}
      <Tabs defaultValue="alumni" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alumni">Alumni Approvals</TabsTrigger>
          <TabsTrigger value="staff">HOD & Staff Management</TabsTrigger>
          <TabsTrigger value="branding">College Branding</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* Alumni Approvals */}
        <TabsContent value="alumni" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Alumni Approvals</h2>
            <Badge variant="secondary">{stats.pendingAlumni} Pending</Badge>
          </div>

          <div className="space-y-4">
            {pendingAlumni.map((alumni) => (
              <Card key={alumni.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{alumni.name}</CardTitle>
                      <CardDescription>{alumni.email}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{alumni.department}</Badge>
                      <Badge variant="secondary">
                        Class of {alumni.graduationYear}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Applied on {alumni.appliedDate}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                      <Button size="sm">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* HOD & Staff Management */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">HOD & Staff Management</h2>
            <div className="flex space-x-2">
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="hod-name">Full Name</Label>
                      <Input id="hod-name" placeholder="Dr. John Smith" />
                    </div>
                    <div>
                      <Label htmlFor="hod-email">Email</Label>
                      <Input
                        id="hod-email"
                        type="email"
                        placeholder="john.smith@college.edu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-department">Department</Label>
                      <Input
                        id="hod-department"
                        placeholder="Computer Science"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hod-password">Default Password</Label>
                      <Input
                        id="hod-password"
                        type="password"
                        placeholder="HOD@1234"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateHODOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsCreateHODOpen(false)}>
                      Create HOD
                    </Button>
                  </DialogFooter>
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
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="staff-name">Full Name</Label>
                      <Input id="staff-name" placeholder="Jane Doe" />
                    </div>
                    <div>
                      <Label htmlFor="staff-email">Email</Label>
                      <Input
                        id="staff-email"
                        type="email"
                        placeholder="jane.doe@college.edu"
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-department">Department</Label>
                      <Input
                        id="staff-department"
                        placeholder="Administration"
                      />
                    </div>
                    <div>
                      <Label htmlFor="staff-password">Default Password</Label>
                      <Input
                        id="staff-password"
                        type="password"
                        placeholder="Staff@1234"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateStaffOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={() => setIsCreateStaffOpen(false)}>
                      Create Staff
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="space-y-4">
            {hodStaff.map((member) => (
              <Card key={member.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          member.role === "HOD" ? "default" : "secondary"
                        }
                      >
                        {member.role}
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
                      Department: {member.department}
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
            ))}
          </div>
        </TabsContent>

        {/* College Branding */}
        <TabsContent value="branding" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">College Branding</h2>
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

        {/* Reports */}
        <TabsContent value="reports" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Reports & Analytics</h2>
            <div className="flex space-x-2">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
              <Button>
                <FileDown className="w-4 h-4 mr-2" />
                Export Data
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download data in various formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <FileDown className="w-4 h-4 mr-2" />
                  Alumni Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileDown className="w-4 h-4 mr-2" />
                  Job Posts (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileDown className="w-4 h-4 mr-2" />
                  Event Reports (PDF)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileDown className="w-4 h-4 mr-2" />
                  Contributions (CSV)
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Events</CardTitle>
                <CardDescription>
                  Latest events and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {event.attendees} attendees
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CollegeAdminDashboard;
