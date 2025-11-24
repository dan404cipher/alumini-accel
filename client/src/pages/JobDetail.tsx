import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Building,
  MapPin,
  Clock,
  DollarSign,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  Mail,
  Globe,
  Calendar,
  Briefcase,
  BarChart3,
  Award,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { EditJobDialog } from "@/components/dialogs/EditJobDialog";
import { ShareJobDialog } from "@/components/dialogs/ShareJobDialog";
import { hasPermission } from "@/utils/rolePermissions";

interface Job {
  _id: string;
  position: string;
  company: string;
  location: string;
  type: string;
  remote?: boolean;
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  description: string;
  requirements?: string[];
  benefits?: string[];
  tags?: string[];
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt?: string;
  applicants?: number;
  isReferral?: boolean;
  deadline?: string;
  applicationUrl?: string;
  companyWebsite?: string;
  contactEmail?: string;
}

const JobDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditJobOpen, setIsEditJobOpen] = useState(false);
  const [isShareJobOpen, setIsShareJobOpen] = useState(false);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch job data
  const {
    data: jobResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["job", id],
    queryFn: () => jobAPI.getJobById(id!),
    enabled: !!id,
  });

  // Extract job data from API response
  const job = jobResponse?.data?.job || (jobResponse?.data as Job | undefined);

  // Fetch suggested jobs (after job is loaded)
  const {
    data: suggestedJobsResponse,
    isLoading: isLoadingSuggested,
    error: suggestedJobsError,
  } = useQuery({
    queryKey: ["suggestedJobs", job?._id, job?.company, job?.type, job?.location],
    queryFn: () =>
      jobAPI.getAllJobs({
        limit: 15,
        page: 1,
      }),
    enabled: !!job?._id,
  });

  // Filter and prepare suggested jobs (exclude current job, prioritize by company/type/location)
  const allJobs = ((suggestedJobsResponse?.data as { jobs?: Job[] })?.jobs ||
    (suggestedJobsResponse?.data as Job[]) ||
    []) as Job[];
  const suggestedJobs = allJobs
    .filter((j: Job) => j._id !== job?._id)
    .sort((a: Job, b: Job) => {
      // Prioritize: same company > same type > same location > recent
      const aIsSameCompany = a.company === job?.company;
      const bIsSameCompany = b.company === job?.company;
      if (aIsSameCompany && !bIsSameCompany) return -1;
      if (!aIsSameCompany && bIsSameCompany) return 1;

      const aIsSameType = a.type === job?.type;
      const bIsSameType = b.type === job?.type;
      if (aIsSameType && !bIsSameType) return -1;
      if (!aIsSameType && bIsSameType) return 1;

      const aIsSameLocation = a.location === job?.location;
      const bIsSameLocation = b.location === job?.location;
      if (aIsSameLocation && !bIsSameLocation) return -1;
      if (!aIsSameLocation && bIsSameLocation) return 1;

      // Finally sort by date (newest first)
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    })
    .slice(0, 6);

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedJobs");
    if (saved) {
      setSavedJobs(new Set(JSON.parse(saved)));
    }
  }, []);

  // Check if user can edit jobs
  const canEditAllJobs = user?.role
    ? hasPermission(user.role, "canEditAllJobs")
    : false;

  // Helper function to check if user can edit this specific job
  const canEditJob = () => {
    if (!user || !job) return false;
    // Can edit if they have permission to edit all jobs OR if they own the job
    return canEditAllJobs || job.postedBy === user._id;
  };

  // Handle save/unsave job
  const handleSaveJob = () => {
    if (!job) return;

    const newSaved = new Set(savedJobs);
    if (newSaved.has(job._id)) {
      newSaved.delete(job._id);
      toast({
        title: "Job Removed",
        description: "Job removed from your saved jobs.",
      });
    } else {
      newSaved.add(job._id);
      toast({
        title: "Job Saved",
        description: "Job added to your saved jobs.",
      });
    }
    setSavedJobs(newSaved);
    localStorage.setItem("savedJobs", JSON.stringify([...newSaved]));
  };

  // Handle apply job
  const handleApply = () => {
    if (!job) return;

    if (job.applicationUrl) {
      window.open(job.applicationUrl, "_blank");
    } else {
      const email = job.contactEmail || "contact@company.com";
      window.open(
        `mailto:${email}?subject=Application for ${job.position}`,
        "_blank"
      );
    }
  };

  // Handle edit job
  const handleEditJob = () => {
    setIsEditJobOpen(true);
  };

  // Handle share job
  const handleShareJob = () => {
    setIsShareJobOpen(true);
  };

  // Handle job updated
  const handleJobUpdated = () => {
    // Refresh the job data
    window.location.reload();
  };

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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
              <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Job Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The job you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/jobs")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job Board
          </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Suggested Jobs */}
        <aside
          className={`
            ${
              sidebarOpen
                ? "fixed inset-y-0 left-0 z-50"
                : "hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:z-40"
            }
            top-16 w-[280px] sm:w-80 flex-shrink-0 bg-background ${
              sidebarOpen ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"
            } border-r transition-transform duration-300 ease-in-out
          `}
        >
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {/* Close button for mobile */}
            {sidebarOpen && (
              <div className="flex justify-end mb-4 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Suggested Jobs
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Other opportunities you might be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSuggested ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 rounded-lg"></div>
                        <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded mt-1 w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestedJobsError ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Unable to load jobs</p>
                  </div>
                ) : suggestedJobs.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {suggestedJobs.map((suggestedJob: Job) => (
                        <div
                          key={suggestedJob._id}
                          onClick={() => {
                            navigate(`/jobs/${suggestedJob._id}`);
                            setSidebarOpen(false);
                          }}
                          className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-blue-300 p-3"
                        >
                          <h4 className="font-semibold text-xs sm:text-sm text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                            {suggestedJob.position}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2 line-clamp-1">
                            {suggestedJob.company}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mb-1">
                            <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{suggestedJob.location}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center text-xs text-gray-500">
                              <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">{suggestedJob.type}</span>
                            </div>
                            {suggestedJob.remote && (
                              <Badge variant="secondary" className="text-xs">
                                Remote
                              </Badge>
                            )}
                          </div>
                          {suggestedJob.salary && (
                            <div className="flex items-center text-xs text-green-600 font-semibold mt-2">
                              <DollarSign className="w-3 h-3 mr-1" />
                              {formatSalary(suggestedJob.salary)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 text-xs sm:text-sm"
                      onClick={() => {
                        navigate("/jobs");
                        setSidebarOpen(false);
                      }}
                    >
                      View All Jobs
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">
                      No suggested jobs at the moment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Mobile Header with Sidebar Toggle */}
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                </Button>
        <Button
          variant="ghost"
          onClick={() => navigate("/jobs")}
                  className="hidden sm:flex"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Board
        </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/jobs")}
                  className="sm:hidden h-9 w-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

        {/* Job Header */}
        <Card className="mb-6">
              <CardHeader className="pb-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                    <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                  {job.position}
                </CardTitle>
                    <CardDescription className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4">
                  {job.company}
                </CardDescription>

                {/* Job Meta Info */}
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {job.location}
                  </div>
                  <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-1" />
                    {job.type}
                  </div>
                  {job.remote && (
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      Remote
                    </div>
                  )}
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(job.createdAt)}
                  </div>
                  {job.postedBy && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Posted by {job.postedBy.firstName} {job.postedBy.lastName}
                    </div>
                  )}
                  {job.deadline && (
                    <div className="flex items-center text-orange-600">
                      <Calendar className="w-4 h-4 mr-1" />
                      Deadline: {formatDate(job.deadline)}
                    </div>
                  )}
                </div>

                {/* Salary */}
                {job.salary && (
                  <div className="flex items-center text-green-600 font-semibold mb-4">
                    <DollarSign className="w-4 h-4 mr-1" />
                        <span className="text-base sm:text-lg">{formatSalary(job.salary)}</span>
                  </div>
                )}

                {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      {job.postedBy?._id === user?._id ? (
                        <Button
                          variant="secondary"
                          disabled
                          className="w-full sm:w-auto"
                        >
                          Your Job Post
                        </Button>
                      ) : (
                        <Button
                          onClick={handleApply}
                          className="w-full sm:w-auto"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Apply Now
                        </Button>
                      )}
                  <Button
                    variant="outline"
                    onClick={handleSaveJob}
                        className={`w-full sm:w-auto ${
                          savedJobs.has(job._id) ? "text-yellow-600" : ""
                        }`}
                  >
                    <Bookmark
                      className={`w-4 h-4 mr-2 ${
                        savedJobs.has(job._id) ? "fill-current" : ""
                      }`}
                    />
                    {savedJobs.has(job._id) ? "Saved" : "Save Job"}
                  </Button>
                      <Button
                        variant="outline"
                        onClick={handleShareJob}
                        className="w-full sm:w-auto"
                      >
                    <Mail className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  {canEditJob() && (
                        <Button
                          variant="outline"
                          onClick={handleEditJob}
                          className="w-full sm:w-auto"
                        >
                      <Briefcase className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {canDeleteJob() && (
                        <Button
                          variant="outline"
                          onClick={() => setShowDeleteDialog(true)}
                          className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Description */}
            <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Job Description</CardTitle>
              </CardHeader>
                  <CardContent className="pt-0">
                <div className="prose max-w-none">
                  {job.description?.split("\n").map((paragraph, index) => (
                        <p
                          key={index}
                          className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-700 leading-relaxed"
                        >
                      {paragraph}
                    </p>
                      )) || (
                        <p className="text-sm sm:text-base text-gray-500">
                          No description available
                        </p>
                      )}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl">Requirements</CardTitle>
                </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2 sm:space-y-3">
                    {job.requirements.map((requirement, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm sm:text-base"
                          >
                            <span className="text-primary mr-2 mt-1">•</span>
                            <span className="text-gray-700 leading-relaxed">
                              {requirement}
                            </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl">Benefits</CardTitle>
                </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2 sm:space-y-3">
                    {job.benefits.map((benefit, index) => (
                          <li
                            key={index}
                            className="flex items-start text-sm sm:text-base"
                          >
                            <span className="text-green-600 mr-2 mt-1">•</span>
                            <span className="text-gray-700 leading-relaxed">
                              {benefit}
                            </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl">Tags</CardTitle>
                </CardHeader>
                    <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs sm:text-sm"
                          >
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

              {/* Company Info Sidebar */}
              <div className="space-y-4 sm:space-y-6">
            {/* Company Info */}
            <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Company Information</CardTitle>
              </CardHeader>
                  <CardContent className="pt-0 space-y-3 sm:space-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Company</span>
                      <span className="text-xs sm:text-sm font-medium text-right max-w-[50%] break-words">
                        {job.company}
                      </span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Location</span>
                      <span className="text-xs sm:text-sm font-medium text-right max-w-[50%] break-words">
                        {job.location}
                      </span>
                </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm text-gray-600">Remote</span>
                      <span className="text-xs sm:text-sm font-medium">
                        {job.remote ? "Yes" : "No"}
                      </span>
                </div>
                {job.deadline && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Deadline</span>
                        <span className="text-xs sm:text-sm font-medium text-right max-w-[50%] break-words">
                          {formatDate(job.deadline)}
                        </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Contact Information</CardTitle>
              </CardHeader>
                  <CardContent className="pt-0 space-y-3 sm:space-4">
                {job.companyWebsite && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Website</span>
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-xs sm:text-sm"
                    >
                          <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">Visit</span>
                    </a>
                  </div>
                )}
                {job.applicationUrl && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-gray-600">Apply URL</span>
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center text-xs sm:text-sm"
                    >
                          <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-[120px] sm:max-w-none">Apply</span>
                    </a>
                  </div>
                )}
                {job.contactEmail && (
                      <div className="flex justify-between items-start">
                        <span className="text-xs sm:text-sm text-gray-600">Email</span>
                    <a
                      href={`mailto:${job.contactEmail}`}
                          className="text-primary hover:underline flex items-center text-xs sm:text-sm text-right max-w-[60%] break-words"
                    >
                          <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0 mt-0.5" />
                          <span className="break-all">{job.contactEmail}</span>
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posted By */}
            <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Posted By</CardTitle>
              </CardHeader>
                  <CardContent className="pt-0">
                <div className="flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mr-3">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm sm:text-base truncate">
                      {job.postedBy.firstName} {job.postedBy.lastName}
                    </p>
                        <p className="text-xs sm:text-sm text-gray-600">Alumni</p>
                  </div>
                </div>
              </CardContent>
            </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Job Dialog */}
        {job && (
          <EditJobDialog
            open={isEditJobOpen}
            onOpenChange={setIsEditJobOpen}
            job={job as any}
            onJobUpdated={handleJobUpdated}
          />
        )}

        {/* Share Job Dialog */}
        {job && (
          <ShareJobDialog
            open={isShareJobOpen}
            onOpenChange={setIsShareJobOpen}
            job={job as any}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Job Post</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this job post? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteJob}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default JobDetail;
