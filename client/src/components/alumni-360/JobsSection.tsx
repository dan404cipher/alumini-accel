import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText, Calendar, MapPin, Building2, CheckCircle2, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

interface JobPost {
  _id: string;
  title: string;
  company: string;
  position: string;
  location?: string;
  status?: string;
  createdAt: string;
}

interface JobApplication {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    position: string;
  };
  status: string;
  appliedAt: string;
}

interface JobsSectionProps {
  jobsPosted?: JobPost[];
  jobsApplied?: JobApplication[];
  loading?: boolean;
}

const getStatusBadge = (status: string) => {
  const statusLower = status?.toLowerCase() || "";
  switch (statusLower) {
    case "active":
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "closed":
    case "expired":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    case "applied":
      return (
        <Badge variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Applied
        </Badge>
      );
    case "shortlisted":
      return (
        <Badge variant="default" className="bg-blue-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Shortlisted
        </Badge>
      );
    case "rejected":
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Rejected
        </Badge>
      );
    case "hired":
      return (
        <Badge variant="default" className="bg-green-500">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Hired
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          {status?.charAt(0).toUpperCase() + status?.slice(1) || "Unknown"}
        </Badge>
      );
  }
};

export const JobsSection = ({
  jobsPosted = [],
  jobsApplied = [],
  loading = false,
}: JobsSectionProps) => {
  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading jobs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Jobs</h2>
      </div>

      <Tabs defaultValue="posted" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="posted" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Jobs Posted ({jobsPosted.length})
          </TabsTrigger>
          <TabsTrigger value="applied" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Jobs Applied ({jobsApplied.length})
          </TabsTrigger>
        </TabsList>

        {/* Jobs Posted Tab */}
        <TabsContent value="posted" className="space-y-4">
          {jobsPosted.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No jobs posted yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobsPosted.map((job) => (
                <Card key={job._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{job.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{job.company}</span>
                          </div>
                          {job.position && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{job.position}</span>
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Posted: {formatDate(job.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(job.status || "pending")}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Jobs Applied Tab */}
        <TabsContent value="applied" className="space-y-4">
          {jobsApplied.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No job applications yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobsApplied.map((application) => (
                <Card key={application._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {application.jobId?.title || "Job Title"}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{application.jobId?.company || "Company"}</span>
                          </div>
                          {application.jobId?.position && (
                            <div className="flex items-center gap-1">
                              <Briefcase className="w-4 h-4" />
                              <span>{application.jobId.position}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Applied: {formatDate(application.appliedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(application.status || "applied")}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

