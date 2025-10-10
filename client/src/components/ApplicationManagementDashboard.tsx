import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Mail,
  Phone,
  Calendar,
  Edit,
  Trash2,
  Download,
  FileText,
  Users,
  Filter,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobApplicationAPI } from "@/lib/api";

interface Application {
  _id: string;
  applicantId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
    currentCompany?: string;
    currentPosition?: string;
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

interface ApplicationManagementDashboardProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

const ApplicationManagementDashboard: React.FC<
  ApplicationManagementDashboardProps
> = ({ jobId, jobTitle, companyName }) => {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<
    "Applied" | "Shortlisted" | "Rejected" | "Hired"
  >("Applied");
  const [reviewNotes, setReviewNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await jobApplicationAPI.getJobApplications(jobId);
      if (response.success) {
        setApplications(response.data.applications);
      }
    } catch (error: any) {
      console.error("Error fetching applications:", error);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedApplication) return;

    try {
      await jobApplicationAPI.updateApplicationStatus(selectedApplication._id, {
        status: newStatus,
        reviewNotes: reviewNotes || undefined,
      });

      toast({
        title: "Success",
        description: "Application status updated successfully",
      });

      setStatusUpdateDialog(false);
      setReviewNotes("");
      fetchApplications();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update application status",
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
      app.applicantId.firstName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.applicantId.lastName
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      app.applicantId.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactDetails.name.toLowerCase().includes(searchQuery.toLowerCase());

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
            <Users className="w-5 h-5" />
            Application Management
          </CardTitle>
          <CardDescription>
            Manage applications for <strong>{jobTitle}</strong> at{" "}
            <strong>{companyName}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
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
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search applicants..."
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
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No applications found</p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-4">
                {filteredApplications.map((application) => (
                  <Card key={application._id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={application.applicantId.profilePicture}
                            />
                            <AvatarFallback>
                              {application.applicantId.firstName?.charAt(0)}
                              {application.applicantId.lastName?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {application.applicantId.firstName}{" "}
                              {application.applicantId.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {application.applicantId.currentCompany}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`${getStatusColor(
                            application.status
                          )} text-xs`}
                        >
                          {getStatusIcon(application.status)}
                          <span className="ml-1">{application.status}</span>
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">
                            {application.contactDetails.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{application.contactDetails.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(
                              application.appliedAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {application.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {application.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{application.skills.length - 3}
                          </Badge>
                        )}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewApplication(application)}
                          className="flex-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(application)}
                            >
                              <Edit className="w-3 h-3 mr-2" />
                              Update Status
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDeleteApplication(application._id)
                              }
                              className="text-red-600"
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Applicant</TableHead>
                      <TableHead className="hidden sm:table-cell min-w-[120px]">
                        Contact
                      </TableHead>
                      <TableHead className="hidden md:table-cell min-w-[100px]">
                        Skills
                      </TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                      <TableHead className="hidden lg:table-cell min-w-[100px]">
                        Applied
                      </TableHead>
                      <TableHead className="min-w-[60px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => (
                      <TableRow key={application._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={application.applicantId.profilePicture}
                              />
                              <AvatarFallback>
                                {application.applicantId.firstName[0]}
                                {application.applicantId.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {application.applicantId.firstName}{" "}
                                {application.applicantId.lastName}
                              </p>
                              <p className="text-sm text-gray-500">
                                {application.applicantId.currentPosition} at{" "}
                                {application.applicantId.currentCompany}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-sm">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[100px]">
                                {application.contactDetails.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="w-3 h-3" />
                              <span className="truncate max-w-[100px]">
                                {application.contactDetails.phone}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {application.skills
                              .slice(0, 2)
                              .map((skill, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {application.skills.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{application.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`${getStatusColor(
                              application.status
                            )} flex items-center gap-1 w-fit text-xs`}
                          >
                            {getStatusIcon(application.status)}
                            <span className="hidden sm:inline">
                              {application.status}
                            </span>
                            <span className="sm:hidden">
                              {application.status.charAt(0)}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(
                              application.appliedAt
                            ).toLocaleDateString()}
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
                                  setNewStatus(application.status);
                                  setStatusUpdateDialog(true);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setNewStatus(application.status);
                                  setStatusUpdateDialog(true);
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Update Status
                              </DropdownMenuItem>
                              {application.resume && (
                                <DropdownMenuItem>
                                  <Download className="w-4 h-4 mr-2" />
                                  Download Resume
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedApplication?.applicantId.firstName}{" "}
              {selectedApplication?.applicantId.lastName}'s application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Application Details */}
              <div className="space-y-4">
                <h3 className="font-semibold">Application Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Name:</p>
                    <p>{selectedApplication.contactDetails.name}</p>
                  </div>
                  <div>
                    <p className="font-medium">Email:</p>
                    <p>{selectedApplication.contactDetails.email}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone:</p>
                    <p>{selectedApplication.contactDetails.phone}</p>
                  </div>
                  <div>
                    <p className="font-medium">Applied:</p>
                    <p>
                      {new Date(
                        selectedApplication.appliedAt
                      ).toLocaleDateString()}
                    </p>
                  </div>
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
              </div>

              {/* Status Update Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">New Status</Label>
                  <Select
                    value={newStatus}
                    onValueChange={(value: any) => setNewStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Applied">Applied</SelectItem>
                      <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reviewNotes">Review Notes (Optional)</Label>
                  <Textarea
                    id="reviewNotes"
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes about this application..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStatusUpdateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleStatusUpdate}>Update Status</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationManagementDashboard;
