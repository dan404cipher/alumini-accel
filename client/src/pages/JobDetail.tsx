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
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { jobAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { EditJobDialog } from "@/components/dialogs/EditJobDialog";
import { ShareJobDialog } from "@/components/dialogs/ShareJobDialog";

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

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedJobs");
    if (saved) {
      setSavedJobs(new Set(JSON.parse(saved)));
    }
  }, []);

  // Check if user can edit jobs
  const canEditJobs =
    user?.role === "super_admin" || user?.role === "coordinator";

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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
    );
  }

  if (error || !job) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
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
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/jobs")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Job Board
        </Button>

        {/* Job Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {job.position}
                </CardTitle>
                <CardDescription className="text-xl text-gray-600 mb-4">
                  {job.company}
                </CardDescription>

                {/* Job Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
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
                    {formatSalary(job.salary)}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button onClick={handleApply} className="flex-1 sm:flex-none">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Apply Now
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSaveJob}
                    className={savedJobs.has(job._id) ? "text-yellow-600" : ""}
                  >
                    <Bookmark
                      className={`w-4 h-4 mr-2 ${
                        savedJobs.has(job._id) ? "fill-current" : ""
                      }`}
                    />
                    {savedJobs.has(job._id) ? "Saved" : "Save Job"}
                  </Button>
                  <Button variant="outline" onClick={handleShareJob}>
                    <Mail className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  {canEditJobs && (
                    <Button variant="outline" onClick={handleEditJob}>
                      <Briefcase className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Job Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {job.description?.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  )) || <p>No description available</p>}
                </div>
              </CardContent>
            </Card>

            {/* Requirements */}
            {job.requirements && job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Company</span>
                  <span>{job.company}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span>{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remote</span>
                  <span>{job.remote ? "Yes" : "No"}</span>
                </div>
                {job.deadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline</span>
                    <span>{formatDate(job.deadline)}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.companyWebsite && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Website</span>
                    <a
                      href={job.companyWebsite}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      <Globe className="w-4 h-4 mr-1" />
                      Visit
                    </a>
                  </div>
                )}
                {job.applicationUrl && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Apply URL</span>
                    <a
                      href={job.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Apply
                    </a>
                  </div>
                )}
                {job.contactEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email</span>
                    <a
                      href={`mailto:${job.contactEmail}`}
                      className="text-primary hover:underline flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-1" />
                      {job.contactEmail}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Posted By */}
            <Card>
              <CardHeader>
                <CardTitle>Posted By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {job.postedBy.firstName} {job.postedBy.lastName}
                    </p>
                    <p className="text-sm text-gray-600">Alumni</p>
                  </div>
                </div>
              </CardContent>
            </Card>
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
      </div>
    </div>
  );
};

export default JobDetail;
