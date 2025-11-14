import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { getAuthTokenOrNull } from "@/utils/auth";
import { Community } from "./types";
import { useToast } from "@/hooks/use-toast";

interface EditCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  community: Community | null;
  onSuccess: () => void;
}

const EditCommunityModal: React.FC<EditCommunityModalProps> = ({
  isOpen,
  onClose,
  community,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    type: "public",
    tags: [] as string[],
    rules: [] as string[],
    externalLinks: {
      website: "",
      github: "",
      slack: "",
      discord: "",
      other: "",
    },
    coverImage: null as File | null,
    logo: null as File | null,
  });

  // Initialize form data when community changes
  useEffect(() => {
    if (community) {
      setFormData({
        name: community.name || "",
        description: community.description || "",
        category: community.category || "",
        type:
          community.type === "open"
            ? "public"
            : community.type === "closed"
            ? "private"
            : "hidden",
        tags: community.tags || [],
        rules: community.rules || [],
        externalLinks: {
          website: community.externalLinks?.website || "",
          github: community.externalLinks?.github || "",
          slack: community.externalLinks?.slack || "",
          discord: community.externalLinks?.discord || "",
          other: "",
        },
        coverImage: null,
        logo: null,
      });
    }
  }, [community]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Helper functions for tags
  const addTag = (tag: string) => {
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Helper functions for rules
  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }));
  };

  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  // Handle external links
  const handleExternalLinkChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      externalLinks: {
        ...prev.externalLinks,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!community?._id) return;

    setLoading(true);
    try {
      const submitData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        type:
          formData.type === "public"
            ? "open"
            : formData.type === "private"
            ? "closed"
            : "hidden",
        tags: formData.tags,
        rules: formData.rules.filter((rule) => rule.trim()),
        externalLinks: formData.externalLinks,
      };

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
        }/communities/${community._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Community updated successfully",
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to update community",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update community",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "department", label: "Department" },
    { value: "batch", label: "Batch" },
    { value: "interest", label: "Interest" },
    { value: "professional", label: "Professional" },
    { value: "location", label: "Location" },
    { value: "academic_research", label: "Academic & Research" },
    { value: "professional_career", label: "Professional & Career" },
    {
      value: "entrepreneurship_startups",
      label: "Entrepreneurship & Startups",
    },
    { value: "social_hobby", label: "Social & Hobby" },
    { value: "mentorship_guidance", label: "Mentorship & Guidance" },
    { value: "events_meetups", label: "Events & Meetups" },
    {
      value: "community_support_volunteering",
      label: "Community Support & Volunteering",
    },
    { value: "technology_deeptech", label: "Technology & DeepTech" },
    { value: "regional_chapter_based", label: "Regional / Chapter-based" },
    { value: "sports", label: "Sports & Recreation" },
    { value: "cultural", label: "Cultural" },
    { value: "other", label: "Other" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Community</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            {/* Community Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Community Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter community name"
                required
              />
              <p className="text-xs text-gray-500">
                {formData.name.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Describe your community"
                rows={3}
                required
              />
              <p className="text-xs text-gray-500">
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Category and Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    handleInputChange("category", value)
                  }
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
              <div className="space-y-2">
                <Label htmlFor="type">Community Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select community type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="hidden">Hidden</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Media Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Media</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coverImage">Cover Image</Label>
                <Input
                  id="coverImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData((prev) => ({
                        ...prev,
                        coverImage: file,
                      }));
                    }
                  }}
                />
                {formData.coverImage && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      ✓ {formData.coverImage.name}
                    </p>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData((prev) => ({
                        ...prev,
                        logo: file,
                      }));
                    }
                  }}
                />
                {formData.logo && (
                  <div className="mt-2">
                    <p className="text-sm text-green-600">
                      ✓ {formData.logo.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tags</h3>
            <div>
              <Label htmlFor="tags-input">Add Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="tags-input"
                  placeholder="Enter a tag..."
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const tagValue = e.currentTarget.value.trim();
                      if (tagValue) {
                        addTag(tagValue);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const input = document.getElementById(
                      "tags-input"
                    ) as HTMLInputElement;
                    if (input.value) {
                      const tagValue = input.value.trim();
                      addTag(tagValue);
                      input.value = "";
                    }
                  }}
                >
                  Add
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.tags.length}/10 tags (max 20 characters each)
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-primary hover:text-primary/70"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rules & Guidelines */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rules & Guidelines</h3>
            <div>
              <Label>Community Rules</Label>
              <div className="space-y-2 mt-2">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={`Rule ${index + 1}`}
                      value={rule}
                      onChange={(e) => updateRule(index, e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRule(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRule}
                  className="w-full"
                >
                  Add Rule
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.rules.filter((rule) => rule.trim()).length}/15 rules
                (max 200 characters each)
              </p>
            </div>
          </div>

          {/* External Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">External Links</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.externalLinks.website}
                  onChange={(e) =>
                    handleExternalLinkChange("website", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="github">GitHub</Label>
                <Input
                  id="github"
                  type="url"
                  placeholder="https://github.com/username"
                  value={formData.externalLinks.github}
                  onChange={(e) =>
                    handleExternalLinkChange("github", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="slack">Slack</Label>
                <Input
                  id="slack"
                  type="url"
                  placeholder="https://workspace.slack.com"
                  value={formData.externalLinks.slack}
                  onChange={(e) =>
                    handleExternalLinkChange("slack", e.target.value)
                  }
                />
              </div>
              <div>
                <Label htmlFor="discord">Discord</Label>
                <Input
                  id="discord"
                  type="url"
                  placeholder="https://discord.gg/invite"
                  value={formData.externalLinks.discord}
                  onChange={(e) =>
                    handleExternalLinkChange("discord", e.target.value)
                  }
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="other">Other Link</Label>
                <Input
                  id="other"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.externalLinks.other}
                  onChange={(e) =>
                    handleExternalLinkChange("other", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Community"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCommunityModal;
