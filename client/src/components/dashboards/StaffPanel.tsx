import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Eye,
  EyeOff,
  UserPlus,
  Mail,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { userAPI, campaignAPI, tenantAPI, alumniAPI } from "@/lib/api";

const StaffPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);
  const [isCreateAlumniOpen, setIsCreateAlumniOpen] = useState(false);
  const [isCreateFundraiserOpen, setIsCreateFundraiserOpen] = useState(false);

  // Real data states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState({
    requests: false,
    post: false,
    fundraiser: false,
    alumni: false,
  });

  // Form states
  const [newAlumni, setNewAlumni] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    collegeId: "", // Not used anymore but keeping for consistency
    department: "",
    graduationYear: new Date().getFullYear(),
    currentCompany: "",
    currentPosition: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    alumni: {} as Record<string, string>,
  });

  // Password visibility state
  const [passwordVisibility, setPasswordVisibility] = useState({
    alumni: false,
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

  // Fetch alumni data
  const fetchAlumni = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, alumni: true }));
      const response = await alumniAPI.getAllAlumni({
        tenantId: user.tenantId,
      });

      if (response.success && response.data) {
        const alumniArray = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response.data?.alumni)
          ? response.data.alumni
          : Array.isArray(response.data?.profiles)
          ? response.data.profiles
          : [];
        setAlumni(alumniArray);
      }
    } catch (error) {
      console.error("Error fetching alumni:", error);
      toast({
        title: "Error",
        description: "Failed to fetch alumni data",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, alumni: false }));
    }
  }, [user?.tenantId, toast]);

  // Handle alumni click
  const handleAlumniClick = (alumni: any) => {
    navigate(`/alumni/${alumni.userId._id}`);
  };

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

  // Validation functions
  const validateForm = (formData: any, formType: "alumni") => {
    const errors: Record<string, string> = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = "First name must be at least 2 characters";
    } else if (formData.firstName.trim().length > 50) {
      errors.firstName = "First name must be less than 50 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = "Last name must be at least 2 characters";
    } else if (formData.lastName.trim().length > 50) {
      errors.lastName = "Last name must be less than 50 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = "Please enter a valid email address";
    }

    // Department validation (for Alumni)
    if (formType === "alumni" && !formData.department.trim()) {
      errors.department = "Department is required";
    } else if (
      formData.department.trim() &&
      formData.department.trim().length < 2
    ) {
      errors.department = "Department must be at least 2 characters";
    } else if (
      formData.department.trim() &&
      formData.department.trim().length > 100
    ) {
      errors.department = "Department must be less than 100 characters";
    }

    // Graduation year validation (for Alumni)
    if (formType === "alumni") {
      const currentYear = new Date().getFullYear();
      if (!formData.graduationYear) {
        errors.graduationYear = "Graduation year is required";
      } else if (
        formData.graduationYear < 1950 ||
        formData.graduationYear > currentYear + 5
      ) {
        errors.graduationYear = `Graduation year must be between 1950 and ${
          currentYear + 5
        }`;
      }
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(
        formData.password
      )
    ) {
      errors.password =
        "Password must contain at least one uppercase letter, one number, and one special character";
    }

    return errors;
  };

  const updateValidationErrors = (
    formType: "alumni",
    errors: Record<string, string>
  ) => {
    setValidationErrors((prev) => ({
      ...prev,
      [formType]: errors,
    }));
  };

  const togglePasswordVisibility = (formType: "alumni") => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [formType]: !prev[formType],
    }));
  };

  // Create alumni
  const handleCreateAlumni = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(newAlumni, "alumni");
    updateValidationErrors("alumni", errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are validation errors
    }

    setLoading((prev) => ({ ...prev, post: true }));

    try {
      // First create the user account
      const userData = {
        firstName: newAlumni.firstName.trim(),
        lastName: newAlumni.lastName.trim(),
        email: newAlumni.email.trim(),
        password: newAlumni.password,
        role: "alumni",
        tenantId: user?.tenantId,
      };

      console.log("Creating user with data:", userData);
      const userResponse = await userAPI.createUser(userData);
      console.log("User creation response:", userResponse);

      if (userResponse.success) {
        toast({
          title: "Success",
          description: "Alumni created successfully",
        });
        setNewAlumni({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          collegeId: "", // Not used anymore but keeping for consistency
          department: "",
          graduationYear: new Date().getFullYear(),
          currentCompany: "",
          currentPosition: "",
          phoneNumber: "",
          address: "",
          bio: "",
        });
        setIsCreateAlumniOpen(false);
        fetchPendingRequests();
      } else {
        const errorMessage =
          userResponse.message || "Failed to create alumni user";
        const errors = userResponse.errors || [];
        console.error("User creation validation errors:", errors);
        throw new Error(`${errorMessage}: ${errors.join(", ")}`);
      }
    } catch (error) {
      console.error("Error creating alumni:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create alumni";
      toast({
        title: "Error",
        description: errorMessage,
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

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

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
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
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
        <TabsList className="grid w-full grid-cols-4">
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
          <TabsTrigger value="alumni" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden sm:inline">Alumni</span>
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

        {/* Alumni Management */}
        <TabsContent value="alumni" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Alumni Management</h2>
            <Dialog
              open={isCreateAlumniOpen}
              onOpenChange={setIsCreateAlumniOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Alumni
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Alumni Account</DialogTitle>
                  <DialogDescription>
                    Create a new alumni account with profile information. Make
                    sure to use a unique email address that hasn't been
                    registered before.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateAlumni} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alumni-firstName">First Name *</Label>
                      <Input
                        id="alumni-firstName"
                        value={newAlumni.firstName}
                        onChange={(e) => {
                          setNewAlumni({
                            ...newAlumni,
                            firstName: e.target.value,
                          });
                          // Clear error when user starts typing
                          if (validationErrors.alumni.firstName) {
                            updateValidationErrors("alumni", {
                              ...validationErrors.alumni,
                              firstName: "",
                            });
                          }
                        }}
                        placeholder="Enter first name"
                        className={
                          validationErrors.alumni.firstName
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {validationErrors.alumni.firstName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.alumni.firstName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alumni-lastName">Last Name *</Label>
                      <Input
                        id="alumni-lastName"
                        value={newAlumni.lastName}
                        onChange={(e) => {
                          setNewAlumni({
                            ...newAlumni,
                            lastName: e.target.value,
                          });
                          // Clear error when user starts typing
                          if (validationErrors.alumni.lastName) {
                            updateValidationErrors("alumni", {
                              ...validationErrors.alumni,
                              lastName: "",
                            });
                          }
                        }}
                        placeholder="Enter last name"
                        className={
                          validationErrors.alumni.lastName
                            ? "border-red-500"
                            : ""
                        }
                      />
                      {validationErrors.alumni.lastName && (
                        <p className="text-sm text-red-500">
                          {validationErrors.alumni.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-email">Email Address *</Label>
                    <Input
                      id="alumni-email"
                      type="email"
                      value={newAlumni.email}
                      onChange={(e) => {
                        setNewAlumni({ ...newAlumni, email: e.target.value });
                        // Clear error when user starts typing
                        if (validationErrors.alumni.email) {
                          updateValidationErrors("alumni", {
                            ...validationErrors.alumni,
                            email: "",
                          });
                        }
                      }}
                      placeholder="Enter email address"
                      className={
                        validationErrors.alumni.email ? "border-red-500" : ""
                      }
                    />
                    {validationErrors.alumni.email && (
                      <p className="text-sm text-red-500">
                        {validationErrors.alumni.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-password">Password *</Label>
                    <div className="relative">
                      <Input
                        id="alumni-password"
                        type={passwordVisibility.alumni ? "text" : "password"}
                        value={newAlumni.password}
                        onChange={(e) => {
                          setNewAlumni({
                            ...newAlumni,
                            password: e.target.value,
                          });
                          // Clear error when user starts typing
                          if (validationErrors.alumni.password) {
                            updateValidationErrors("alumni", {
                              ...validationErrors.alumni,
                              password: "",
                            });
                          }
                        }}
                        placeholder="Enter password"
                        className={`pr-10 ${
                          validationErrors.alumni.password
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => togglePasswordVisibility("alumni")}
                      >
                        {passwordVisibility.alumni ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {validationErrors.alumni.password && (
                      <p className="text-sm text-red-500">
                        {validationErrors.alumni.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-department">Department *</Label>
                    <Input
                      id="alumni-department"
                      value={newAlumni.department}
                      onChange={(e) => {
                        setNewAlumni({
                          ...newAlumni,
                          department: e.target.value,
                        });
                        // Clear error when user starts typing
                        if (validationErrors.alumni.department) {
                          updateValidationErrors("alumni", {
                            ...validationErrors.alumni,
                            department: "",
                          });
                        }
                      }}
                      placeholder="Enter department"
                      className={
                        validationErrors.alumni.department
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.alumni.department && (
                      <p className="text-sm text-red-500">
                        {validationErrors.alumni.department}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-graduationYear">
                      Graduation Year *
                    </Label>
                    <Input
                      id="alumni-graduationYear"
                      type="number"
                      value={newAlumni.graduationYear}
                      onChange={(e) => {
                        setNewAlumni({
                          ...newAlumni,
                          graduationYear:
                            parseInt(e.target.value) ||
                            new Date().getFullYear(),
                        });
                        // Clear error when user starts typing
                        if (validationErrors.alumni.graduationYear) {
                          updateValidationErrors("alumni", {
                            ...validationErrors.alumni,
                            graduationYear: "",
                          });
                        }
                      }}
                      placeholder="Enter graduation year"
                      className={
                        validationErrors.alumni.graduationYear
                          ? "border-red-500"
                          : ""
                      }
                    />
                    {validationErrors.alumni.graduationYear && (
                      <p className="text-sm text-red-500">
                        {validationErrors.alumni.graduationYear}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="alumni-currentCompany">
                        Current Company
                      </Label>
                      <Input
                        id="alumni-currentCompany"
                        value={newAlumni.currentCompany}
                        onChange={(e) =>
                          setNewAlumni({
                            ...newAlumni,
                            currentCompany: e.target.value,
                          })
                        }
                        placeholder="Enter current company"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="alumni-currentPosition">
                        Current Position
                      </Label>
                      <Input
                        id="alumni-currentPosition"
                        value={newAlumni.currentPosition}
                        onChange={(e) =>
                          setNewAlumni({
                            ...newAlumni,
                            currentPosition: e.target.value,
                          })
                        }
                        placeholder="Enter current position"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-phoneNumber">Phone Number</Label>
                    <Input
                      id="alumni-phoneNumber"
                      value={newAlumni.phoneNumber}
                      onChange={(e) =>
                        setNewAlumni({
                          ...newAlumni,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-address">Address</Label>
                    <Input
                      id="alumni-address"
                      value={newAlumni.address}
                      onChange={(e) =>
                        setNewAlumni({ ...newAlumni, address: e.target.value })
                      }
                      placeholder="Enter address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alumni-bio">Bio</Label>
                    <Input
                      id="alumni-bio"
                      value={newAlumni.bio}
                      onChange={(e) =>
                        setNewAlumni({ ...newAlumni, bio: e.target.value })
                      }
                      placeholder="Enter bio"
                    />
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateAlumniOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading.post}>
                      {loading.post ? "Creating..." : "Create Alumni"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {loading.alumni ? (
              <div className="text-center py-8">
                <div className="text-muted-foreground">Loading alumni...</div>
              </div>
            ) : alumni.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <GraduationCap className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No alumni found
                      </h3>
                      <p className="text-gray-600">
                        No alumni have been created yet. Use the "Create Alumni"
                        button above to add new alumni.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alumni.map((alumni: any) => (
                <Card
                  key={alumni._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleAlumniClick(alumni)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="relative">
                          <img
                            src={
                              alumni.userId?.profilePicture
                                ? alumni.userId.profilePicture.startsWith(
                                    "http"
                                  )
                                  ? alumni.userId.profilePicture
                                  : `${(
                                      import.meta.env.VITE_API_URL ||
                                      "http://localhost:3000/api/v1"
                                    ).replace("/api/v1", "")}${
                                      alumni.userId.profilePicture
                                    }`
                                : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${alumni.userId?.firstName || ""} ${
                                      alumni.userId?.lastName || ""
                                    }`
                                  )}&background=random`
                            }
                            alt={`${alumni.userId?.firstName} ${alumni.userId?.lastName}`}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${alumni.userId?.firstName || ""} ${
                                  alumni.userId?.lastName || ""
                                }`
                              )}&background=random`;
                            }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-semibold">
                              {alumni.userId?.firstName}{" "}
                              {alumni.userId?.lastName}
                            </h3>
                            <Badge variant="secondary">Alumni</Badge>
                          </div>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-4 w-4" />
                              <span>{alumni.userId?.email}</span>
                            </div>
                            {alumni.currentCompany && (
                              <div className="flex items-center space-x-2">
                                <Building className="h-4 w-4" />
                                <span>{alumni.currentCompany}</span>
                                {alumni.currentPosition && (
                                  <span>• {alumni.currentPosition}</span>
                                )}
                              </div>
                            )}
                            {alumni.currentLocation && (
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4" />
                                <span>{alumni.currentLocation}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2">
                              <GraduationCap className="h-4 w-4" />
                              <span>Class of {alumni.graduationYear}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
};

export default StaffPanel;
