import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { jobApplicationAPI, jobAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Calendar, Building, MapPin, Users } from "lucide-react";

const statusColors: Record<string, string> = {
  Applied: "bg-blue-100 text-blue-700",
  Shortlisted: "bg-amber-100 text-amber-700",
  Rejected: "bg-red-100 text-red-700",
  Hired: "bg-emerald-100 text-emerald-700",
};

const MyJobApplicationPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const {
    data: jobData,
    isLoading: jobLoading,
    isError: jobError,
    error: jobErrorObj,
  } = useQuery({
    queryKey: ["job-detail", jobId],
    queryFn: () => jobAPI.getJobById(jobId ?? ""),
    enabled: Boolean(jobId),
  });

  const {
    data: applicationsData,
    isLoading: appsLoading,
    isError: appsError,
    error: appsErrorObj,
  } = useQuery({
    queryKey: ["my-applications"],
    queryFn: () =>
      jobApplicationAPI.getUserApplications({
        page: 1,
        limit: 200,
      }),
    enabled: Boolean(user?.id),
  });

  const job = useMemo(() => {
    if (!jobData) return null;
    if ("data" in jobData && jobData.data?.job) return jobData.data.job;
    if ("data" in jobData) return jobData.data;
    return (jobData as any).job ?? jobData;
  }, [jobData]);

  const application = useMemo(() => {
    if (!applicationsData) return null;
    const list =
      ("data" in applicationsData
        ? applicationsData.data?.applications
        : (applicationsData as any)?.applications) || [];
    return list.find((app: any) => {
      const appJobId =
        typeof app.jobId === "string" ? app.jobId : app.jobId?._id;
      return appJobId === jobId;
    });
  }, [applicationsData, jobId]);

  if (!jobId) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Invalid URL</AlertTitle>
          <AlertDescription>
            Missing job reference. Please return to the job board and use the
            provided link.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (jobLoading || appsLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <Skeleton className="h-10 w-60" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-40 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (jobError || !job) {
    const message =
      jobErrorObj instanceof Error
        ? jobErrorObj.message
        : "Unable to load job information.";
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Job not found</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/jobs")}>Back to Job Board</Button>
      </div>
    );
  }

  if (appsError) {
    const message =
      appsErrorObj instanceof Error
        ? appsErrorObj.message
        : "Unable to load your applications.";
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/jobs")}>Back to Job Board</Button>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="max-w-4xl mx-auto py-10 space-y-4">
        <Alert>
          <AlertTitle>No application found</AlertTitle>
          <AlertDescription>
            We couldn&apos;t find an application for this job under your
            account.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate("/jobs")}>Back to Job Board</Button>
      </div>
    );
  }

  const status = application.status || "Applied";
  const statusColor = statusColors[status] || "bg-gray-100 text-gray-700";
  const appliedDate = application.appliedAt
    ? new Date(application.appliedAt).toLocaleString()
    : null;

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
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
      </div>

      <Card className="shadow-medium">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">
            {job.position || job.title}
          </CardTitle>
          <CardDescription className="space-y-1">
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Building className="w-4 h-4" />
                {job.company}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {job.type}
              </span>
            </div>
            {appliedDate && (
              <p className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Applied on {appliedDate}
              </p>
            )}
          </CardDescription>
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium text-muted-foreground">
              Current status:
            </span>
            <Badge className={statusColor}>{status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {application.reviewNotes && (
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Notes from reviewer</h3>
              <p className="text-sm text-muted-foreground">
                {application.reviewNotes}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-medium">Your Application</h3>
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Experience:</span>{" "}
                {application.experience || "Not provided"}
              </p>
              <div>
                <p className="text-sm font-semibold mb-1">Skills:</p>
                {application.skills && application.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {application.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Not provided</p>
                )}
              </div>
              {application.message && (
                <div>
                  <p className="text-sm font-semibold mb-1">Message:</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {application.message}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyJobApplicationPage;

