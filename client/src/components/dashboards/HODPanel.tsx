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
import { Tabs, TabsContent } from "@/components/ui/tabs";
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
  Eye,
  EyeOff,
  Mail,
  Settings,
  LayoutDashboard,
  Tags,
  Building2,
  Image,
  Newspaper,
  HeartHandshake,
  BookOpen,
  Activity,
  Briefcase,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  userAPI,
  campaignAPI,
  tenantAPI,
  alumniAPI,
  eventAPI,
  galleryAPI,
  newsAPI,
  communityAPI,
} from "@/lib/api";
import CampaignManagement from "../CampaignManagement";
import { CategoryManagement } from "../CategoryManagement";
import EligibleStudentsPanel from "../EligibleStudentsPanel";

const HODPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [collegeBanner, setCollegeBanner] = useState<string | null>(null);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreateAlumniOpen, setIsCreateAlumniOpen] = useState(false);
  const [isCreateFundraiserOpen, setIsCreateFundraiserOpen] = useState(false);

  // Real data states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [alumni, setAlumni] = useState([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [galleries, setGalleries] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [mentorships, setMentorships] = useState<any[]>([]);
  const [alumniByDepartment, setAlumniByDepartment] = useState<
    Record<string, number>
  >({});
  const [eventsByStatus, setEventsByStatus] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState({
    requests: false,
    post: false,
    fundraiser: false,
    alumni: false,
    events: false,
    campaigns: false,
    galleries: false,
    news: false,
    communities: false,
    donations: false,
    mentorships: false,
  });

  // Form states
  const [newStaff, setNewStaff] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
  });

  const [newAlumni, setNewAlumni] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    collegeId: "",
    department: "",
    graduationYear: new Date().getFullYear(),
    currentCompany: "",
    currentPosition: "",
    phoneNumber: "",
    address: "",
    bio: "",
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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    staff: {} as Record<string, string>,
    alumni: {} as Record<string, string>,
  });

  // Password visibility state
  const [passwordVisibility, setPasswordVisibility] = useState({
    staff: false,
    alumni: false,
  });

  // Colleges state removed - HOD can only create alumni for their own college

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

  // Validation functions
  const validateForm = (formData: any, formType: "staff" | "alumni") => {
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

    // Department validation (for Staff and Alumni)
    if (
      (formType === "staff" || formType === "alumni") &&
      !formData.department.trim()
    ) {
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

    // College validation removed - HOD can only create alumni for their own college

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
    formType: "staff" | "alumni",
    errors: Record<string, string>
  ) => {
    setValidationErrors((prev) => ({
      ...prev,
      [formType]: errors,
    }));
  };

  const togglePasswordVisibility = (formType: "staff" | "alumni") => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [formType]: !prev[formType],
    }));
  };

  // Create staff
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(newStaff, "staff");
    updateValidationErrors("staff", errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are validation errors
    }

    setLoading((prev) => ({ ...prev, post: true }));

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

      const response = await userAPI.createUser(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff created successfully",
        });
        setNewStaff({
          firstName: "",
          lastName: "",
          email: "",
          department: "",
          password: "",
        });
        setIsCreateStaffOpen(false);
        fetchPendingRequests();
      } else {
        throw new Error(response.message || "Failed to create staff");
      }
    } catch (error) {
      console.error("Error creating staff:", error);
      toast({
        title: "Error",
        description: "Failed to create staff",
        variant: "destructive",
      });
    } finally {
      setLoading((prev) => ({ ...prev, post: false }));
    }
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

  // Handle alumni click
  const handleAlumniClick = (alumni: any) => {
    navigate(`/alumni/${alumni.userId._id}`);
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
          if (typeof bannerResponse === "string") {
            setCollegeBanner(bannerResponse);
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

  // Fetch colleges removed - HOD can only create alumni for their own college

  // Listen for banner updates
  useEffect(() => {
    const handleBannerUpdate = () => {
      if (user?.tenantId) {
        const loadCollegeBanner = async () => {
          try {
            const bannerResponse = await tenantAPI.getBanner(user.tenantId);
            if (typeof bannerResponse === "string") {
              setCollegeBanner(bannerResponse);
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

  // Fetch recent events
  const fetchRecentEvents = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, events: true }));
      const response = await eventAPI.getAllEvents({
        limit: 10,
        tenantId: user.tenantId,
      });

      if (response.success && response.data?.events) {
        const events = response.data.events;
        setRecentEvents(events);

        const statusCounts: Record<string, number> = {};
        events.forEach((event: any) => {
          const status = event.status || "upcoming";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        setEventsByStatus(statusCounts);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading((prev) => ({ ...prev, events: false }));
    }
  }, [user?.tenantId]);

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, campaigns: true }));
      const response = await campaignAPI.getAllCampaigns({
        limit: 10,
      });

      if (response.success && response.data?.campaigns) {
        setCampaigns(response.data.campaigns);
      } else if (response.success && Array.isArray(response.data)) {
        setCampaigns(response.data);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading((prev) => ({ ...prev, campaigns: false }));
    }
  }, [user?.tenantId]);

  // Fetch galleries
  const fetchGalleries = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, galleries: true }));
      const response = await galleryAPI.getAllGalleries({
        limit: 10,
      });

      if (response.success && response.data?.galleries) {
        setGalleries(response.data.galleries);
      } else if (response.success && Array.isArray(response.data)) {
        setGalleries(response.data);
      }
    } catch (error) {
      console.error("Error fetching galleries:", error);
    } finally {
      setLoading((prev) => ({ ...prev, galleries: false }));
    }
  }, [user?.tenantId]);

  // Fetch news
  const fetchNews = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, news: true }));
      const response = await newsAPI.getAllNews({
        limit: 10,
      });

      if (response.success && response.data?.news) {
        setNews(response.data.news);
      } else if (response.success && Array.isArray(response.data)) {
        setNews(response.data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading((prev) => ({ ...prev, news: false }));
    }
  }, [user?.tenantId]);

  // Fetch communities
  const fetchCommunities = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, communities: true }));
      const response = await communityAPI.getTopCommunities(10);

      if (response.success && response.data) {
        setCommunities(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Error fetching communities:", error);
    } finally {
      setLoading((prev) => ({ ...prev, communities: false }));
    }
  }, [user?.tenantId]);

  // Fetch donations
  const fetchDonations = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, donations: true }));
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${baseUrl}/donations?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const donationsData = data.data?.donations || data.data || [];
        setDonations(Array.isArray(donationsData) ? donationsData : []);
      }
    } catch (error) {
      console.error("Error fetching donations:", error);
    } finally {
      setLoading((prev) => ({ ...prev, donations: false }));
    }
  }, [user?.tenantId]);

  // Fetch mentorships
  const fetchMentorships = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, mentorships: true }));
      const baseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${baseUrl}/mentorship?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mentorshipsData = data.data?.mentorships || data.data || [];
        setMentorships(Array.isArray(mentorshipsData) ? mentorshipsData : []);
      }
    } catch (error) {
      console.error("Error fetching mentorships:", error);
    } finally {
      setLoading((prev) => ({ ...prev, mentorships: false }));
    }
  }, [user?.tenantId]);

  // Calculate alumni by department
  useEffect(() => {
    if (alumni.length > 0) {
      const deptCounts: Record<string, number> = {};
      alumni.forEach((alum: any) => {
        const dept = alum.department || alum.userId?.department || "Unknown";
        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
      });
      setAlumniByDepartment(deptCounts);
    }
  }, [alumni]);

  // Fetch all dashboard data on mount
  useEffect(() => {
    fetchRecentEvents();
    fetchCampaigns();
    fetchGalleries();
    fetchNews();
    fetchCommunities();
    fetchDonations();
    fetchMentorships();
  }, [
    fetchRecentEvents,
    fetchCampaigns,
    fetchGalleries,
    fetchNews,
    fetchCommunities,
    fetchDonations,
    fetchMentorships,
  ]);

  // Stats calculation
  const stats = {
    staffUnderHOD: 8,
    alumniEngagement: 78,
    eventsOrganized: recentEvents.length,
    pendingAlumni: pendingRequests.filter((req: any) => req.role === "alumni")
      .length,
    pendingStaff: pendingRequests.filter((req: any) => req.role === "staff")
      .length,
    totalContributions: campaigns.reduce(
      (sum: number, c: any) => sum + (c.currentAmount || 0),
      0
    ),
    totalAlumniVerified: alumni.length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter((c: any) => c.status === "active").length,
    totalCampaignRaised: campaigns.reduce(
      (sum: number, c: any) => sum + (c.currentAmount || 0),
      0
    ),
    totalCampaignTarget: campaigns.reduce(
      (sum: number, c: any) => sum + (c.targetAmount || 0),
      0
    ),
  };

  const [activeTab, setActiveTab] = useState("dashboard");

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
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-[calc(100vh-5rem)] overflow-hidden">
        {/* Enhanced Sidebar */}
        <aside className="hidden lg:block w-72 flex-shrink-0 bg-gradient-to-b from-white to-gray-50 border-r shadow-sm">
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">HOD</h3>
                  <p className="text-blue-100 text-xs">Management Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {[
                {
                  key: "dashboard",
                  label: "Dashboard",
                  icon: LayoutDashboard,
                  color: "purple",
                },
                {
                  key: "fundraisers",
                  label: "Fundraisers",
                  icon: DollarSign,
                  color: "amber",
                },
                {
                  key: "staff",
                  label: "Staff",
                  icon: Users,
                  color: "blue",
                },
                {
                  key: "alumni",
                  label: "Alumni",
                  icon: GraduationCap,
                  color: "amber",
                },
                {
                  key: "eligible-students",
                  label: "Eligible Students",
                  icon: GraduationCap,
                  color: "blue",
                },
                {
                  key: "categories",
                  label: "Categories",
                  icon: Tags,
                  color: "indigo",
                },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                const colorMap: Record<
                  string,
                  { bg: string; border: string; text: string; dot: string }
                > = {
                  purple: {
                    bg: "bg-purple-50",
                    border: "border-purple-200",
                    text: "text-purple-700",
                    dot: "bg-purple-500",
                  },
                  blue: {
                    bg: "bg-blue-50",
                    border: "border-blue-200",
                    text: "text-blue-700",
                    dot: "bg-blue-500",
                  },
                  green: {
                    bg: "bg-green-50",
                    border: "border-green-200",
                    text: "text-green-700",
                    dot: "bg-green-500",
                  },
                  amber: {
                    bg: "bg-amber-50",
                    border: "border-amber-200",
                    text: "text-amber-700",
                    dot: "bg-amber-500",
                  },
                  indigo: {
                    bg: "bg-indigo-50",
                    border: "border-indigo-200",
                    text: "text-indigo-700",
                    dot: "bg-indigo-500",
                  },
                  rose: {
                    bg: "bg-rose-50",
                    border: "border-rose-200",
                    text: "text-rose-700",
                    dot: "bg-rose-500",
                  },
                };

                const activeColors = colorMap[item.color] || colorMap.blue;

                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? `${activeColors.bg} ${activeColors.border} ${activeColors.text} border-l-4 shadow-sm`
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border-l-4 border-transparent"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? "" : "text-gray-500"}`}
                    />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <div
                        className={`w-2 h-2 rounded-full ${activeColors.dot}`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header - only on Dashboard tab */}
          {activeTab === "dashboard" && (
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
          )}

          {/* College Banner Display - only on Dashboard tab */}
          {activeTab === "dashboard" && collegeBanner && (
            <div className="relative overflow-hidden rounded-lg shadow-lg mt-6">
              <img
                src={collegeBanner}
                alt="College Banner"
                className="w-full h-80 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="max-w-4xl">
                  <h2 className="text-4xl font-bold text-white mb-4">
                    Welcome to {user?.tenantId ? "Your College" : "AlumniAccel"}
                  </h2>
                  <p className="text-xl text-white/90 mb-6 max-w-2xl">
                    Manage your department, oversee staff, and engage with
                    alumni
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content controlled by sidebar */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6 mt-6"
          >
            {/* Dashboard Overview */}
            <TabsContent value="dashboard" className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Alumni Verified
                    </CardTitle>
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalAlumniVerified}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Verified alumni
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Pending Approvals
                    </CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.pendingAlumni + stats.pendingStaff}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Awaiting approval
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Events Organized
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.eventsOrganized}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Events this month
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Fundraisers Created
                    </CardTitle>
                    <Target className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.totalContributions > 0 ? "Active" : "0"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Active campaigns
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Alumni by Department */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Alumni by Department
                    </CardTitle>
                    <CardDescription>
                      Distribution across departments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.keys(alumniByDepartment).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No data available
                        </p>
                      ) : (
                        Object.entries(alumniByDepartment)
                          .sort(([, a], [, b]) => b - a)
                          .slice(0, 5)
                          .map(([dept, count]) => (
                            <div key={dept} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium truncate">
                                  {dept}
                                </span>
                                <span className="text-muted-foreground">
                                  {count}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full"
                                  style={{
                                    width: `${
                                      (count / stats.totalAlumniVerified) *
                                        100 || 0
                                    }%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Events by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Events by Status
                    </CardTitle>
                    <CardDescription>Event status breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.keys(eventsByStatus).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No events yet
                        </p>
                      ) : (
                        Object.entries(eventsByStatus).map(
                          ([status, count]) => (
                            <div
                              key={status}
                              className="flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    status === "upcoming"
                                      ? "bg-green-500"
                                      : status === "completed"
                                      ? "bg-blue-500"
                                      : "bg-gray-400"
                                  }`}
                                />
                                <span className="text-sm font-medium capitalize">
                                  {status}
                                </span>
                              </div>
                              <Badge variant="secondary">{count}</Badge>
                            </div>
                          )
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Campaign Performance
                    </CardTitle>
                    <CardDescription>
                      Overall fundraising progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Raised</span>
                          <span className="font-bold text-lg">
                            ₹{stats.totalCampaignRaised.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">
                            ₹{stats.totalCampaignTarget.toLocaleString()}
                          </span>
                        </div>
                        {stats.totalCampaignTarget > 0 && (
                          <>
                            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                              <div
                                className="bg-rose-500 h-3 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(
                                    (stats.totalCampaignRaised /
                                      stats.totalCampaignTarget) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">
                              {Math.round(
                                (stats.totalCampaignRaised /
                                  stats.totalCampaignTarget) *
                                  100
                              )}
                              % Complete
                            </p>
                          </>
                        )}
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Active Campaigns:
                          </span>
                          <span className="font-medium text-green-600">
                            {stats.activeCampaigns}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity - All Models */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {/* Recent Events */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-purple-500" />
                        <CardTitle>Recent Events</CardTitle>
                      </div>
                      <Badge variant="outline">{recentEvents.length}</Badge>
                    </div>
                    <CardDescription>
                      Latest events and their performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.events ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading events...
                          </p>
                        </div>
                      ) : recentEvents.length === 0 ? (
                        <div className="text-center py-4">
                          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No events found
                          </p>
                        </div>
                      ) : (
                        recentEvents.slice(0, 5).map((event: any) => {
                          const attendeesCount = Array.isArray(event.attendees)
                            ? event.attendees.length
                            : typeof event.attendees === "number"
                            ? event.attendees
                            : 0;
                          const eventDate = new Date(
                            event.date || event.startDate
                          );
                          const isUpcoming = eventDate > new Date();
                          const eventStatus =
                            event.status || (isUpcoming ? "upcoming" : "past");

                          return (
                            <div
                              key={event._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {event.image ? (
                                  <img
                                    src={event.image}
                                    alt={event.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-purple-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {event.title}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <p className="text-xs text-muted-foreground">
                                    {eventDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  {event.location && (
                                    <>
                                      <span className="text-muted-foreground">
                                        •
                                      </span>
                                      <p className="text-xs text-muted-foreground truncate">
                                        {event.location}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-muted-foreground">
                                    {attendeesCount} attendees
                                  </span>
                                  <Badge
                                    variant={
                                      eventStatus === "completed"
                                        ? "default"
                                        : "secondary"
                                    }
                                    className="text-xs"
                                  >
                                    {eventStatus}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Gallery */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Image className="h-5 w-5 text-cyan-500" />
                        <CardTitle>Gallery</CardTitle>
                      </div>
                      <Badge variant="outline">{galleries.length}</Badge>
                    </div>
                    <CardDescription>Recent photo galleries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.galleries ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading galleries...
                          </p>
                        </div>
                      ) : galleries.length === 0 ? (
                        <div className="text-center py-4">
                          <Image className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No galleries found
                          </p>
                        </div>
                      ) : (
                        galleries.slice(0, 5).map((gallery: any) => {
                          const galleryDate = new Date(
                            gallery.createdAt || new Date()
                          );
                          const imageCount = Array.isArray(gallery.images)
                            ? gallery.images.length
                            : 0;
                          const firstImage =
                            Array.isArray(gallery.images) &&
                            gallery.images.length > 0
                              ? gallery.images[0]
                              : null;

                          return (
                            <div
                              key={gallery._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {firstImage ? (
                                  <img
                                    src={firstImage}
                                    alt={gallery.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                                    <Image className="h-6 w-6 text-cyan-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {gallery.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {galleryDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {imageCount} images
                                  </Badge>
                                  {gallery.category && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {gallery.category}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* News Room */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Newspaper className="h-5 w-5 text-blue-500" />
                        <CardTitle>News Room</CardTitle>
                      </div>
                      <Badge variant="outline">{news.length}</Badge>
                    </div>
                    <CardDescription>Latest news and updates</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.news ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading news...
                          </p>
                        </div>
                      ) : news.length === 0 ? (
                        <div className="text-center py-4">
                          <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No news found</p>
                        </div>
                      ) : (
                        news.slice(0, 5).map((newsItem: any) => {
                          const newsDate = new Date(
                            newsItem.publishedAt ||
                              newsItem.createdAt ||
                              new Date()
                          );

                          return (
                            <div
                              key={newsItem._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {newsItem.image ? (
                                  <img
                                    src={newsItem.image}
                                    alt={newsItem.title}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Newspaper className="h-6 w-6 text-blue-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {newsItem.title}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {newsItem.summary ||
                                    newsItem.content?.substring(0, 60) ||
                                    ""}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <p className="text-xs text-muted-foreground">
                                    {newsDate.toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  {newsItem.author && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {typeof newsItem.author === "string"
                                        ? newsItem.author
                                        : `${newsItem.author.firstName || ""} ${
                                            newsItem.author.lastName || ""
                                          }`.trim() ||
                                          newsItem.author.email ||
                                          "Unknown"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Community */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-green-500" />
                        <CardTitle>Communities</CardTitle>
                      </div>
                      <Badge variant="outline">{communities.length}</Badge>
                    </div>
                    <CardDescription>Top active communities</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.communities ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading communities...
                          </p>
                        </div>
                      ) : communities.length === 0 ? (
                        <div className="text-center py-4">
                          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No communities found
                          </p>
                        </div>
                      ) : (
                        communities.slice(0, 5).map((community: any) => {
                          const memberCount =
                            community.members?.length ||
                            community.memberCount ||
                            0;
                          const postCount =
                            community.posts?.length || community.postCount || 0;

                          return (
                            <div
                              key={community._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                {community.image ? (
                                  <img
                                    src={community.image}
                                    alt={community.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                                    <MessageSquare className="h-6 w-6 text-green-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {community.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {community.description || ""}
                                </p>
                                <div className="flex items-center gap-3 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {memberCount} members
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      {postCount} posts
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Donations */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HeartHandshake className="h-5 w-5 text-rose-500" />
                        <CardTitle>Donations</CardTitle>
                      </div>
                      <Badge variant="outline">{donations.length}</Badge>
                    </div>
                    <CardDescription>Recent donations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.donations ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading donations...
                          </p>
                        </div>
                      ) : donations.length === 0 ? (
                        <div className="text-center py-4">
                          <HeartHandshake className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No donations found
                          </p>
                        </div>
                      ) : (
                        donations.slice(0, 5).map((donation: any) => {
                          const donationDate = new Date(
                            donation.createdAt ||
                              donation.donatedAt ||
                              new Date()
                          );
                          const amount = donation.amount || 0;
                          const donorName =
                            donation.donor?.firstName &&
                            donation.donor?.lastName
                              ? `${donation.donor.firstName} ${donation.donor.lastName}`
                              : donation.donorName || "Anonymous";

                          return (
                            <div
                              key={donation._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                                  <HeartHandshake className="h-6 w-6 text-rose-500" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate text-sm">
                                  {donorName}
                                </p>
                                <p className="text-lg font-bold text-rose-600 mt-1">
                                  ₹{amount.toLocaleString()}
                                </p>
                                {donation.campaign?.title && (
                                  <p className="text-xs text-muted-foreground truncate mt-1">
                                    {donation.campaign.title}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  {donationDate.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Mentorship */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-indigo-500" />
                        <CardTitle>Mentorship</CardTitle>
                      </div>
                      <Badge variant="outline">{mentorships.length}</Badge>
                    </div>
                    <CardDescription>
                      Recent mentorship connections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {loading.mentorships ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            Loading mentorships...
                          </p>
                        </div>
                      ) : mentorships.length === 0 ? (
                        <div className="text-center py-4">
                          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">
                            No mentorships found
                          </p>
                        </div>
                      ) : (
                        mentorships.slice(0, 5).map((mentorship: any) => {
                          const mentorshipDate = new Date(
                            mentorship.createdAt || new Date()
                          );
                          const mentorName =
                            mentorship.mentor?.firstName &&
                            mentorship.mentor?.lastName
                              ? `${mentorship.mentor.firstName} ${mentorship.mentor.lastName}`
                              : mentorship.mentorName || "Unknown";
                          const menteeName =
                            mentorship.mentee?.firstName &&
                            mentorship.mentee?.lastName
                              ? `${mentorship.mentee.firstName} ${mentorship.mentee.lastName}`
                              : mentorship.menteeName || "Unknown";

                          return (
                            <div
                              key={mentorship._id}
                              className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-indigo-500" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm">
                                  Mentor: {mentorName}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Mentee: {menteeName}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <Badge
                                    variant={
                                      mentorship.status === "active"
                                        ? "default"
                                        : mentorship.status === "completed"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {mentorship.status || "pending"}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground">
                                    {mentorshipDate.toLocaleDateString(
                                      "en-US",
                                      {
                                        month: "short",
                                        day: "numeric",
                                      }
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardContent>
                </Card>
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
                    <form
                      onSubmit={handleCreateFundraiser}
                      className="space-y-4"
                    >
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
                              <SelectItem value="emergency">
                                Emergency
                              </SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="fundraiser-description">
                          Description
                        </Label>
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
                          <Label htmlFor="fundraiser-target">
                            Target Amount
                          </Label>
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
                          <Label htmlFor="fundraiser-email">
                            Contact Email
                          </Label>
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
                          <Label htmlFor="fundraiser-phone">
                            Contact Phone
                          </Label>
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
                          <Label htmlFor="fundraiser-person">
                            Contact Person
                          </Label>
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
                          {loading.fundraiser
                            ? "Creating..."
                            : "Create Fundraiser"}
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
                    <form onSubmit={handleCreateStaff} className="space-y-4">
                      <div>
                        <Label htmlFor="staff-firstName">First Name</Label>
                        <Input
                          id="staff-firstName"
                          placeholder="Jane"
                          value={newStaff.firstName}
                          onChange={(e) => {
                            setNewStaff((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }));
                            // Clear error when user starts typing
                            if (validationErrors.staff.firstName) {
                              updateValidationErrors("staff", {
                                ...validationErrors.staff,
                                firstName: "",
                              });
                            }
                          }}
                          className={
                            validationErrors.staff.firstName
                              ? "border-red-500"
                              : ""
                          }
                          required
                        />
                        {validationErrors.staff.firstName && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors.staff.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="staff-lastName">Last Name</Label>
                        <Input
                          id="staff-lastName"
                          placeholder="Doe"
                          value={newStaff.lastName}
                          onChange={(e) => {
                            setNewStaff((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }));
                            // Clear error when user starts typing
                            if (validationErrors.staff.lastName) {
                              updateValidationErrors("staff", {
                                ...validationErrors.staff,
                                lastName: "",
                              });
                            }
                          }}
                          className={
                            validationErrors.staff.lastName
                              ? "border-red-500"
                              : ""
                          }
                          required
                        />
                        {validationErrors.staff.lastName && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors.staff.lastName}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="staff-email">Email</Label>
                        <Input
                          id="staff-email"
                          type="email"
                          placeholder="jane.doe@college.edu"
                          value={newStaff.email}
                          onChange={(e) => {
                            setNewStaff((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }));
                            // Clear error when user starts typing
                            if (validationErrors.staff.email) {
                              updateValidationErrors("staff", {
                                ...validationErrors.staff,
                                email: "",
                              });
                            }
                          }}
                          className={
                            validationErrors.staff.email ? "border-red-500" : ""
                          }
                          required
                        />
                        {validationErrors.staff.email && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors.staff.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="staff-department">Department</Label>
                        <Input
                          id="staff-department"
                          placeholder="Administration"
                          value={newStaff.department}
                          onChange={(e) => {
                            setNewStaff((prev) => ({
                              ...prev,
                              department: e.target.value,
                            }));
                            // Clear error when user starts typing
                            if (validationErrors.staff.department) {
                              updateValidationErrors("staff", {
                                ...validationErrors.staff,
                                department: "",
                              });
                            }
                          }}
                          className={
                            validationErrors.staff.department
                              ? "border-red-500"
                              : ""
                          }
                          required
                        />
                        {validationErrors.staff.department && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors.staff.department}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="staff-password">Default Password</Label>
                        <div className="relative">
                          <Input
                            id="staff-password"
                            type={
                              passwordVisibility.staff ? "text" : "password"
                            }
                            placeholder="Staff@1234"
                            value={newStaff.password}
                            onChange={(e) => {
                              setNewStaff((prev) => ({
                                ...prev,
                                password: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.staff.password) {
                                updateValidationErrors("staff", {
                                  ...validationErrors.staff,
                                  password: "",
                                });
                              }
                            }}
                            className={`pr-10 ${
                              validationErrors.staff.password
                                ? "border-red-500"
                                : ""
                            }`}
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => togglePasswordVisibility("staff")}
                          >
                            {passwordVisibility.staff ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {validationErrors.staff.password && (
                          <p className="text-sm text-red-500 mt-1">
                            {validationErrors.staff.password}
                          </p>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateStaffOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={loading.post}>
                          {loading.post ? "Creating..." : "Create Staff"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {staffUnderHOD.map((staff) => (
                  <Card key={staff.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {staff.name}
                          </CardTitle>
                          <CardDescription>{staff.email}</CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              staff.status === "active"
                                ? "default"
                                : "secondary"
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
                        Create a new alumni account with profile information.
                        Make sure to use a unique email address that hasn't been
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
                            setNewAlumni({
                              ...newAlumni,
                              email: e.target.value,
                            });
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
                            validationErrors.alumni.email
                              ? "border-red-500"
                              : ""
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
                            type={
                              passwordVisibility.alumni ? "text" : "password"
                            }
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
                            setNewAlumni({
                              ...newAlumni,
                              address: e.target.value,
                            })
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
                    <div className="text-muted-foreground">
                      Loading alumni...
                    </div>
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
                            No alumni have been created yet. Use the "Create
                            Alumni" button above to add new alumni.
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
                                  alumni.userId?.profileImage
                                    ? alumni.userId.profileImage.startsWith(
                                        "http"
                                      )
                                      ? alumni.userId.profileImage
                                      : `${(
                                          import.meta.env.VITE_API_BASE_URL ||
                                          "http://localhost:3000/api/v1"
                                        ).replace("/api/v1", "")}${
                                          alumni.userId.profileImage
                                        }`
                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                        `${alumni.userId?.firstName || ""} ${
                                          alumni.userId?.lastName || ""
                                        }`
                                      )}&background=random&color=fff`
                                }
                                alt={`${alumni.userId?.firstName} ${alumni.userId?.lastName}`}
                                className="w-12 h-12 rounded-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                    `${alumni.userId?.firstName || ""} ${
                                      alumni.userId?.lastName || ""
                                    }`
                                  )}&background=random&color=fff`;
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

            {/* Eligible Students Management */}
            <TabsContent value="eligible-students" className="space-y-6">
              <EligibleStudentsPanel />
            </TabsContent>

            {/* Category Management */}
            <TabsContent value="categories" className="space-y-6">
              <CategoryManagement />
            </TabsContent>

            {/* Contributions */}
            <TabsContent value="contributions" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">
                  Contributions History
                </h2>
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
                          <CardDescription>
                            {contribution.event}
                          </CardDescription>
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
      </div>
    </div>
  );
};

export default HODPanel;
