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
  CheckCircle,
  XCircle,
  Plus,
  MessageSquare,
  FileText,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
  DollarSign,
  Building,
  MapPin,
  Target,
  Heart,
  Share2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userAPI, campaignAPI, tenantAPI } from "@/lib/api";

const StaffPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);
  const [isCreateFundraiserOpen, setIsCreateFundraiserOpen] = useState(false);

  // Real data states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState({
    requests: false,
    post: false,
    fundraiser: false,
  });

  // Form states

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

  // Fetch pending requests (Alumni only for Staff)
  const fetchPendingRequests = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, requests: true }));
      const response = await userAPI.getPendingUserRequests();

      if (response.success && response.data) {
        // Filter requests for Staff's department/college (only alumni)
        const staffRequests = response.data.filter(
          (req: any) => req.tenantId === user.tenantId && req.role === "alumni"
        );
        setPendingRequests(staffRequests);
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
          description: "Alumni request approved successfully",
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
          description: "Alumni request rejected",
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

  // Load college banner
  useEffect(() => {
    const loadCollegeBanner = async () => {
      if (user?.tenantId) {
        try {
          const bannerResponse = await tenantAPI.getBanner(user.tenantId);
          if (bannerResponse instanceof Blob) {
            const bannerUrl = URL.createObjectURL(bannerResponse);
            setCollegeBanner(bannerUrl);
          }
        } catch (error) {
          console.log("No banner found or error loading banner:", error);

          // Check localStorage as fallback
          try {
            const storedBanner = localStorage.getItem(
              `college_banner_${user.tenantId}`
            );
            if (storedBanner) {
              setCollegeBanner(storedBanner);
            }
          } catch (localStorageError) {
            console.log(
              "Error loading banner from localStorage:",
              localStorageError
            );
          }
        }
      }
    };

    loadCollegeBanner();
  }, [user?.tenantId]);

  // Listen for banner updates
  useEffect(() => {
    const handleBannerUpdate = () => {
      if (user?.tenantId) {
        const loadCollegeBanner = async () => {
          try {
            const bannerResponse = await tenantAPI.getBanner(user.tenantId);
            if (bannerResponse instanceof Blob) {
              const bannerUrl = URL.createObjectURL(bannerResponse);
              setCollegeBanner(bannerUrl);
            }
          } catch (error) {
            console.log("No banner found or error loading banner:", error);

            // Check localStorage as fallback
            try {
              const storedBanner = localStorage.getItem(
                `college_banner_${user.tenantId}`
              );
              if (storedBanner) {
                setCollegeBanner(storedBanner);
              }
            } catch (localStorageError) {
              console.log(
                "Error loading banner from localStorage:",
                localStorageError
              );
            }
          }
        };
        loadCollegeBanner();
      }
    };

    window.addEventListener("collegeBannerUpdated", handleBannerUpdate);
    return () => {
      window.removeEventListener("collegeBannerUpdated", handleBannerUpdate);
    };
  }, [user?.tenantId]);

  // Mock data - replace with actual API calls
  const stats = {
    alumniVerified: 45,
    postsMade: 23,
    eventsPosted: 8,
    pendingAlumni: pendingRequests.filter((req: any) => req.role === "alumni")
      .length,
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
      {/* College Banner */}
      {collegeBanner && (
        <div className="relative overflow-hidden rounded-lg shadow-lg">
          <img
            src={collegeBanner}
            alt="College Banner"
            className="w-full h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-bold text-white mb-4">
                Welcome to Your College Staff Portal
              </h2>
              <p className="text-xl text-white/90 mb-6 max-w-2xl">
                Support alumni engagement, manage content, and contribute to
                college initiatives
              </p>
            </div>
          </div>
        </div>
      )}

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
      <Tabs defaultValue="approvals" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Approvals</span>
          </TabsTrigger>
          <TabsTrigger value="fundraisers" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Fundraisers</span>
          </TabsTrigger>
          <TabsTrigger value="moderate" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Moderate</span>
          </TabsTrigger>
        </TabsList>

        {/* Approvals - Alumni */}
        <TabsContent value="approvals" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Pending Alumni Approvals</h2>
            <Badge variant="secondary">
              {stats.pendingAlumni} Total Pending
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
                <p className="text-muted-foreground">
                  No pending alumni requests
                </p>
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
                        <Badge variant="default">Alumni</Badge>
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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Department Scholarship Fund
                    </CardTitle>
                    <CardDescription>
                      By Staff Member • 2024-01-15
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₹25,000
                    </div>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Research Equipment Fund
                    </CardTitle>
                    <CardDescription>
                      By Staff Member • 2024-01-10
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      ₹50,000
                    </div>
                    <Badge variant="secondary">Completed</Badge>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

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
