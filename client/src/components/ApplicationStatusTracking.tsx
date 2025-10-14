import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  MoreHorizontal,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  Building2,
  Briefcase,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApplicationAPI } from "@/lib/api";

interface Application {
  _id: string;
  jobId: {
    _id: string;
    title: string;
    company: string;
    position: string;
    location: string;
    type: string;
    status: string;
    deadline?: string;
    postedBy: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  skills: string[];
  experience: string;
  contactDetails: {
    name: string;
    email: string;
    phone: string;
  };
  message?: string;
  resume?: string;
  status: "Applied" | "Shortlisted" | "Rejected" | "Hired";
  appliedAt: string;
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
}

const ApplicationStatusTracking: React.FC = () => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobApplicationAPI.getUserApplications();

      if (response.success) {
        setApplications(response.data.applications || []);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to load your applications",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load your applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApplication = async (applicationId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this application? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await jobApplicationAPI.deleteApplication(applicationId);
      toast({
        title: "Success",
        description: "Application deleted successfully",
      });
      fetchApplications();
    } catch (error: any) {
      console.error("Error deleting application:", error);
      toast({
        title: "Error",
        description: "Failed to delete application",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Applied":
        return <Clock className="w-4 h-4" />;
      case "Shortlisted":
        return <CheckCircle className="w-4 h-4" />;
      case "Rejected":
        return <XCircle className="w-4 h-4" />;
      case "Hired":
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-800";
      case "Shortlisted":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Hired":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.jobId.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobId.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.jobId.position.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    total: applications.length,
    applied: applications.filter((app) => app.status === "Applied").length,
    shortlisted: applications.filter((app) => app.status === "Shortlisted")
      .length,
    rejected: applications.filter((app) => app.status === "Rejected").length,
    hired: applications.filter((app) => app.status === "Hired").length,
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Loading Applications...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            My Job Applications
          </CardTitle>
          <CardDescription>
            Track the status of your job applications and manage your
            applications
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Applied</p>
                <p className="text-2xl font-bold text-blue-600">
                  {statusCounts.applied}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Shortlisted</p>
                <p className="text-2xl font-bold text-green-600">
                  {statusCounts.shortlisted}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {statusCounts.rejected}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Hired</p>
                <p className="text-2xl font-bold text-purple-600">
                  {statusCounts.hired}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search jobs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Hired">Hired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredApplications.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No applications found</p>
              <p className="text-sm text-gray-400 mt-2">
                {applications.length === 0
                  ? "You haven't applied to any jobs yet."
                  : "No applications match your current filters."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Details</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((application) => (
                  <TableRow key={application._id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{application.jobId.title}</p>
                        <p className="text-sm text-gray-500">
                          {application.jobId.position}
                        </p>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-3 h-3" />
                          {application.jobId.location}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-gray-500" />
                          <span className="font-medium">
                            {application.jobId.company}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">
                          Posted by {application.jobId.postedBy.firstName}{" "}
                          {application.jobId.postedBy.lastName}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge
                          className={`${getStatusColor(
                            application.status
                          )} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(application.status)}
                          {application.status}
                        </Badge>
                        {application.reviewedAt && (
                          <p className="text-xs text-gray-500">
                            Reviewed:{" "}
                            {new Date(
                              application.reviewedAt
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedApplication(application);
                              setDetailsDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteApplication(application._id)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Application
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              View details of your job application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Job Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Job Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Job Title:</p>
                    <p>{selectedApplication.jobId.title}</p>
                  </div>
                  <div>
                    <p className="font-medium">Position:</p>
                    <p>{selectedApplication.jobId.position}</p>
                  </div>
                  <div>
                    <p className="font-medium">Company:</p>
                    <p>{selectedApplication.jobId.company}</p>
                  </div>
                  <div>
                    <p className="font-medium">Location:</p>
                    <p>{selectedApplication.jobId.location}</p>
                  </div>
                  <div>
                    <p className="font-medium">Job Type:</p>
                    <p className="capitalize">
                      {selectedApplication.jobId.type}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Posted By:</p>
                    <p>
                      {selectedApplication.jobId.postedBy.firstName}{" "}
                      {selectedApplication.jobId.postedBy.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Application Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Application Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Status:</p>
                    <Badge
                      className={`${getStatusColor(
                        selectedApplication.status
                      )} flex items-center gap-1 w-fit`}
                    >
                      {getStatusIcon(selectedApplication.status)}
                      {selectedApplication.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="font-medium">Applied:</p>
                    <p>
                      {new Date(
                        selectedApplication.appliedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
                  {selectedApplication.reviewedAt && (
                    <>
                      <div>
                        <p className="font-medium">Reviewed:</p>
                        <p>
                          {new Date(
                            selectedApplication.reviewedAt
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="font-medium">Reviewed By:</p>
                        <p>
                          {selectedApplication.reviewedBy?.firstName}{" "}
                          {selectedApplication.reviewedBy?.lastName}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <p className="font-medium">Skills:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedApplication.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="font-medium">Experience:</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedApplication.experience}
                  </p>
                </div>

                {selectedApplication.message && (
                  <div>
                    <p className="font-medium">Message:</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedApplication.message}
                    </p>
                  </div>
                )}

                {selectedApplication.reviewNotes && (
                  <div>
                    <p className="font-medium">Review Notes:</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedApplication.reviewNotes}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setDetailsDialog(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationStatusTracking;
