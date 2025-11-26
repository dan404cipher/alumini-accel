import { useEffect, useState } from "react";
import { RewardTemplate, RewardTask } from "./types";
import { rewardsAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, Trash2 } from "lucide-react";

const defaultReward: Partial<RewardTemplate> = {
  name: "",
  description: "",
  category: "engagement",
  rewardType: "points",
  points: 50,
  tags: [],
  tasks: [],
  isFeatured: false,
  isActive: true,
};

export const RewardsAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<RewardTemplate[]>([]);
  const [editingReward, setEditingReward] =
    useState<Partial<RewardTemplate>>(defaultReward);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("catalog");
  const [badges, setBadges] = useState<Array<{ _id: string; name: string; icon?: string; color?: string }>>([]);

  const fetchRewards = async () => {
    try {
      const response = await rewardsAPI.getRewards({ scope: "admin" });
      if (response.success && response.data?.rewards) {
        setRewards(response.data.rewards as RewardTemplate[]);
      }
    } catch (error) {
      toast({
        title: "Unable to load rewards",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRewards();
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      // Fetch badges from the API - we'll use a simple approach
      // Since there's no dedicated list endpoint, we can fetch from the Badge model
      // For now, we'll make this optional and allow manual badge ID entry
      // Or we can create a simple endpoint later
    } catch (error) {
      console.error("Error fetching badges:", error);
    }
  };

  const handleRewardChange = (
    field: keyof RewardTemplate,
    value: string | number | boolean | string[] | object | null
  ) => {
    setEditingReward((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTaskChange = (index: number, updatedTask: Partial<RewardTask>) => {
    setEditingReward((prev) => {
      const tasks = prev.tasks ? [...prev.tasks] : [];
      tasks[index] = {
        ...(tasks[index] || {}),
        ...updatedTask,
      } as RewardTask;
      return { ...prev, tasks };
    });
  };

  const addTask = () => {
    setEditingReward((prev) => ({
      ...prev,
      tasks: [
        ...(prev.tasks || []),
        {
          _id: crypto.randomUUID(),
          title: "New task",
          description: "",
          actionType: "custom",
          metric: "count",
          targetValue: 1,
          points: 0,
          isAutomated: true,
        },
      ],
    }));
  };

  const removeTask = (index: number) => {
    setEditingReward((prev) => ({
      ...prev,
      tasks: (prev.tasks || []).filter((_, taskIndex) => taskIndex !== index),
    }));
  };

  const resetForm = () => {
    setEditingReward(defaultReward);
  };

  const isValidObjectIdString = (value: string | undefined | null) => {
    if (!value) return false;
    return /^[0-9a-fA-F]{24}$/.test(value.trim());
  };

  const extractBadgeId = (badge?: { _id?: string } | string) => {
    if (!badge) return undefined;
    if (typeof badge === "string") return badge.trim();
    return badge._id?.toString();
  };

  const validateReward = (): string | null => {
    const errors: string[] = [];

    if (!editingReward.name?.trim()) {
      errors.push("Reward name is required.");
    }
    if (!editingReward.category?.trim()) {
      errors.push("Reward category is required.");
    }
    if (!editingReward.rewardType) {
      errors.push("Reward type is required.");
    }
    if (
      editingReward.rewardType === "points" &&
      (!editingReward.points || editingReward.points <= 0)
    ) {
      errors.push("Points must be greater than 0 for point-based rewards.");
    }

    if (
      editingReward.badge &&
      !isValidObjectIdString(extractBadgeId(editingReward.badge as any))
    ) {
      errors.push("Reward badge must be a valid MongoDB ObjectId.");
    }

    if (!editingReward.tasks || editingReward.tasks.length === 0) {
      errors.push("At least one task is required.");
    } else {
      editingReward.tasks.forEach((task, index) => {
        if (!task.title?.trim()) {
          errors.push(`Task ${index + 1}: title is required.`);
        }
        if (!task.actionType) {
          errors.push(`Task ${index + 1}: action type is required.`);
        }
        if (!task.metric) {
          errors.push(`Task ${index + 1}: metric is required.`);
        }
        if (!task.targetValue || task.targetValue <= 0) {
          errors.push(`Task ${index + 1}: target value must be greater than 0.`);
        }
        if (task.points !== undefined && task.points < 0) {
          errors.push(`Task ${index + 1}: points cannot be negative.`);
        }
        const badgeId = extractBadgeId(task.badge as any);
        if (badgeId && !isValidObjectIdString(badgeId)) {
          errors.push(
            `Task ${index + 1}: badge ID must be a 24-character MongoDB ObjectId.`
          );
        }
      });
    }

    return errors.length ? errors.join("\n") : null;
  };

  const handleSave = async () => {
    if (!editingReward.name) {
      toast({
        title: "Name required",
        description: "Please provide a name for the reward.",
        variant: "destructive",
      });
      return;
    }

    const validationError = validateReward();
    if (validationError) {
      toast({
        title: "Invalid reward configuration",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const normalizeBadgeId = (badge?: { _id?: string } | string) => {
        const badgeId = extractBadgeId(badge);
        if (!badgeId) return undefined;
        return isValidObjectIdString(badgeId) ? badgeId : undefined;
      };

      const rewardPayload: any = {
        ...editingReward,
        badge: normalizeBadgeId((editingReward as any)?.badge),
        tasks: (editingReward.tasks || []).map((task) => ({
          ...task,
          badge: normalizeBadgeId(task.badge),
        })),
      };

      if (editingReward._id) {
        await rewardsAPI.updateReward(editingReward._id, rewardPayload);
      } else {
        await rewardsAPI.createReward(rewardPayload);
      }

      toast({
        title: "Reward saved",
        description: "The reward configuration has been updated.",
      });
      resetForm();
      fetchRewards();
    } catch (error) {
      toast({
        title: "Unable to save reward",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (reward: RewardTemplate) => {
    setEditingReward(reward);
    setActiveTab("builder");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (rewardId: string) => {
    try {
      await rewardsAPI.deleteReward(rewardId);
      toast({
        title: "Reward deleted",
        description: "The reward has been removed.",
      });
      fetchRewards();
    } catch (error) {
      toast({
        title: "Unable to delete reward",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Tabs
      defaultValue="catalog"
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-6"
    >
      <TabsList className="w-full justify-start rounded-2xl bg-gray-100/70 overflow-x-auto">
        <TabsTrigger value="catalog">Reward Catalogue</TabsTrigger>
        <TabsTrigger value="builder">Create / Edit Reward</TabsTrigger>
      </TabsList>

      <TabsContent value="catalog" className="space-y-4">
        <div className="flex justify-end">
          <Button onClick={() => setActiveTab("builder")}>
            <Plus className="w-4 h-4 mr-2" />
            New Reward
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {rewards.map((reward) => (
            <Card key={reward._id} className="border-gray-100 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <p className="text-sm text-gray-500">{reward.category}</p>
                </div>
                <Badge variant={reward.isActive ? "success" : "secondary"}>
                  {reward.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                {reward.description && (
                  <p className="text-sm text-gray-600">{reward.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  <Badge variant="outline">{reward.rewardType}</Badge>
                  {reward.points ? (
                    <Badge variant="outline">{reward.points} pts</Badge>
                  ) : null}
                  {reward.voucherTemplate?.partner && (
                    <Badge variant="outline">
                      {reward.voucherTemplate.partner}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(reward)}>
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(reward._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {rewards.length === 0 && (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center text-gray-500">
                No rewards configured yet. Create your first reward from the
                builder tab.
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="builder">
        <Card className="shadow-lg border-gray-100">
          <CardHeader>
            <CardTitle>
              {editingReward._id ? "Edit Reward" : "Create Reward"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="reward-name">Name</Label>
                <Input
                  id="reward-name"
                  value={editingReward.name || ""}
                  onChange={(event) =>
                    handleRewardChange("name", event.target.value)
                  }
                  placeholder="e.g. Community Champion"
                />
              </div>
              <div>
                <Label htmlFor="reward-category">Category</Label>
                <Input
                  id="reward-category"
                  value={editingReward.category || ""}
                  onChange={(event) =>
                    handleRewardChange("category", event.target.value)
                  }
                  placeholder="engagement · mentorship · donation"
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={editingReward.description || ""}
                onChange={(event) =>
                  handleRewardChange("description", event.target.value)
                }
                rows={3}
                placeholder="Explain what alumni must accomplish to earn this reward."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Reward Type</Label>
                <select
                  className="w-full border rounded-xl px-3 py-2"
                  value={editingReward.rewardType}
                  onChange={(event) =>
                    handleRewardChange(
                      "rewardType",
                      event.target.value as RewardTemplate["rewardType"]
                    )
                  }
                >
                  <option value="points">Points</option>
                  <option value="voucher">Voucher</option>
                  <option value="badge">Badge</option>
                  <option value="perk">Perk</option>
                </select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min={0}
                  value={editingReward.points || 0}
                  onChange={(event) =>
                    handleRewardChange("points", Number(event.target.value))
                  }
                />
              </div>
              <div className="flex items-center justify-between border rounded-2xl px-3 py-2">
                <div>
                  <Label className="text-sm">Featured</Label>
                  <p className="text-xs text-gray-500">
                    Highlight reward in the catalog.
                  </p>
                </div>
                <Switch
                  checked={editingReward.isFeatured || false}
                  onCheckedChange={(checked) =>
                    handleRewardChange("isFeatured", checked)
                  }
                />
              </div>
            </div>

            {/* Schedule Section */}
            <div className="border-t pt-5 space-y-4">
              <Label className="text-base font-semibold">Schedule (Optional)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Starts At</Label>
                  <Input
                    type="datetime-local"
                    value={
                      editingReward.startsAt
                        ? new Date(editingReward.startsAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        handleRewardChange("startsAt", new Date(e.target.value).toISOString());
                      } else {
                        handleRewardChange("startsAt", undefined);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When reward becomes available
                  </p>
                </div>
                <div>
                  <Label>Ends At</Label>
                  <Input
                    type="datetime-local"
                    value={
                      editingReward.endsAt
                        ? new Date(editingReward.endsAt).toISOString().slice(0, 16)
                        : ""
                    }
                    onChange={(e) => {
                      if (e.target.value) {
                        handleRewardChange("endsAt", new Date(e.target.value).toISOString());
                      } else {
                        handleRewardChange("endsAt", undefined);
                      }
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    When reward expires
                  </p>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="border-t pt-5">
              <div className="flex items-center justify-between border rounded-2xl px-3 py-2">
                <div>
                  <Label className="text-sm">Active</Label>
                  <p className="text-xs text-gray-500">
                    Make reward available to users
                  </p>
                </div>
                <Switch
                  checked={editingReward.isActive !== false}
                  onCheckedChange={(checked) =>
                    handleRewardChange("isActive", checked)
                  }
                />
              </div>
            </div>

            {/* Tasks Section */}
            <div className="border-t pt-5 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Tasks</Label>
                <Button variant="outline" size="sm" onClick={addTask}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Task
                </Button>
              </div>

              <div className="space-y-4">
                {(editingReward.tasks || []).map((task, index) => (
                  <div
                    key={task._id || index}
                    className="border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex flex-col md:flex-row gap-3">
                      <div className="flex-1">
                        <Label>Task Title</Label>
                        <Input
                          value={task.title}
                          onChange={(event) =>
                            handleTaskChange(index, {
                              title: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex-1">
                        <Label>Action Type</Label>
                        <select
                          className="w-full border rounded-xl px-3 py-2"
                          value={task.actionType}
                          onChange={(event) =>
                            handleTaskChange(index, {
                              actionType: event.target.value,
                            })
                          }
                        >
                          <option value="event">Event</option>
                          <option value="donation">Donation</option>
                          <option value="mentorship">Mentorship</option>
                          <option value="job">Job</option>
                          <option value="referral">Referral</option>
                          <option value="engagement">Engagement</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label>Metric</Label>
                        <select
                          className="w-full border rounded-xl px-3 py-2"
                          value={task.metric || "count"}
                          onChange={(event) =>
                            handleTaskChange(index, {
                              metric: event.target.value as "count" | "amount" | "duration",
                            })
                          }
                        >
                          <option value="count">Count</option>
                          <option value="amount">Amount</option>
                          <option value="duration">Duration</option>
                        </select>
                      </div>
                      <div className="flex-1">
                        <Label>Target Value</Label>
                        <Input
                          type="number"
                          min={1}
                          value={task.targetValue}
                          onChange={(event) =>
                            handleTaskChange(index, {
                              targetValue: Number(event.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Points</Label>
                        <Input
                          type="number"
                          min={0}
                          value={task.points || 0}
                          onChange={(event) =>
                            handleTaskChange(index, {
                              points: Number(event.target.value),
                            })
                          }
                          placeholder="Points for this task"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Points awarded when task is completed
                        </p>
                      </div>
                      <div>
                        <Label>Badge (Optional)</Label>
                        <Input
                          value={task.badge?._id || ""}
                          onChange={(event) => {
                            const badgeId = event.target.value.trim();
                            if (badgeId) {
                              handleTaskChange(index, {
                                badge: {
                                  _id: badgeId,
                                  name: "Badge",
                                },
                              });
                            } else {
                              handleTaskChange(index, {
                                badge: undefined,
                              });
                            }
                          }}
                          placeholder="Badge ID (optional)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Enter badge ID to link a badge to this task
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={task.description || ""}
                        onChange={(event) =>
                          handleTaskChange(index, {
                            description: event.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center justify-between border rounded-xl px-3 py-2">
                        <div>
                          <Label className="text-sm">Automatic Detection</Label>
                          <p className="text-xs text-gray-500">
                            Progress updates automatically
                          </p>
                        </div>
                        <Switch
                          checked={task.isAutomated}
                          onCheckedChange={(checked) =>
                            handleTaskChange(index, { isAutomated: checked })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between border rounded-xl px-3 py-2">
                        <div>
                          <Label className="text-sm">Requires Verification</Label>
                          <p className="text-xs text-gray-500">
                            Staff must approve completion
                          </p>
                        </div>
                        <Switch
                          checked={
                            (task.metadata as any)?.requiresVerification === true
                          }
                          onCheckedChange={(checked) =>
                            handleTaskChange(index, {
                              metadata: {
                                ...(task.metadata || {}),
                                requiresVerification: checked,
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove Task
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={resetForm}
                disabled={saving}
                type="button"
              >
                Reset
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-2" />
                {editingReward._id ? "Update Reward" : "Create Reward"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default RewardsAdminDashboard;

