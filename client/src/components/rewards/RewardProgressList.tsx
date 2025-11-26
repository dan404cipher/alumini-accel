import { useState } from "react";
import { RewardTemplate, RewardActivity } from "./types";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle2, Target, Zap, Eye, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardProgressListProps {
  rewards: RewardTemplate[];
  activities?: RewardActivity[];
}

const statusBadgeVariant = (status: RewardActivity["status"]) => {
  switch (status) {
    case "earned":
      return "success";
    case "redeemed":
      return "default";
    case "expired":
      return "secondary";
    default:
      return "outline";
  }
};

export const RewardProgressList: React.FC<RewardProgressListProps> = ({
  rewards,
  activities = [],
}) => {
  const [openTaskDialog, setOpenTaskDialog] = useState<Record<string, boolean>>({});
  
  const activityMap = activities.reduce<Record<string, RewardActivity>>(
    (acc, activity) => {
      acc[activity.reward._id] = activity;
      return acc;
    },
    {}
  );
  
  // Get task-specific activities (if we have taskId in activities)
  const getTaskActivity = (rewardId: string, taskId: string) => {
    return activities.find(
      (act) => act.reward._id === rewardId && act.taskId === taskId
    );
  };

  // Filter to only show rewards that have activities (in progress)
  const rewardsWithProgress = rewards.filter(
    (reward) => activityMap[reward._id]
  );

  return (
    <div className="space-y-4">
      {rewardsWithProgress.map((reward) => {
        const activity = activityMap[reward._id];
        const ratio = activity
          ? Math.min(
              (activity.progressValue / Math.max(activity.progressTarget, 1)) *
                100,
              100
            )
          : 0;

        return (
          <div
            key={reward._id}
            className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  {reward.category || "Reward"}
                </p>
                <h4 className="text-lg font-semibold text-gray-900">
                  {reward.name}
                </h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {reward.rewardType}
                </Badge>
                {reward.points ? (
                  <Badge variant="outline" className="text-xs flex items-center">
                    <Zap className="w-3 h-3 mr-1" />
                    {reward.points} pts
                  </Badge>
                ) : null}
                {activity && (
                  <Badge
                    variant={statusBadgeVariant(activity.status)}
                    className="text-xs"
                  >
                    {activity.status.replace("_", " ")}
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Overall Progress
                </span>
                <span className="font-medium text-gray-700">
                  {activity
                    ? `${activity.progressValue}/${activity.progressTarget}`
                    : "0/1"}
                </span>
              </div>
              <Progress value={ratio} className="h-2 rounded-full" />
              
              {/* Task-level progress */}
              {reward.tasks && reward.tasks.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">
                      Tasks ({reward.tasks.length})
                    </span>
                    <Dialog
                      open={openTaskDialog[reward._id] || false}
                      onOpenChange={(open) =>
                        setOpenTaskDialog((prev) => ({
                          ...prev,
                          [reward._id]: open,
                        }))
                      }
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-7 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View Tasks
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{reward.name} - Tasks</DialogTitle>
                          <DialogDescription>
                            Detailed progress for each task
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 mt-4">
                          {reward.tasks.map((task, taskIndex) => {
                            const taskActivity = getTaskActivity(reward._id, task._id) || activity;
                            const taskProgress = taskActivity
                              ? Math.min(
                                  (taskActivity.progressValue /
                                    Math.max(taskActivity.progressTarget, 1)) *
                                    100,
                                  100
                                )
                              : 0;
                            const isTaskComplete =
                              taskActivity &&
                              taskActivity.progressValue >= taskActivity.progressTarget;

                            return (
                              <div
                                key={task._id || taskIndex}
                                className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50/50"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Target className="w-4 h-4 text-blue-600" />
                                      <h4 className="font-semibold text-gray-900">
                                        {task.title}
                                      </h4>
                                      {isTaskComplete && (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      )}
                                      {task.isAutomated && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs text-blue-600 border-blue-200"
                                        >
                                          <Sparkles className="w-3 h-3 mr-1" />
                                          Auto-tracked
                                        </Badge>
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
                                        <Badge variant="outline" className="text-green-600">
                                          {task.points} pts
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {taskActivity && (
                                  <div className="space-y-2 pt-2 border-t border-gray-200">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                      <span>Progress</span>
                                      <span className="font-medium text-gray-700">
                                        {taskActivity.progressValue}/
                                        {taskActivity.progressTarget}
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
                                  </div>
                                )}
                                {!taskActivity && (
                                  <div className="pt-2 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">
                                      Not started yet
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  <div className="space-y-2">
                    {reward.tasks.slice(0, 3).map((task, taskIndex) => {
                      const taskActivity = getTaskActivity(reward._id, task._id) || activity;
                      const taskProgress = taskActivity
                        ? Math.min(
                            (taskActivity.progressValue /
                              Math.max(taskActivity.progressTarget, 1)) *
                              100,
                            100
                          )
                        : 0;
                      const isComplete =
                        taskActivity &&
                        taskActivity.progressValue >= taskActivity.progressTarget;

                      return (
                        <div
                          key={task._id || taskIndex}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {isComplete ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <Target className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            )}
                            <span className="text-xs font-medium text-gray-700 truncate">
                              {task.title}
                            </span>
                            {task.isAutomated && (
                              <Sparkles className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {task.points && (
                              <Badge variant="outline" className="text-xs">
                                {task.points} pts
                              </Badge>
                            )}
                            {taskActivity && (
                              <span className="text-xs text-gray-500">
                                {taskActivity.progressValue}/
                                {taskActivity.progressTarget}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {reward.tasks.length > 3 && (
                      <p className="text-xs text-gray-500 text-center">
                        +{reward.tasks.length - 3} more tasks
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {rewards.length === 0 && (
        <div className="text-center py-12 border border-dashed rounded-3xl">
          <Target className="w-10 h-10 mx-auto text-gray-400" />
          <p className="text-gray-600 mt-3">No rewards in progress</p>
          <p className="text-sm text-gray-500 mt-1">
            Start earning rewards from the catalog!
          </p>
        </div>
      )}
    </div>
  );
};

export default RewardProgressList;

