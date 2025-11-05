import { useState, useEffect } from "react";
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
  const [primarySection, setPrimarySection] = useState<
    "events" | "jobs" | "community" | "mentorship" | "donations" | "gallery" | "departments"
  >("events");
  const [activeTab, setActiveTab] = useState<string>("community");
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
  });

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
        setActiveTab(available[0]?.value || "community");
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
          ...(response.data || []),
          ...(inactiveResponse.data || []),
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
      if (editingCategory) {
        await categoryAPI.update(editingCategory._id, {
          ...formData,
          order: undefined as unknown as number, // ensure order not sent if removed
          name: trimmedName,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await categoryAPI.create({
          ...formData,
          order: undefined as unknown as number,
          name: trimmedName,
          entityType: activeTab,
        });
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

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      order: category.order,
      isActive: category.isActive,
      entityType: category.entityType,
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, entityType: activeTab }));
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      order: 0,
      isActive: true,
      entityType: activeTab,
    });
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
                : `Add a new ${currentEntityLabel.toLowerCase()} for your college.`}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Category Type removed; entity type inferred from active tab */}
              <div className="space-y-2">
                <Label htmlFor="name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
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
                      ? "e.g., Alumni Department, HOD Department, Staffs Department, Computer Science"
                      : "e.g., Workshop, Full-time, Entry Level"
                  }
                  required
                />
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
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  "Update Category"
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
