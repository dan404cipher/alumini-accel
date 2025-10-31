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
import { campaignAPI } from "@/lib/api";
import { useForm } from "react-hook-form";
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

  useEffect(() => {
    fetchCampaigns();
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

  const handleCreateCampaign = async (data: CampaignFormData) => {
    try {
      // Ensure all required fields are provided with defaults
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

      const response = await campaignAPI.createCampaign(campaignData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
        setIsCreateDialogOpen(false);
        form.reset();
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
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleCreateCampaign)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">
                        Basic Information
                      </h3>
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
                                <SelectItem value="research">
                                  Research
                                </SelectItem>
                                <SelectItem value="event">Event</SelectItem>
                                <SelectItem value="emergency">
                                  Emergency
                                </SelectItem>
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
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
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
                                <SelectItem value="INR">INR (₹)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Date</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
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
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="contactInfo.email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="contact@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactInfo.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="+1 (555) 123-4567"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="contactInfo.person"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contact Person</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Contact person name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Campaign location"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Settings</h3>
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
                                Allow donors to donate anonymously
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
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Create Campaign</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

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
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
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
    </div>
  );
};

export default CampaignManagement;
