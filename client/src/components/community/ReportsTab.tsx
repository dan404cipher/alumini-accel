import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Flag,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reportAPI } from "@/lib/api";

interface Report {
  _id: string;
  reporterId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  reportedEntityId: string;
  reportedEntityType: "post" | "comment";
  reason: string;
  description?: string;
  status: "pending" | "reviewed" | "resolved" | "dismissed";
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReportsTabProps {
  communityId: string;
  isAdmin: boolean;
  isModerator: boolean;
}

const ReportsTab: React.FC<ReportsTabProps> = ({
  communityId,
  isAdmin,
  isModerator,
}) => {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [resolution, setResolution] = useState<string>("");

  // Fetch reports
  const fetchReports = async () => {
    if (!isAdmin && !isModerator) {
      toast({
        title: "Access Denied",
        description: "Only admins and moderators can view reports",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (isAdmin) {
        // Admins can see all pending reports
        response = await reportAPI.getPendingReports();
      } else {
        // Moderators can see community-specific reports
        response = await reportAPI.getCommunityReports(communityId);
      }

      if (response.success) {
        setReports(response.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch reports",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update report status
  const updateReportStatus = async () => {
    if (!selectedReport || !newStatus) return;

    try {
      const response = await reportAPI.updateReportStatus(selectedReport._id, {
        status: newStatus as any,
        resolution: resolution.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Report status updated successfully",
        });
        setShowStatusDialog(false);
        setSelectedReport(null);
        setNewStatus("");
        setResolution("");
        fetchReports(); // Refresh the list
      } else {
        toast({
          title: "Error",
          description: "Failed to update report status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating report status:", error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive",
      });
    }
  };

  // Filter reports
  const filteredReports = reports.filter((report) => {
    const statusMatch =
      statusFilter === "all" || report.status === statusFilter;
    const typeMatch =
      typeFilter === "all" || report.reportedEntityType === typeFilter;
    return statusMatch && typeMatch;
  });

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "reviewed":
        return "bg-blue-100 text-blue-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "dismissed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get reason badge color
  const getReasonBadgeColor = (reason: string) => {
    switch (reason) {
      case "spam":
        return "bg-red-100 text-red-800";
      case "harassment":
        return "bg-orange-100 text-orange-800";
      case "inappropriate_content":
        return "bg-purple-100 text-purple-800";
      case "hate_speech":
        return "bg-red-100 text-red-800";
      case "violence":
        return "bg-red-100 text-red-800";
      case "misinformation":
        return "bg-yellow-100 text-yellow-800";
      case "copyright_violation":
        return "bg-blue-100 text-blue-800";
      case "other":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    fetchReports();
  }, [communityId, isAdmin, isModerator]);

  if (!isAdmin && !isModerator) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-600">
            Only community administrators and moderators can view reports.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Reports Management
          </h2>
          <p className="text-gray-600">
            Review and manage reported posts and comments
          </p>
        </div>
        <Button onClick={fetchReports} disabled={loading}>
          <Eye className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="type-filter">Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="post">Posts</SelectItem>
                  <SelectItem value="comment">Comments</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>Reports ({filteredReports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading reports...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-8">
              <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Reports Found
              </h3>
              <p className="text-gray-600">
                {statusFilter === "all" && typeFilter === "all"
                  ? "No reports have been submitted yet."
                  : "No reports match the current filters."}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <Card
                  key={report._id}
                  className="border-l-4 border-l-yellow-400"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getStatusBadgeColor(report.status)}>
                            {report.status}
                          </Badge>
                          <Badge className={getReasonBadgeColor(report.reason)}>
                            {report.reason.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline">
                            {report.reportedEntityType === "post" ? (
                              <MessageSquare className="w-3 h-3 mr-1" />
                            ) : (
                              <User className="w-3 h-3 mr-1" />
                            )}
                            {report.reportedEntityType}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>
                              Reported by: {report.reporterId.firstName}{" "}
                              {report.reporterId.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Reported on: {formatDate(report.createdAt)}
                            </span>
                          </div>
                          {report.description && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700">
                                <strong>Description:</strong>{" "}
                                {report.description}
                              </p>
                            </div>
                          )}
                          {report.resolution && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-700">
                                <strong>Resolution:</strong> {report.resolution}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setShowStatusDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Update Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Update Report Status</AlertDialogTitle>
            <AlertDialogDescription>
              Review this report and update its status. Provide a resolution if
              applicable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resolution">Resolution (Optional)</Label>
              <Textarea
                id="resolution"
                placeholder="Provide details about the resolution..."
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                {resolution.length}/500 characters
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={updateReportStatus}>
              Update Status
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReportsTab;
