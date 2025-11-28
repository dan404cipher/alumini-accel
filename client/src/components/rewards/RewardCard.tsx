import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  Gift,
  Star,
  Award,
  Clock,
  Zap,
  CheckCircle2,
  Target,
  Upload,
  CalendarDays,
} from "lucide-react";
import { format } from "date-fns";
import { RewardTemplate, RewardActivity } from "./types";
import { rewardsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import React from "react";

interface RewardCardProps {
  reward: RewardTemplate;
  activity?: RewardActivity;
  onClaim?: (reward: RewardTemplate) => void;
  layout?: "horizontal" | "vertical";
}

const rewardTypeIconMap: Record<
  RewardTemplate["rewardType"],
  React.ComponentType<{ className?: string }>
> = {
  badge: Award,
  voucher: Gift,
  points: Star,
  perk: Zap,
};

export const RewardCard: React.FC<RewardCardProps> = ({
  reward,
  activity,
  onClaim,
  layout = "vertical",
}) => {
  const { toast } = useToast();
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ rewardId: string; taskId: string } | null>(null);
  const [submissionNote, setSubmissionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  const Icon =
    reward.icon || rewardTypeIconMap[reward.rewardType]
      ? rewardTypeIconMap[reward.rewardType]
      : Gift;

  const progressRatio = activity
    ? Math.min(
        (activity.progressValue / Math.max(activity.progressTarget, 1)) * 100,
        100
      )
    : 0;

  // Check if reward can be claimed (earned AND verification approved if required)
  const canClaim =
    activity?.status === "earned" &&
    (!activity.verification?.required ||
      activity.verification?.status === "approved");
  const showClaimButton = canClaim && !!onClaim;
  const isVerificationPending =
    activity?.status === "earned" &&
    activity.verification?.required === true &&
    activity.verification?.status === "pending";

  const startDate = reward.startsAt ? new Date(reward.startsAt) : null;
  const endDate = reward.endsAt ? new Date(reward.endsAt) : null;

  const scheduleInfo = useMemo(() => {
    if (!startDate && !endDate) return null;
    const now = new Date();
    let status: "Upcoming" | "Active" | "Ended" = "Active";
    let description = "";

    if (startDate && now < startDate) {
      status = "Upcoming";
      description = `Opens ${format(startDate, "MMM d, yyyy")}`;
    } else if (endDate && now > endDate) {
      status = "Ended";
      description = `Ended ${format(endDate, "MMM d, yyyy")}`;
    } else {
      status = "Active";
      if (startDate) {
        description = `Opened ${format(startDate, "MMM d, yyyy")}`;
      }
      if (endDate) {
        description += description
          ? ` • Ends ${format(endDate, "MMM d, yyyy")}`
          : `Ends ${format(endDate, "MMM d, yyyy")}`;
      }
      if (!description) {
        description = "Available now";
      }
    }

    return { status, description };
  }, [startDate, endDate]);

  const handleManualSubmit = async () => {
    if (!selectedTask) return;
    
    try {
      setSubmitting(true);
      await rewardsAPI.logTaskProgress(selectedTask.rewardId, selectedTask.taskId, {
        amount: 1,
        context: {
          note: submissionNote || "Manual submission",
          requiresVerification: true,
        },
      });
      
      toast({
        title: "Progress submitted",
        description: "Your submission has been sent for staff approval.",
      });
      
      setSubmitDialogOpen(false);
      setSubmissionNote("");
      setSelectedTask(null);
      
      // Refresh would be handled by parent component
      if (onClaim) {
        // Trigger a refresh by calling a callback if provided
        window.location.reload(); // Simple refresh for now
      }
    } catch (error) {
      toast({
        title: "Unable to submit progress",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-lg flex",
        layout === "horizontal" ? "flex-col sm:flex-row" : "flex-col"
      )}
    >
      {reward.heroImage ? (
        <div
          className={cn(
            "w-full bg-cover bg-center min-h-[160px]",
            layout === "horizontal" ? "sm:w-1/3" : ""
          )}
          style={{ backgroundImage: `url(${reward.heroImage})` }}
        />
      ) : (
        <div
          className={cn(
            "w-full flex items-center justify-center",
            layout === "horizontal" ? "sm:w-1/3" : "",
            "min-h-[140px]"
          )}
          style={{ background: reward.color || "#EEF2FF" }}
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-white/80 shadow-inner">
            <Icon className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      )}

      <div className="flex-1 p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-xs uppercase tracking-wide">
            {reward.category || "Engagement"}
          </Badge>
          {reward.level && (
            <Badge variant="outline" className="text-xs">
              {reward.level}
            </Badge>
          )}
          {reward.isFeatured && (
            <Badge variant="success" className="text-xs">
              Featured
            </Badge>
          )}
        </div>

        <div className="space-y-1">
          <h3 className="text-xl font-semibold text-gray-900">
            {reward.name}
          </h3>
          {reward.description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {reward.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-500 mr-2" />
            {reward.points ? `${reward.points} pts` : "Custom reward"}
          </div>
          {reward.voucherTemplate?.partner && (
            <div className="flex items-center text-sm text-gray-600">
              <Gift className="w-4 h-4 text-blue-500 mr-2" />
              {reward.voucherTemplate.partner}
              {reward.voucherTemplate.value
                ? ` · ${reward.voucherTemplate.value} ${reward.voucherTemplate.currency || "USD"}`
                : ""}
            </div>
          )}
          {reward.tasks?.length > 0 && (
            <div className="flex items-center text-sm text-gray-500 sm:col-span-2">
              <Clock className="w-4 h-4 mr-2" />
              {reward.tasks.length} task
              {reward.tasks.length > 1 ? "s" : ""} to complete
            </div>
          )}
        </div>

        {scheduleInfo && (
          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-3 space-y-3">
            <div className="flex items-start gap-3 text-sm text-gray-600">
              <CalendarDays className="w-4 h-4 text-indigo-500 mt-0.5" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  Schedule
                </p>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[11px]",
                      scheduleInfo.status === "Active"
                        ? "border-green-200 text-green-600"
                        : scheduleInfo.status === "Upcoming"
                        ? "border-amber-200 text-amber-600"
                        : "border-gray-200 text-gray-500"
                    )}
                  >
                    {scheduleInfo.status}
                  </Badge>
                  <span>{scheduleInfo.description}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activity && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="uppercase tracking-wide">Progress</span>
              <span className="font-medium text-gray-700">
                {activity.progressValue}/{activity.progressTarget}
              </span>
            </div>
            <Progress value={progressRatio} className="h-2 rounded-full" />
            <div className="flex flex-wrap gap-2 text-xs text-gray-500">
              <Badge
                variant="outline"
                className={cn(
                  "border-dashed",
                  activity.status === "earned"
                    ? "text-green-600 border-green-200"
                    : "text-gray-600 border-gray-200"
                )}
              >
                {activity.status.replace("_", " ")}
              </Badge>
              {activity.pointsAwarded ? (
                <Badge variant="outline">{activity.pointsAwarded} pts</Badge>
              ) : null}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 pt-2">
          {reward.tasks?.length > 0 && (
            <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-w-[160px]"
                >
                  View Tasks
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-semibold">
                    {reward.name} - Tasks
                  </DialogTitle>
                  <DialogDescription>
                    Complete these tasks to earn this reward
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {reward.tasks.map((task, index) => {
                    const taskActivity = activity?.taskId === task._id ? activity : null;
                    const taskProgress = taskActivity
                      ? Math.min(
                          (taskActivity.progressValue / Math.max(taskActivity.progressTarget, 1)) * 100,
                          100
                        )
                      : 0;
                    
                    return (
                      <div
                        key={task._id || index}
                        className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-4 h-4 text-blue-600" />
                              <h4 className="font-semibold text-gray-900">
                                {task.title}
                              </h4>
                              {taskActivity?.status === "earned" && (
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-600 mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 text-xs">
                              <Badge variant="outline">
                                {task.actionType}
                              </Badge>
                              <Badge variant="outline">
                                {task.metric}: {task.targetValue}
                              </Badge>
                              {task.points && (
                                <Badge variant="outline">
                                  {task.points} pts
                                </Badge>
                              )}
                              {task.isAutomated && (
                                <Badge variant="secondary">Auto-tracked</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {taskActivity && (
                          <div className="space-y-2 pt-2 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Progress</span>
                              <span className="font-medium text-gray-700">
                                {taskActivity.progressValue}/{taskActivity.progressTarget}
                              </span>
                            </div>
                            <Progress value={taskProgress} className="h-2" />
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                taskActivity.status === "earned"
                                  ? "text-green-600 border-green-200"
                                  : taskActivity.status === "in_progress"
                                  ? "text-blue-600 border-blue-200"
                                  : "text-gray-600 border-gray-200"
                              )}
                            >
                              {taskActivity.status.replace("_", " ")}
                            </Badge>
                            {taskActivity.verification?.status === "pending" && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⏳ Awaiting staff approval
                              </p>
                            )}
                            {taskActivity.verification?.status === "rejected" && (
                              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-xs font-semibold text-red-700 mb-1">
                                  ❌ Task Rejected
                                </p>
                                {taskActivity.verification.rejectionReason && (
                                  <p className="text-xs text-red-600 mb-2">
                                    {taskActivity.verification.rejectionReason}
                                  </p>
                                )}
                                <ResubmitTaskButton
                                  activityId={taskActivity._id}
                                  taskTitle={task.title}
                                />
                              </div>
                            )}
                            {taskActivity.verification?.status === "approved" && (
                              <p className="text-xs text-green-600 mt-1">
                                ✅ Approved by staff
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* Manual Submission Button for non-automated tasks */}
                        {!task.isAutomated && (
                          <div className="pt-2 border-t border-gray-200">
                            <Dialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedTask({
                                      rewardId: reward._id,
                                      taskId: task._id,
                                    });
                                  }}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Submit Proof
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Submit Progress for: {task.title}</DialogTitle>
                                  <DialogDescription>
                                    Provide proof or details about completing this task. Staff will review and approve.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div>
                                    <Label>Description / Proof</Label>
                                    <Textarea
                                      placeholder="Describe what you did or provide proof of completion..."
                                      value={submissionNote}
                                      onChange={(e) => setSubmissionNote(e.target.value)}
                                      rows={4}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Include any relevant details, links, or evidence
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSubmitDialogOpen(false);
                                      setSubmissionNote("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleManualSubmit}
                                    disabled={submitting || !submissionNote.trim()}
                                  >
                                    {submitting ? "Submitting..." : "Submit for Approval"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </DialogContent>
            </Dialog>
          )}
          {showClaimButton && (
            <Button
              size="sm"
              className="flex-1 min-w-[160px]"
              onClick={() => onClaim?.(reward)}
            >
              Claim Reward
            </Button>
          )}
          {isVerificationPending && (
            <div className="flex-1 min-w-[160px] text-center">
              <Button
                size="sm"
                variant="outline"
                disabled
                className="w-full cursor-not-allowed"
              >
                <Clock className="w-4 h-4 mr-2" />
                Awaiting Approval
              </Button>
              <p className="text-xs text-amber-600 mt-1">
                This reward requires staff verification
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Resubmit Task Button Component
const ResubmitTaskButton: React.FC<{ activityId: string; taskTitle: string }> = ({
  activityId,
  taskTitle,
}) => {
  const { toast } = useToast();
  const [resubmitting, setResubmitting] = React.useState(false);

  const handleResubmit = async () => {
    try {
      setResubmitting(true);
      const response = await rewardsAPI.resubmitTask(activityId);
      
      if (response.success) {
        toast({
          title: "Task Resubmitted",
          description: `"${taskTitle}" has been resubmitted and is pending verification again.`,
        });
        // Refresh the page or update state
        window.location.reload();
      } else {
        throw new Error(response.message || "Failed to resubmit task");
      }
    } catch (error) {
      toast({
        title: "Resubmission Failed",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleResubmit}
      disabled={resubmitting}
      size="sm"
      variant="outline"
      className="w-full text-xs h-7 border-red-300 text-red-700 hover:bg-red-100"
    >
      <RotateCcw className="w-3 h-3 mr-1" />
      {resubmitting ? "Resubmitting..." : "Resubmit Task"}
    </Button>
  );
};

export default RewardCard;

