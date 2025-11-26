import { useEffect, useState } from "react";
import { VerificationActivity, VerificationStats } from "./types";
import { rewardsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  User,
  Award,
  Calendar,
  FileText,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { getImageUrl } from "@/lib/api";
import { format } from "date-fns";

export const StaffVerificationDashboard: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<VerificationActivity[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedActivity, setSelectedActivity] = useState<VerificationActivity | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const [verificationsResponse, statsResponse] = await Promise.all([
        rewardsAPI.getPendingVerifications({
          status: filter === "all" ? undefined : filter,
          search: searchQuery || undefined,
          page,
          limit: 20,
        }),
        rewardsAPI.getVerificationStats(),
      ]);

      if (verificationsResponse.success && verificationsResponse.data) {
        setActivities(verificationsResponse.data.activities || []);
        setTotalPages(verificationsResponse.data.pagination?.pages || 1);
      }

      if (statsResponse.success && statsResponse.data?.stats) {
        setStats(statsResponse.data.stats as VerificationStats);
      }
    } catch (error) {
      toast({
        title: "Unable to load verifications",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [filter, page, searchQuery]);

  const handleVerify = async (activity: VerificationActivity, action: "approve" | "reject") => {
    try {
      setVerifying(true);
      await rewardsAPI.verifyTask(
        activity._id,
        action,
        action === "reject" ? rejectionReason : undefined
      );
      toast({
        title: `Task ${action === "approve" ? "approved" : "rejected"}`,
        description: `The task has been ${action === "approve" ? "approved" : "rejected"} successfully.`,
      });
      setSelectedActivity(null);
      setRejectionReason("");
      fetchVerifications();
    } catch (error) {
      toast({
        title: "Unable to verify task",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading && !activities.length) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Pending Verifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Approved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-gray-500 mt-1">Total approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Rejected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-gray-500 mt-1">Total rejected</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-700">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">All verifications</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Task Verifications</CardTitle>
            <Select value={filter} onValueChange={(value) => {
              setFilter(value as typeof filter);
              setPage(1);
            }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, reward, or task..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-gray-600 mt-3">No verifications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => (
                <Card key={activity._id} className="border-l-4 border-l-blue-500">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {activity.user?.profilePicture ? (
                              <img
                                src={getImageUrl(activity.user.profilePicture)}
                                alt={activity.user.firstName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold">
                                {activity.user?.firstName} {activity.user?.lastName}
                              </h4>
                              {getStatusBadge(activity.verification?.status || "pending")}
                            </div>
                            <p className="text-sm text-gray-600">{activity.user?.email}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Award className="w-3 h-3" />
                                <span>{activity.reward?.name}</span>
                              </div>
                              {activity.taskId && activity.reward?.tasks && (
                                <div className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  <span>
                                    {activity.reward.tasks.find((t) => t._id === activity.taskId)?.title || "Task"}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {activity.createdAt
                                    ? format(new Date(activity.createdAt), "MMM d, yyyy")
                                    : "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {activity.progressValue} / {activity.progressTarget}
                            </span>
                          </div>
                          {activity.pointsAwarded && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Points</span>
                              <span className="font-medium text-green-600">
                                +{activity.pointsAwarded} pts
                              </span>
                            </div>
                          )}
                          {activity.context && Object.keys(activity.context).length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                              <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                                <FileText className="w-3 h-3" />
                                <span>Context</span>
                              </div>
                              <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify(activity.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        {activity.verification?.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-sm font-medium text-red-800">Rejection Reason:</p>
                            <p className="text-sm text-red-700 mt-1">
                              {activity.verification.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>

                      {activity.verification?.status === "pending" && (
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 border-green-200 hover:bg-green-50"
                                onClick={() => setSelectedActivity(activity)}
                              >
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Task</DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to approve this task? Points will be
                                  awarded to the user.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedActivity(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleVerify(activity, "approve")}
                                  disabled={verifying}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {verifying ? "Approving..." : "Approve"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => {
                                  setSelectedActivity(activity);
                                  setRejectionReason("");
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Task</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this task.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Textarea
                                  placeholder="Enter rejection reason..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={4}
                                />
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedActivity(null);
                                    setRejectionReason("");
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={() => handleVerify(activity, "reject")}
                                  disabled={verifying || !rejectionReason.trim()}
                                  variant="destructive"
                                >
                                  {verifying ? "Rejecting..." : "Reject"}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

