import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { categoryAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Loader2, Search, Tag, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
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

interface Category {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  entityType: string;
  isActive: boolean;
  order: number;
  programs?: string[] | Array<{ _id: string; name: string }>;
  createdAt: string;
  createdBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

const ENTITY_TYPES = [
  { value: "community", label: "Community Categories", section: "community" },
  {
    value: "community_post_category",
    label: "Community Post Categories",
    section: "community",
  },
  { value: "department", label: "Departments", section: "departments" },
  { value: "program", label: "Programs", section: "departments" },
  { value: "event_type", label: "Event Types", section: "events" },
  { value: "event_location", label: "Event Locations", section: "events" },
  {
    value: "event_price_range",
    label: "Event Price Ranges",
    section: "events",
  },
  { value: "job_type", label: "Job Types", section: "jobs" },
  { value: "job_experience", label: "Job Experience Levels", section: "jobs" },
  { value: "job_industry", label: "Job Industries", section: "jobs" },
  {
    value: "mentorship_category",
    label: "Mentorship Categories",
    section: "mentorship",
  },
  {
    value: "donation_category",
    label: "Donation Categories",
    section: "donations",
  },
  {
    value: "gallery_category",
    label: "Gallery Categories",
    section: "gallery",
  },
] as const;

export const CategoryManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  // URL-based navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const primarySection = (searchParams.get("subtab") as
    | "events"
    | "jobs"
    | "community"
    | "mentorship"
    | "donations"
    | "gallery"
    | "departments") || "events";
  const activeTab = searchParams.get("view") || "community";

  const setPrimarySection = (section: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("subtab", section);
    // Reset view when changing section to a valid default for that section
    const available = ENTITY_TYPES.filter((t) => t.section === section);
    if (available.length > 0) {
      newParams.set("view", available[0].value);
    }
    setSearchParams(newParams);
  };

  const setActiveTab = (tab: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("view", tab);
    setSearchParams(newParams);
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryPage, setCategoryPage] = useState(1);
  const [categoryLimit] = useState(10);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: 0,
    isActive: true,
    entityType: "community",
    programs: [] as string[],
  });
  const [availablePrograms, setAvailablePrograms] = useState<Array<{ _id: string; name: string }>>([]);
  const [loadingPrograms, setLoadingPrograms] = useState(false);
  const [selectedProgramForDept, setSelectedProgramForDept] = useState<string>("");

  // Check if user can manage categories
  const canManage = ["college_admin", "hod", "staff"].includes(
    user?.role || ""
  );
  const canDelete = ["college_admin", "hod"].includes(user?.role || "");

  useEffect(() => {
    if (canManage) {
      // Ensure activeTab is valid for current primary section
      const available = ENTITY_TYPES.filter(
        (t) => t.section === primarySection
      );
      if (!available.find((t) => t.value === activeTab)) {
        // If invalid, set to first available
        if (available.length > 0) {
             setActiveTab(available[0].value);
        }
        return;
      }
      fetchCategories();
    }
  }, [canManage, activeTab, primarySection]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll({
        isActive: "true",
        entityType: activeTab,
      });
      if (response.success) {
        // Also fetch inactive categories
        const inactiveResponse = await categoryAPI.getAll({
          isActive: "false",
          entityType: activeTab,
        });
        const allCategories = [
          ...((response.data as Category[]) || []),
          ...((inactiveResponse.data as Category[]) || []),
        ];
        // Sort by name only (Order column removed)
        allCategories.sort((a, b) => a.name.localeCompare(b.name));
        setCategories(allCategories);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Type-specific validation/enhancements
      const trimmedName = formData.name.trim();
      if (!trimmedName) {
        toast({ title: "Name is required", variant: "destructive" });
        return;
      }
      // Enforce price range formats when creating price ranges
      const typeForValidation = editingCategory
        ? editingCategory.entityType
        : activeTab;
      if (typeForValidation === "event_price_range") {
        const val = trimmedName.toLowerCase();
        const valid =
          val === "free" || /^(\d+)-(\d+)$/.test(val) || /^(\d+)\+$/.test(val);
        if (!valid) {
          toast({
            title: "Invalid price range",
            description:
              'Use "Free", "min-max" (e.g., 0-25) or "min+" (e.g., 100+).',
            variant: "destructive",
          });
          return;
        }
      }
      // Validate: For new departments, program must be selected
      if (activeTab === "department" && !editingCategory && !selectedProgramForDept) {
        toast({
          title: "Program Required",
          description: "Please select a program before creating a department.",
          variant: "destructive",
        });
        return;
      }

      if (editingCategory) {
        const updateData: any = {
          ...formData,
          order: undefined as unknown as number, // ensure order not sent if removed
          name: trimmedName,
        };
        // Only include programs if entityType is department
        if (formData.entityType === "department") {
          updateData.programs = formData.programs;
        } else {
          delete updateData.programs;
        }
        await categoryAPI.update(editingCategory._id, updateData);
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        const createData: any = {
          ...formData,
          order: undefined as unknown as number,
          name: trimmedName,
          entityType: activeTab,
        };
        // Only include programs if entityType is department
        if (activeTab === "department") {
          // If selectedProgramForDept is set, use it; otherwise use formData.programs
          if (selectedProgramForDept) {
            createData.programs = [selectedProgramForDept];
          } else {
            createData.programs = formData.programs;
          }
        } else {
          delete createData.programs;
        }
        await categoryAPI.create(createData);
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }
      setIsDialogOpen(false);
      resetForm();
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save category",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      await categoryAPI.delete(categoryToDelete);
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to delete category",
        variant: "destructive",
      });
    }
  };

  const handleEdit = async (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      order: category.order,
      isActive: category.isActive,
      entityType: category.entityType,
      programs: (category.programs as any)?.map((p: any) => typeof p === 'string' ? p : p._id || p) || [],
    });
    
    // Fetch programs if editing a department category
    if (category.entityType === "department") {
      await fetchPrograms();
    }
    
    setIsDialogOpen(true);
  };

  const handleAdd = async () => {
    resetForm();
    setFormData((prev) => ({ ...prev, entityType: activeTab }));
    setSelectedProgramForDept("");
    
    // Fetch programs if adding a department category
    if (activeTab === "department") {
      await fetchPrograms();
    }
    
    setIsDialogOpen(true);
  };

  const fetchPrograms = async () => {
    try {
      setLoadingPrograms(true);
      const response = await categoryAPI.getAll({
        entityType: "program",
        isActive: "true",
      });
      if (response.success && response.data) {
        setAvailablePrograms(response.data);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
    } finally {
      setLoadingPrograms(false);
    }
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      order: 0,
      isActive: true,
      entityType: activeTab,
      programs: [],
    });
    setAvailablePrograms([]);
    setSelectedProgramForDept("");
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You don't have permission to manage categories. Only College Admins,
            HODs, and Staff can manage categories.
          </p>
        </div>
      </div>
    );
  }

  const currentEntityLabel =
    ENTITY_TYPES.find((e) => e.value === activeTab)?.label || "Categories";
  const sectionDescription =
    primarySection === "events"
      ? "Manage event-related categories such as event types, locations, and price ranges."
      : primarySection === "jobs"
      ? "Manage job-related categories such as job types, experience levels, and industries."
      : primarySection === "mentorship"
      ? "Manage mentorship categories/topics available across mentorship features."
      : primarySection === "donations"
      ? "Manage donation/campaign categories to organize fundraising."
      : primarySection === "gallery"
      ? "Manage gallery categories to organize media and albums."
      : primarySection === "departments"
      ? "Manage departments used across the alumni directory and related forms."
      : "Manage community-related categories available to users when creating communities.";

  // Filter categories for current entity type and search term
  const entityCategories = categories.filter(
    (cat) => cat.entityType === activeTab
  );
  const filteredCategories = entityCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cat.description || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination for filtered categories
  const totalCategories = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(totalCategories / categoryLimit));
  const paginatedCategories = filteredCategories.slice(
    (categoryPage - 1) * categoryLimit,
    categoryPage * categoryLimit
  );

  const activeCount = entityCategories.filter((c) => c.isActive).length;
  const inactiveCount = entityCategories.filter((c) => !c.isActive).length;

  // Reset page when search term or active tab changes
  useEffect(() => {
    setCategoryPage(1);
  }, [searchTerm, activeTab]);

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Category Management</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organize and manage categories across your platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {entityCategories.length > 0 && (
            <>
              <Badge variant="outline" className="text-sm">
                Total: {entityCategories.length}
              </Badge>
              <Badge variant="secondary" className="text-sm bg-green-50 text-green-700">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active: {activeCount}
              </Badge>
              {inactiveCount > 0 && (
                <Badge variant="secondary" className="text-sm bg-gray-50 text-gray-700">
                  <XCircle className="w-3 h-3 mr-1" />
                  Inactive: {inactiveCount}
                </Badge>
              )}
            </>
          )}
          <Button onClick={handleAdd}>
            <Plus className="w-4 h-4 mr-2" />
            Add {currentEntityLabel.split(" ")[0]}
          </Button>
        </div>
      </div>

      {/* Primary Section Tabs */}
      <div>
        <Tabs
          value={primarySection}
          onValueChange={(v) => setPrimarySection(v as any)}
        >
          <TabsList className="grid w-full grid-cols-7 max-w-[1200px]">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm text-muted-foreground mt-2">{sectionDescription}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="flex flex-wrap gap-2">
          {ENTITY_TYPES.filter((e) => e.section === primarySection).map(
            (entity) => (
              <TabsTrigger key={entity.value} value={entity.value}>
                {entity.label}
              </TabsTrigger>
            )
          )}
        </TabsList>

        {ENTITY_TYPES.filter((e) => e.section === primarySection).map(
          (entity) => (
            <TabsContent
              key={entity.value}
              value={entity.value}
              className="space-y-4"
            >
              {/* Search and Filter */}
              {!loading && entityCategories.length > 0 && (
                <div className="flex items-center space-x-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search categories..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  {searchTerm && (
                    <Badge variant="secondary" className="text-sm">
                      {filteredCategories.length} result{filteredCategories.length !== 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              )}

              {/* Categories List */}
              {loading ? (
                <Card>
                  <CardContent className="p-12">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                      <div className="text-muted-foreground">Loading categories...</div>
                    </div>
                  </CardContent>
                </Card>
              ) : entityCategories.length === 0 ? (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Tag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No {entity.label.toLowerCase()} found
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Create your first {entity.label.toLowerCase().replace(" categories", " category")} to get started.
                      </p>
                      <Button onClick={handleAdd}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create {entity.label.split(" ")[0]}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : filteredCategories.length === 0 ? (
                <Card>
                  <CardContent className="p-12">
                    <div className="text-center">
                      <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        No categories found matching your search
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting your search terms
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedCategories.map((category) => (
                      <Card
                        key={category._id}
                        className="hover:shadow-lg transition-all duration-200 border-l-4"
                        style={{
                          borderLeftColor: category.isActive
                            ? "rgb(34, 197, 94)"
                            : "rgb(156, 163, 175)",
                        }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-semibold">
                                  {category.name}
                                </h3>
                                <Badge
                                  variant={category.isActive ? "default" : "secondary"}
                                  className={
                                    category.isActive
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-gray-500 hover:bg-gray-600"
                                  }
                                >
                                  {category.isActive ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3 mr-1" />
                                      Active
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Inactive
                                    </>
                                  )}
                                </Badge>
                              </div>
                              {category.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {category.description}
                                </p>
                              )}
                              {category.createdBy && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Created by {category.createdBy.firstName}{" "}
                                  {category.createdBy.lastName}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(category)}
                              >
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </Button>
                              {canDelete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteClick(category._id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        Showing {((categoryPage - 1) * categoryLimit) + 1} to{" "}
                        {Math.min(categoryPage * categoryLimit, totalCategories)} of{" "}
                        {totalCategories} categories
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoryPage <= 1 || loading}
                          onClick={() => setCategoryPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-muted-foreground px-2">
                            Page {categoryPage} of {totalPages}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={categoryPage >= totalPages || loading}
                          onClick={() => setCategoryPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          )
        )}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Category" : "Create Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details below."
                : activeTab === "department"
                ? "Select a program first, then create a department for that program."
                : `Add a new ${currentEntityLabel.toLowerCase()} for your college.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Category Type removed; entity type inferred from active tab */}
              {/* Show program selector first for new departments */}
              {formData.entityType === "department" && !editingCategory && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    Step 1: Select Program
                  </p>
                  <p className="text-xs text-blue-700">
                    Choose which program this department belongs to. You can add this department to more programs later by editing it.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">
                  {formData.entityType === "department" && !editingCategory
                    ? "Department Name"
                    : "Name"}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={
                    formData.entityType === "department" &&
                    !editingCategory &&
                    !selectedProgramForDept
                  }
                  placeholder={
                    formData.entityType === "event_type"
                      ? "e.g., Hackathon, Alumni Meet"
                      : formData.entityType === "event_location"
                      ? "e.g., Main Auditorium, Online, Chennai"
                      : formData.entityType === "event_price_range"
                      ? "e.g., Free, 0-25, 100+"
                      : formData.entityType === "job_type"
                      ? "e.g., Freelance, Contract"
                      : formData.entityType === "job_experience"
                      ? "e.g., Junior, Senior"
                      : formData.entityType === "job_industry"
                      ? "e.g., AI/ML, FinTech"
                      : formData.entityType === "department"
                      ? !selectedProgramForDept && !editingCategory
                        ? "Select a program first"
                        : "e.g., Computer Science, Electrical Engineering"
                      : "e.g., Workshop, Full-time, Entry Level"
                  }
                  required
                />
                {formData.entityType === "department" &&
                  !editingCategory &&
                  !selectedProgramForDept && (
                    <p className="text-xs text-muted-foreground">
                      Please select a program above to continue
                    </p>
                  )}
                {formData.entityType === "event_price_range" && (
                  <p className="text-xs text-muted-foreground">
                    Allowed formats: Free, min-max (e.g., 0-25), min+ (e.g.,
                    100+)
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Optional description for this category"
                  rows={3}
                />
              </div>
              {/* Program selection for NEW department categories - must select program first */}
              {formData.entityType === "department" && !editingCategory && (
                <div className="space-y-2">
                  <Label htmlFor="selectProgram">
                    Select Program <span className="text-red-500">*</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      (Choose the program this department belongs to)
                    </span>
                  </Label>
                  {loadingPrograms ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading programs...
                    </div>
                  ) : availablePrograms.length === 0 ? (
                    <div className="border rounded-md p-4 bg-yellow-50 border-yellow-200">
                      <p className="text-sm text-yellow-800 font-medium mb-1">
                        No programs available
                      </p>
                      <p className="text-xs text-yellow-700">
                        Please create programs first before creating departments.
                      </p>
                    </div>
                  ) : (
                    <Select
                      value={selectedProgramForDept}
                      onValueChange={(value) => {
                        setSelectedProgramForDept(value);
                        setFormData({ ...formData, programs: [value] });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a program (required)" />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePrograms.map((program) => (
                          <SelectItem key={program._id} value={program._id}>
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {selectedProgramForDept && (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Department will be created for:{" "}
                      {availablePrograms.find((p) => p._id === selectedProgramForDept)?.name}
                    </p>
                  )}
                </div>
              )}

              {/* Programs selection for EDITING department categories - multi-select */}
              {formData.entityType === "department" && editingCategory && (
                <div className="space-y-2">
                  <Label htmlFor="programs">
                    Linked Programs
                    <span className="text-xs text-muted-foreground ml-2">
                      (Select which programs this department is available for)
                    </span>
                  </Label>
                  {loadingPrograms ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading programs...
                    </div>
                  ) : availablePrograms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No programs available. Please create programs first.
                    </p>
                  ) : (
                    <div className="border rounded-md p-3 max-h-48 overflow-y-auto space-y-2">
                      {availablePrograms.map((program) => (
                        <label
                          key={program._id}
                          className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={formData.programs.includes(program._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  programs: [...formData.programs, program._id],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  programs: formData.programs.filter(
                                    (id) => id !== program._id
                                  ),
                                });
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{program.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {formData.programs.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {formData.programs.length} program(s) selected
                    </p>
                  )}
                </div>
              )}
              {/* Display Order removed */}
              {editingCategory && (
                <div className="space-y-2">
                  <Label htmlFor="isActive">Status</Label>
                  <select
                    id="isActive"
                    value={formData.isActive ? "true" : "false"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isActive: e.target.value === "true",
                      })
                    }
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  (formData.entityType === "department" &&
                    !editingCategory &&
                    !selectedProgramForDept)
                }
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  "Update Category"
                ) : formData.entityType === "department" && !selectedProgramForDept ? (
                  "Select Program First"
                ) : (
                  "Create Category"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              category. If any items are using this category, you will need to
              change their category first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCategoryToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
