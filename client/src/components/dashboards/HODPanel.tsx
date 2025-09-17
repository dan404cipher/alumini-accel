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
import { Textarea } from "@/components/ui/textarea";
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
  UserPlus,
  BarChart3,
  TrendingUp,
  MessageSquare,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const HODPanel = () => {
  const { user } = useAuth();
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Mock data - replace with actual API calls
  const stats = {
    staffUnderHOD: 8,
    alumniEngagement: 78,
    postsCreated: 15,
    eventsOrganized: 6,
    pendingAlumni: 5,
    totalContributions: 45000,
  };

  const staffUnderHOD = [
    {
      id: 1,
      name: "Emily Rodriguez",
      email: "emily.r@college.edu",
      department: "Administration",
      status: "active",
      joinDate: "2023-01-15",
    },
    {
      id: 2,
      name: "David Kim",
      email: "david.kim@college.edu",
      department: "Student Affairs",
      status: "active",
      joinDate: "2023-03-20",
    },
    {
      id: 3,
      name: "Sarah Wilson",
      email: "sarah.w@college.edu",
      department: "Academic Affairs",
      status: "pending",
      joinDate: "2024-01-10",
    },
  ];

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
      department: "Computer Science",
      appliedDate: "2024-01-14",
    },
  ];

  const recentPosts = [
    {
      id: 1,
      title: "Department Research Opportunities",
      type: "information",
      views: 45,
      comments: 3,
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Alumni Networking Event",
      type: "event",
      views: 78,
      comments: 12,
      date: "2024-01-12",
    },
    {
      id: 3,
      title: "Help Request: Industry Mentorship",
      type: "help",
      views: 23,
      comments: 5,
      date: "2024-01-10",
    },
  ];

  const contributions = [
    {
      id: 1,
      alumni: "Dr. Michael Chen",
      amount: 5000,
      event: "Research Fund",
      date: "2024-01-15",
      status: "completed",
    },
    {
      id: 2,
      alumni: "Sarah Johnson",
      amount: 2500,
      event: "Scholarship Fund",
      date: "2024-01-12",
      status: "completed",
    },
    {
      id: 3,
      alumni: "John Smith",
      amount: 1000,
      event: "Department Equipment",
      date: "2024-01-10",
      status: "pending",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">HOD Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your department staff and alumni engagement
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="w-4 h-4 mr-2" />
          Head of Department
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Staff Under HOD
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.staffUnderHOD}</div>
            <p className="text-xs text-muted-foreground">
              Active staff members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alumni Engagement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniEngagement}%</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Created</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsCreated}</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Events Organized
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsOrganized}</div>
            <p className="text-xs text-muted-foreground">+1 this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="staff" className="space-y-6">
        <TabsList>
          <TabsTrigger value="staff">Staff Management</TabsTrigger>
          <TabsTrigger value="alumni">Alumni Verification</TabsTrigger>
          <TabsTrigger value="posts">Feed Posts</TabsTrigger>
          <TabsTrigger value="contributions">Contributions</TabsTrigger>
        </TabsList>

        {/* Staff Management */}
        <TabsContent value="staff" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Staff Management</h2>
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
                    Add a new staff member to your department.
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
                    <Input id="staff-department" placeholder="Administration" />
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

          <div className="space-y-4">
            {staffUnderHOD.map((staff) => (
              <Card key={staff.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <CardDescription>{staff.email}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          staff.status === "active" ? "default" : "secondary"
                        }
                      >
                        {staff.status}
                      </Badge>
                      <Badge variant="outline">{staff.department}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Joined: {staff.joinDate}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Profile
                      </Button>
                      <Button size="sm" variant="outline">
                        Manage
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alumni Verification */}
        <TabsContent value="alumni" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Alumni Verification</h2>
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

        {/* Feed Posts */}
        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Feed Posts</h2>
            <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share information, events, or help requests with alumni.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="post-title">Title</Label>
                    <Input id="post-title" placeholder="Enter post title" />
                  </div>
                  <div>
                    <Label htmlFor="post-type">Type</Label>
                    <select
                      id="post-type"
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="information">Information</option>
                      <option value="event">Event</option>
                      <option value="help">Help Request</option>
                      <option value="announcement">Announcement</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea
                      id="post-content"
                      placeholder="Write your post content here..."
                      className="min-h-32"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreatePostOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={() => setIsCreatePostOpen(false)}>
                    Create Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>Type: {post.type}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{post.type}</Badge>
                      <Badge variant="secondary">{post.date}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{post.views} views</span>
                      <span>{post.comments} comments</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Contributions */}
        <TabsContent value="contributions" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Contributions History</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">
                Total Raised:
              </span>
              <span className="text-lg font-bold">
                ${stats.totalContributions.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {contributions.map((contribution) => (
              <Card key={contribution.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {contribution.alumni}
                      </CardTitle>
                      <CardDescription>{contribution.event}</CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          contribution.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {contribution.status}
                      </Badge>
                      <span className="text-lg font-bold">
                        ${contribution.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Date: {contribution.date}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                      <Button size="sm" variant="outline">
                        Send Thank You
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HODPanel;
