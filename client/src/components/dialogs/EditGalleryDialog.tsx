import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { X, Upload, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { galleryAPI, categoryAPI } from "@/lib/api";

interface GalleryItem {
  _id: string;
  title: string;
  description?: string;
  images: string[];
  category: string;
  tags?: string[];
}

interface EditGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: GalleryItem | null;
  onSuccess: () => void;
}

const EditGalleryDialog: React.FC<EditGalleryDialogProps> = ({
  open,
  onOpenChange,
  gallery,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    tags: [] as string[],
    images: [] as string[],
  });
  const [newTag, setNewTag] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const lastPopulatedGalleryId = useRef<string | null>(null);
  const wasOpenRef = useRef(false);

  // Load gallery categories dynamically
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "gallery_category",
        });
        const names = Array.isArray(res.data)
          ? (res.data as any[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setCategories(names);
      } catch (_e) {
        // keep empty list if API fails
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Populate form data when gallery changes or dialog opens
  const galleryId = gallery?._id;
  useEffect(() => {
    // Handle dialog close - reset form
    if (!open) {
      if (wasOpenRef.current) {
        lastPopulatedGalleryId.current = null;
        setFormData({
          title: "",
          description: "",
          category: "",
          tags: [],
          images: [],
        });
        setPreviewImages([]);
        setUploadedFiles([]);
      }
      wasOpenRef.current = false;
      return;
    }

    // Handle dialog open - populate form
    if (open && gallery && galleryId) {
      wasOpenRef.current = true;

      // Check if we've already populated for this gallery to prevent unnecessary re-population
      if (lastPopulatedGalleryId.current === galleryId) {
        return;
      }

      setFormData({
        title: gallery.title || "",
        description: gallery.description || "",
        category: gallery.category || "",
        tags: gallery.tags ? [...gallery.tags] : [],
        images: gallery.images ? [...gallery.images] : [],
      });
      setPreviewImages(gallery.images ? [...gallery.images] : []);
      setUploadedFiles([]);
      lastPopulatedGalleryId.current = galleryId;
    }
  }, [galleryId, open, gallery]);

  const handleImageUpload = async (files: FileList) => {
    try {
      // Validate file types - must be specific image MIME types
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      const fileArray = Array.from(files);
      const invalidFiles = fileArray.filter(
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

      // Upload all images at once using the correct API signature
      const response = await galleryAPI.uploadImages(fileArray);
      if (response.success && response.data?.images) {
        const uploadedUrls = response.data.images;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }));
        setPreviewImages((prev) => [...prev, ...uploadedUrls]);

        toast({
          title: "Success",
          description: `${uploadedUrls.length} image(s) uploaded successfully`,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error",
        description: "Failed to upload images",
        variant: "destructive",
      });
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gallery) return;

    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "Category is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await galleryAPI.updateGallery(gallery._id, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        tags: formData.tags,
        images: formData.images,
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Gallery updated successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.message || "Failed to update gallery");
      }
    } catch (error) {
      console.error("Error updating gallery:", error);
      toast({
        title: "Error",
        description: "Failed to update gallery",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
  };

  if (!gallery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Gallery</DialogTitle>
          <DialogDescription>
            Update your gallery details, images, and tags.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Enter gallery title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Enter gallery description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <SelectItem value="__noopts__" disabled>
                    No categories available
                  </SelectItem>
                ) : (
                  categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Images</Label>
            <div className="space-y-4">
              {/* Image Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600 mb-2">
                  Click to upload images or drag and drop
                </p>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("image-upload")?.click()
                  }
                >
                  Choose Images
                </Button>
              </div>

              {/* Preview Images */}
              {previewImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {previewImages.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeImage(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Tags</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Enter tag"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {tag}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Gallery"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditGalleryDialog;
