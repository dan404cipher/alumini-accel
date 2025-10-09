import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Image, X, Plus, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityId: string;
  onPostCreated?: () => void;
}

interface PostForm {
  title: string;
  content: string;
  type: "text" | "image";
  tags: string[];
  imageUrl?: string;
  priority: "high" | "medium" | "low";
  category: string;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  communityId,
  onPostCreated,
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [postForm, setPostForm] = useState<PostForm>({
    title: "",
    content: "",
    type: "text",
    tags: [],
    imageUrl: "",
    priority: "medium",
    category: "",
  });

  const postTypes = [
    {
      value: "text",
      label: "Text Post",
      icon: MessageCircle,
      description: "Share your thoughts",
    },
    {
      value: "image",
      label: "Image Post",
      icon: Image,
      description: "Share an image",
    },
  ];

  const handleInputChange = (field: string, value: string | string[]) => {
    setPostForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addTag = () => {
    if (tagInput.trim() && !postForm.tags.includes(tagInput.trim())) {
      setPostForm((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()],
      }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setPostForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle image upload
  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("image", file);
      formData.append("type", "community-post");

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/upload/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      console.log("Upload response:", data);

      if (data.success) {
        console.log("Upload response data:", data.data);
        // Construct the full URL for the image
        const baseUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
        const apiBaseUrl = baseUrl.replace("/api/v1", ""); // Remove /api/v1 to get the base URL
        const imageUrl = data.data.relativeUrl
          ? `${apiBaseUrl}${data.data.relativeUrl}`
          : data.data.url;
        console.log("Setting image URL:", imageUrl);
        setPostForm((prev) => ({
          ...prev,
          imageUrl: imageUrl,
          type: "image",
        }));
        toast({
          title: "Success",
          description: "Image uploaded successfully!",
        });
      } else {
        toast({
          title: "Upload failed",
          description: data.message || "Failed to upload image.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Validation
      if (!postForm.title.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide a title for your discussion.",
          variant: "destructive",
        });
        return;
      }

      if (!postForm.content.trim()) {
        toast({
          title: "Validation Error",
          description: "Please provide post content.",
          variant: "destructive",
        });
        return;
      }

      if (postForm.type === "image" && !postForm.imageUrl) {
        toast({
          title: "Validation Error",
          description: "Please upload an image for image posts.",
          variant: "destructive",
        });
        return;
      }

      // Prepare post data
      const postData: {
        title: string;
        content: string;
        type: string;
        tags: string[];
        mediaUrls?: string[];
        priority: string;
        category?: string;
      } = {
        title: postForm.title.trim(),
        content: postForm.content.trim(),
        type: postForm.type,
        tags: postForm.tags,
        priority: postForm.priority,
        category: postForm.category.trim() || undefined,
      };

      // Add image URL if it's an image post
      if (postForm.type === "image" && postForm.imageUrl) {
        postData.mediaUrls = [postForm.imageUrl];
      }

      // Submit post
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/community/${communityId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(postData),
        }
      );

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Discussion created successfully!",
        });

        // Reset form
        setPostForm({
          title: "",
          content: "",
          type: "text",
          tags: [],
          imageUrl: "",
          priority: "medium",
          category: "",
        });

        onClose();
        onPostCreated?.();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create discussion.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating discussion:", error);
      toast({
        title: "Error",
        description: "Failed to create discussion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedPostType = postTypes.find(
    (type) => type.value === postForm.type
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedPostType && <selectedPostType.icon className="w-5 h-5" />}
            Create New Discussion
          </DialogTitle>
          <DialogDescription>
            Share your thoughts or images with the community.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Post Type Selection */}
          <div className="space-y-3">
            <Label>Post Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {postTypes.map((type) => (
                <Button
                  key={type.value}
                  variant={postForm.type === type.value ? "default" : "outline"}
                  onClick={() => handleInputChange("type", type.value)}
                  className="h-auto p-4 flex flex-col items-center gap-2"
                >
                  <type.icon className="w-5 h-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{type.label}</div>
                    <div className="text-xs opacity-70">{type.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Discussion Title */}
          <div className="space-y-3">
            <Label htmlFor="title">Discussion Title *</Label>
            <Input
              id="title"
              placeholder="What's your discussion about?"
              value={postForm.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              maxLength={100}
            />
            <div className="text-sm text-gray-500 text-right">
              {postForm.title.length}/100 characters
            </div>
          </div>

          {/* Category */}
          <div className="space-y-3">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              placeholder="e.g., Job Referrals, Career Advice, Events"
              value={postForm.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              maxLength={50}
            />
            <div className="text-sm text-gray-500 text-right">
              {postForm.category.length}/50 characters
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={postForm.priority}
              onValueChange={(value) => handleInputChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={postForm.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={4}
              maxLength={2000}
            />
            <div className="text-sm text-gray-500 text-right">
              {postForm.content.length}/2000 characters
            </div>
          </div>

          {/* Image Upload */}
          {postForm.type === "image" && (
            <div className="space-y-3">
              <Label htmlFor="imageUpload">Upload Image *</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {postForm.imageUrl ? (
                  <div className="space-y-3">
                    <div className="text-xs text-gray-500 mb-2">
                      Image URL: {postForm.imageUrl}
                    </div>
                    <img
                      src={postForm.imageUrl}
                      alt="Uploaded"
                      className="max-h-48 mx-auto rounded-lg"
                      onError={(e) => {
                        console.error(
                          "Image failed to load:",
                          postForm.imageUrl
                        );
                        console.error("Image error:", e);
                      }}
                      onLoad={() => {
                        console.log(
                          "Image loaded successfully:",
                          postForm.imageUrl
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleInputChange("imageUrl", "")}
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remove Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">
                        Click to upload an image or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, GIF up to 5MB
                      </p>
                    </div>
                    <input
                      type="file"
                      id="imageUpload"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("imageUpload")?.click()
                      }
                      disabled={uploadingImage}
                    >
                      {uploadingImage ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Choose Image
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-3">
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {postForm.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {postForm.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => removeTag(tag)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || uploadingImage}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || uploadingImage}
            >
              {isSubmitting ? "Creating..." : "Create Discussion"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDiscussionModal;
