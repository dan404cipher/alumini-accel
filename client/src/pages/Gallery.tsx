import React, { useState, useEffect, useCallback } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { galleryAPI, categoryAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/ui/pagination";
import EditGalleryDialog from "@/components/dialogs/EditGalleryDialog";
import DeleteGalleryDialog from "@/components/dialogs/DeleteGalleryDialog";
import GalleryActionMenu from "@/components/gallery/GalleryActionMenu";

interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Plus,
  Upload,
  X,
  Calendar,
  User,
  Tag,
  ArrowLeft,
  Eye,
  Search,
  Filter,
  Menu,
  Image as ImageIcon,
  Heart,
  Download,
  Share2,
  Grid3X3,
  List,
  Star,
  Clock,
  Maximize2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  createdAt: string;
  category: string;
  tags?: string[];
  viewCount?: number;
}

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [selectedSortBy, setSelectedSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(12);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [galleryCategories, setGalleryCategories] = useState<string[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<{
    pages: number;
    total: number;
  } | null>(null);

  // Note: Backend already handles: search, category, dateRange, sortBy
  // No client-side filtering or sorting needed
  const sortedGalleries = galleries;

  // Create gallery form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Other",
    tags: "",
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedGallery, setSelectedGallery] = useState<GalleryItem | null>(
    null
  );
  const [showGalleryDetail, setShowGalleryDetail] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);

  // Load gallery categories dynamically
  useEffect(() => {
    let mounted = true;
    (async () => {
      // Only fetch categories if user is authenticated
      if (!user) {
        return;
      }
      try {
        const res = await categoryAPI.getAll({
          entityType: "gallery_category",
        });
        interface Category {
          name?: string;
        }
        const names = Array.isArray(res.data)
          ? (res.data as Category[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setGalleryCategories(names);
      } catch (error) {
        // Silently handle errors (401, network issues, etc.)
        // Categories are optional - gallery will work without them
        if (mounted) setGalleryCategories([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  // Check if user can create galleries (HOD, Staff, College Admin only)
  const canCreateGallery =
    user &&
    (user.role === "super_admin" ||
      user.role === "college_admin" ||
      user.role === "hod" ||
      user.role === "staff");

  const fetchGalleries = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: itemsPerPage,
        tenantId: user?.tenantId,
      };

      if (selectedCategory !== "all") {
        params.category = selectedCategory;
      }

      if (searchQuery) {
        params.search = searchQuery;
      }

      if (selectedDateRange !== "all") {
        params.dateRange = selectedDateRange;
      }

      if (selectedSortBy) {
        params.sortBy = selectedSortBy;
      }

      const response = await galleryAPI.getAllGalleries(params);

      if (response.success) {
        const data = response.data as {
          galleries: GalleryItem[];
          pagination?: { pages: number; total: number };
        };
        setGalleries(data.galleries);
        if (data.pagination) {
          setTotalPages(data.pagination.pages || 1);
          setPaginationInfo(data.pagination);
        }
      }
    } catch (error) {
      console.error("Error fetching galleries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch galleries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    selectedCategory,
    currentPage,
    itemsPerPage,
    user?.tenantId,
    searchQuery,
    selectedDateRange,
    selectedSortBy,
    toast,
  ]);

  useEffect(() => {
    fetchGalleries();
  }, [fetchGalleries]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedDateRange, selectedSortBy]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      // Check total count including existing images
      const totalCount = selectedImages.length + files.length;
      if (totalCount > 10) {
        toast({
          title: "Too Many Images",
          description: `You can only select up to 10 images total. You currently have ${selectedImages.length} images selected.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file sizes
      const oversizedFiles = files.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        toast({
          title: "File Too Large",
          description: `Some images are larger than 10MB. Please select smaller images.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file types - must be specific image MIME types
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const invalidFiles = files.filter(
        (file) => !allowedTypes.includes(file.type.toLowerCase())
      );
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid File Type",
          description: "Please select only image files (JPEG, PNG, GIF, WebP)",
          variant: "destructive",
        });
        return;
      }

      // Append new images to existing ones
      const newImages = [...selectedImages, ...files];
      setSelectedImages(newImages);

      // Create previews for new images and append to existing
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setImagePreviews([...imagePreviews, ...newPreviews]);

      // Show success message
      toast({
        title: "Images Added",
        description: `${files.length} image${
          files.length > 1 ? "s" : ""
        } added successfully (${newImages.length}/10 total)`,
      });

      // Clear the input so the same files can be selected again if needed
      e.target.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const addMoreImages = () => {
    document.getElementById("images")?.click();
  };

  const handleViewGallery = (gallery: GalleryItem) => {
    setSelectedGallery(gallery);
    setShowGalleryDetail(true);
  };

  const handleEditGallery = (gallery: GalleryItem) => {
    setSelectedGallery(gallery);
    setShowEditDialog(true);
  };

  const handleDeleteGallery = (gallery: GalleryItem) => {
    setSelectedGallery(gallery);
    setShowDeleteDialog(true);
  };

  const handleEditSuccess = () => {
    fetchGalleries();
    setShowEditDialog(false);
    setSelectedGallery(null);
  };

  const handleDeleteSuccess = () => {
    fetchGalleries();
    setShowDeleteDialog(false);
    setSelectedGallery(null);
  };

  const handleCreateGallery = async () => {
    if (!formData.title.trim() || selectedImages.length === 0) {
      toast({
        title: "Error",
        description: "Title and at least one image are required",
        variant: "destructive",
      });
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to create galleries",
        variant: "destructive",
      });
      return;
    }

    // Check if user has permission
    if (!canCreateGallery) {
      toast({
        title: "Permission Denied",
        description: "Only admins and coordinators can create galleries",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreateLoading(true);

      // Upload images first
      const uploadResponse = await galleryAPI.uploadImages(selectedImages);
      if (!uploadResponse.success) {
        throw new Error("Failed to upload images");
      }

      // Create gallery
      const galleryData = {
        title: formData.title,
        description: formData.description,
        images: (uploadResponse.data as { images: string[] }).images,
        category: formData.category,
        tags: formData.tags
          ? formData.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      const createResponse = await galleryAPI.createGallery(galleryData);
      if (createResponse.success) {
        toast({
          title: "Success",
          description: "Gallery created successfully",
        });

        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "Other",
          tags: "",
        });
        setSelectedImages([]);
        setImagePreviews([]);
        setShowCreateDialog(false);

        // Refresh galleries
        fetchGalleries();
      }
    } catch (error: unknown) {
      console.error("Error creating gallery:", error);

      let errorMessage = "Failed to create gallery";
      if ((error as ApiError)?.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if ((error as ApiError)?.response?.status === 403) {
        errorMessage =
          "Permission denied. Only admins and coordinators can create galleries.";
      } else if ((error as ApiError)?.response?.data?.message) {
        errorMessage = (error as ApiError).response.data.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const getImageUrl = (imagePath: string) => {
    if (imagePath.startsWith("http")) {
      return imagePath;
    }

    // For static files, use proxy path
    return imagePath;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab="gallery" onTabChange={() => {}} />
      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar */}
        <div
          className={`
        ${
          sidebarOpen
            ? "fixed inset-y-0 left-0 z-50"
            : "hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:z-40"
        }
        top-16 w-[280px] sm:w-80 flex-shrink-0 bg-background ${
          sidebarOpen ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"
        }
      `}
        >
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Filter className="w-5 h-5 mr-2" />
                    Photo Gallery
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <CardDescription>
                  Explore memorable moments and events
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Search Galleries */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Search Galleries
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search galleries, titles..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1 h-8 w-8 p-0"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold">Filters</h3>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {galleryCategories.length === 0 ? (
                          <SelectItem value="__noopts__" disabled>
                            No categories available
                          </SelectItem>
                        ) : (
                          galleryCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date Range</label>
                    <Select
                      value={selectedDateRange}
                      onValueChange={setSelectedDateRange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select date range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Dates</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="this_week">This Week</SelectItem>
                        <SelectItem value="this_month">This Month</SelectItem>
                        <SelectItem value="last_month">Last Month</SelectItem>
                        <SelectItem value="this_year">This Year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select
                      value={selectedSortBy}
                      onValueChange={setSelectedSortBy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sort option" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="title">Title A-Z</SelectItem>
                        <SelectItem value="images">Most Images</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Clear Filters */}
                  {(searchQuery ||
                    (selectedCategory && selectedCategory !== "all") ||
                    (selectedDateRange && selectedDateRange !== "all") ||
                    (selectedSortBy && selectedSortBy !== "newest")) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedCategory("all");
                        setSelectedDateRange("all");
                        setSelectedSortBy("newest");
                      }}
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
                </div>

                {/* Quick Actions - Only show if user can create galleries */}
                {canCreateGallery && (
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="text-sm font-semibold">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setShowCreateDialog(true)}
                        className="w-full justify-start"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Gallery
                      </Button>
                    </div>
                  </div>
                )}

                {/* View Mode */}
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="text-sm font-semibold">View Mode</h3>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className="flex-1"
                    >
                      <Grid3X3 className="w-4 h-4 mr-1" />
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "list" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("list")}
                      className="flex-1"
                    >
                      <List className="w-4 h-4 mr-1" />
                      List
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-y-auto ml-0 lg:ml-80 pt-4 lg:pt-6">
          <div className="space-y-4 sm:space-y-6 p-3 sm:p-4 lg:p-6 pb-20">
            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-2"
              >
                <Menu className="w-4 h-4" />
                Filters
              </Button>
            </div>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    Photo Gallery
                  </h1>
                  <p className="text-muted-foreground text-sm lg:text-base">
                    Explore memorable moments •{" "}
                    {paginationInfo?.total || sortedGalleries.length} galleries
                  </p>
                </div>
              </div>
            </div>

            {/* Gallery Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading galleries...</p>
              </div>
            ) : sortedGalleries.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No galleries found
                </h3>
                <p className="text-gray-600 mb-6">
                  {canCreateGallery
                    ? "Create your first gallery to get started."
                    : "Check back later for gallery updates."}
                </p>
                {canCreateGallery && (
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Gallery
                  </Button>
                )}
              </div>
            ) : (
              <div
                className={`grid gap-4 lg:gap-6 ${
                  viewMode === "grid"
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                    : "grid-cols-1"
                }`}
              >
                {sortedGalleries.map((gallery) => (
                  <Card
                    key={gallery._id}
                    className={`overflow-hidden hover:shadow-xl transition-shadow duration-300 ${
                      viewMode === "list"
                        ? "flex flex-col sm:flex-row"
                        : "flex flex-col"
                    }`}
                  >
                    <div
                      className={`${
                        viewMode === "list"
                          ? "sm:w-48 sm:h-32 flex-shrink-0"
                          : "aspect-w-16 aspect-h-9"
                      }`}
                    >
                      <img
                        src={getImageUrl(gallery.images[0])}
                        alt={gallery.title}
                        className={`${
                          viewMode === "list"
                            ? "w-full h-full object-cover"
                            : "w-full h-48 lg:h-64 object-cover"
                        }`}
                        onError={(e) => {
                          e.currentTarget.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                        }}
                      />
                    </div>
                    <CardContent
                      className={`${
                        viewMode === "list" ? "p-4 lg:p-6 flex-1" : "p-4 lg:p-6"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-2 gap-2">
                        <h3 className="text-base lg:text-xl font-semibold text-gray-900 line-clamp-2">
                          {gallery.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className="flex-shrink-0 text-xs"
                          >
                            {gallery.category}
                          </Badge>
                          <GalleryActionMenu
                            gallery={gallery}
                            currentUser={user}
                            onEdit={() => handleEditGallery(gallery)}
                            onDelete={() => handleDeleteGallery(gallery)}
                          />
                        </div>
                      </div>

                      {gallery.description && (
                        <p className="text-xs lg:text-sm text-gray-600 mb-4 line-clamp-3">
                          {gallery.description}
                        </p>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs lg:text-sm text-gray-500 mb-4 gap-2">
                        <div className="flex items-center">
                          <Calendar className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          {new Date(gallery.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <User className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          {gallery.createdBy?.firstName}{" "}
                          {gallery.createdBy?.lastName}
                        </div>
                      </div>

                      {gallery.tags && gallery.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {gallery.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {gallery.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{gallery.tags.length - 3} more
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-xs lg:text-sm text-gray-500">
                          {gallery.images.length} image
                          {gallery.images.length !== 1 ? "s" : ""}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewGallery(gallery)}
                          className="text-xs lg:text-sm"
                        >
                          <Eye className="w-3 h-3 lg:w-4 lg:h-4 mr-1" />
                          <span className="hidden sm:inline">View Gallery</span>
                          <span className="sm:hidden">View</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Gallery</DialogTitle>
              <DialogDescription>
                Create a new photo gallery with title, description, and images.
                Only admins and coordinators can create galleries.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Enter gallery title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Enter gallery description"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData({ ...formData, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {galleryCategories.length === 0 ? (
                      <SelectItem value="__noopts__" disabled>
                        No categories available
                      </SelectItem>
                    ) : (
                      galleryCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="e.g., graduation, ceremony, celebration"
                />
              </div>

              <div>
                <Label htmlFor="images">Images *</Label>

                {/* Drag and Drop Area */}
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("images")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(
                      "border-blue-400",
                      "bg-blue-50"
                    );
                  }}
                  onDragLeave={(e) => {
                    e.currentTarget.classList.remove(
                      "border-blue-400",
                      "bg-blue-50"
                    );
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(
                      "border-blue-400",
                      "bg-blue-50"
                    );
                    const allowedTypes = [
                      "image/jpeg",
                      "image/jpg",
                      "image/png",
                      "image/gif",
                      "image/webp",
                    ];
                    const files = Array.from(e.dataTransfer.files).filter(
                      (file) => allowedTypes.includes(file.type.toLowerCase())
                    );
                    if (files.length > 0) {
                      setSelectedImages(files);
                      const previews = files.map((file) =>
                        URL.createObjectURL(file)
                      );
                      setImagePreviews(previews);
                    } else {
                      toast({
                        title: "Invalid File Type",
                        description:
                          "Please drop only image files (JPEG, PNG, GIF, WebP)",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to select images or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports multiple images (up to 10, max 10MB each)
                  </p>
                </div>

                <Input
                  id="images"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        Selected Images ({imagePreviews.length}/10)
                      </h4>
                      <div className="flex gap-2">
                        {imagePreviews.length < 10 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMoreImages}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add More
                          </Button>
                        )}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedImages([]);
                            setImagePreviews([]);
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => removeImage(index)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                            {index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateGallery} disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Gallery"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Gallery Detail Dialog */}
        <Dialog open={showGalleryDetail} onOpenChange={setShowGalleryDetail}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-2xl font-bold">
                  {selectedGallery?.title}
                </DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGalleryDetail(false)}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Galleries
                </Button>
              </div>
            </DialogHeader>

            {selectedGallery && (
              <div className="space-y-6">
                {/* Gallery Info */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(selectedGallery.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {selectedGallery.createdBy?.firstName}{" "}
                    {selectedGallery.createdBy?.lastName}
                  </div>
                  <Badge variant="secondary">{selectedGallery.category}</Badge>
                  <span>
                    {selectedGallery.images.length} image
                    {selectedGallery.images.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Description */}
                {selectedGallery.description && (
                  <p className="text-gray-700 leading-relaxed">
                    {selectedGallery.description}
                  </p>
                )}

                {/* Tags */}
                {selectedGallery.tags && selectedGallery.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedGallery.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Images Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedGallery.images.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div
                        className="aspect-video overflow-hidden rounded-lg bg-gray-100 relative cursor-pointer"
                        onClick={() => {
                          setSelectedImageUrl(getImageUrl(imageUrl));
                          setSelectedImageIndex(index);
                          setIsImageModalOpen(true);
                        }}
                      >
                        <img
                          src={getImageUrl(imageUrl)}
                          alt={`${selectedGallery.title} - Image ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                          }}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center pointer-events-none">
                          <Maximize2 className="w-8 h-8 sm:w-10 sm:h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded z-10 pointer-events-none">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Gallery Dialog */}
        <EditGalleryDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          gallery={selectedGallery}
          onSuccess={handleEditSuccess}
        />

        {/* Delete Gallery Dialog */}
        <DeleteGalleryDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          gallery={selectedGallery}
          onSuccess={handleDeleteSuccess}
        />

        {/* Image Modal */}
        {selectedImageUrl && (
          <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
            <DialogContent className="max-w-[95vw] w-full h-[95vh] p-0 overflow-hidden">
              <div className="relative w-full h-full flex items-center justify-center bg-black min-h-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                  onClick={() => setIsImageModalOpen(false)}
                >
                  <X className="h-6 w-6" />
                </Button>
                {selectedGallery && selectedGallery.images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                      onClick={() => {
                        const prevIndex =
                          selectedImageIndex > 0
                            ? selectedImageIndex - 1
                            : selectedGallery.images.length - 1;
                        setSelectedImageIndex(prevIndex);
                        setSelectedImageUrl(
                          getImageUrl(selectedGallery.images[prevIndex])
                        );
                      }}
                      disabled={selectedGallery.images.length <= 1}
                    >
                      <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                      onClick={() => {
                        const nextIndex =
                          selectedImageIndex < selectedGallery.images.length - 1
                            ? selectedImageIndex + 1
                            : 0;
                        setSelectedImageIndex(nextIndex);
                        setSelectedImageUrl(
                          getImageUrl(selectedGallery.images[nextIndex])
                        );
                      }}
                      disabled={selectedGallery.images.length <= 1}
                    >
                      <ArrowLeft className="h-6 w-6 rotate-180" />
                    </Button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded">
                      Image {selectedImageIndex + 1} of{" "}
                      {selectedGallery.images.length}
                    </div>
                  </>
                )}
                <img
                  src={selectedImageUrl}
                  alt={
                    selectedGallery
                      ? `${selectedGallery.title} - Image ${
                          selectedImageIndex + 1
                        }`
                      : "Gallery image"
                  }
                  className="max-w-full max-h-full w-auto h-auto object-contain"
                  style={{ maxHeight: "calc(95vh - 2rem)" }}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
      </>
      <Footer />
    </div>
  );
};

export default Gallery;
