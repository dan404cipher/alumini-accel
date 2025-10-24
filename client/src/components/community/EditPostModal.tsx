import React, { useState, useEffect } from "react";
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
import { getAuthTokenOrNull } from "@/utils/auth";

import { CommunityPost } from "./types";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: CommunityPost;
  onPostUpdated?: () => void;
}

interface PostForm {
  title: string;
  content: string;
  type: "text" | "image" | "video" | "poll" | "announcement";
  tags: string[];
  mediaUrls: string[];
  priority: "high" | "medium" | "low";
  category: string;
}

const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}) => {
  const { toast } = useToast();

  // Helper function to get auth token
  const getAuthToken = (): string => {
    const token = getAuthTokenOrNull();
    if (!token) {
      throw new Error("Access token is required");
    }
    return token;
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const [postForm, setPostForm] = useState<PostForm>({
    title: "",
    content: "",
    type: "text",
    tags: [],
    mediaUrls: [],
    priority: "medium",
    category: "",
  });

  // Initialize form with post data
  useEffect(() => {
    if (post) {
      setPostForm({
        title: post.title || "",
        content: post.content || "",
        type: post.type || "text",
        tags: post.tags || [],
        mediaUrls: post.mediaUrls || [],
        priority: post.priority || "medium",
        category: post.category || "",
      });
    }
  }, [post]);

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

  const categories = [
    { value: "general", label: "General Discussion" },
    { value: "announcement", label: "Announcement" },
    { value: "question", label: "Question" },
    { value: "job", label: "Job Opportunity" },
    { value: "event", label: "Event" },
    { value: "poll", label: "Poll" },
    { value: "news", label: "News" },
    { value: "other", label: "Other" },
  ];

  const priorities = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
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
        title: "Invalid File",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const token = getAuthToken();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/upload/image`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success) {
        setPostForm((prev) => ({
          ...prev,
          mediaUrls: [...prev.mediaUrls, data.data.url],
        }));
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } else {
        throw new Error(data.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      if (
        error instanceof Error &&
        error.message === "Access token is required"
      ) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to upload images.",
          variant: "destructive",
        });
        // Redirect to login
        window.location.href = "/login";
      } else {
        toast({
          title: "Error",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!postForm.title.trim() || !postForm.content.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both title and content",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/community-posts/${post._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: postForm.title,
            content: postForm.content,
            type: postForm.type,
            tags: postForm.tags,
            mediaUrls: postForm.mediaUrls,
            priority: postForm.priority,
            category: postForm.category,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Post updated successfully",
        });
        onPostUpdated?.();
        onClose();
      } else {
        throw new Error(data.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      if (
        error instanceof Error &&
        error.message === "Access token is required"
      ) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to update posts.",
          variant: "destructive",
        });
        // Redirect to login
        window.location.href = "/login";
      } else {
        toast({
          title: "Error",
          description: "Failed to update post. Please try again.",
          variant: "destructive",
        });
      }
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
            Edit Post
          </DialogTitle>
          <DialogDescription>
            Update your post content and settings.
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

          {/* Post Title */}
          <div className="space-y-3">
            <Label htmlFor="title">Post Title *</Label>
            <Input
              id="title"
              placeholder="What's your post about?"
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
            <Select
              value={postForm.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Post Content */}
          <div className="space-y-3">
            <Label htmlFor="content">Post Content *</Label>
            <Textarea
              id="content"
              placeholder="Share your thoughts..."
              value={postForm.content}
              onChange={(e) => handleInputChange("content", e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <div className="text-sm text-gray-500 text-right">
              {postForm.content.length}/2000 characters
            </div>
          </div>

          {/* Image Upload (for image posts) */}
          {postForm.type === "image" && (
            <div className="space-y-3">
              <Label>Images</Label>
              <div className="space-y-3">
                {postForm.mediaUrls.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {postForm.mediaUrls.map((url, index) => (
                      <div key={index} className="relative">
                        <img
                          src={url}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setPostForm((prev) => ({
                              ...prev,
                              mediaUrls: prev.mediaUrls.filter(
                                (_, i) => i !== index
                              ),
                            }));
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <Label
                    htmlFor="image-upload"
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {postForm.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  {tag}
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
            <div className="flex gap-2">
              <Input
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
              <Button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <div className="flex justify-end gap-3 pt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Update Post"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditPostModal;
