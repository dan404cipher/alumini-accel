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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Building,
  MapPin,
  Target,
  Heart,
  Share2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userAPI, postAPI, campaignAPI } from "@/lib/api";
import CampaignManagement from "../CampaignManagement";

const HODPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [isCreateFundraiserOpen, setIsCreateFundraiserOpen] = useState(false);

  // Real data states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState({
    requests: false,
    post: false,
    fundraiser: false,
  });

  // Form states
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    type: "information",
    category: "general",
  });

  const [newFundraiser, setNewFundraiser] = useState({
    title: "",
    description: "",
    category: "scholarship",
    targetAmount: 0,
    currency: "INR",
    startDate: "",
    endDate: "",
    location: "",
    contactInfo: {
      email: "",
      phone: "",
      person: "",
    },
  });

  // Fetch pending requests (Alumni/Staff)
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, requests: true }));
      const response = await userAPI.getPendingUserRequests();

      if (response.success && response.data) {
        // Filter requests for HOD's department/college
        const hodRequests = response.data.filter(
          (req: any) =>
            req.tenantId === user.tenantId &&
            (req.role === "alumni" || req.role === "staff")
        );
        setPendingRequests(hodRequests);
      }
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      toast({
        title: "Error",
        description: "Failed to load pending requests",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, requests: false }));
    }
  }, [user?.tenantId, toast]);

  // Approve user request
  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await userAPI.approveUserRequest(requestId);

      if (response.success) {
        toast({
          title: "Success",
          description: "User request approved successfully",
        });
        fetchPendingRequests(); // Refresh the list
      } else {
        throw new Error(response.message || "Failed to approve request");
      }
    } catch (error) {
      console.error("Error approving request:", error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive",
      });
    }
  };

  // Reject user request
  const handleRejectRequest = async (requestId: string) => {
    try {
      const response = await userAPI.rejectUserRequest(requestId);

      if (response.success) {
        toast({
          title: "Success",
          description: "User request rejected",
        });
        fetchPendingRequests(); // Refresh the list
      } else {
        throw new Error(response.message || "Failed to reject request");
      }
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    }
  };

  // Create staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, post: true }));

    try {
      const userData = {
        firstName: newStaff.firstName.trim(),
        lastName: newStaff.lastName.trim(),
        email: newStaff.email.trim(),
        password: newStaff.password,
        role: "staff",
        tenantId: user?.tenantId,
        department: user?.department || "General",
      };

      const response = await userAPI.createPendingUserRequest(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff request submitted for approval",
        });
        setNewStaff({ firstName: "", lastName: "", email: "", password: "" });
        setIsCreateStaffOpen(false);
        fetchPendingRequests();
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
      setLoading((prev) => ({ ...prev, post: false }));
    }
  };

  // Create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, post: true }));

    try {
      const postData = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        type: newPost.type,
        category: newPost.category,
        isPublic: true,
        allowComments: true,
        targetAudience: {
          roles: ["alumni", "staff", "hod"],
          departments: [user?.department || "General"],
        },
      };

      const response = await postAPI.createPost(postData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Post created successfully",
        });
        setNewPost({
          title: "",
          content: "",
          type: "information",
          category: "general",
        });
        setIsCreatePostOpen(false);
      } else {
        throw new Error(response.message || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, post: false }));
    }
  };

  // Create fundraiser
  const handleCreateFundraiser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading((prev) => ({ ...prev, fundraiser: true }));

    try {
      const campaignData = {
        title: newFundraiser.title.trim(),
        description: newFundraiser.description.trim(),
        category: newFundraiser.category,
        targetAmount: newFundraiser.targetAmount,
        currency: newFundraiser.currency,
        startDate: newFundraiser.startDate,
        endDate: newFundraiser.endDate,
        location: newFundraiser.location.trim(),
        allowAnonymous: true,
        featured: false,
        tags: [user?.department || "General"],
        contactInfo: {
          email: newFundraiser.contactInfo.email.trim(),
          phone: newFundraiser.contactInfo.phone.trim(),
          person: newFundraiser.contactInfo.person.trim(),
        },
      };

      const response = await campaignAPI.createCampaign(campaignData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Fundraiser created successfully",
        });
        setNewFundraiser({
          title: "",
          description: "",
          category: "scholarship",
          targetAmount: 0,
          currency: "INR",
          startDate: "",
          endDate: "",
          location: "",
          contactInfo: { email: "", phone: "", person: "" },
        });
        setIsCreateFundraiserOpen(false);
      } else {
        throw new Error(response.message || "Failed to create fundraiser");
      }
    } catch (error) {
      console.error("Error creating fundraiser:", error);
      toast({
        title: "Error",
        description: "Failed to create fundraiser",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, fundraiser: false }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  // Mock data - replace with actual API calls
  const stats = {
    staffUnderHOD: 8,
    alumniEngagement: 78,
    postsCreated: 15,
    eventsOrganized: 6,
    pendingAlumni: pendingRequests.filter((req: any) => req.role === "alumni")
      .length,
    pendingStaff: pendingRequests.filter((req: any) => req.role === "staff")
      .length,
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
      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Feed Posts</span>
          </TabsTrigger>
          <TabsTrigger value="fundraisers" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Fundraisers</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Staff</span>
          </TabsTrigger>
        </TabsList>

        {/* Approvals - Alumni/Staff */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Pending Approvals</h2>
            <Badge variant="secondary">
              {stats.pendingAlumni + stats.pendingStaff} Total Pending
            </Badge>
          </div>

          <div className="space-y-4">
            {loading.requests ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Loading pending requests...
                </p>
              </div>
            ) : pendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((request: any) => (
                <Card key={request.requestId}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {request.firstName} {request.lastName}
                        </CardTitle>
                        <CardDescription>{request.email}</CardDescription>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {request.department || "N/A"}
                        </Badge>
                        <Badge
                          variant={
                            request.role === "alumni" ? "default" : "secondary"
                          }
                        >
                          {request.role === "alumni" ? "Alumni" : "Staff"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Applied on{" "}
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejectRequest(request.requestId)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            handleApproveRequest(request.requestId)
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                    Share information, announcements, or updates with your
                    department.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div>
                    <Label htmlFor="post-title">Title</Label>
                    <Input
                      id="post-title"
                      placeholder="Enter post title"
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="post-type">Post Type</Label>
                    <Select
                      value={newPost.type}
                      onValueChange={(value) =>
                        setNewPost((prev) => ({
                          ...prev,
                          type: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select post type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="information">Information</SelectItem>
                        <SelectItem value="announcement">
                          Announcement
                        </SelectItem>
                        <SelectItem value="event">Event</SelectItem>
                        <SelectItem value="help">Help Request</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="post-content">Content</Label>
                    <Textarea
                      id="post-content"
                      placeholder="Write your post content..."
                      rows={6}
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost((prev) => ({
                          ...prev,
                          content: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreatePostOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading.post}>
                      {loading.post ? "Creating..." : "Create Post"}
                    </Button>
                  </DialogFooter>
                </form>
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
                        {post.type} • {post.date}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">{post.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        {post.views} views
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {post.comments} comments
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Heart className="w-4 h-4 mr-2" />
                        Like
                      </Button>
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fundraisers */}
        <TabsContent value="fundraisers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Fundraisers</h2>
            <Dialog
              open={isCreateFundraiserOpen}
              onOpenChange={setIsCreateFundraiserOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Fundraiser
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Fundraiser</DialogTitle>
                  <DialogDescription>
                    Start a fundraising campaign for your department.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFundraiser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fundraiser-title">Title</Label>
                      <Input
                        id="fundraiser-title"
                        placeholder="Enter fundraiser title"
                        value={newFundraiser.title}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-category">Category</Label>
                      <Select
                        value={newFundraiser.category}
                        onValueChange={(value) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scholarship">
                            Scholarship
                          </SelectItem>
                          <SelectItem value="infrastructure">
                            Infrastructure
                          </SelectItem>
                          <SelectItem value="research">Research</SelectItem>
                          <SelectItem value="event">Event</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="fundraiser-description">Description</Label>
                    <Textarea
                      id="fundraiser-description"
                      placeholder="Describe your fundraising campaign..."
                      rows={4}
                      value={newFundraiser.description}
                      onChange={(e) =>
                        setNewFundraiser((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fundraiser-target">Target Amount</Label>
                      <Input
                        id="fundraiser-target"
                        type="number"
                        placeholder="50000"
                        value={newFundraiser.targetAmount}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            targetAmount: parseInt(e.target.value) || 0,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-currency">Currency</Label>
                      <Select
                        value={newFundraiser.currency}
                        onValueChange={(value) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            currency: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INR">INR</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-location">Location</Label>
                      <Input
                        id="fundraiser-location"
                        placeholder="City, State"
                        value={newFundraiser.location}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="fundraiser-start">Start Date</Label>
                      <Input
                        id="fundraiser-start"
                        type="date"
                        value={newFundraiser.startDate}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            startDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-end">End Date</Label>
                      <Input
                        id="fundraiser-end"
                        type="date"
                        value={newFundraiser.endDate}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="fundraiser-email">Contact Email</Label>
                      <Input
                        id="fundraiser-email"
                        type="email"
                        placeholder="contact@college.edu"
                        value={newFundraiser.contactInfo.email}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              email: e.target.value,
                            },
                          }))
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-phone">Contact Phone</Label>
                      <Input
                        id="fundraiser-phone"
                        placeholder="+1234567890"
                        value={newFundraiser.contactInfo.phone}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              phone: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="fundraiser-person">Contact Person</Label>
                      <Input
                        id="fundraiser-person"
                        placeholder="John Doe"
                        value={newFundraiser.contactInfo.person}
                        onChange={(e) =>
                          setNewFundraiser((prev) => ({
                            ...prev,
                            contactInfo: {
                              ...prev.contactInfo,
                              person: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateFundraiserOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading.fundraiser}>
                      {loading.fundraiser ? "Creating..." : "Create Fundraiser"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {contributions.map((contribution) => (
              <Card key={contribution.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {contribution.event}
                      </CardTitle>
                      <CardDescription>
                        By {contribution.alumni} • {contribution.date}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{contribution.amount.toLocaleString()}
                      </div>
                      <Badge
                        variant={
                          contribution.status === "completed"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {contribution.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

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
