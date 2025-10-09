import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MapPin,
  Building,
  Clock,
  DollarSign,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  Plus,
  Filter,
  Search,
  X,
  Calendar,
  Globe,
  Gift,
  Tag,
  Mail,
  Edit,
  Share2,
  Menu,
} from "lucide-react";
import { PostJobDialog } from "./dialogs/PostJobDialog";
import { EditJobDialog } from "./dialogs/EditJobDialog";
import { ShareJobDialog } from "./dialogs/ShareJobDialog";
import { jobAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { hasPermission } from "@/utils/rolePermissions";

interface Job {
  _id: string;
  company: string;
  position: string;
  location: string;
  type: string;
  experience?: string;
  industry?: string;
  remote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements: string[];
  benefits?: string[];
  tags?: string[];
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
  applicants?: number;
  isReferral?: boolean;
  deadline?: string;
  applicationUrl?: string;
  companyWebsite?: string;
  contactEmail?: string;
}

const JobBoard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [isShareJobOpen, setIsShareJobOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [sharingJob, setSharingJob] = useState<Job | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedSalaryRange, setSelectedSalaryRange] = useState("all");
  const [selectedRemoteWork, setSelectedRemoteWork] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showSavedJobs, setShowSavedJobs] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const fetchJobsRef = useRef<typeof fetchJobs>();

  // Check if user can edit jobs
  const canEditAllJobs = user?.role
    ? hasPermission(user.role, "canEditAllJobs")
    : false;
  const canDeleteJobs = user?.role
    ? hasPermission(user.role, "canDeleteJobs")
    : false;

  // Helper function to check if user can edit a specific job
  const canEditJob = (job: Job) => {
    if (!user) return false;
    // Can edit if they have permission to edit all jobs OR if they own the job
    return canEditAllJobs || job.postedBy._id === user._id;
  };

  // Helper function to check if user can delete a specific job
  const canDeleteJob = (job: Job) => {
    if (!user) return false;
    // Can delete if they have permission to delete all jobs OR if they own the job
    return canDeleteJobs || job.postedBy._id === user._id;
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch jobs from API
  const fetchJobs = useCallback(
    async (pageNum = 1, append = false) => {
      // Prevent multiple simultaneous requests
      if (isFetching) return;

      try {
        setIsFetching(true);
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const params: Record<string, string | number> = {
          page: pageNum,
          limit: 10,
        };
        if (debouncedSearchQuery) params.q = debouncedSearchQuery;
        if (selectedLocation && selectedLocation !== "all")
          params.location = selectedLocation;
        if (selectedType && selectedType !== "all") params.type = selectedType;
        if (selectedExperience && selectedExperience !== "all")
          params.experience = selectedExperience;
        if (selectedIndustry && selectedIndustry !== "all")
          params.industry = selectedIndustry;

        const response = await jobAPI.getAllJobs(params);

        // Reset retry count on successful request
        setRetryCount(0);

        if (response.success && response.data) {
          const data = response.data as
            | { jobs?: Job[]; pagination?: Record<string, string | number> }
            | Job[];
          const newJobs = Array.isArray(data) ? data : data.jobs || [];

          // Debug: Log the first job to see what fields are available
          if (newJobs.length > 0) {
            // Jobs loaded successfully
          }

          if (append) {
            setJobs((prev) => [...prev, ...newJobs]);
          } else {
            setJobs(newJobs);
          }

          // Check if there are more pages
          if (data && typeof data === "object" && "pagination" in data) {
            const pagination = data.pagination;
            const hasMorePages = pagination.page < pagination.totalPages;
            setHasMore(hasMorePages);
          } else {
            // If no pagination info, check if we got a full page
            const hasMorePages = newJobs.length === 10;
            setHasMore(hasMorePages);
          }

          // Safety check: if we got no jobs, there are no more pages
          if (newJobs.length === 0) {
            setHasMore(false);
          }
        } else {
          setError("Failed to fetch jobs");
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch jobs";

        // Handle 429 (Too Many Requests) with exponential backoff
        if (err instanceof Error && err.message.includes("429")) {
          setIsRateLimited(true);
          setHasMore(false); // Stop infinite scroll when rate limited

          // Set a cooldown period before allowing new requests
          setTimeout(() => {
            setIsRateLimited(false);
            setRetryCount(0);
          }, 30000); // 30 second cooldown

          setError(
            "Too many requests. Please wait a moment before trying again."
          );
          return;
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setIsFetching(false);
      }
    },
    [debouncedSearchQuery, selectedLocation, selectedType, isFetching]
  );

  // Store the latest fetchJobs function in ref
  fetchJobsRef.current = fetchJobs;

  // Load jobs when user is authenticated or filters change
  useEffect(() => {
    if (user && !authLoading) {
      setPage(1);
      setHasMore(true); // Reset hasMore when filters change
      if (fetchJobsRef.current) {
        fetchJobsRef.current(1, false);
      }
    } else if (!authLoading && !user) {
      setLoading(false);
      setError("Please log in to view jobs");
    }
  }, [user, authLoading, debouncedSearchQuery, selectedLocation, selectedType]);

  // Load more jobs when scrolling
  const loadMore = useCallback(() => {
    if (
      hasMore &&
      !loadingMore &&
      !loading &&
      !isFetching &&
      !isRateLimited &&
      fetchJobsRef.current &&
      page < 50 // Reduced from 100 to prevent excessive requests
    ) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchJobsRef.current(nextPage, true);
    }
  }, [hasMore, loadingMore, loading, isFetching, isRateLimited, page]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !isFetching &&
          !isRateLimited
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loadMore, hasMore, loadingMore, isFetching, isRateLimited]);

  // Refresh jobs after creating a new one
  const handleJobCreated = useCallback(() => {
    setPage(1);
    if (fetchJobsRef.current) {
      fetchJobsRef.current(1, false);
    }
  }, []);

  // Handle save/unsave job
  const handleSaveJob = useCallback((jobId: string) => {
    setSavedJobs((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(jobId)) {
        newSaved.delete(jobId);
      } else {
        newSaved.add(jobId);
      }
      return newSaved;
    });
  }, []);

  // Handle view job details - navigate to job detail page
  const handleViewJob = useCallback(
    (job: Job) => {
      navigate(`/jobs/${job._id}`);
    },
    [navigate]
  );

  // Handle edit job
  const handleEditJob = useCallback((job: Job) => {
    setEditingJob(job);
    setIsEditJobOpen(true);
  }, []);

  // Handle job updated
  const handleJobUpdated = useCallback(() => {
    // Refresh the jobs list
    fetchJobsRef.current?.(1, false);
  }, []);

  // Handle share job
  const handleShareJob = useCallback((job: Job) => {
    setSharingJob(job);
    setIsShareJobOpen(true);
  }, []);

  // Filter jobs based on search and filter criteria
  const filterJobs = (jobs: Job[]) => {
    return jobs.filter((job) => {
      // Search query filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch =
          job.position.toLowerCase().includes(searchLower) ||
          job.company.toLowerCase().includes(searchLower) ||
          job.description.toLowerCase().includes(searchLower) ||
          job.location.toLowerCase().includes(searchLower) ||
          (job.tags &&
            job.tags.some((tag) => tag.toLowerCase().includes(searchLower)));
        if (!matchesSearch) return false;
      }

      // Job type filter
      if (selectedType !== "all" && job.type !== selectedType) return false;

      // Experience level filter
      if (selectedExperience !== "all" && job.experience !== selectedExperience)
        return false;

      // Industry filter
      if (selectedIndustry !== "all" && job.industry !== selectedIndustry)
        return false;

      // Location filter
      if (selectedLocation !== "all") {
        if (selectedLocation === "remote" && !job.remote) return false;
        if (
          selectedLocation === "hybrid" &&
          !job.location.toLowerCase().includes("hybrid")
        )
          return false;
        if (
          !["remote", "hybrid"].includes(selectedLocation) &&
          !job.location.toLowerCase().includes(selectedLocation.toLowerCase())
        )
          return false;
      }

      // Remote work filter
      if (selectedRemoteWork !== "all") {
        switch (selectedRemoteWork) {
          case "remote":
            if (!job.remote) return false;
            break;
          case "hybrid":
            if (!job.location.toLowerCase().includes("hybrid")) return false;
            break;
          case "onsite":
            if (job.remote || job.location.toLowerCase().includes("hybrid"))
              return false;
            break;
        }
      }

      // Salary range filter
      if (selectedSalaryRange !== "all" && job.salary) {
        const salary = job.salary.min; // Use minimum salary for comparison
        switch (selectedSalaryRange) {
          case "0-50k":
            if (salary > 50000) return false;
            break;
          case "50k-75k":
            if (salary < 50000 || salary > 75000) return false;
            break;
          case "75k-100k":
            if (salary < 75000 || salary > 100000) return false;
            break;
          case "100k-150k":
            if (salary < 100000 || salary > 150000) return false;
            break;
          case "150k-200k":
            if (salary < 150000 || salary > 200000) return false;
            break;
          case "200k+":
            if (salary < 200000) return false;
            break;
        }
      }

      return true;
    });
  };

  // Get saved jobs from the current jobs list
  const savedJobsList = useMemo(() => {
    return jobs.filter((job) => savedJobs.has(job._id));
  }, [jobs, savedJobs]);

  // Helper function to format salary
  const formatSalary = (salary?: {
    min: number;
    max: number;
    currency: string;
  }) => {
    if (!salary) return "Salary not specified";

    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      EUR: "€",
      GBP: "£",
      INR: "₹",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
      CHF: "CHF",
      CNY: "¥",
    };

    const symbol = currencySymbols[salary.currency] || salary.currency;
    return `${symbol}${salary.min.toLocaleString()} - ${symbol}${salary.max.toLocaleString()}`;
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return diffMinutes <= 1 ? "Just now" : `${diffMinutes} minutes ago`;
    }
    if (diffHours < 24) {
      return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
    }
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  // Helper function to get company logo
  const getCompanyLogo = (company: string) => {
    const companyLower = company.toLowerCase();
    return `https://logo.clearbit.com/${companyLower.replace(/\s+/g, "")}.com`;
  };

  // Helper function to create a fallback logo
  const createFallbackLogo = (company: string) => {
    const firstLetter = company.charAt(0).toUpperCase();
    const colors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#8B5CF6", // purple
      "#EF4444", // red
      "#F59E0B", // yellow
      "#6366F1", // indigo
      "#EC4899", // pink
      "#14B8A6", // teal
    ];
    const colorIndex = company.charCodeAt(0) % colors.length;
    const color = colors[colorIndex];

    return `data:image/svg+xml;base64,${btoa(`
      <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" fill="${color}" rx="8"/>
        <text x="24" y="32" font-family="Arial, sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="white">${firstLetter}</text>
      </svg>
    `)}`;
  };

  // Check if user can create jobs
  const canCreateJobs = user?.role
    ? hasPermission(user.role, "canCreateJobs")
    : false;

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Opportunities
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Find your perfect opportunity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Opportunities */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Search Opportunities
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search jobs, internships, projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Filters</h3>

                {/* Job Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="temporary">Temporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Level */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Experience Level
                  </label>
                  <Select
                    value={selectedExperience}
                    onValueChange={setSelectedExperience}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">
                        Entry Level (0-2 years)
                      </SelectItem>
                      <SelectItem value="mid">Mid Level (3-5 years)</SelectItem>
                      <SelectItem value="senior">
                        Senior Level (6-10 years)
                      </SelectItem>
                      <SelectItem value="lead">
                        Lead/Principal (10+ years)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select
                    value={selectedIndustry}
                    onValueChange={setSelectedIndustry}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="consulting">Consulting</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Salary Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Salary Range</label>
                  <Select
                    value={selectedSalaryRange}
                    onValueChange={setSelectedSalaryRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select salary range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Ranges</SelectItem>
                      <SelectItem value="0-50k">$0 - $50k</SelectItem>
                      <SelectItem value="50k-75k">$50k - $75k</SelectItem>
                      <SelectItem value="75k-100k">$75k - $100k</SelectItem>
                      <SelectItem value="100k-150k">$100k - $150k</SelectItem>
                      <SelectItem value="150k-200k">$150k - $200k</SelectItem>
                      <SelectItem value="200k+">$200k+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Remote Work */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Remote Work</label>
                  <Select
                    value={selectedRemoteWork}
                    onValueChange={setSelectedRemoteWork}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select remote option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Options</SelectItem>
                      <SelectItem value="remote">Remote Only</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="San Francisco">
                        San Francisco
                      </SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="Seattle">Seattle</SelectItem>
                      <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                      <SelectItem value="Chicago">Chicago</SelectItem>
                      <SelectItem value="Boston">Boston</SelectItem>
                      <SelectItem value="Austin">Austin</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="Toronto">Toronto</SelectItem>
                      <SelectItem value="Berlin">Berlin</SelectItem>
                      <SelectItem value="Singapore">Singapore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchQuery ||
                  (selectedLocation && selectedLocation !== "all") ||
                  (selectedType && selectedType !== "all") ||
                  (selectedExperience && selectedExperience !== "all") ||
                  (selectedIndustry && selectedIndustry !== "all") ||
                  (selectedSalaryRange && selectedSalaryRange !== "all") ||
                  (selectedRemoteWork && selectedRemoteWork !== "all")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedLocation("all");
                      setSelectedType("all");
                      setSelectedExperience("all");
                      setSelectedIndustry("all");
                      setSelectedSalaryRange("all");
                      setSelectedRemoteWork("all");
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    onClick={() => setShowSavedJobs(!showSavedJobs)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    Saved Jobs
                    {savedJobs.size > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-auto bg-primary text-primary-foreground"
                      >
                        {savedJobs.size}
                      </Badge>
                    )}
                  </Button>
                  {canCreateJobs && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsPostJobOpen(true)}
                      className="w-full justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Post Job
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-4 lg:p-6 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">Job Board</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Opportunities from our alumni network •{" "}
                {filterJobs(jobs).length} active positions
              </p>
            </div>
          </div>
        </div>

        {/* Saved Jobs Section */}
        {showSavedJobs && (
          <Card className="shadow-medium">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold flex items-center">
                  <Bookmark className="w-5 h-5 mr-2 text-primary" />
                  Saved Jobs ({savedJobsList.length})
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSavedJobs(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {savedJobsList.length === 0 ? (
                <div className="text-center py-8">
                  <Bookmark className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No saved jobs yet. Start saving jobs you're interested in!
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowSavedJobs(false)}
                  >
                    Browse Jobs
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedJobsList.map((job) => (
                    <Card
                      key={job._id}
                      className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <img
                              src={getCompanyLogo(job.company)}
                              alt={job.company}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  createFallbackLogo(job.company);
                              }}
                            />
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold mb-1">
                                    {job.position}
                                  </h4>
                                  <div className="flex items-center space-x-3 text-sm text-muted-foreground mb-2">
                                    <div className="flex items-center">
                                      <Building className="w-4 h-4 mr-1" />
                                      {job.company}
                                    </div>
                                    <div className="flex items-center">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      {job.location}
                                    </div>
                                    <div className="flex items-center text-success font-semibold">
                                      <DollarSign className="w-4 h-4 mr-1" />
                                      {formatSalary(job.salary)}
                                    </div>
                                    {job.postedBy && (
                                      <div className="flex items-center">
                                        <Users className="w-4 h-4 mr-1" />
                                        Posted by {job.postedBy.firstName}{" "}
                                        {job.postedBy.lastName}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <p className="text-muted-foreground mb-3 line-clamp-2">
                                {job.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <Badge variant="outline" className="text-xs">
                                    {job.type}
                                  </Badge>
                                  {job.remote && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Remote
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveJob(job._id)}
                                    className="text-yellow-600"
                                  >
                                    <Bookmark className="w-4 h-4 fill-current" />
                                  </Button>
                                  {canEditJob(job) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditJob(job)}
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleShareJob(job)}
                                    className="text-green-600 hover:text-green-700"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewJob(job)}
                                  >
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    View
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => {
                                      if (job.applicationUrl) {
                                        window.open(
                                          job.applicationUrl,
                                          "_blank"
                                        );
                                      } else {
                                        // Show contact information or open email
                                        const email = "contact@company.com";
                                        window.open(
                                          `mailto:${email}?subject=Application for ${job.position}`,
                                          "_blank"
                                        );
                                      }
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Job Listings */}
        {!showSavedJobs && (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground mt-2">Loading jobs...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                {error === "Please log in to view jobs" ? (
                  <Button
                    onClick={() => (window.location.href = "/login")}
                    variant="gradient"
                  >
                    Go to Login
                  </Button>
                ) : error.includes("Too many requests") ? (
                  <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                      Please wait 30 seconds before trying again.
                    </p>
                    <Button
                      onClick={() => {
                        setIsRateLimited(false);
                        setError(null);
                        fetchJobsRef.current?.(1, false);
                      }}
                      variant="outline"
                      disabled={isRateLimited}
                    >
                      {isRateLimited ? "Please wait..." : "Try Again"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => fetchJobsRef.current?.(1, false)}
                    variant="outline"
                  >
                    Try Again
                  </Button>
                )}
              </div>
            ) : filterJobs(jobs).length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  No jobs available at the moment.
                </p>
                {canCreateJobs && (
                  <Button
                    onClick={() => setIsPostJobOpen(true)}
                    variant="gradient"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post First Job
                  </Button>
                )}
              </div>
            ) : (
              filterJobs(jobs).map((job) => (
                <Card
                  key={job._id}
                  className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0"
                >
                  <CardContent className="p-4 lg:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 lg:space-x-4 flex-1">
                        <img
                          src={getCompanyLogo(job.company)}
                          alt={job.company}
                          className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              createFallbackLogo(job.company);
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg lg:text-xl font-semibold mb-1 truncate">
                                {job.position}
                              </h3>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs lg:text-sm text-muted-foreground mb-2">
                                <div className="flex items-center">
                                  <Building className="w-4 h-4 mr-1" />
                                  {job.company}
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {job.location}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatDate(job.createdAt)}
                                </div>
                                {job.postedBy && (
                                  <div className="flex items-center">
                                    <Users className="w-4 h-4 mr-1" />
                                    Posted by {job.postedBy.firstName}{" "}
                                    {job.postedBy.lastName}
                                  </div>
                                )}
                                {job.deadline && (
                                  <div className="flex items-center text-orange-600">
                                    <Clock className="w-4 h-4 mr-1" />
                                    Deadline:{" "}
                                    {new Date(
                                      job.deadline
                                    ).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {job.description}
                          </p>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {job.requirements
                              .slice(0, 3)
                              .map((requirement, index) => (
                                <Badge
                                  key={index}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {requirement}
                                </Badge>
                              ))}
                            {job.requirements.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{job.requirements.length - 3} more
                              </Badge>
                            )}
                          </div>

                          {/* Benefits */}
                          {job.benefits && job.benefits.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.benefits
                                .slice(0, 3)
                                .map((benefit, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs bg-green-50 text-green-700 border-green-200"
                                  >
                                    {benefit}
                                  </Badge>
                                ))}
                              {job.benefits.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.benefits.length - 3} more benefits
                                </Badge>
                              )}
                            </div>
                          )}

                          {/* Tags */}
                          {job.tags && job.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                              {job.tags.slice(0, 4).map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                              {job.tags.length > 4 && (
                                <Badge variant="outline" className="text-xs">
                                  +{job.tags.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center text-success font-semibold">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {formatSalary(job.salary)}
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {job.type}
                              </Badge>
                              {job.remote && (
                                <Badge variant="secondary" className="text-xs">
                                  Remote
                                </Badge>
                              )}
                              {job.isReferral && (
                                <div className="flex items-center text-primary">
                                  <Star className="w-4 h-4 mr-1" />
                                  <span className="text-xs font-medium">
                                    Alumni Referral
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Users className="w-4 h-4 mr-1" />
                              {job.applicants || 0} applicants
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t border-border">
                            <div className="text-xs lg:text-sm text-muted-foreground">
                              Posted by{" "}
                              <span className="text-primary font-medium">
                                {job.postedBy.firstName} {job.postedBy.lastName}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveJob(job._id)}
                                className={`${
                                  savedJobs.has(job._id)
                                    ? "text-yellow-600"
                                    : ""
                                } p-2`}
                              >
                                <Bookmark
                                  className={`w-4 h-4 ${
                                    savedJobs.has(job._id) ? "fill-current" : ""
                                  }`}
                                />
                              </Button>
                              {canEditJob(job) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditJob(job)}
                                  className="text-blue-600 hover:text-blue-700 p-2"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleShareJob(job)}
                                className="text-green-600 hover:text-green-700 p-2"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewJob(job)}
                                className="text-xs lg:text-sm"
                              >
                                <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                                <span className="hidden sm:inline">
                                  View Details
                                </span>
                                <span className="sm:hidden">View</span>
                              </Button>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  if (job.applicationUrl) {
                                    window.open(job.applicationUrl, "_blank");
                                  } else {
                                    // Show contact information or open email
                                    const email = "contact@company.com";
                                    window.open(
                                      `mailto:${email}?subject=Application for ${job.position}`,
                                      "_blank"
                                    );
                                  }
                                }}
                                className="text-xs lg:text-sm"
                              >
                                Apply Now
                              </Button>
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
        )}

        {/* Infinite Scroll Trigger */}
        {!showSavedJobs && (
          <div ref={observerRef} className="text-center py-4">
            {loadingMore && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-2"></div>
                <span className="text-muted-foreground">
                  Loading more jobs...
                </span>
              </div>
            )}
            {isRateLimited && (
              <div className="text-center py-4">
                <p className="text-orange-600 mb-2">
                  ⚠️ Too many requests. Please wait before loading more jobs.
                </p>
                <p className="text-sm text-muted-foreground">
                  This helps prevent server overload.
                </p>
              </div>
            )}
            {!hasMore && jobs.length > 0 && !isRateLimited && (
              <p className="text-muted-foreground">No more jobs to load</p>
            )}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <PostJobDialog
        open={isPostJobOpen}
        onOpenChange={setIsPostJobOpen}
        onJobCreated={handleJobCreated}
      />

      {/* Edit Job Dialog */}
      <EditJobDialog
        open={isEditJobOpen}
        onOpenChange={setIsEditJobOpen}
        job={editingJob}
        onJobUpdated={handleJobUpdated}
      />

      {/* Share Job Dialog */}
      <ShareJobDialog
        open={isShareJobOpen}
        onOpenChange={setIsShareJobOpen}
        job={sharingJob}
      />
    </div>
  );
};

export default JobBoard;
