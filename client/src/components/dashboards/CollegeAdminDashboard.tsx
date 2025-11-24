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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categoryAPI } from "@/lib/api";
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
  FileText,
  UserPlus,
  Building2,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Users2,
  Briefcase,
  Target,
  MessageSquare,
  IndianRupee,
  Activity,
  Image,
  Newspaper,
  HeartHandshake,
  BookOpen,
  LayoutDashboard,
  Tags,
  FolderKanban,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  userAPI,
  alumniAPI,
  eventAPI,
  jobAPI,
  tenantAPI,
  communityAPI,
  campaignAPI,
  galleryAPI,
  newsAPI,
  getImageUrl,
  API_BASE_URL,
} from "@/lib/api";
import AlumniManagement from "../AlumniManagement";
import CampaignManagement from "../CampaignManagement";
import { CategoryManagement } from "../CategoryManagement";
import EligibleStudentsPanel from "../EligibleStudentsPanel";
import EventManagement from "../EventManagement";
import JobManagement from "../admin/JobManagement";
import Footer from "../Footer";
// Note: College Admin only manages their own college, not all colleges

// Type definitions
interface PendingRequest {
  _id: string;
  role: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  [key: string]: unknown;
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department?: string;
  status?: string;
  [key: string]: unknown;
}

interface Event {
  _id: string;
  title: string;
  date?: string;
  startDate?: string;
  location?: string;
  image?: string;
  status?: string;
  attendees?: Array<unknown> | number;
  [key: string]: unknown;
}

interface Campaign {
  _id: string;
  title: string;
  description?: string;
  status?: string;
  currentAmount?: number;
  targetAmount?: number;
  [key: string]: unknown;
}

interface Job {
  _id: string;
  title: string;
  status?: string;
  [key: string]: unknown;
}

interface Alumni {
  _id: string;
  department?: string;
  userId?: {
    department?: string;
  };
  [key: string]: unknown;
}

interface Gallery {
  _id: string;
  title: string;
  images?: string[];
  category?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface News {
  _id: string;
  title: string;
  content?: string;
  summary?: string;
  image?: string;
  publishedAt?: string;
  createdAt?: string;
  author?:
    | string
    | {
        firstName?: string;
        lastName?: string;
        email?: string;
      };
  [key: string]: unknown;
}

interface Community {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  members?: unknown[];
  memberCount?: number;
  posts?: unknown[];
  postCount?: number;
  [key: string]: unknown;
}

interface Donation {
  _id: string;
  amount: number;
  donorName?: string;
  donor?: {
    firstName?: string;
    lastName?: string;
  };
  campaign?: {
    title?: string;
  };
  createdAt?: string;
  donatedAt?: string;
  [key: string]: unknown;
}

interface Mentorship {
  _id: string;
  status?: string;
  mentor?: {
    firstName?: string;
    lastName?: string;
  };
  mentorName?: string;
  mentee?: {
    firstName?: string;
    lastName?: string;
  };
  menteeName?: string;
  createdAt?: string;
  [key: string]: unknown;
}

interface TenantData {
  description?: string;
  [key: string]: unknown;
}

interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

interface PaginatedResponse<T> {
  data?: T[];
  pagination?: {
    total?: number;
    page?: number;
    limit?: number;
  };
  total?: number;
  count?: number;
}

interface UserResponse extends PaginatedResponse<StaffMember> {
  users?: StaffMember[];
}

interface EventResponse extends PaginatedResponse<Event> {
  events?: Event[];
}

interface CampaignResponse {
  campaigns?: Campaign[];
  data?: Campaign[];
}

interface JobResponse extends PaginatedResponse<Job> {
  jobs?: Job[];
}

interface AlumniResponse {
  alumni?: Alumni[];
  profiles?: Alumni[];
  data?: Alumni[];
  pagination?: {
    total?: number;
  };
}

interface GalleryResponse {
  galleries?: Gallery[];
  data?: Gallery[];
}

interface NewsResponse {
  news?: News[];
  data?: News[];
}

interface CommunityResponse {
  data?: Community[];
}

interface DonationResponse {
  donations?: Donation[];
  data?: Donation[];
}

interface MentorshipResponse {
  mentorships?: Mentorship[];
  data?: Mentorship[];
}

const CollegeAdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateHODOpen, setIsCreateHODOpen] = useState(false);
  const [isCreateStaffOpen, setIsCreateStaffOpen] = useState(false);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);

  // Mobile sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // College Settings state
  const [collegeLogo, setCollegeLogo] = useState<File | null>(null);
  const [collegeBanner, setCollegeBanner] = useState<File | null>(null);
  const [collegeDescription, setCollegeDescription] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [logoLoading, setLogoLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);
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
    totalCommunities: 0,
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalJobs: 0,
    activeJobs: 0,
    hodCount: 0,
    staffCount: 0,
    adminCount: 0,
    totalCampaignRaised: 0,
    totalCampaignTarget: 0,
  });

  const [pendingAlumni, setPendingAlumni] = useState<PendingRequest[]>([]);
  const [hodStaff, setHodStaff] = useState<StaffMember[]>([]);
  const [staffPage, setStaffPage] = useState(1);
  const [staffLimit] = useState(10);
  const [totalStaff, setTotalStaff] = useState(0);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [recentActivities, setRecentActivities] = useState<unknown[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [mentorships, setMentorships] = useState<Mentorship[]>([]);
  const [alumniByDepartment, setAlumniByDepartment] = useState<
    Record<string, number>
  >({});
  const [eventsByStatus, setEventsByStatus] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState({
    stats: false,
    alumni: false,
    staff: false,
    events: false,
    communities: false,
    campaigns: false,
    jobs: false,
    galleries: false,
    news: false,
    donations: false,
    mentorships: false,
  });

  // Form states for creating HOD/Staff
  const [newHOD, setNewHOD] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    password: "",
  });

  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "department",
          isActive: "true",
        });
        const names = Array.isArray(res.data)
          ? (res.data as Array<{ name?: string; [key: string]: unknown }>)
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setDepartmentOptions(names);
      } catch (_) {
        if (mounted) setDepartmentOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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

  // Validation errors state
  const [validationErrors, setValidationErrors] = useState({
    hod: {} as Record<string, string>,
    staff: {} as Record<string, string>,
    admin: {} as Record<string, string>,
  });

  // Password visibility state
  const [passwordVisibility, setPasswordVisibility] = useState({
    hod: false,
    staff: false,
    admin: false,
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

      // Fetch all data in parallel
      const [
        alumniResponse,
        staffResponse,
        eventsResponse,
        pendingAlumniResponse,
        communitiesResponse,
        campaignsResponse,
        jobsResponse,
        allStaffResponse,
      ] = await Promise.all([
        alumniAPI.getAllAlumni({
          limit: 1,
          tenantId: user.tenantId,
        }),
        userAPI.getAllUsers({
          role: "hod,staff",
          tenantId: user.tenantId,
          limit: 1,
        }),
        eventAPI.getAllEvents({
          limit: 1,
          tenantId: user.tenantId,
        }),
        userAPI.getPendingUserRequests(),
        communityAPI
          .getTopCommunities(100)
          .catch(() => ({ success: false, data: [] })),
        campaignAPI
          .getAllCampaigns({
            limit: 100,
          })
          .catch(() => ({ success: false, data: { campaigns: [] } })),
        jobAPI
          .getAllJobs({
            limit: 1,
            tenantId: user.tenantId,
          })
          .catch(() => ({
            success: false,
            data: { pagination: { total: 0 } },
          })),
        userAPI
          .getAllUsers({
            role: "college_admin,hod,staff",
            tenantId: user.tenantId,
          })
          .catch(() => ({ success: false, data: { users: [] } })),
      ]);

      // Process pending requests
      const pendingAlumniData = (pendingAlumniResponse.data ||
        []) as PendingRequest[];
      const pendingAlumniCount =
        pendingAlumniData.filter(
          (req) => req.role === "alumni" && req.tenantId === user.tenantId
        ).length || 0;

      const pendingStaffCount =
        pendingAlumniData.filter(
          (req) =>
            (req.role === "hod" || req.role === "staff") &&
            req.tenantId === user.tenantId
        ).length || 0;

      // Process staff breakdown
      const allStaffResponseTyped =
        allStaffResponse as APIResponse<UserResponse>;
      const allStaff =
        (allStaffResponseTyped.data as UserResponse)?.users || [];
      const hodCount = allStaff.filter((s) => s.role === "hod").length;
      const staffCount = allStaff.filter((s) => s.role === "staff").length;
      const adminCount = allStaff.filter(
        (s) => s.role === "college_admin"
      ).length;

      // Process communities
      const communitiesResponseTyped =
        communitiesResponse as APIResponse<CommunityResponse>;
      const communitiesData =
        (communitiesResponseTyped.data as CommunityResponse)?.data || [];
      const totalCommunities = Array.isArray(communitiesData)
        ? communitiesData.length
        : 0;

      // Process campaigns
      const campaignsResponseTyped =
        campaignsResponse as APIResponse<CampaignResponse>;
      const campaignsData =
        (campaignsResponseTyped.data as CampaignResponse)?.campaigns ||
        (campaignsResponseTyped.data as Campaign[]) ||
        [];
      const allCampaigns = Array.isArray(campaignsData) ? campaignsData : [];
      const totalCampaigns = allCampaigns.length;
      const activeCampaigns = allCampaigns.filter(
        (c) => c.status === "active"
      ).length;
      const totalRaised = allCampaigns.reduce(
        (sum: number, c) => sum + (c.currentAmount || 0),
        0
      );
      const totalTarget = allCampaigns.reduce(
        (sum: number, c) => sum + (c.targetAmount || 0),
        0
      );

      // Process jobs
      const jobsResponseTyped = jobsResponse as APIResponse<JobResponse>;
      const jobsDataTyped = jobsResponseTyped.data as JobResponse;
      const jobsTotal = jobsDataTyped?.pagination?.total || 0;
      const jobsData = jobsDataTyped?.jobs || [];
      const activeJobsCount = jobsData.filter(
        (j) => j.status === "active" || j.status === "open"
      ).length;

      const alumniResponseTyped = alumniResponse as APIResponse<AlumniResponse>;
      const alumniDataTyped = alumniResponseTyped.data as AlumniResponse;
      const staffResponseTyped = staffResponse as APIResponse<UserResponse>;
      const staffDataTyped = staffResponseTyped.data as UserResponse;
      const eventsResponseTyped = eventsResponse as APIResponse<EventResponse>;
      const eventsDataTyped = eventsResponseTyped.data as EventResponse;

      setStats({
        totalAlumni: alumniDataTyped?.pagination?.total || 0,
        activeStaff: staffDataTyped?.pagination?.total || 0,
        eventsPosted: eventsDataTyped?.pagination?.total || 0,
        fundsRaised: totalRaised,
        pendingAlumni: pendingAlumniCount,
        pendingHOD: pendingStaffCount,
        pendingStaff: pendingStaffCount,
        totalCommunities,
        totalCampaigns,
        activeCampaigns,
        totalJobs: jobsTotal,
        activeJobs: activeJobsCount,
        hodCount,
        staffCount,
        adminCount,
        totalCampaignRaised: totalRaised,
        totalCampaignTarget: totalTarget,
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
        const allRequests = (response.data as PendingRequest[]).filter(
          (req) => req.tenantId === user.tenantId
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
        role: "college_admin,hod,staff",
        tenantId: user.tenantId,
        page: staffPage,
        limit: staffLimit,
      });

      const responseTyped = response as APIResponse<UserResponse>;
      const dataTyped = responseTyped.data as UserResponse;
      if (response.success && dataTyped?.users) {
        setHodStaff(dataTyped.users);
        const total =
          dataTyped?.pagination?.total ||
          dataTyped?.total ||
          dataTyped?.count ||
          0;
        setTotalStaff(total);
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
  }, [user?.tenantId, toast, staffPage, staffLimit]);

  // Fetch recent events
  const fetchRecentEvents = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, events: true }));
      const response = await eventAPI.getAllEvents({
        limit: 10,
        tenantId: user.tenantId,
      });

      const responseTyped = response as APIResponse<EventResponse>;
      const dataTyped = responseTyped.data as EventResponse;
      if (response.success && dataTyped?.events) {
        const events = dataTyped.events;
        setRecentEvents(events);

        // Calculate events by status
        const statusCounts: Record<string, number> = {};
        events.forEach((event) => {
          const status = event.status || "upcoming";
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        setEventsByStatus(statusCounts);
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

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, campaigns: true }));
      const response = await campaignAPI.getAllCampaigns({
        limit: 10,
      });

      const responseTyped = response as APIResponse<CampaignResponse>;
      const dataTyped = responseTyped.data as CampaignResponse | Campaign[];
      if (response.success && dataTyped) {
        const campaignsData =
          (dataTyped as CampaignResponse)?.campaigns ||
          (Array.isArray(dataTyped) ? dataTyped : []);
        setCampaigns(Array.isArray(campaignsData) ? campaignsData : []);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
    } finally {
      setLoading((prev) => ({ ...prev, campaigns: false }));
    }
  }, [user?.tenantId]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, jobs: true }));
      const response = await jobAPI.getAllJobs({
        limit: 10,
        tenantId: user.tenantId,
      });

      const responseTyped = response as APIResponse<JobResponse>;
      const dataTyped = responseTyped.data as JobResponse | Job[];
      if (response.success && dataTyped) {
        const jobsData =
          (dataTyped as JobResponse)?.jobs ||
          (Array.isArray(dataTyped) ? dataTyped : []);
        setJobs(Array.isArray(jobsData) ? jobsData : []);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading((prev) => ({ ...prev, jobs: false }));
    }
  }, [user?.tenantId]);

  // Fetch alumni breakdown by department
  const fetchAlumniBreakdown = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      const response = await alumniAPI.getAllAlumni({
        limit: 1000,
        tenantId: user.tenantId,
      });

      const responseTyped = response as APIResponse<AlumniResponse>;
      const dataTyped = responseTyped.data as AlumniResponse | Alumni[];
      if (response.success && dataTyped) {
        const alumniData =
          (dataTyped as AlumniResponse)?.alumni ||
          (dataTyped as AlumniResponse)?.profiles ||
          (Array.isArray(dataTyped) ? dataTyped : []);
        const alumniArray = Array.isArray(alumniData) ? alumniData : [];

        // Group by department
        const deptCounts: Record<string, number> = {};
        alumniArray.forEach((alumni) => {
          const dept =
            alumni.department || alumni.userId?.department || "Unknown";
          deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        });
        setAlumniByDepartment(deptCounts);
      }
    } catch (error) {
      console.error("Error fetching alumni breakdown:", error);
    }
  }, [user?.tenantId]);

  // Fetch galleries
  const fetchGalleries = useCallback(async () => {
    if (!user?.tenantId) return;

    try {
      setLoading((prev) => ({ ...prev, galleries: true }));
      const response = await galleryAPI.getAllGalleries({
        limit: 5,
        tenantId: user.tenantId,
      });

      const responseTyped = response as APIResponse<GalleryResponse>;
      const dataTyped = responseTyped.data as GalleryResponse | Gallery[];
      if (response.success && dataTyped) {
        const galleriesData =
          (dataTyped as GalleryResponse)?.galleries ||
          (Array.isArray(dataTyped) ? dataTyped : []);
        setGalleries(Array.isArray(galleriesData) ? galleriesData : []);
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
        limit: 5,
      });

      const responseTyped = response as APIResponse<NewsResponse>;
      const dataTyped = responseTyped.data as NewsResponse | News[];
      if (response.success && dataTyped) {
        const newsData =
          (dataTyped as NewsResponse)?.news ||
          (Array.isArray(dataTyped) ? dataTyped : []);
        setNews(Array.isArray(newsData) ? newsData : []);
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
      const response = await communityAPI.getTopCommunities(5);

      if (response.success && response.data) {
        const communitiesData = response.data || [];
        setCommunities(Array.isArray(communitiesData) ? communitiesData : []);
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
      const baseUrl = API_BASE_URL;
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${baseUrl}/donations?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = (await response.json()) as APIResponse<DonationResponse>;
        const donationsData =
          (data.data as DonationResponse)?.donations ||
          (Array.isArray(data.data) ? data.data : []);
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
      const baseUrl = API_BASE_URL;
      const token =
        localStorage.getItem("token") || sessionStorage.getItem("token");

      const response = await fetch(`${baseUrl}/mentorship?limit=5`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = (await response.json()) as APIResponse<MentorshipResponse>;
        const mentorshipsData =
          (data.data as MentorshipResponse)?.mentorships ||
          (Array.isArray(data.data) ? data.data : []);
        setMentorships(Array.isArray(mentorshipsData) ? mentorshipsData : []);
      }
    } catch (error) {
      console.error("Error fetching mentorships:", error);
    } finally {
      setLoading((prev) => ({ ...prev, mentorships: false }));
    }
  }, [user?.tenantId]);

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

  // Validation functions
  interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    department: string;
    password: string;
  }

  const validateForm = (
    formData: FormData,
    formType: "hod" | "staff" | "admin"
  ) => {
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

    // Department validation (for HOD and Staff)
    if (
      (formType === "hod" || formType === "staff") &&
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

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    } else if (
      !/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/.test(
        formData.password
      )
    ) {
      errors.password =
        "Password must contain at least one uppercase letter, one number, and one special character";
    }

    return errors;
  };

  const updateValidationErrors = (
    formType: "hod" | "staff" | "admin",
    errors: Record<string, string>
  ) => {
    setValidationErrors((prev) => ({
      ...prev,
      [formType]: errors,
    }));
  };

  const togglePasswordVisibility = (formType: "hod" | "staff" | "admin") => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [formType]: !prev[formType],
    }));
  };

  // HOD/Staff creation functions
  const handleCreateHOD = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(newHOD, "hod");
    updateValidationErrors("hod", errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are validation errors
    }

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

      const response = await userAPI.createUser(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "HOD created successfully",
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
        fetchHodStaff();
      } else {
        throw new Error(response.message || "Failed to create HOD");
      }
    } catch (error) {
      console.error("Error creating HOD:", error);
      toast({
        title: "Error",
        description: "Failed to create HOD",
        variant: "destructive",
      });
    } finally {
      setCreateLoading((prev) => ({ ...prev, hod: false }));
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(newStaff, "staff");
    updateValidationErrors("staff", errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are validation errors
    }

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

      const response = await userAPI.createUser(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Staff created successfully",
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
        fetchHodStaff();
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
      setCreateLoading((prev) => ({ ...prev, staff: false }));
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    const errors = validateForm(newAdmin, "admin");
    updateValidationErrors("admin", errors);

    if (Object.keys(errors).length > 0) {
      return; // Don't submit if there are validation errors
    }

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

      const response = await userAPI.createUser(userData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Admin created successfully",
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
        fetchHodStaff();
      } else {
        throw new Error(response.message || "Failed to create admin");
      }
    } catch (error) {
      console.error("Error creating admin:", error);
      toast({
        title: "Error",
        description: "Failed to create admin",
        variant: "destructive",
      });
    } finally {
      setCreateLoading((prev) => ({ ...prev, admin: false }));
    }
  };

  // College Settings handlers
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, SVG)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setCollegeLogo(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);

      toast({
        title: "Logo Selected",
        description: "Logo ready to upload",
      });
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, SVG)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setCollegeBanner(file);
      const preview = URL.createObjectURL(file);
      setBannerPreview(preview);

      toast({
        title: "Banner Selected",
        description: "Banner ready to upload",
      });
    }
  };

  const handleSaveCollegeSettings = async () => {
    // Check for tenantId in multiple possible locations
    // NOTE: Do NOT use user._id as tenantId - they are different entities
    interface UserWithTenant {
      tenantId?: string;
      tenant?: { _id?: string };
      _id?: string;
      role?: string;
    }
    const userWithTenant = user as UserWithTenant;
    const tenantId =
      userWithTenant?.tenantId ||
      userWithTenant?.tenant?._id ||
      null;

    // Validate tenantId format (MongoDB ObjectId is 24 hex characters)
    if (!tenantId || typeof tenantId !== "string" || !/^[0-9a-fA-F]{24}$/.test(tenantId)) {
      toast({
        title: "Error",
        description: `Invalid college ID. User: ${user?.firstName} ${user?.lastName}, Role: ${user?.role}. Please contact support to ensure your account is properly linked to a college.`,
        variant: "destructive",
      });
      return;
    }

    setSettingsLoading(true);

    try {
      // First, verify the tenant exists (will auto-create if missing for college_admin)
      const tenantCheck = await tenantAPI.getTenantById(tenantId);
      if (!tenantCheck.success) {
        toast({
          title: "Error",
          description: tenantCheck.message || "College not found. Please contact support to ensure your account is properly linked to a college.",
          variant: "destructive",
        });
        setSettingsLoading(false);
        return;
      }
      
      // If tenant was auto-created, show a success message
      if (tenantCheck.message?.includes("auto-created")) {
        toast({
          title: "College Setup",
          description: "Your college has been automatically set up. You can now upload logo and banner.",
        });
      }

      // Upload logo to database
      if (collegeLogo) {
        setLogoLoading(true);

        try {
          const logoResponse = await tenantAPI.uploadLogo(
            tenantId,
            collegeLogo
          );

          if (logoResponse.success) {
            // Dispatch custom event to notify navbar of logo update
            window.dispatchEvent(new CustomEvent("collegeLogoUpdated"));

            // Also dispatch event for banner update
            window.dispatchEvent(new CustomEvent("collegeBannerUpdated"));
          } else {
            const errorMessage = logoResponse.message || "Failed to upload logo";
            // If it's an invalid tenant ID error, don't fallback to localStorage
            if (errorMessage.includes("Invalid tenant ID") || errorMessage.includes("Tenant not found")) {
              throw new Error(errorMessage);
            }
            // For other errors, fallback to localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
              const logoData = e.target?.result as string;
              localStorage.setItem(`college_logo_${tenantId}`, logoData);

              // Dispatch custom event to notify navbar of logo update (with small delay)
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("collegeLogoUpdated"));
              }, 100);
            };
            reader.readAsDataURL(collegeLogo);
          }
        } catch (error) {
          // If it's a tenant ID error, re-throw to be handled by outer catch
          if (error instanceof Error && 
              (error.message.includes("Invalid tenant ID") || 
               error.message.includes("Tenant not found"))) {
            throw error; // Re-throw to prevent success toast and show error
          }
          // For other errors, silently fallback to localStorage (already handled above)
        }
        setLogoLoading(false);
      }

      // Upload banner to database
      if (collegeBanner) {
        setBannerLoading(true);

        try {
          const bannerResponse = await tenantAPI.uploadBanner(
            tenantId,
            collegeBanner
          );

          if (bannerResponse.success) {
            // Dispatch custom event to notify of banner update
            window.dispatchEvent(new CustomEvent("collegeBannerUpdated"));
          } else {
            const errorMessage = bannerResponse.message || "Failed to upload banner";
            // If it's an invalid tenant ID error, don't fallback to localStorage
            if (errorMessage.includes("Invalid tenant ID") || errorMessage.includes("Tenant not found")) {
              throw new Error(errorMessage);
            }
            // For other errors, fallback to localStorage
            const reader = new FileReader();
            reader.onload = (e) => {
              const bannerData = e.target?.result as string;
              localStorage.setItem(`college_banner_${tenantId}`, bannerData);

              // Dispatch custom event to notify of banner update (with small delay)
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("collegeBannerUpdated"));
              }, 100);
            };
            reader.readAsDataURL(collegeBanner);
          }
        } catch (error) {
          // If it's a tenant ID error, re-throw to be handled by outer catch
          if (error instanceof Error && 
              (error.message.includes("Invalid tenant ID") || 
               error.message.includes("Tenant not found"))) {
            throw error; // Re-throw to prevent success toast and show error
          }
          // For other errors, silently fallback to localStorage (already handled above)
        }
        setBannerLoading(false);
      }

      // Save college description to database
      if (collegeDescription.trim()) {
        const descriptionResponse = await tenantAPI.updateDescription(
          tenantId,
          collegeDescription
        );

        if (!descriptionResponse.success) {
          throw new Error(
            descriptionResponse.message || "Failed to save description"
          );
        }
      }

      toast({
        title: "Settings Saved",
        description: "College settings have been updated successfully",
      });

      // Reset form
      setCollegeLogo(null);
      setCollegeBanner(null);
      setLogoPreview(null);
      setBannerPreview(null);
    } catch (error) {
      console.error("Error saving college settings:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to save college settings",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
      setLogoLoading(false);
      setBannerLoading(false);
    }
  };

  // Load college settings from database
  const loadCollegeSettings = async (tenantId: string) => {
    try {
      // Load logo from database
      try {
        const logoResponse = await tenantAPI.getLogo(tenantId);
        if (typeof logoResponse === "string") {
          setLogoPreview(getImageUrl(logoResponse));
        }
      } catch (error) {
        // Logo not found or error loading logo
      }

      // Load banner from database
      try {
        const bannerResponse = await tenantAPI.getBanner(tenantId);
        if (typeof bannerResponse === "string") {
          setBannerPreview(getImageUrl(bannerResponse));
        }
      } catch (error) {
        // Check localStorage as fallback
        try {
          const storedBanner = localStorage.getItem(
            `college_banner_${tenantId}`
          );
          if (storedBanner) {
            setBannerPreview(storedBanner);
          }
        } catch (localStorageError) {
          // Error loading banner from localStorage
        }
      }

      // Load description from tenant data
      try {
        const tenantResponse = await tenantAPI.getTenantById(tenantId);
        if (tenantResponse.success && tenantResponse.data) {
          const tenantData = tenantResponse.data as TenantData;
          if (tenantData.description) {
            setCollegeDescription(tenantData.description);
          }
        }
      } catch (error) {
        // Error loading tenant description
      }
    } catch (error) {
      console.error("Error loading college settings:", error);
    }
  };

  // Alumni creation is now handled by AlumniManagement component

  // Load data on component mount
  useEffect(() => {
    fetchStats();
    fetchPendingAlumni();
    fetchHodStaff();
    fetchRecentEvents();
    fetchCampaigns();
    fetchJobs();
    fetchAlumniBreakdown();
    fetchGalleries();
    fetchNews();
    fetchCommunities();
    fetchDonations();
    fetchMentorships();

    // Load existing college settings from database
    // NOTE: Do NOT use user._id as tenantId - they are different entities
    interface UserWithTenant {
      tenantId?: string;
      tenant?: { _id?: string };
      _id?: string;
      role?: string;
    }
    const userWithTenant = user as UserWithTenant;
    const tenantId =
      userWithTenant?.tenantId ||
      userWithTenant?.tenant?._id ||
      null;
    
    // Only load if tenantId is valid (24 hex characters)
    if (tenantId && typeof tenantId === "string" && /^[0-9a-fA-F]{24}$/.test(tenantId)) {
      loadCollegeSettings(tenantId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    fetchStats,
    fetchPendingAlumni,
    fetchHodStaff,
    fetchRecentEvents,
    fetchCampaigns,
    fetchJobs,
    fetchAlumniBreakdown,
    fetchGalleries,
    fetchNews,
    fetchCommunities,
    fetchDonations,
    fetchMentorships,
  ]);

  // Listen for banner updates
  useEffect(() => {
    const handleBannerUpdate = () => {
      interface UserWithTenant {
        tenantId?: string;
        tenant?: { _id?: string };
        _id?: string;
        role?: string;
      }
      const userWithTenant = user as UserWithTenant;
      const tenantId = userWithTenant?.tenantId || userWithTenant?.tenant?._id;
      // Only load if tenantId is valid (24 hex characters)
      if (tenantId && typeof tenantId === "string" && /^[0-9a-fA-F]{24}$/.test(tenantId)) {
        loadCollegeSettings(tenantId);
      }
    };

    window.addEventListener("collegeBannerUpdated", handleBannerUpdate);
    return () => {
      window.removeEventListener("collegeBannerUpdated", handleBannerUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId]);

  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Enhanced Sidebar */}
        <aside
          className={`
          ${
            sidebarOpen
              ? "fixed inset-y-0 left-0 z-50"
              : "hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:z-40"
          }
          top-16 w-72 flex-shrink-0 bg-gradient-to-b from-white to-gray-50 border-r shadow-sm ${
            sidebarOpen ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem-80px)]"
          }
        `}
        >
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">
                      College Admin
                    </h3>
                    <p className="text-blue-100 text-xs">Management Portal</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden text-white hover:bg-white/20"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
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
                  key: "college",
                  label: "College Settings",
                  icon: Settings,
                  color: "blue",
                },
                {
                  key: "admin-staff",
                  label: "Admin & Staff",
                  icon: Users2,
                  color: "green",
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
                  icon: Users,
                  color: "blue",
                },
                {
                  key: "categories",
                  label: "Categories",
                  icon: Tags,
                  color: "indigo",
                },
                {
                  key: "fundraisers",
                  label: "Campaign",
                  icon: Target,
                  color: "rose",
                },
                {
                  key: "event-management",
                  label: "Event Management",
                  icon: Calendar,
                  color: "amber",
                },
                {
                  key: "job-management",
                  label: "Job Management",
                  icon: Briefcase,
                  color: "blue",
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
          </div>
        </aside>
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 ml-0 lg:ml-72 pb-20">
          {/* Mobile Menu Button */}
          <div className="lg:hidden mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-2"
            >
              <Menu className="w-4 h-4" />
              Menu
            </Button>
          </div>

          {/* Header - only on Dashboard tab */}
          {activeTab === "dashboard" && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  College Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Manage your college's alumni network and operations
                </p>
              </div>
              <Badge variant="outline" className="text-sm">
                <Building2 className="w-4 h-4 mr-2" />
                College Admin
              </Badge>
            </div>
          )}

          {/* College Banner Display - only on Dashboard tab */}
          {activeTab === "dashboard" && bannerPreview && (
            <div className="relative overflow-hidden rounded-lg shadow-lg">
              <img
                src={bannerPreview ? getImageUrl(bannerPreview) : ""}
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
                    Manage your college's alumni network and operations
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content controlled by sidebar */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
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
                    fetchCampaigns();
                    fetchJobs();
                    fetchAlumniBreakdown();
                    fetchGalleries();
                    fetchNews();
                    fetchCommunities();
                    fetchDonations();
                    fetchMentorships();
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Refresh Data
                </Button>
              </div>

              {/* Enhanced KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Alumni */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Alumni
                    </CardTitle>
                    <GraduationCap className="h-5 w-5 text-blue-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats
                        ? "..."
                        : stats.totalAlumni.toLocaleString()}
                    </div>
                    <div className="flex items-center mt-2">
                      {stats.pendingAlumni > 0 ? (
                        <>
                          <TrendingUp className="h-3 w-3 text-orange-500 mr-1" />
                          <p className="text-xs text-orange-600 font-medium">
                            {stats.pendingAlumni} pending approval
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          All up to date
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Active Staff Breakdown */}
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Active Staff
                    </CardTitle>
                    <Users className="h-5 w-5 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats ? "..." : stats.activeStaff}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">HOD:</span>
                        <span className="font-medium">{stats.hodCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Staff:</span>
                        <span className="font-medium">{stats.staffCount}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Admin:</span>
                        <span className="font-medium">{stats.adminCount}</span>
                      </div>
                    </div>
                    {stats.pendingStaff > 0 && (
                      <p className="text-xs text-orange-600 mt-1">
                        +{stats.pendingStaff} pending
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Events Posted */}
                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Events Posted
                    </CardTitle>
                    <Calendar className="h-5 w-5 text-purple-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats ? "..." : stats.eventsPosted}
                    </div>
                    <div className="mt-2 space-y-1">
                      {Object.keys(eventsByStatus).length > 0 ? (
                        Object.entries(eventsByStatus)
                          .slice(0, 2)
                          .map(([status, count]) => (
                            <div
                              key={status}
                              className="flex justify-between text-xs"
                            >
                              <span className="text-muted-foreground capitalize">
                                {status}:
                              </span>
                              <span className="font-medium">{count}</span>
                            </div>
                          ))
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          No events yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Funds Raised */}
                <Card className="border-l-4 border-l-amber-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Funds Raised
                    </CardTitle>
                    <IndianRupee className="h-5 w-5 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats
                        ? "..."
                        : `₹${stats.fundsRaised.toLocaleString()}`}
                    </div>
                    {stats.totalCampaignTarget > 0 && (
                      <div className="mt-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Progress:
                          </span>
                          <span className="font-medium">
                            {Math.round(
                              (stats.totalCampaignRaised /
                                stats.totalCampaignTarget) *
                                100
                            )}
                            %
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
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
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Communities */}
                <Card className="border-l-4 border-l-cyan-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Communities
                    </CardTitle>
                    <MessageSquare className="h-5 w-5 text-cyan-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats ? "..." : stats.totalCommunities}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Active communities
                    </p>
                  </CardContent>
                </Card>

                {/* Campaigns */}
                <Card className="border-l-4 border-l-rose-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Campaigns
                    </CardTitle>
                    <Target className="h-5 w-5 text-rose-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats ? "..." : stats.totalCampaigns}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Active:</span>
                        <span className="font-medium text-green-600">
                          {stats.activeCampaigns}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">
                          {stats.totalCampaigns}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Jobs */}
                <Card className="border-l-4 border-l-indigo-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Job Postings
                    </CardTitle>
                    <Briefcase className="h-5 w-5 text-indigo-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats ? "..." : stats.totalJobs}
                    </div>
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Active:</span>
                        <span className="font-medium text-green-600">
                          {stats.activeJobs}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Total:</span>
                        <span className="font-medium">{stats.totalJobs}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Overall Engagement */}
                <Card className="border-l-4 border-l-teal-500">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Engagement
                    </CardTitle>
                    <Activity className="h-5 w-5 text-teal-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {loading.stats
                        ? "..."
                        : Math.round(
                            ((stats.totalAlumni + stats.activeStaff) /
                              (stats.totalAlumni +
                                stats.activeStaff +
                                stats.pendingAlumni +
                                stats.pendingStaff)) *
                              100 || 0
                          )}
                      %
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Verified members
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Statistics Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                      (count / stats.totalAlumni) * 100 || 0
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                        recentEvents.slice(0, 5).map((event) => {
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
                        galleries.slice(0, 5).map((gallery) => {
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
                        news.slice(0, 5).map((newsItem) => {
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
                        communities.slice(0, 5).map((community) => {
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
                        donations.slice(0, 5).map((donation) => {
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
                        mentorships.slice(0, 5).map((mentorship) => {
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

            {/* College Settings - Only for the admin's own college */}
            <TabsContent value="college" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">College Settings</h2>
                <Button
                  onClick={handleSaveCollegeSettings}
                  disabled={settingsLoading || logoLoading || bannerLoading}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  {settingsLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>College Logo</CardTitle>
                    <CardDescription>
                      Upload your college logo (PNG, JPG, SVG, max 5MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {logoPreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={logoPreview}
                            alt="Logo Preview"
                            className="w-full h-32 object-contain border rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCollegeLogo(null);
                              setLogoPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-sm text-green-600">
                          ✓ Logo selected: {collegeLogo?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500 mb-4">
                          Click to upload or drag and drop
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("logo-upload")?.click()
                          }
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Banner Image</CardTitle>
                    <CardDescription>
                      Upload a banner image for your college page (max 10MB)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {bannerPreview ? (
                      <div className="space-y-4">
                        <div className="relative">
                          <img
                            src={
                              bannerPreview ? getImageUrl(bannerPreview) : ""
                            }
                            alt="Banner Preview"
                            className="w-full h-48 object-cover border rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={() => {
                              setCollegeBanner(null);
                              setBannerPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-sm text-green-600">
                          ✓ Banner selected: {collegeBanner?.name}
                        </p>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
                        <p className="text-sm text-gray-500 mb-4">
                          Click to upload or drag and drop
                        </p>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerUpload}
                          className="hidden"
                          id="banner-upload"
                        />
                        <Button
                          variant="outline"
                          onClick={() =>
                            document.getElementById("banner-upload")?.click()
                          }
                        >
                          Choose File
                        </Button>
                      </div>
                    )}
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
                    value={collegeDescription}
                    onChange={(e) => setCollegeDescription(e.target.value)}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Admin & Staff Management - Only for this college */}
            <TabsContent value="admin-staff" className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Admin & Staff Management
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Manage admins, HODs and staff for your college
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-sm">
                    Total: {totalStaff}
                  </Badge>
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
                            onChange={(e) => {
                              setNewAdmin((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.admin.firstName) {
                                updateValidationErrors("admin", {
                                  ...validationErrors.admin,
                                  firstName: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.admin.firstName
                                ? "border-red-500"
                                : ""
                            }
                            required
                          />
                          {validationErrors.admin.firstName && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.admin.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="admin-lastName">Last Name</Label>
                          <Input
                            id="admin-lastName"
                            placeholder="Smith"
                            value={newAdmin.lastName}
                            onChange={(e) => {
                              setNewAdmin((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.admin.lastName) {
                                updateValidationErrors("admin", {
                                  ...validationErrors.admin,
                                  lastName: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.admin.lastName
                                ? "border-red-500"
                                : ""
                            }
                            required
                          />
                          {validationErrors.admin.lastName && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.admin.lastName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="admin-email">Email</Label>
                          <Input
                            id="admin-email"
                            type="email"
                            placeholder="john.smith@college.edu"
                            value={newAdmin.email}
                            onChange={(e) => {
                              setNewAdmin((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.admin.email) {
                                updateValidationErrors("admin", {
                                  ...validationErrors.admin,
                                  email: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.admin.email
                                ? "border-red-500"
                                : ""
                            }
                            required
                          />
                          {validationErrors.admin.email && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.admin.email}
                            </p>
                          )}
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
                          <Label htmlFor="admin-password">
                            Default Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="admin-password"
                              type={
                                passwordVisibility.admin ? "text" : "password"
                              }
                              placeholder="Admin@1234"
                              value={newAdmin.password}
                              onChange={(e) => {
                                setNewAdmin((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }));
                                // Clear error when user starts typing
                                if (validationErrors.admin.password) {
                                  updateValidationErrors("admin", {
                                    ...validationErrors.admin,
                                    password: "",
                                  });
                                }
                              }}
                              className={`pr-10 ${
                                validationErrors.admin.password
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
                              onClick={() => togglePasswordVisibility("admin")}
                            >
                              {passwordVisibility.admin ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {validationErrors.admin.password && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.admin.password}
                            </p>
                          )}
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
                            {createLoading.admin
                              ? "Creating..."
                              : "Create Admin"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>

                  <Dialog
                    open={isCreateHODOpen}
                    onOpenChange={setIsCreateHODOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateHODOpen(true);
                        }}
                      >
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
                            onChange={(e) => {
                              setNewHOD((prev) => ({
                                ...prev,
                                firstName: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.hod.firstName) {
                                updateValidationErrors("hod", {
                                  ...validationErrors.hod,
                                  firstName: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.hod.firstName
                                ? "border-red-500"
                                : ""
                            }
                            required
                          />
                          {validationErrors.hod.firstName && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.hod.firstName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="hod-lastName">Last Name</Label>
                          <Input
                            id="hod-lastName"
                            placeholder="Smith"
                            value={newHOD.lastName}
                            onChange={(e) => {
                              setNewHOD((prev) => ({
                                ...prev,
                                lastName: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.hod.lastName) {
                                updateValidationErrors("hod", {
                                  ...validationErrors.hod,
                                  lastName: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.hod.lastName
                                ? "border-red-500"
                                : ""
                            }
                            required
                          />
                          {validationErrors.hod.lastName && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.hod.lastName}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="hod-email">Email</Label>
                          <Input
                            id="hod-email"
                            type="email"
                            placeholder="john.smith@college.edu"
                            value={newHOD.email}
                            onChange={(e) => {
                              setNewHOD((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }));
                              // Clear error when user starts typing
                              if (validationErrors.hod.email) {
                                updateValidationErrors("hod", {
                                  ...validationErrors.hod,
                                  email: "",
                                });
                              }
                            }}
                            className={
                              validationErrors.hod.email ? "border-red-500" : ""
                            }
                            required
                          />
                          {validationErrors.hod.email && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.hod.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="hod-department">Department</Label>
                          <Select
                            value={newHOD.department}
                            onValueChange={(val) => {
                              setNewHOD((prev) => ({
                                ...prev,
                                department: val,
                              }));
                              if (validationErrors.hod.department) {
                                updateValidationErrors("hod", {
                                  ...validationErrors.hod,
                                  department: "",
                                });
                              }
                            }}
                          >
                            <SelectTrigger id="hod-department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departmentOptions.length === 0 ? (
                                <SelectItem value="" disabled>
                                  No departments available
                                </SelectItem>
                              ) : (
                                departmentOptions.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          {validationErrors.hod.department && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.hod.department}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="hod-password">Default Password</Label>
                          <div className="relative">
                            <Input
                              id="hod-password"
                              type={
                                passwordVisibility.hod ? "text" : "password"
                              }
                              placeholder="HOD@1234"
                              value={newHOD.password}
                              onChange={(e) => {
                                setNewHOD((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }));
                                // Clear error when user starts typing
                                if (validationErrors.hod.password) {
                                  updateValidationErrors("hod", {
                                    ...validationErrors.hod,
                                    password: "",
                                  });
                                }
                              }}
                              className={`pr-10 ${
                                validationErrors.hod.password
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
                              onClick={() => togglePasswordVisibility("hod")}
                            >
                              {passwordVisibility.hod ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          {validationErrors.hod.password && (
                            <p className="text-sm text-red-500 mt-1">
                              {validationErrors.hod.password}
                            </p>
                          )}
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
                          <Select
                            value={newStaff.department}
                            onValueChange={(val) =>
                              setNewStaff((prev) => ({
                                ...prev,
                                department: val,
                              }))
                            }
                          >
                            <SelectTrigger id="staff-department">
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent>
                              {departmentOptions.length === 0 ? (
                                <SelectItem value="" disabled>
                                  No departments available
                                </SelectItem>
                              ) : (
                                departmentOptions.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="staff-password">
                            Default Password
                          </Label>
                          <div className="relative">
                            <Input
                              id="staff-password"
                              type={
                                passwordVisibility.staff ? "text" : "password"
                              }
                              placeholder="Staff@1234"
                              value={newStaff.password}
                              onChange={(e) =>
                                setNewStaff((prev) => ({
                                  ...prev,
                                  password: e.target.value,
                                }))
                              }
                              className="pr-10"
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
                            {createLoading.staff
                              ? "Creating..."
                              : "Create Staff"}
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
                  hodStaff.map((member) => (
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
                                member.status === "active"
                                  ? "default"
                                  : "secondary"
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

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm text-muted-foreground">
                  Page {staffPage} of{" "}
                  {Math.max(1, Math.ceil(totalStaff / staffLimit))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={staffPage <= 1 || loading.staff}
                    onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    disabled={
                      staffPage >= Math.ceil(totalStaff / staffLimit) ||
                      loading.staff
                    }
                    onClick={() => setStaffPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Alumni Management */}
            <TabsContent value="alumni" className="space-y-6">
              <AlumniManagement />
            </TabsContent>

            {/* Eligible Students Management */}
            <TabsContent value="eligible-students" className="space-y-6">
              <EligibleStudentsPanel />
            </TabsContent>

            {/* Category Management */}
            <TabsContent value="categories" className="space-y-6">
              <CategoryManagement />
            </TabsContent>

            {/* Campaigns Management */}
            <TabsContent value="fundraisers" className="space-y-6">
              <CampaignManagement />
            </TabsContent>
            <TabsContent value="event-management" className="space-y-6">
              <EventManagement />
            </TabsContent>

            {/* Job Management */}
            <TabsContent value="job-management" className="space-y-6">
              <JobManagement />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CollegeAdminDashboard;
