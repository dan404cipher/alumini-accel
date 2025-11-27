import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { jobAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import ApplicationManagementDashboard from "@/components/ApplicationManagementDashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const JobApplicationsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data,
    isLoading,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["job-detail", id],
    queryFn: () => jobAPI.getJobById(id ?? ""),
    enabled: Boolean(id),
  });

  const job = useMemo(() => {
    if (!data) return null;
    // API might return { data: { job } } or { data: job }
    if ("data" in data && data.data?.job) return data.data.job;
    if ("data" in data) return data.data;
    return (data as any).job ?? data;
  }, [data]);

  const canManage = useMemo(() => {
    if (!user || !job) return false;
    const adminRoles = [
      "super_admin",
      "college_admin",
      "hod",
      "staff",
    ] as const;
    const isAdmin = adminRoles.includes(user.role as typeof adminRoles[number]);
    const jobOwnerId =
      typeof job.postedBy === "string" ? job.postedBy : job.postedBy?._id;
    return isAdmin || jobOwnerId === user._id;
  }, [user, job]);

  if (!id) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Invalid job reference</AlertTitle>
          <AlertDescription>
            Missing job identifier. Please return to the job board and select a
            job to manage applications.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-10 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !job) {
    const message =
      queryError instanceof Error
        ? queryError.message
        : "Unable to load job details.";
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Job not found</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/jobs")}>
          Back to Job Board
        </Button>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Access restricted</AlertTitle>
          <AlertDescription>
            You don&apos;t have permission to view applications for this job.
          </AlertDescription>
        </Alert>
        <Button className="mt-4" onClick={() => navigate("/jobs")}>
          Back to Job Board
        </Button>
      </div>
    );
  }

  const jobOwner =
    typeof job.postedBy === "object"
      ? `${job.postedBy.firstName ?? ""} ${job.postedBy.lastName ?? ""}`.trim()
      : undefined;

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">
            Applications for {job.position || job.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {job.company} • {job.location}
          </p>
          {jobOwner && (
            <p className="text-xs text-muted-foreground">
              Posted by {jobOwner}
            </p>
          )}
        </div>
      </div>

      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle>Application Management</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationManagementDashboard
            jobId={job._id}
            jobTitle={job.position || job.title}
            companyName={job.company}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default JobApplicationsPage;

