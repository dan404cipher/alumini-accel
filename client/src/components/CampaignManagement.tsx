import React, { useState, useEffect } from "react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { campaignAPI, categoryAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  Users,
  Target,
  TrendingUp,
  MoreHorizontal,
  Eye,
  Heart,
  Share2,
  CheckCircle2,
  XCircle,
  Loader2,
  IndianRupee,
  Download,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const campaignSchema = z.object({
  title: z.string().min(1, "Campaign title is required"),
  description: z.string().min(1, "Campaign description is required"),
  category: z.string().min(1, "Category is required"),
  targetAmount: z.number().min(1, "Target amount must be greater than 0"),
  currency: z.string().default("INR"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  allowAnonymous: z.boolean().default(true),
  featured: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  location: z.string().optional(),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    person: z.string().optional(),
  }),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

interface Campaign {
  _id: string;
  title: string;
  description: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  startDate: string;
  endDate: string;
  status: string;
  images: string[];
  documents: string[];
  allowAnonymous: boolean;
  featured: boolean;
  tags: string[];
  location?: string;
  contactInfo: {
    email: string;
    phone?: string;
    person?: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  tenantId: {
    _id: string;
    name: string;
    domain: string;
  };
  statistics: {
    totalDonations: number;
    totalDonors: number;
    averageDonation: number;
  };
  createdAt: string;
  progressPercentage?: number;
  daysRemaining?: number;
}

const CampaignManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [campaignPage, setCampaignPage] = useState(1);
  const [campaignLimit] = useState(6);
  const { toast } = useToast();
  const { user } = useAuth();

  // Donor management state
  const [selectedCampaignForDonors, setSelectedCampaignForDonors] =
    useState<Campaign | null>(null);
  const [isDonorsDialogOpen, setIsDonorsDialogOpen] = useState(false);
  const [donors, setDonors] = useState<
    Array<{
      _id: string;
      donorName: string;
      donorEmail?: string | null;
      donorProfile?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePicture?: string;
      } | null;
      amount: number;
      currency: string;
      paymentMethod: string;
      transactionId?: string;
      anonymous: boolean;
      message?: string;
      createdAt: string;
    }>
  >([]);
  const [donorStats, setDonorStats] = useState<{
    totalDonors?: number;
    totalAmount?: number;
    totalDonations?: number;
    averageAmount?: number;
    topDonors?: Array<{
      donor: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        profilePicture?: string;
      };
      totalAmount: number;
      donationCount: number;
      lastDonation: string;
    }>;
  } | null>(null);
  const [donorsLoading, setDonorsLoading] = useState(false);
  const [donorsPage, setDonorsPage] = useState(1);
  const [donorsLimit] = useState(20);
  const [donorsTotal, setDonorsTotal] = useState(0);

  // Form state for Create Campaign (Donations page style)
  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    category: "",
    amount: "",
    endDate: "",
    imageFile: null as File | null,
    imagePreviewUrl: "",
  });
  const [createFormErrors, setCreateFormErrors] = useState({
    title: "",
    description: "",
    category: "",
    amount: "",
    endDate: "",
    imageFile: "",
  });
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "donation_category",
        });
        const names = Array.isArray(res.data)
          ? (res.data as Array<{ name?: string }>)
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        setCategoryOptions(names);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const form = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      targetAmount: 0,
      currency: "INR",
      startDate: "",
      endDate: "",
      allowAnonymous: true,
      featured: false,
      tags: [],
      location: "",
      contactInfo: {
        email: "",
        phone: "",
        person: "",
      },
    },
  });

  // Prefill edit form when opening edit dialog
  useEffect(() => {
    if (isEditDialogOpen && selectedCampaign) {
      form.reset({
        title: selectedCampaign.title || "",
        description: selectedCampaign.description || "",
        category: selectedCampaign.category || "",
        targetAmount: selectedCampaign.targetAmount || 0,
        currency: "INR",
        startDate: selectedCampaign.startDate
          ? new Date(selectedCampaign.startDate).toISOString().slice(0, 16)
          : "",
        endDate: selectedCampaign.endDate
          ? new Date(selectedCampaign.endDate).toISOString().slice(0, 16)
          : "",
        featured: selectedCampaign.featured ?? false,
        tags: selectedCampaign.tags || [],
      });
    }
  }, [isEditDialogOpen, selectedCampaign, form]);

  const handleUpdateCampaign = async (data: CampaignFormData) => {
    if (!selectedCampaign?._id) return;
    try {
      const campaignData = {
        title: data.title!,
        description: data.description!,
        category: data.category!,
        targetAmount: data.targetAmount!,
        currency: data.currency || "INR",
        startDate: data.startDate!,
        endDate: data.endDate!,
        allowAnonymous: data.allowAnonymous ?? true,
        featured: data.featured ?? false,
        tags: data.tags || [],
        location: data.location,
        contactInfo: {
          email: data.contactInfo!.email!,
          phone: data.contactInfo!.phone,
          person: data.contactInfo!.person,
        },
      };

      const response = await campaignAPI.updateCampaign(
        selectedCampaign._id,
        campaignData
      );

      if (response.success) {
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
        setIsEditDialogOpen(false);
        setSelectedCampaign(null);
        form.reset();
    fetchCampaigns();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignAPI.getAllCampaigns({
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success) {
        const campaignsWithProgress = (response.data as Campaign[]).map(
          (campaign: Campaign) => ({
            ...campaign,
            progressPercentage: Math.round(
              (campaign.currentAmount / campaign.targetAmount) * 100
            ),
            daysRemaining: Math.max(
              0,
              Math.ceil(
                (new Date(campaign.endDate).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            ),
          })
        );
        setCampaigns(campaignsWithProgress);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch campaigns",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Validate create form (Donations page style)
  const validateCreateForm = () => {
    const newErrors = {
      title: "",
      description: "",
      category: "",
      amount: "",
      endDate: "",
      imageFile: "",
    };

    if (!createFormData.title.trim()) {
      newErrors.title = "Campaign title is required";
    } else if (createFormData.title.trim().length < 5) {
      newErrors.title = "Campaign title must be at least 5 characters";
    } else if (createFormData.title.trim().length > 100) {
      newErrors.title = "Campaign title must be less than 100 characters";
    }

    if (!createFormData.description.trim()) {
      newErrors.description = "Campaign description is required";
    } else if (createFormData.description.trim().length < 20) {
      newErrors.description =
        "Campaign description must be at least 20 characters";
    } else if (createFormData.description.trim().length > 1000) {
      newErrors.description =
        "Campaign description must be less than 1000 characters";
    }

    if (!createFormData.category) {
      newErrors.category = "Please select a category";
    }

    if (!createFormData.amount) {
      newErrors.amount = "Target amount is required";
    } else if (isNaN(Number(createFormData.amount))) {
      newErrors.amount = "Please enter a valid number";
    } else if (Number(createFormData.amount) <= 0) {
      newErrors.amount = "Target amount must be greater than 0";
    } else if (Number(createFormData.amount) < 1000) {
      newErrors.amount = "Target amount must be at least ₹1,000";
    } else if (Number(createFormData.amount) > 100000000) {
      newErrors.amount = "Target amount cannot exceed ₹10,00,00,000";
    }

    if (!createFormData.endDate) {
      newErrors.endDate = "End date is required";
    } else {
      const endDate = new Date(createFormData.endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (endDate <= today) {
        newErrors.endDate = "End date must be in the future";
      } else if (
        endDate > new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)
      ) {
        newErrors.endDate = "End date cannot be more than 1 year from now";
      }
    }

    if (createFormData.imageFile) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (createFormData.imageFile.size > maxSize) {
        newErrors.imageFile = "Image size must be less than 5MB";
      }
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(createFormData.imageFile.type)) {
        newErrors.imageFile =
          "Please upload a valid image (JPEG, PNG, GIF, WebP)";
      }
    }

    setCreateFormErrors(newErrors);
    return Object.values(newErrors).every((error) => !error);
  };

  const handleCreateCampaign = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (!validateCreateForm()) return;

    try {
      const campaignData = {
        title: createFormData.title,
        description: createFormData.description,
        category: createFormData.category,
        targetAmount: parseInt(createFormData.amount),
        currency: "INR",
        startDate: new Date().toISOString(),
        endDate: createFormData.endDate,
        contactInfo: {
          email: "admin@alma-mater.edu",
        },
      };

      const response = await campaignAPI.createCampaign(campaignData);

      if (response.success) {
        // Upload image if provided
        const campaignId =
          (response.data as { _id?: string; id?: string })?._id ||
          (response.data as { _id?: string; id?: string })?.id;
        if (createFormData.imageFile && campaignId) {
          try {
            const imageFormData = new FormData();
            imageFormData.append("image", createFormData.imageFile);
            // Check if uploadCampaignImage exists, otherwise skip
            if (campaignAPI.uploadCampaignImage) {
              await campaignAPI.uploadCampaignImage(campaignId, imageFormData);
            }
          } catch (imageError) {
            console.error("Error uploading campaign image:", imageError);
            // Don't fail the entire operation if image upload fails
          }
        }

        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
        setIsCreateDialogOpen(false);
        setCreateFormData({
          title: "",
          description: "",
          category: "",
          amount: "",
          endDate: "",
          imageFile: null,
          imagePreviewUrl: "",
        });
        setCreateFormErrors({
          title: "",
          description: "",
          category: "",
          amount: "",
          endDate: "",
          imageFile: "",
        });
        fetchCampaigns();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setCreateFormData((prev) => ({
        ...prev,
        imageFile: null,
        imagePreviewUrl: "",
      }));
      setCreateFormErrors((prev) => ({ ...prev, imageFile: "" }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const url = (evt.target?.result as string) || "";
      setCreateFormData((prev) => ({
        ...prev,
        imageFile: file,
        imagePreviewUrl: url,
      }));
      setCreateFormErrors((prev) => ({ ...prev, imageFile: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const response = await campaignAPI.deleteCampaign(campaignId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Campaign deleted successfully",
        });
        fetchCampaigns();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete campaign",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    }
  };

  // Donor management functions
  const handleViewDonors = async (campaign: Campaign) => {
    setSelectedCampaignForDonors(campaign);
    setIsDonorsDialogOpen(true);
    await fetchCampaignDonors(campaign._id, 1);
    await fetchCampaignDonorStats(campaign._id);
  };

  const fetchCampaignDonors = async (campaignId: string, page: number = 1) => {
    try {
      setDonorsLoading(true);
      const response = await campaignAPI.getCampaignDonors(campaignId, {
        page,
        limit: donorsLimit,
      });

      if (response.success && response.data) {
        const data = response.data as {
          donors?: Array<{
            _id: string;
            donorName: string;
            donorEmail?: string | null;
            donorProfile?: {
              _id: string;
              firstName: string;
              lastName: string;
              email: string;
              profilePicture?: string;
            } | null;
            amount: number;
            currency: string;
            paymentMethod: string;
            transactionId?: string;
            anonymous: boolean;
            message?: string;
            createdAt: string;
          }>;
          pagination?: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
          };
        };
        setDonors(data.donors || []);
        setDonorsTotal(data.pagination?.total || 0);
        setDonorsPage(page);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch donors",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching donors:", error);
      toast({
        title: "Error",
        description: "Failed to fetch donors",
        variant: "destructive",
      });
    } finally {
      setDonorsLoading(false);
    }
  };

  const fetchCampaignDonorStats = async (campaignId: string) => {
    try {
      const response = await campaignAPI.getCampaignDonorStats(campaignId);
      if (response.success && response.data) {
        setDonorStats(
          response.data as {
            totalDonors?: number;
            totalAmount?: number;
            totalDonations?: number;
            averageAmount?: number;
            topDonors?: Array<{
              donor: {
                _id: string;
                firstName: string;
                lastName: string;
                email: string;
                profilePicture?: string;
              };
              totalAmount: number;
              donationCount: number;
              lastDonation: string;
            }>;
          }
        );
      }
    } catch (error) {
      console.error("Error fetching donor stats:", error);
    }
  };

  const handleExportDonors = async () => {
    if (!selectedCampaignForDonors) return;

    try {
      const response = await campaignAPI.exportCampaignDonors(
        selectedCampaignForDonors._id,
        "csv"
      );

      // Create blob and download
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `campaign-${
        selectedCampaignForDonors._id
      }-donors-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Donors exported successfully",
      });
    } catch (error) {
      console.error("Error exporting donors:", error);
      toast({
        title: "Error",
        description: "Failed to export donors",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, label: "Draft" },
      active: { variant: "default" as const, label: "Active" },
      paused: { variant: "secondary" as const, label: "Paused" },
      completed: { variant: "outline" as const, label: "Completed" },
      cancelled: { variant: "destructive" as const, label: "Cancelled" },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const categoryColors = {
      scholarship: "bg-blue-100 text-blue-800",
      infrastructure: "bg-green-100 text-green-800",
      research: "bg-purple-100 text-purple-800",
      event: "bg-orange-100 text-orange-800",
      emergency: "bg-red-100 text-red-800",
      other: "bg-gray-100 text-gray-800",
    };

    const colorClass =
      categoryColors[category as keyof typeof categoryColors] ||
      categoryColors.other;
    return <Badge className={colorClass}>{category}</Badge>;
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || campaign.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination for filtered campaigns
  const totalCampaigns = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / campaignLimit));
  const paginatedCampaigns = filteredCampaigns.slice(
    (campaignPage - 1) * campaignLimit,
    campaignPage * campaignLimit
  );

  // Statistics
  const totalAmount = campaigns.reduce(
    (sum, c) => sum + (c.currentAmount || 0),
    0
  );
  const totalTarget = campaigns.reduce(
    (sum, c) => sum + (c.targetAmount || 0),
    0
  );
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const completedCount = campaigns.filter(
    (c) => c.status === "completed"
  ).length;

  // Reset page when filters change
  useEffect(() => {
    setCampaignPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Campaign Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track fundraising campaigns for your college
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!loading && campaigns.length > 0 && (
            <>
              <Badge variant="outline" className="text-sm">
                Total: {campaigns.length}
              </Badge>
              {activeCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-sm bg-green-50 text-green-700"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Active: {activeCount}
                </Badge>
              )}
              {completedCount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-sm bg-blue-50 text-blue-700"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Completed: {completedCount}
                </Badge>
              )}
              {totalAmount > 0 && (
                <Badge
                  variant="secondary"
                  className="text-sm bg-purple-50 text-purple-700"
                >
                  <IndianRupee className="w-3 h-3 mr-1" />
                  Raised: ₹{totalAmount.toLocaleString()}
                </Badge>
              )}
            </>
          )}
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create a new fundraising campaign
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCampaign} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={createFormData.title}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter campaign title"
                    className={`mt-1 w-full border ${
                      createFormErrors.title
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  />
                  {createFormErrors.title && (
                    <p className="text-red-500 text-xs mt-1">
                      {createFormErrors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={createFormData.description}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your campaign goals and impact"
                    rows={3}
                    className={`mt-1 w-full border ${
                      createFormErrors.description
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  />
                  {createFormErrors.description && (
                    <p className="text-red-500 text-xs mt-1">
                      {createFormErrors.description}
                    </p>
                  )}
                </div>

                {/* Category & Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Category *
                    </label>
                    <Select
                      value={createFormData.category}
                      onValueChange={(value) =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          category: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={`mt-1 ${
                          createFormErrors.category ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select an option" />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.length === 0 ? (
                          <SelectItem value="__noopts__" disabled>
                            No saved categories
                          </SelectItem>
                        ) : (
                          categoryOptions.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    {createFormErrors.category && (
                      <p className="text-red-500 text-xs mt-1">
                        {createFormErrors.category}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Target Amount (₹) *
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={createFormData.amount}
                      onChange={(e) =>
                        setCreateFormData((prev) => ({
                          ...prev,
                          amount: e.target.value,
                        }))
                      }
                      placeholder="Enter target amount"
                      className={`mt-1 w-full border ${
                        createFormErrors.amount
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                    />
                    {createFormErrors.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {createFormErrors.amount}
                      </p>
                    )}
                  </div>
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={createFormData.endDate}
                    onChange={(e) =>
                      setCreateFormData((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                    className={`mt-1 w-full border ${
                      createFormErrors.endDate
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm`}
                  />
                  {createFormErrors.endDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {createFormErrors.endDate}
                    </p>
                  )}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Campaign Image (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className={`mt-1 w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm ${
                      createFormErrors.imageFile
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a JPG or PNG image. A preview will appear below.
                  </p>
                  {createFormErrors.imageFile && (
                    <p className="text-red-500 text-xs mt-1">
                      {createFormErrors.imageFile}
                    </p>
                  )}
                  {createFormData.imagePreviewUrl && (
                    <div className="mt-2">
                      <img
                        src={createFormData.imagePreviewUrl}
                        alt="Preview"
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 mt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">+ Create Campaign</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Campaign Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Campaign</DialogTitle>
            <DialogDescription>
              Update the details of this fundraising campaign
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
              onSubmit={form.handleSubmit(handleUpdateCampaign)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Campaign Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter campaign title"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="scholarship">
                                Scholarship
                              </SelectItem>
                              <SelectItem value="infrastructure">
                                Infrastructure
                              </SelectItem>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="event">Event</SelectItem>
                            <SelectItem value="emergency">Emergency</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter campaign description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Financial Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Financial Information
                    </h3>
                    <FormField
                      control={form.control}
                      name="targetAmount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Amount</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter target amount"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseFloat(e.target.value) || 0)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select currency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            <SelectItem value="INR">INR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="datetime-local" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  </div>
                </div>

              {/* Additional Settings */}
                <div className="space-y-4">
                <h3 className="text-lg font-semibold">Additional Settings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="allowAnonymous"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Anonymous Donations
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                            Allow donors to contribute anonymously
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="featured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Featured Campaign
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Highlight this campaign as featured
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                <Button type="submit">Update Campaign</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      {/* Enhanced Filters */}
      {!loading && (
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="scholarship">Scholarship</SelectItem>
            <SelectItem value="infrastructure">Infrastructure</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
          {(searchTerm ||
            categoryFilter !== "all" ||
            statusFilter !== "all") && (
            <Badge variant="secondary" className="text-sm">
              {filteredCampaigns.length} result
              {filteredCampaigns.length !== 1 ? "s" : ""}
            </Badge>
          )}
      </div>
      )}

      {/* Campaigns Grid */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
              <div className="text-muted-foreground">Loading campaigns...</div>
            </div>
          </CardContent>
        </Card>
      ) : filteredCampaigns.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ||
                categoryFilter !== "all" ||
                statusFilter !== "all"
                  ? "No campaigns found matching your filters"
                  : "No campaigns found"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm ||
                categoryFilter !== "all" ||
                statusFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Create your first fundraising campaign to get started"}
              </p>
              {!searchTerm &&
                categoryFilter === "all" &&
                statusFilter === "all" && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedCampaigns.map((campaign) => (
          <Card key={campaign._id} className="relative">
            {campaign.featured && (
              <div className="absolute top-2 right-2 z-10">
                <Badge className="bg-yellow-100 text-yellow-800">
                  Featured
                </Badge>
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">
                    {campaign.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {campaign.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewDonors(campaign)}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          View Donors
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedCampaign(campaign);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteCampaign(campaign._id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                {getCategoryBadge(campaign.category)}
                {getStatusBadge(campaign.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">
                    {campaign.progressPercentage}%
                  </span>
                </div>
                    <Progress
                      value={campaign.progressPercentage || 0}
                      className="h-2"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {campaign.currentAmount.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {campaign.targetAmount.toLocaleString()}
                      </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>{campaign.statistics.totalDonors} donors</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{campaign.daysRemaining} days left</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                    <div className="text-xs text-muted-foreground truncate pr-2">
                  Created by {campaign.createdBy.firstName}{" "}
                  {campaign.createdBy.lastName}
                </div>
                    <div className="flex space-x-2 flex-shrink-0">
                      <Button size="sm" variant="outline" className="text-xs">
                        <Heart className="w-3 h-3 mr-1" />
                        {campaign.statistics?.totalDonations || 0}
                  </Button>
                      <Button size="sm" variant="outline" className="text-xs">
                        <Share2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

          {/* Pagination Controls */}
          {filteredCampaigns.length > 0 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(campaignPage - 1) * campaignLimit + 1} to{" "}
                {Math.min(campaignPage * campaignLimit, totalCampaigns)} of{" "}
                {totalCampaigns} campaigns
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={campaignPage <= 1 || loading}
                  onClick={() => setCampaignPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground px-2">
                    Page {campaignPage} of {totalPages}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={campaignPage >= totalPages || loading}
                  onClick={() => setCampaignPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Donors Dialog */}
      <Dialog open={isDonorsDialogOpen} onOpenChange={setIsDonorsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Campaign Donors - {selectedCampaignForDonors?.title}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDonors}
                disabled={!donors.length}
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </DialogTitle>
            <DialogDescription>
              View and manage all donors who contributed to this campaign
            </DialogDescription>
          </DialogHeader>

          {/* Donor Stats */}
          {donorStats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Donors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {donorStats.totalDonors || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Raised
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{donorStats.totalAmount?.toLocaleString() || 0}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Average Donation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹
                    {Math.round(donorStats.averageAmount || 0).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {donorStats.totalDonations || 0}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Top Donors */}
          {donorStats?.topDonors && donorStats.topDonors.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Top Donors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {donorStats.topDonors.map((topDonor, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                          {index + 1}
                        </div>
                        {topDonor.donor?.profilePicture ? (
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={topDonor.donor.profilePicture} />
                            <AvatarFallback>
                              {topDonor.donor.firstName?.[0]}
                              {topDonor.donor.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {topDonor.donor?.firstName}{" "}
                            {topDonor.donor?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {topDonor.donationCount} donation
                            {topDonor.donationCount !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">
                          ₹{topDonor.totalAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {topDonor.donor?.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Donors Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">All Donors</CardTitle>
            </CardHeader>
            <CardContent>
              {donorsLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground mr-2" />
                  <span className="text-muted-foreground">
                    Loading donors...
                  </span>
                </div>
              ) : donors.length === 0 ? (
                <div className="text-center p-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No donors found for this campaign
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Donor</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Payment Method</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {donors.map((donor) => (
                          <TableRow key={donor._id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {donor.donorProfile?.profilePicture ? (
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage
                                      src={donor.donorProfile.profilePicture}
                                    />
                                    <AvatarFallback>
                                      {donor.donorName?.[0] || "A"}
                                    </AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                                    <User className="w-4 h-4 text-gray-600" />
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">
                                    {donor.donorName}
                                  </div>
                                  {donor.donorEmail && (
                                    <div className="text-xs text-muted-foreground">
                                      {donor.donorEmail}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-semibold">
                                ₹{donor.amount.toLocaleString()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {donor.currency}
                              </div>
                            </TableCell>
                            <TableCell>{donor.paymentMethod}</TableCell>
                            <TableCell>
                              <span className="text-xs font-mono">
                                {donor.transactionId || "N/A"}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(donor.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {donor.message ? (
                                <span className="text-sm line-clamp-2">
                                  {donor.message}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  -
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Donors Pagination */}
                  {donorsTotal > donorsLimit && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {(donorsPage - 1) * donorsLimit + 1} to{" "}
                        {Math.min(donorsPage * donorsLimit, donorsTotal)} of{" "}
                        {donorsTotal} donors
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={donorsPage <= 1}
                          onClick={() => {
                            if (selectedCampaignForDonors) {
                              fetchCampaignDonors(
                                selectedCampaignForDonors._id,
                                donorsPage - 1
                              );
                            }
                          }}
                        >
                          Previous
                </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          Page {donorsPage} of{" "}
                          {Math.ceil(donorsTotal / donorsLimit)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={
                            donorsPage >= Math.ceil(donorsTotal / donorsLimit)
                          }
                          onClick={() => {
                            if (selectedCampaignForDonors) {
                              fetchCampaignDonors(
                                selectedCampaignForDonors._id,
                                donorsPage + 1
                              );
                            }
                          }}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
          </CardContent>
        </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignManagement;
