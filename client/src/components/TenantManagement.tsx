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
  FormDescription,
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
import { useToast } from "@/hooks/use-toast";
import { tenantAPI, getImageUrl } from "@/lib/api";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Building2,
  Settings,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Schema for creating new tenants (includes super admin creation)
const createTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-z0-9.-]+$/,
      "Domain must contain only lowercase letters, numbers, hyphens, and dots"
    ),
  about: z.string().optional(),
  superAdminEmail: z.string().email("Invalid college admin email address"),
  superAdminFirstName: z
    .string()
    .min(1, "College admin first name is required"),
  superAdminLastName: z.string().min(1, "College admin last name is required"),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }),
  settings: z.object({
    allowAlumniRegistration: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    allowJobPosting: z.boolean().default(true),
    allowFundraising: z.boolean().default(true),
    allowMentorship: z.boolean().default(true),
    allowEvents: z.boolean().default(true),
    emailNotifications: z.boolean().default(true),
    whatsappNotifications: z.boolean().default(false),
    customBranding: z.boolean().default(false),
  }),
});

// Schema for editing existing tenants (no super admin fields)
const editTenantSchema = z.object({
  name: z.string().min(1, "Tenant name is required"),
  domain: z
    .string()
    .min(1, "Domain is required")
    .regex(
      /^[a-z0-9.-]+$/,
      "Domain must contain only lowercase letters, numbers, hyphens, and dots"
    ),
  about: z.string().optional(),
  contactInfo: z.object({
    email: z.string().email("Invalid email address"),
    phone: z.string().optional(),
    address: z.string().optional(),
    website: z.string().optional(),
  }),
  settings: z.object({
    allowAlumniRegistration: z.boolean().default(true),
    requireApproval: z.boolean().default(true),
    allowJobPosting: z.boolean().default(true),
    allowFundraising: z.boolean().default(true),
    allowMentorship: z.boolean().default(true),
    allowEvents: z.boolean().default(true),
    emailNotifications: z.boolean().default(true),
    whatsappNotifications: z.boolean().default(false),
    customBranding: z.boolean().default(false),
  }),
});

type CreateTenantFormData = z.infer<typeof createTenantSchema>;
type EditTenantFormData = z.infer<typeof editTenantSchema>;

interface Tenant {
  _id: string;
  name: string;
  domain: string;
  about?: string;
  logo?: string;
  banner?: string;
  superAdminId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  contactInfo: {
    email: string;
    phone?: string;
    address?: string;
    website?: string;
  };
  settings: {
    allowAlumniRegistration: boolean;
    requireApproval: boolean;
    allowJobPosting: boolean;
    allowFundraising: boolean;
    allowMentorship: boolean;
    allowEvents: boolean;
    emailNotifications: boolean;
    whatsappNotifications: boolean;
    customBranding: boolean;
  };
  subscription: {
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    maxUsers: number;
  };
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalUsers: number;
    totalAlumni: number;
    activeUsers: number;
    inactiveUsers: number;
  };
}

const TenantManagement: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const { toast } = useToast();

  const createForm = useForm<CreateTenantFormData>({
    resolver: zodResolver(createTenantSchema),
    mode: "onChange", // Validate on change
    defaultValues: {
      name: "",
      domain: "",
      about: "",
      superAdminEmail: "",
      superAdminFirstName: "",
      superAdminLastName: "",
      contactInfo: {
        email: "",
        phone: "",
        address: "",
        website: "",
      },
      settings: {
        allowAlumniRegistration: true,
        requireApproval: true,
        allowJobPosting: true,
        allowFundraising: true,
        allowMentorship: true,
        allowEvents: true,
        emailNotifications: true,
        whatsappNotifications: false,
        customBranding: false,
      },
    },
  });

  const editForm = useForm<EditTenantFormData>({
    resolver: zodResolver(editTenantSchema),
    mode: "onChange", // Validate on change
    defaultValues: {
      name: "",
      domain: "",
      about: "",
      contactInfo: {
        email: "",
        phone: "",
        address: "",
        website: "",
      },
      settings: {
        allowAlumniRegistration: true,
        requireApproval: true,
        allowJobPosting: true,
        allowFundraising: true,
        allowMentorship: true,
        allowEvents: true,
        emailNotifications: true,
        whatsappNotifications: false,
        customBranding: false,
      },
    },
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  // Populate edit form when tenant is selected for editing
  useEffect(() => {
    if (selectedTenant && isEditDialogOpen) {
      editForm.reset({
        name: selectedTenant.name,
        domain: selectedTenant.domain,
        about: selectedTenant.about,
        contactInfo: {
          email: selectedTenant.contactInfo.email,
          phone: selectedTenant.contactInfo.phone,
          website: selectedTenant.contactInfo.website,
          address: selectedTenant.contactInfo.address,
        },
        settings: {
          allowAlumniRegistration:
            selectedTenant.settings.allowAlumniRegistration,
          requireApproval: selectedTenant.settings.requireApproval,
          allowJobPosting: selectedTenant.settings.allowJobPosting,
          allowFundraising: selectedTenant.settings.allowFundraising,
          allowMentorship: selectedTenant.settings.allowMentorship,
          allowEvents: selectedTenant.settings.allowEvents,
          emailNotifications: selectedTenant.settings.emailNotifications,
          whatsappNotifications: selectedTenant.settings.whatsappNotifications,
          customBranding: selectedTenant.settings.customBranding,
        },
      });
    }
  }, [selectedTenant, isEditDialogOpen, editForm]);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await tenantAPI.getAllTenants({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });

      if (response.success) {
        setTenants(response.data.tenants);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch tenants",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching tenants:", error);
      toast({
        title: "Error",
        description: "Failed to fetch tenants",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (data: CreateTenantFormData) => {
    try {
      const response = await tenantAPI.createTenant(data);

      if (response.success) {
        toast({
          title: "Success",
          description: "Tenant created successfully",
        });
        setIsCreateDialogOpen(false);
        createForm.reset();
        fetchTenants();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to create tenant",
        variant: "destructive",
      });
    }
  };

  const handleViewTenant = (tenantId: string) => {
    console.log("View tenant:", tenantId);

    // Find the tenant data
    const tenant = tenants.find((t) => t._id === tenantId);
    if (tenant) {
      // Set selected tenant and open view dialog
      setSelectedTenant(tenant);
      setIsViewDialogOpen(true);
    } else {
      toast({
        title: "Error",
        description: "Tenant not found!",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTenant = async (data: EditTenantFormData) => {
    if (!selectedTenant) return;

    try {
      const response = await tenantAPI.updateTenant(selectedTenant._id, data);

      if (response.success) {
        toast({
          title: "Success",
          description: "Tenant updated successfully",
        });
        setIsEditDialogOpen(false);
        fetchTenants();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to update tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast({
        title: "Error",
        description: "Failed to update tenant",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (!confirm("Are you sure you want to delete this tenant?")) return;

    try {
      const response = await tenantAPI.deleteTenant(tenantId);

      if (response.success) {
        toast({
          title: "Success",
          description: "Tenant deleted successfully",
        });
        fetchTenants();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete tenant",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting tenant:", error);
      toast({
        title: "Error",
        description: "Failed to delete tenant",
        variant: "destructive",
      });
    }
  };

  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      (tenant.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (tenant.domain?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (tenant.contactInfo?.email &&
        tenant.contactInfo.email
          .toLowerCase()
          .includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && tenant.isActive) ||
      (statusFilter === "inactive" && !tenant.isActive);

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Tenant Management
          </h2>
          <p className="text-gray-600">Manage colleges and institutes</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Tenant</DialogTitle>
              <DialogDescription>
                Create a new college or institute tenant
              </DialogDescription>
            </DialogHeader>
            <Form {...createForm}>
              <form
                onSubmit={createForm.handleSubmit(handleCreateTenant)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tenant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., crescentvalley.edu or tech-university"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use lowercase letters, numbers, hyphens, and dots
                            only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="about"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* College Admin Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">College Admin</h3>
                    <FormField
                      control={createForm.control}
                      name="superAdminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Admin Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="admin@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="superAdminFirstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Admin First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter first name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="superAdminLastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>College Admin Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter last name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Default Password Display */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Default Password
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          value="TempPassword123!"
                          readOnly
                          className="bg-gray-50 text-gray-600 font-mono"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText("TempPassword123!");
                            toast({
                              title: "Password Copied",
                              description:
                                "Default password copied to clipboard",
                            });
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        This will be the initial password for the College Admin.
                        They should change it after first login.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
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
                      control={createForm.control}
                      name="contactInfo.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="contactInfo.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="contactInfo.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://example.com"
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
                      control={createForm.control}
                      name="settings.allowAlumniRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Alumni Registration
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow alumni to register themselves
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
                      control={createForm.control}
                      name="settings.requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Approval
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Require admin approval for new registrations
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
                      control={createForm.control}
                      name="settings.allowJobPosting"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Job Posting
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow alumni to post job opportunities
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
                      control={createForm.control}
                      name="settings.allowFundraising"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Fundraising
                            </FormLabel>
                            <div className="text-sm text-muted-foreground">
                              Allow fundraising campaigns
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
                  <Button type="submit">Create Tenant</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tenants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants ({filteredTenants.length})</CardTitle>
          <CardDescription>
            Manage all college and institute tenants
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>College Admin</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {tenant.logo ? (
                        <img
                          src={getImageUrl(tenant.logo)}
                          alt={tenant.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{tenant.name}</div>
                        {tenant.about && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {tenant.about}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {tenant.domain}
                    </code>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {tenant.superAdminId
                          ? `${tenant.superAdminId.firstName} ${tenant.superAdminId.lastName}`
                          : "No Super Admin"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tenant.superAdminId?.email || "N/A"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={tenant.isActive ? "default" : "secondary"}>
                      {tenant.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {tenant.subscription?.plan || "N/A"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{tenant.stats?.totalUsers || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleViewTenant(tenant._id)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedTenant(tenant);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTenant(tenant._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Tenant Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tenant Details</DialogTitle>
            <DialogDescription>
              View detailed information about {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Name:
                      </span>
                      <span className="font-medium">{selectedTenant.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Domain:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.domain}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.isActive ? "default" : "secondary"
                        }
                      >
                        {selectedTenant.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Created:
                      </span>
                      <span className="font-medium">
                        {new Date(
                          selectedTenant.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Statistics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Users:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.stats?.totalUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Active Users:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.stats?.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Alumni:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.stats?.alumni || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Events:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.stats?.events || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Email:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.contactInfo.email}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Phone:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.contactInfo.phone}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Website:
                      </span>
                      <span className="font-medium">
                        {selectedTenant.contactInfo.website}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Address:
                      </span>
                      <span className="font-medium text-right">
                        {selectedTenant.contactInfo.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  Subscription Information
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Plan:</span>
                    <Badge variant="outline">
                      {selectedTenant.subscription.plan}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Badge
                      variant={
                        selectedTenant.subscription.status === "active"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {selectedTenant.subscription.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Max Users:
                    </span>
                    <span className="font-medium">
                      {selectedTenant.subscription.maxUsers}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Start Date:
                    </span>
                    <span className="font-medium">
                      {new Date(
                        selectedTenant.subscription.startDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      End Date:
                    </span>
                    <span className="font-medium">
                      {new Date(
                        selectedTenant.subscription.endDate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Allow Alumni Registration:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.allowAlumniRegistration
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.allowAlumniRegistration
                          ? "Yes"
                          : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Require Approval:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.requireApproval
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.requireApproval ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Allow Job Posting:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.allowJobPosting
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.allowJobPosting ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Allow Fundraising:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.allowFundraising
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.allowFundraising
                          ? "Yes"
                          : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Allow Mentorship:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.allowMentorship
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.allowMentorship ? "Yes" : "No"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Allow Events:
                      </span>
                      <Badge
                        variant={
                          selectedTenant.settings.allowEvents
                            ? "default"
                            : "secondary"
                        }
                      >
                        {selectedTenant.settings.allowEvents ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* About */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">About</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTenant.about}
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
            >
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                setSelectedTenant(selectedTenant);
                setIsEditDialogOpen(true);
              }}
            >
              Edit Tenant
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update information for {selectedTenant?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTenant && (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit(handleUpdateTenant)}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tenant Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter tenant name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="domain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., crescentvalley.edu or tech-university"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use lowercase letters, numbers, hyphens, and dots
                            only
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="about"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>About</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">
                      Contact Information
                    </h3>
                    <FormField
                      control={editForm.control}
                      name="contactInfo.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="Enter email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="contactInfo.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter phone" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="contactInfo.website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter website" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="contactInfo.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Enter address" {...field} />
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
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="settings.allowAlumniRegistration"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Alumni Registration
                            </FormLabel>
                            <FormDescription>
                              Allow alumni to register themselves
                            </FormDescription>
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
                      control={editForm.control}
                      name="settings.requireApproval"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Require Approval
                            </FormLabel>
                            <FormDescription>
                              Require admin approval for registrations
                            </FormDescription>
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
                      control={editForm.control}
                      name="settings.allowJobPosting"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Job Posting
                            </FormLabel>
                            <FormDescription>
                              Allow users to post job opportunities
                            </FormDescription>
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
                      control={editForm.control}
                      name="settings.allowFundraising"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Fundraising
                            </FormLabel>
                            <FormDescription>
                              Allow fundraising campaigns
                            </FormDescription>
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
                      control={editForm.control}
                      name="settings.allowMentorship"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Mentorship
                            </FormLabel>
                            <FormDescription>
                              Allow mentorship programs
                            </FormDescription>
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
                      control={editForm.control}
                      name="settings.allowEvents"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Allow Events
                            </FormLabel>
                            <FormDescription>
                              Allow event creation and management
                            </FormDescription>
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Update Tenant</Button>
                </div>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TenantManagement;
