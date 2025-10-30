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
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
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
    "events" | "jobs" | "community" | "mentorship" | "donations" | "gallery"
  >("events");
  const [activeTab, setActiveTab] = useState<string>("community");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
        // Sort by order, then by name
        allCategories.sort((a, b) => {
          if (a.order !== b.order) return a.order - b.order;
          return a.name.localeCompare(b.name);
        });
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
          name: trimmedName,
        });
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        await categoryAPI.create({
          ...formData,
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
      : "Manage community-related categories available to users when creating communities.";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Category Management</h2>
          <div className="mt-3">
            <Tabs
              value={primarySection}
              onValueChange={(v) => setPrimarySection(v as any)}
            >
              <TabsList className="grid w-full grid-cols-6 max-w-[1100px]">
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="jobs">Jobs</TabsTrigger>
                <TabsTrigger value="community">Community</TabsTrigger>
                <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
                <TabsTrigger value="donations">Donations</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-muted-foreground mt-3">{sectionDescription}</p>
          </div>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Add {currentEntityLabel.split(" ")[0]}
        </Button>
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
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center p-8 bg-muted rounded-lg">
                  <p className="text-muted-foreground">
                    No {entity.label.toLowerCase()} found. Create your first one
                    to get started.
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-20">Order</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Status</TableHead>
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories
                        .filter((cat) => cat.entityType === entity.value)
                        .map((category) => (
                          <TableRow key={category._id}>
                            <TableCell>{category.order}</TableCell>
                            <TableCell className="font-medium">
                              {category.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {category.description || "-"}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  category.isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {category.isActive ? "Active" : "Inactive"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(category)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                {canDelete && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteClick(category._id)
                                    }
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
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
              {!editingCategory && (
                <div className="space-y-2">
                  <Label htmlFor="entityType">Category Type</Label>
                  <Select
                    value={formData.entityType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, entityType: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((entity) => (
                        <SelectItem key={entity.value} value={entity.value}>
                          {entity.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first. Categories are sorted by order,
                  then alphabetically.
                </p>
              </div>
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
