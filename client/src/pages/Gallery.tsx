import React, { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { galleryAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  category: string;
  tags?: string[];
}

const Gallery: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [galleries, setGalleries] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

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

  const categories = [
    "Events",
    "Campus",
    "Sports",
    "Academic",
    "Cultural",
    "Other",
  ];

  // Check if user can create galleries (admin or coordinator)
  const canCreateGallery =
    user && (user.role === "super_admin" || user.role === "coordinator");

  useEffect(() => {
    fetchGalleries();
  }, [selectedCategory]);

  const fetchGalleries = async () => {
    try {
      setLoading(true);
      const response = await galleryAPI.getAllGalleries({
        category: selectedCategory === "all" ? undefined : selectedCategory,
        limit: 20,
      });

      if (response.success) {
        setGalleries(response.data.galleries);
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
  };

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

      // Validate file types
      const invalidFiles = files.filter(
        (file) => !file.type.startsWith("image/")
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
        images: uploadResponse.data.images,
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
    } catch (error: any) {
      console.error("Error creating gallery:", error);

      let errorMessage = "Failed to create gallery";
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please log in again.";
      } else if (error.response?.status === 403) {
        errorMessage =
          "Permission denied. Only admins and coordinators can create galleries.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
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

    // For static files, use the base URL without /api/v1
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
    const staticBaseUrl = baseUrl.replace("/api/v1", "");
    const url = `${staticBaseUrl}${imagePath}`;

    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab="" onTabChange={() => {}} />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">Photo Gallery</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
            Explore our collection of memorable moments, events, and campus life
          </p>

          {/* Category Filter */}
          <div className="flex justify-center gap-2 flex-wrap">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              className="text-white border-white bg-gray-400 hover:bg-white hover:text-blue-600"
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="text-white bg-gray-400 border-white hover:bg-white hover:text-blue-600"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Create Gallery Button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {canCreateGallery ? (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Gallery
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Gallery</DialogTitle>
                <DialogDescription>
                  Create a new photo gallery with title, description, and
                  images. Only admins and coordinators can create galleries.
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
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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
                      const files = Array.from(e.dataTransfer.files).filter(
                        (file) => file.type.startsWith("image/")
                      );
                      if (files.length > 0) {
                        setSelectedImages(files);
                        const previews = files.map((file) =>
                          URL.createObjectURL(file)
                        );
                        setImagePreviews(previews);
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
                  <Button
                    onClick={handleCreateGallery}
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Gallery"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-600">
              {!user ? (
                <>
                  Please{" "}
                  <a href="/login" className="text-blue-600 hover:underline">
                    log in
                  </a>{" "}
                  to create galleries
                </>
              ) : (
                <>Only admins and coordinators can create galleries</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Gallery Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading galleries...</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No galleries found for this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {galleries.map((gallery) => (
              <Card
                key={gallery._id}
                className="overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={getImageUrl(gallery.images[0])}
                    alt={gallery.title}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.currentTarget.src =
                        "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                    }}
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                      {gallery.title}
                    </h3>
                    <Badge variant="secondary" className="ml-2 flex-shrink-0">
                      {gallery.category}
                    </Badge>
                  </div>

                  {gallery.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {gallery.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(gallery.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
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

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {gallery.images.length} image
                      {gallery.images.length !== 1 ? "s" : ""}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewGallery(gallery)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Gallery
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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
                    <img
                      src={getImageUrl(imageUrl)}
                      alt={`${selectedGallery.title} - Image ${index + 1}`}
                      className="w-full h-64 object-cover rounded-lg border shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => {
                        // Open image in new tab for full view
                        window.open(getImageUrl(imageUrl), "_blank");
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIE5vdCBGb3VuZDwvdGV4dD48L3N2Zz4=";
                      }}
                    />
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Gallery;
