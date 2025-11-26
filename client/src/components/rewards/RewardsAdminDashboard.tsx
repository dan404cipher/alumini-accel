import { useCallback, useEffect, useRef, useState } from "react";
import {
  RewardTemplate,
  RewardTask,
  Badge as BadgeType,
  BadgeSummary,
} from "./types";
import {
  API_BASE_URL,
  getImageUrl,
  rewardsAPI,
  type ApiResponse,
} from "@/lib/api";
import { getAuthTokenOrNull } from "@/utils/auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import SimpleImageUpload from "@/components/SimpleImageUpload";
import { Plus, Save, Trash2 } from "lucide-react";

const defaultReward: Partial<RewardTemplate> = {
  name: "",
  description: "",
  category: "engagement",
  rewardType: "points",
  points: 50,
  tags: [],
  tasks: [],
  badge: undefined,
  isFeatured: false,
  isActive: true,
};

const NO_BADGE_VALUE = "__none__";
const BADGE_CATEGORIES = [
  "mentorship",
  "donation",
  "event",
  "job",
  "engagement",
  "achievement",
  "special",
];

interface NewBadgeFormState {
  name: string;
  description: string;
  category: string;
  color: string;
  points: number;
  isRare: boolean;
  icon: string;
}

const initialBadgeForm: NewBadgeFormState = {
  name: "",
  description: "",
  category: BADGE_CATEGORIES[0],
  color: "#F97316",
  points: 0,
  isRare: false,
  icon: "",
};

export const RewardsAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [rewards, setRewards] = useState<RewardTemplate[]>([]);
  const [editingReward, setEditingReward] =
    useState<Partial<RewardTemplate>>(defaultReward);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("catalog");
  const [availableBadges, setAvailableBadges] = useState<BadgeType[]>([]);
  const [isBadgeDialogOpen, setIsBadgeDialogOpen] = useState(false);
  const [newBadge, setNewBadge] = useState<NewBadgeFormState>(initialBadgeForm);
  const [badgeImageUploading, setBadgeImageUploading] = useState(false);
  const [creatingBadge, setCreatingBadge] = useState(false);
  type AdminRewardsResponse = { rewards: RewardTemplate[] };
  type AdminBadgesResponse = { badges: BadgeType[] };
  type CreateBadgeResponse = { badge: BadgeType };
  type TaskMetadata = { requiresVerification?: boolean };

  const fetchRewards = useCallback(async () => {
    try {
      const response = (await rewardsAPI.getRewards({
        scope: "admin",
      })) as ApiResponse<AdminRewardsResponse>;
      if (response.success && response.data?.rewards) {
        setRewards(response.data.rewards);
      }
    } catch (error) {
      toast({
        title: "Unable to load rewards",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchBadges = useCallback(async () => {
    try {
      const response =
        (await rewardsAPI.getBadges()) as ApiResponse<AdminBadgesResponse>;
      if (response.success && response.data?.badges) {
        setAvailableBadges(response.data.badges);
      } else {
        setAvailableBadges([]);
      }
    } catch (error) {
      console.error("Error fetching badges:", error);
      setAvailableBadges([]);
    }
  }, []);

  useEffect(() => {
    fetchRewards();
    fetchBadges();
  }, [fetchBadges, fetchRewards]);

  const badgeImageResetRef = useRef(false);

  const getBadgeId = (badge?: BadgeSummary | string | null) => {
    if (!badge) return NO_BADGE_VALUE;
    if (typeof badge === "string") return badge;
    return badge._id || NO_BADGE_VALUE;
  };

  const buildBadgeSummary = (
    badge?: BadgeType | BadgeSummary | string | null,
    fallbackId?: string
  ): BadgeSummary | undefined => {
    if (!badge) {
      if (fallbackId) {
        return { _id: fallbackId, name: "Badge" };
      }
      return undefined;
    }

    if (typeof badge === "string") {
      return { _id: badge, name: "Badge" };
    }

    const id = badge._id ? String(badge._id) : fallbackId || "";

    return {
      _id: id,
      name: badge.name || "Badge",
      icon: badge.icon,
      color: badge.color,
    };
  };

  const handleRewardBadgeSelect = (badgeId: string) => {
    if (!badgeId || badgeId === NO_BADGE_VALUE) {
      handleRewardChange("badge", undefined);
      return;
    }
    const selected = availableBadges.find((badge) => badge._id === badgeId);
    const summary = buildBadgeSummary(selected, badgeId);
    handleRewardChange("badge", summary);
  };

  const handleTaskBadgeSelect = (index: number, badgeId: string) => {
    if (!badgeId || badgeId === NO_BADGE_VALUE) {
      handleTaskChange(index, { badge: undefined });
      return;
    }
    const selected = availableBadges.find((badge) => badge._id === badgeId);
    const summary = buildBadgeSummary(selected, badgeId);
    handleTaskChange(index, { badge: summary });
  };

  const handleNewBadgeFieldChange = <K extends keyof NewBadgeFormState>(
    field: K,
    value: NewBadgeFormState[K]
  ) => {
    setNewBadge((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetBadgeForm = () => {
    setNewBadge(initialBadgeForm);
    badgeImageResetRef.current = false;
  };

  const handleBadgeDialogChange = (open: boolean) => {
    setIsBadgeDialogOpen(open);
    if (!open) {
      resetBadgeForm();
    }
  };

  const handleBadgeImageChange = (file: File | null) => {
    if (!file) {
      if (badgeImageResetRef.current) {
        badgeImageResetRef.current = false;
        return;
      }
      setNewBadge((prev) => ({ ...prev, icon: "" }));
    }
  };

  const handleBadgeImageUpload = async (file: File) => {
    const token = getAuthTokenOrNull();
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please sign in again to upload a badge image.",
        variant: "destructive",
      });
      throw new Error("Not authenticated");
    }
    setBadgeImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "badge");

      const response = await fetch(`${API_BASE_URL}/upload/image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const result = await response.json();
      const uploadedUrl = result?.data?.url || result?.data?.imageUrl;
      if (!result?.success || !uploadedUrl) {
        throw new Error(result?.message || "Failed to upload badge image");
      }
      setNewBadge((prev) => ({ ...prev, icon: uploadedUrl }));
      badgeImageResetRef.current = true;
      toast({
        title: "Image uploaded",
        description: "Badge image is ready to use.",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Unable to upload image.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setBadgeImageUploading(false);
    }
  };

  const handleCreateBadge = async () => {
    if (!newBadge.name.trim() || !newBadge.description.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and description.",
        variant: "destructive",
      });
      return;
    }

    if (!newBadge.icon) {
      toast({
        title: "Badge image required",
        description: "Please upload an image for the badge.",
        variant: "destructive",
      });
      return;
    }

    setCreatingBadge(true);
    try {
      const response = (await rewardsAPI.createBadge({
        name: newBadge.name.trim(),
        description: newBadge.description.trim(),
        category: newBadge.category,
        icon: newBadge.icon,
        color: newBadge.color,
        points: newBadge.points,
        isRare: newBadge.isRare,
        criteria: {
          type: "manual",
          value: 0,
          description: newBadge.description.trim(),
        },
      })) as ApiResponse<CreateBadgeResponse>;

      if (!response.success || !response.data?.badge) {
        throw new Error(response.message || "Failed to create badge");
      }

      toast({
        title: "Badge created",
        description: `"${response.data.badge.name}" is now available.`,
      });

      await fetchBadges();
      const createdBadge = response.data.badge as BadgeType;

      handleRewardBadgeSelect(createdBadge._id);
      resetBadgeForm();
      setIsBadgeDialogOpen(false);
    } catch (error) {
      toast({
        title: "Unable to create badge",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCreatingBadge(false);
    }
  };

  const handleRewardChange = (
    field: keyof RewardTemplate,
    value: string | number | boolean | string[] | object | null
  ) => {
    setEditingReward((prev) => {
      if (field === "rewardType") {
        const typedValue = value as RewardTemplate["rewardType"];
        return {
          ...prev,
          rewardType: typedValue,
          ...(typedValue !== "badge" ? { badge: undefined } : {}),
        };
      }

      if (field === "badge") {
        return {
          ...prev,
          badge: value as BadgeSummary | undefined,
        };
      }

      return {
        ...prev,
        [field]: value as never,
      };
    });
  };

  const handleTaskChange = (
    index: number,
    updatedTask: Partial<RewardTask>
  ) => {
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
    resetBadgeForm();
  };

  const isValidObjectIdString = (value: string | undefined | null) => {
    if (!value) return false;
    return /^[0-9a-fA-F]{24}$/.test(value.trim());
  };

  const extractBadgeId = (badge?: BadgeSummary | string | null) => {
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
    if (editingReward.rewardType === "badge" && !editingReward.badge) {
      errors.push("Please select or create a badge for this reward.");
    }

    if (
      editingReward.badge &&
      !isValidObjectIdString(extractBadgeId(editingReward.badge))
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
          errors.push(
            `Task ${index + 1}: target value must be greater than 0.`
          );
        }
        if (task.points !== undefined && task.points < 0) {
          errors.push(`Task ${index + 1}: points cannot be negative.`);
        }
        const badgeId = extractBadgeId(task.badge);
        if (badgeId && !isValidObjectIdString(badgeId)) {
          errors.push(
            `Task ${
              index + 1
            }: badge ID must be a 24-character MongoDB ObjectId.`
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
      const normalizeBadgeId = (badge?: BadgeSummary | string | null) => {
        const badgeId = extractBadgeId(badge);
        if (!badgeId) return undefined;
        return isValidObjectIdString(badgeId) ? badgeId : undefined;
      };

      const rewardPayload: Record<string, unknown> = {
        ...editingReward,
        badge: normalizeBadgeId(editingReward.badge),
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
    const normalizedTasks =
      reward.tasks?.map((task) => ({
        ...task,
        badge: buildBadgeSummary(task.badge),
      })) || [];

    setEditingReward({
      ...reward,
      badge: buildBadgeSummary(reward.badge),
      tasks: normalizedTasks,
    });
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
    <>
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
                    <p className="text-sm text-gray-600">
                      {reward.description}
                    </p>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(reward)}
                    >
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
                    <option value="badge">Badge</option>
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

              {editingReward.rewardType === "badge" && (
                <Card className="border-dashed border-2">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">
                      Reward Badge Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end">
                      <div className="flex-1 space-y-2">
                        <Label>Select Existing Badge</Label>
                        {availableBadges.length > 0 ? (
                          <Select
                            value={getBadgeId(editingReward.badge)}
                            onValueChange={(value) =>
                              handleRewardBadgeSelect(value)
                            }
                          >
                            <SelectTrigger className="w-full border rounded-xl px-3 py-2">
                              <SelectValue placeholder="Choose a badge" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NO_BADGE_VALUE}>
                                No badge
                              </SelectItem>
                              {availableBadges.map((badge) => (
                                <SelectItem key={badge._id} value={badge._id}>
                                  {badge.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm text-gray-500">
                            No badges available yet. Create a new badge to
                            attach it to this reward.
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsBadgeDialogOpen(true)}
                      >
                        + Add Badge
                      </Button>
                    </div>

                    {editingReward.badge && (
                      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden"
                          style={{
                            backgroundColor:
                              editingReward.badge.color || "#e5e7eb",
                          }}
                        >
                          {editingReward.badge.icon &&
                          (editingReward.badge.icon.startsWith("http") ||
                            editingReward.badge.icon.startsWith("/")) ? (
                            <img
                              src={getImageUrl(editingReward.badge.icon)}
                              alt={editingReward.badge.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xl">
                              {editingReward.badge.icon || "🏅"}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {editingReward.badge.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            This badge will be awarded when the reward is
                            completed.
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Schedule Section */}
              <div className="border-t pt-5 space-y-4">
                <Label className="text-base font-semibold">
                  Schedule (Optional)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Starts At</Label>
                    <Input
                      type="datetime-local"
                      value={
                        editingReward.startsAt
                          ? new Date(editingReward.startsAt)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleRewardChange(
                            "startsAt",
                            new Date(e.target.value).toISOString()
                          );
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
                          ? new Date(editingReward.endsAt)
                              .toISOString()
                              .slice(0, 16)
                          : ""
                      }
                      onChange={(e) => {
                        if (e.target.value) {
                          handleRewardChange(
                            "endsAt",
                            new Date(e.target.value).toISOString()
                          );
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
                                metric: event.target.value as
                                  | "count"
                                  | "amount"
                                  | "duration",
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
                          {availableBadges.length > 0 ? (
                            <Select
                              value={getBadgeId(task.badge)}
                              onValueChange={(value) =>
                                handleTaskBadgeSelect(index, value)
                              }
                            >
                              <SelectTrigger className="w-full border rounded-xl px-3 py-2">
                                <SelectValue placeholder="Select badge to award" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_BADGE_VALUE}>
                                  No badge
                                </SelectItem>
                                {availableBadges.map((badge) => (
                                  <SelectItem key={badge._id} value={badge._id}>
                                    {badge.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <p className="text-sm text-gray-500">
                              No badges available yet.
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Award this badge when the task is completed.
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
                            <Label className="text-sm">
                              Automatic Detection
                            </Label>
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
                            <Label className="text-sm">
                              Requires Verification
                            </Label>
                            <p className="text-xs text-gray-500">
                              Staff must approve completion
                            </p>
                          </div>
                          <Switch
                            checked={Boolean(
                              (task.metadata as TaskMetadata | undefined)
                                ?.requiresVerification
                            )}
                            onCheckedChange={(checked) =>
                              handleTaskChange(index, {
                                metadata: {
                                  ...((task.metadata as
                                    | TaskMetadata
                                    | undefined) ?? {}),
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

      <Dialog open={isBadgeDialogOpen} onOpenChange={handleBadgeDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create a new badge</DialogTitle>
            <DialogDescription>
              Upload a badge image and define its details. Once saved, it will
              be available to all rewards.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={newBadge.name}
                  onChange={(event) =>
                    handleNewBadgeFieldChange("name", event.target.value)
                  }
                  placeholder="e.g., Community Star"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={newBadge.category}
                  onValueChange={(value) =>
                    handleNewBadgeFieldChange("category", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newBadge.description}
                onChange={(event) =>
                  handleNewBadgeFieldChange("description", event.target.value)
                }
                rows={3}
                placeholder="Explain how this badge is earned"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Primary Color</Label>
                <Input
                  type="color"
                  value={newBadge.color}
                  onChange={(event) =>
                    handleNewBadgeFieldChange("color", event.target.value)
                  }
                  className="h-12 w-full"
                />
              </div>
              <div>
                <Label>Bonus Points (optional)</Label>
                <Input
                  type="number"
                  min={0}
                  value={newBadge.points}
                  onChange={(event) =>
                    handleNewBadgeFieldChange(
                      "points",
                      Number(event.target.value)
                    )
                  }
                />
              </div>
            </div>
            <div className="flex items-center justify-between border rounded-2xl px-3 py-2">
              <div>
                <Label className="text-sm">Mark as rare</Label>
                <p className="text-xs text-gray-500">
                  Rare badges can be limited to special achievements.
                </p>
              </div>
              <Switch
                checked={newBadge.isRare}
                onCheckedChange={(checked) =>
                  handleNewBadgeFieldChange("isRare", checked)
                }
              />
            </div>
            <div>
              <Label>Badge Image</Label>
              <SimpleImageUpload
                currentImage={
                  newBadge.icon ? getImageUrl(newBadge.icon) : undefined
                }
                onImageChange={handleBadgeImageChange}
                onImageUpload={handleBadgeImageUpload}
                isLoading={badgeImageUploading}
                maxSize={5}
              />
              <p className="text-xs text-gray-500 mt-2">
                Use a square PNG, JPG, or WebP image. Recommended size: 512x512.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleBadgeDialogChange(false)}
              disabled={creatingBadge}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateBadge} disabled={creatingBadge}>
              {creatingBadge ? "Saving..." : "Save Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RewardsAdminDashboard;
