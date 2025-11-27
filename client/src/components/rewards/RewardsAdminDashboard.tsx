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
import { Plus, Save, Trash2, Edit, Award } from "lucide-react";
import { RewardsAnalytics } from "./RewardsAnalytics";
import { RewardsReport } from "./RewardsReport";
import Pagination from "@/components/ui/pagination";

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
  isActive: boolean;
  icon: string;
}

const initialBadgeForm: NewBadgeFormState = {
  name: "",
  description: "",
  category: BADGE_CATEGORIES[0],
  color: "#F97316",
  points: 0,
  isRare: false,
  isActive: true,
  icon: "",
};

// Get available metrics based on action type
const getAvailableMetrics = (
  actionType: string
): Array<{ value: string; label: string }> => {
  switch (actionType) {
    case "event":
      // Events are counted (number of events attended)
      return [{ value: "count", label: "Count" }];

    case "donation":
      // Donations can be counted (number of donations) or by amount (total dollars)
      return [
        { value: "count", label: "Count" },
        { value: "amount", label: "Amount" },
      ];

    case "mentorship":
      // Mentorship can be counted (sessions) or by duration (hours)
      return [
        { value: "count", label: "Count" },
        { value: "duration", label: "Duration" },
      ];

    case "job":
      // Jobs are counted (number of jobs posted)
      return [{ value: "count", label: "Count" }];

    case "engagement":
      // Engagement activities are counted (posts, comments, etc.)
      return [{ value: "count", label: "Count" }];

    case "custom":
      // Custom can use any metric
      return [
        { value: "count", label: "Count" },
        { value: "amount", label: "Amount" },
        { value: "duration", label: "Duration" },
      ];

    default:
      return [
        { value: "count", label: "Count" },
        { value: "amount", label: "Amount" },
        { value: "duration", label: "Duration" },
      ];
  }
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
  const [editingBadgeId, setEditingBadgeId] = useState<string | null>(null);
  const [newBadge, setNewBadge] = useState<NewBadgeFormState>(initialBadgeForm);
  const [badgeImageUploading, setBadgeImageUploading] = useState(false);
  const [creatingBadge, setCreatingBadge] = useState(false);
  const [deletingBadgeId, setDeletingBadgeId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);
  type AdminRewardsResponse = {
    rewards: RewardTemplate[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
  type AdminBadgesResponse = { badges: BadgeType[] };
  type CreateBadgeResponse = { badge: BadgeType };
  type TaskMetadata = { requiresVerification?: boolean };

  const fetchRewards = useCallback(async () => {
    try {
      const response = (await rewardsAPI.getRewards({
        scope: "admin",
        page: currentPage,
        limit: pageSize,
      })) as ApiResponse<AdminRewardsResponse>;
      if (response.success && response.data) {
        setRewards(response.data.rewards || []);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        } else {
          // Fallback: create pagination from rewards array if API doesn't return it
          const total = response.data.rewards?.length || 0;
          setPagination({
            page: currentPage,
            limit: pageSize,
            total,
            totalPages: Math.ceil(total / pageSize),
            hasNextPage: currentPage < Math.ceil(total / pageSize),
            hasPrevPage: currentPage > 1,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Unable to load rewards",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  }, [toast, currentPage, pageSize]);

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
  }, [fetchRewards]);

  useEffect(() => {
    fetchBadges();
  }, [fetchBadges]);

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
      setEditingBadgeId(null);
    }
  };

  const handleEditBadge = (badge: BadgeType) => {
    setEditingBadgeId(badge._id);
    setNewBadge({
      name: badge.name,
      description: badge.description,
      category: badge.category,
      color: badge.color || "#F97316",
      points: badge.points || 0,
      isRare: badge.isRare || false,
      isActive: badge.isActive !== false,
      icon: badge.icon || "",
    });
    setIsBadgeDialogOpen(true);
  };

  const handleDeleteBadge = async (badgeId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this badge? This action cannot be undone."
      )
    ) {
      return;
    }

    setDeletingBadgeId(badgeId);
    try {
      const response = await rewardsAPI.deleteBadge(badgeId);
      if (response.success) {
        toast({
          title: "Badge deleted",
          description: "The badge has been removed.",
        });
        await fetchBadges();
      } else {
        throw new Error(response.message || "Failed to delete badge");
      }
    } catch (error) {
      toast({
        title: "Unable to delete badge",
        description:
          error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setDeletingBadgeId(null);
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
      let response: ApiResponse<CreateBadgeResponse>;

      if (editingBadgeId) {
        // Update existing badge
        response = (await rewardsAPI.updateBadge(editingBadgeId, {
          name: newBadge.name.trim(),
          description: newBadge.description.trim(),
          category: newBadge.category,
          icon: newBadge.icon,
          color: newBadge.color,
          points: newBadge.points,
          isRare: newBadge.isRare,
          isActive: newBadge.isActive,
          criteria: {
            type: "manual",
            value: 0,
            description: newBadge.description.trim(),
          },
        })) as ApiResponse<CreateBadgeResponse>;

        if (!response.success || !response.data?.badge) {
          throw new Error(response.message || "Failed to update badge");
        }

        toast({
          title: "Badge updated",
          description: `"${response.data.badge.name}" has been updated.`,
        });
      } else {
        // Create new badge
        response = (await rewardsAPI.createBadge({
          name: newBadge.name.trim(),
          description: newBadge.description.trim(),
          category: newBadge.category,
          icon: newBadge.icon,
          color: newBadge.color,
          points: newBadge.points,
          isRare: newBadge.isRare,
          isActive: newBadge.isActive,
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

        const createdBadge = response.data.badge as BadgeType;
        handleRewardBadgeSelect(createdBadge._id);
      }

      await fetchBadges();
      resetBadgeForm();
      setEditingBadgeId(null);
      setIsBadgeDialogOpen(false);
    } catch (error) {
      toast({
        title: editingBadgeId
          ? "Unable to update badge"
          : "Unable to create badge",
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
      setCurrentPage(1); // Reset to first page after save
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
      // If current page becomes empty after deletion, go to previous page
      if (rewards.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
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
          {/* <TabsTrigger value="builder">Create / Edit Reward</TabsTrigger> */}
          <TabsTrigger value="badges">Badge Management</TabsTrigger>
          <TabsTrigger value="reports-analytics">
            Reports & Analytics
          </TabsTrigger>
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

          {/* Pagination */}
          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, pagination.total)} of{" "}
                {pagination.total} rewards
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="page-size" className="text-sm">
                    Per page:
                  </Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {pagination.totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={setCurrentPage}
                  />
                )}
              </div>
            </div>
          )}
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
                            onChange={(event) => {
                              const newActionType = event.target.value;
                              const availableMetrics =
                                getAvailableMetrics(newActionType);
                              const currentMetric = task.metric || "count";
                              // If current metric is not available for new action type, reset to first available
                              const newMetric = availableMetrics.some(
                                (m) => m.value === currentMetric
                              )
                                ? currentMetric
                                : availableMetrics[0]?.value || "count";

                              // For custom action type: disable auto-tracking and require verification
                              const isCustom = newActionType === "custom";

                              handleTaskChange(index, {
                                actionType: newActionType,
                                metric: newMetric as
                                  | "count"
                                  | "amount"
                                  | "duration",
                                isAutomated: isCustom
                                  ? false
                                  : task.isAutomated,
                                metadata: {
                                  ...((task.metadata as
                                    | TaskMetadata
                                    | undefined) ?? {}),
                                  requiresVerification: isCustom
                                    ? true
                                    : (
                                        task.metadata as
                                          | TaskMetadata
                                          | undefined
                                      )?.requiresVerification ?? false,
                                },
                              });
                            }}
                          >
                            <option value="event">Event</option>
                            <option value="donation">Donation</option>
                            <option value="mentorship">Mentorship</option>
                            <option value="job">Job</option>
                            <option value="engagement">Engagement</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <Label>Metric</Label>
                          <select
                            className="w-full border rounded-xl px-3 py-2"
                            value={task.metric || "count"}
                            onChange={(event) => {
                              const newMetric = event.target.value as
                                | "count"
                                | "amount"
                                | "duration";
                              handleTaskChange(index, {
                                metric: newMetric,
                              });
                            }}
                          >
                            {getAvailableMetrics(
                              task.actionType || "custom"
                            ).map((metric) => (
                              <option key={metric.value} value={metric.value}>
                                {metric.label}
                              </option>
                            ))}
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
                              {task.actionType === "custom"
                                ? "Not available for custom tasks"
                                : "Progress updates automatically"}
                            </p>
                          </div>
                          <Switch
                            checked={task.isAutomated}
                            disabled={task.actionType === "custom"}
                            onCheckedChange={(checked) =>
                              handleTaskChange(index, { isAutomated: checked })
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between border rounded-xl px-3 py-2">
                          <div>
                            <Label className="text-sm">
                              Requires Verification
                              {task.actionType === "custom" && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </Label>
                            <p className="text-xs text-gray-500">
                              {task.actionType === "custom"
                                ? "Mandatory for custom tasks"
                                : "Staff must approve completion"}
                            </p>
                          </div>
                          <Switch
                            checked={
                              task.actionType === "custom"
                                ? true
                                : Boolean(
                                    (task.metadata as TaskMetadata | undefined)
                                      ?.requiresVerification
                                  )
                            }
                            disabled={task.actionType === "custom"}
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
                  onClick={() => {
                    resetForm();
                    setActiveTab("catalog");
                  }}
                  disabled={saving}
                  type="button"
                >
                  Cancel
                </Button>
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

        <TabsContent value="badges" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold">Badge Management</h2>
              <p className="text-sm text-gray-500 mt-1">
                Create, edit, and manage badges that can be awarded to alumni
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingBadgeId(null);
                resetBadgeForm();
                setIsBadgeDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Badge
            </Button>
          </div>

          {availableBadges.length === 0 ? (
            <Card className="border-dashed border-2">
              <CardContent className="py-12 text-center text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p>No badges created yet.</p>
                <p className="text-sm mt-2">
                  Create your first badge to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableBadges.map((badge) => (
                <Card key={badge._id} className="border-gray-100 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0"
                        style={{
                          backgroundColor: `${badge.color}20`,
                          border: `2px solid ${badge.color}40`,
                        }}
                      >
                        {badge.icon &&
                        (badge.icon.startsWith("/") ||
                          badge.icon.startsWith("http")) ? (
                          <img
                            src={getImageUrl(badge.icon)}
                            alt={badge.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">{badge.icon || "🏅"}</span>
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base">
                          {badge.name}
                        </CardTitle>
                        <p className="text-xs text-gray-500">
                          {badge.category}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        badge.isActive !== false ? "default" : "secondary"
                      }
                    >
                      {badge.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {badge.description}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {badge.points > 0 && (
                        <Badge variant="outline">{badge.points} pts</Badge>
                      )}
                      {badge.isRare && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-50 text-yellow-700 border-yellow-300"
                        >
                          Rare
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditBadge(badge)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteBadge(badge._id)}
                        disabled={deletingBadgeId === badge._id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {deletingBadgeId === badge._id ? (
                          "Deleting..."
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="reports-analytics" className="space-y-6">
          <Tabs defaultValue="report" className="space-y-6">
            <TabsList className="w-full max-w-xl">
              <TabsTrigger value="report" className="flex-1">
                Report
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1">
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="report" className="space-y-6">
              <RewardsReport />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <RewardsAnalytics />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <Dialog open={isBadgeDialogOpen} onOpenChange={handleBadgeDialogChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingBadgeId ? "Edit Badge" : "Create a new badge"}
            </DialogTitle>
            <DialogDescription>
              {editingBadgeId
                ? "Update the badge details. Changes will apply to all rewards using this badge."
                : "Upload a badge image and define its details. Once saved, it will be available to all rewards."}
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
              {creatingBadge
                ? "Saving..."
                : editingBadgeId
                ? "Update Badge"
                : "Create Badge"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RewardsAdminDashboard;
