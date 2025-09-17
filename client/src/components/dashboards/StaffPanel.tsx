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
  CheckCircle,
  XCircle,
  Plus,
  MessageSquare,
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const StaffPanel = () => {
  const { user } = useAuth();
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  // Mock data - replace with actual API calls
  const stats = {
    alumniVerified: 45,
    postsMade: 23,
    eventsPosted: 8,
    pendingAlumni: 7,
    postsModerated: 12,
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

  const recentPosts = [
    {
      id: 1,
      title: "Welcome New Alumni",
      author: "Emily Rodriguez",
      type: "announcement",
      views: 45,
      comments: 3,
      date: "2024-01-15",
      status: "published",
    },
    {
      id: 2,
      title: "Career Workshop Event",
      author: "David Kim",
      type: "event",
      views: 78,
      comments: 12,
      date: "2024-01-12",
      status: "published",
    },
    {
      id: 3,
      title: "Help Request: Mentorship",
      author: "Sarah Wilson",
      type: "help",
      views: 23,
      comments: 5,
      date: "2024-01-10",
      status: "pending",
    },
  ];

  const postsToModerate = [
    {
      id: 1,
      title: "Inappropriate Content",
      author: "Anonymous",
      type: "post",
      reportedBy: "John Doe",
      reason: "Spam",
      date: "2024-01-15",
    },
    {
      id: 2,
      title: "Offensive Comment",
      author: "Jane Smith",
      type: "comment",
      reportedBy: "Mike Johnson",
      reason: "Harassment",
      date: "2024-01-14",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-muted-foreground">
            Manage alumni verification and moderate content
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Users className="w-4 h-4 mr-2" />
          Staff Member
        </Badge>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alumni Verified
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniVerified}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.pendingAlumni} pending
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Posts Made</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsMade}</div>
            <p className="text-xs text-muted-foreground">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Posted</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsPosted}</div>
            <p className="text-xs text-muted-foreground">+2 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Posts Moderated
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.postsModerated}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="alumni" className="space-y-6">
        <TabsList>
          <TabsTrigger value="alumni">Verify Alumni</TabsTrigger>
          <TabsTrigger value="posts">Feed/Events</TabsTrigger>
          <TabsTrigger value="moderate">Moderate Posts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Verify Alumni */}
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

        {/* Feed/Events */}
        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Feed Posts & Events</h2>
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
                      <option value="announcement">Announcement</option>
                      <option value="event">Event</option>
                      <option value="help">Help Request</option>
                      <option value="information">Information</option>
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
                      <CardDescription>
                        By {post.author} • Type: {post.type}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={
                          post.status === "published" ? "default" : "secondary"
                        }
                      >
                        {post.status}
                      </Badge>
                      <Badge variant="outline">{post.date}</Badge>
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
                        <Edit className="w-4 h-4 mr-2" />
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

        {/* Moderate Posts */}
        <TabsContent value="moderate" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Content Moderation</h2>
            <Badge variant="destructive">
              {postsToModerate.length} Reports
            </Badge>
          </div>

          <div className="space-y-4">
            {postsToModerate.map((post) => (
              <Card key={post.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{post.title}</CardTitle>
                      <CardDescription>
                        Reported by {post.reportedBy} • Reason: {post.reason}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="destructive">Reported</Badge>
                      <Badge variant="outline">{post.date}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm">
                        Content preview: "This is a sample of the reported
                        content that needs to be reviewed..."
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Author: {post.author} • Type: {post.type}
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          <XCircle className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Analytics & Reports</h2>
            <Button variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Verification Stats</CardTitle>
                <CardDescription>
                  Alumni verification performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Verified</span>
                    <span className="font-medium">{stats.alumniVerified}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Review</span>
                    <span className="font-medium">{stats.pendingAlumni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rejected</span>
                    <span className="font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Success Rate</span>
                    <span className="font-medium text-green-600">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Stats</CardTitle>
                <CardDescription>Posts and moderation activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Posts Created</span>
                    <span className="font-medium">{stats.postsMade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Events Posted</span>
                    <span className="font-medium">{stats.eventsPosted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Posts Moderated</span>
                    <span className="font-medium">{stats.postsModerated}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg. Engagement</span>
                    <span className="font-medium text-blue-600">67%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your recent actions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Verified alumni: John Smith</p>
                    <p className="text-sm text-muted-foreground">
                      Computer Science, Class of 2020
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    2 hours ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Created post: Career Workshop</p>
                    <p className="text-sm text-muted-foreground">
                      Event announcement
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    4 hours ago
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Moderated post: Removed spam</p>
                    <p className="text-sm text-muted-foreground">
                      Inappropriate content
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    1 day ago
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffPanel;
