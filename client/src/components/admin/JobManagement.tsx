import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Building2,
  MapPin,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobAPI } from "@/lib/api";
import { format } from "date-fns";

interface JobPost {
  _id: string;
  title: string;
  company: string;
  position: string;
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
  deadline?: string;
  postedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  status: string;
  createdAt: string;
}

const JobManagement = () => {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchPendingJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getPendingJobs({ page, limit: 10 });
      if (response.success && response.data) {
        setJobs(response.data.jobs || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load pending jobs",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load pending jobs";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchPendingJobs();
  }, [fetchPendingJobs]);

  const handleApprove = async (jobId: string) => {
    try {
      setProcessingId(jobId);
      const response = await jobAPI.approveJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Job approved successfully",
        });
        fetchPendingJobs();
      } else {
        throw new Error(response.message || "Failed to approve job");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to approve job";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (jobId: string) => {
    if (!confirm("Are you sure you want to reject this job post?")) {
      return;
    }

    try {
      setProcessingId(jobId);
      const response = await jobAPI.rejectJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Job rejected successfully",
        });
        fetchPendingJobs();
      } else {
        throw new Error(response.message || "Failed to reject job");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reject job";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this job post? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessingId(jobId);
      const response = await jobAPI.deleteJob(jobId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Job deleted successfully",
        });
        fetchPendingJobs();
      } else {
        throw new Error(response.message || "Failed to delete job");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete job";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12 text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Loading pending jobs...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Management</h2>
          <p className="text-muted-foreground">
            Review and approve job posts from alumni
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchPendingJobs}
          disabled={loading}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium mb-2">No Pending Jobs</p>
            <p className="text-muted-foreground">
              All job posts have been reviewed
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          <span>{job.company}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          <span>{job.position}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>
                            {job.location}
                            {job.remote && " • Remote"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Posted: {formatDate(job.createdAt)}</span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>Posted by:</span>
                        <span className="font-medium">
                          {job.postedBy?.firstName} {job.postedBy?.lastName}
                        </span>
                        <span className="text-xs">({job.postedBy?.email})</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      onClick={() => handleApprove(job._id)}
                      disabled={processingId === job._id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {processingId === job._id ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(job._id)}
                      disabled={processingId === job._id}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {processingId === job._id ? "Processing..." : "Reject"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(job._id)}
                      disabled={processingId === job._id}
                      className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {processingId === job._id ? "Processing..." : "Delete"}
                    </Button>
                    {job.salary && (
                      <div className="ml-auto flex items-center text-sm font-medium">
                        <span>
                          {job.salary.currency} {job.salary.min.toLocaleString()}
                          {" - "}
                          {job.salary.max.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default JobManagement;

