import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Image as ImageIcon } from "lucide-react";
import { newsAPI } from "@/lib/api";

interface News {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface EditNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: News | null;
  onNewsUpdated?: () => void;
}

export const EditNewsDialog = ({
  open,
  onOpenChange,
  news,
  onNewsUpdated,
}: EditNewsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    isShared: false,
    imageFile: null as File | null,
  });

  // Populate form data when news changes
  useEffect(() => {
    if (news) {
      setFormData({
        title: news.title || "",
        summary: news.summary || "",
        isShared: news.isShared || false,
        imageFile: null,
      });
    }
  }, [news]);

  const validateForm = () => {
    const errors: string[] = [];

    // Trim all string fields
    const trimmedTitle = formData.title.trim();
    const trimmedSummary = formData.summary.trim();

    // Required field validation
    if (!trimmedTitle) errors.push("News title is required");
    if (!trimmedSummary) errors.push("News summary is required");

    // Length validation
    if (
      trimmedTitle &&
      (trimmedTitle.length < 5 || trimmedTitle.length > 200)
    ) {
      errors.push(
        `Title must be between 5 and 200 characters (current: ${trimmedTitle.length})`
      );
    }

    if (
      trimmedSummary &&
      (trimmedSummary.length < 10 || trimmedSummary.length > 5000)
    ) {
      errors.push(
        `Summary must be between 10 and 5000 characters (current: ${trimmedSummary.length})`
      );
    }

    return errors;
  };

  const validateField = (fieldName: string, value: string) => {
    const errors: string[] = [];

    switch (fieldName) {
      case "title":
        const trimmedTitle = value.trim();
        if (!trimmedTitle) {
          errors.push("Title is required");
        } else if (trimmedTitle.length < 5 || trimmedTitle.length > 200) {
          errors.push(
            `Title must be between 5 and 200 characters (current: ${trimmedTitle.length})`
          );
        }
        break;

      case "summary":
        const trimmedSummary = value.trim();
        if (!trimmedSummary) {
          errors.push("Summary is required");
        } else if (trimmedSummary.length < 10 || trimmedSummary.length > 5000) {
          errors.push(
            `Summary must be between 10 and 5000 characters (current: ${trimmedSummary.length})`
          );
        }
        break;
    }

    return errors[0] || null; // Return first error or null
  };

  const handleFieldChange = (fieldName: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear previous error for this field
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Validate field if it has content
    if (typeof value === "string" && value.trim()) {
      const error = validateField(fieldName, value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (PNG, JPG, GIF, etc.)",
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

      setFormData({
        ...formData,
        imageFile: file,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!news) return;

    // Validate form using comprehensive validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      // Show validation errors in form fields instead of toast
      const fieldErrorMap: { [key: string]: string } = {};

      // Map validation errors to specific fields
      validationErrors.forEach((error) => {
        if (error.includes("Title")) {
          fieldErrorMap.title = error;
        } else if (error.includes("Summary")) {
          fieldErrorMap.summary = error;
        }
      });

      // Handle specific field requirements
      if (!formData.title.trim())
        fieldErrorMap.title = "News title is required";
      if (!formData.summary.trim())
        fieldErrorMap.summary = "News summary is required";

      setFieldErrors(fieldErrorMap);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare news data for API
      const trimmedTitle = formData.title.trim();
      const trimmedSummary = formData.summary.trim();

      const newsData = {
        title: trimmedTitle,
        summary: trimmedSummary,
        isShared: formData.isShared,
      };

      // Handle image file upload
      let response;
      if (formData.imageFile) {
        const formDataToSend = new FormData();

        // Add all news data as JSON
        formDataToSend.append("newsData", JSON.stringify(newsData));

        // Add the image file
        formDataToSend.append("image", formData.imageFile);

        response = await newsAPI.updateNewsWithImage(news._id, formDataToSend);
      } else {
        response = await newsAPI.updateNews(news._id, newsData);
      }

      if (response.success) {
        toast({
          title: "News Updated Successfully",
          description: `${formData.title} has been updated successfully.`,
        });

        onOpenChange(false);

        // Notify parent component to refresh news
        if (onNewsUpdated) {
          onNewsUpdated();
        }
      } else {
        // Handle API error response
        let errorMessage = response.message || "Failed to update news";
        if (response.errors) {
          if (Array.isArray(response.errors)) {
            errorMessage = response.errors.join(", ");
          } else {
            errorMessage = response.errors;
          }
        }

        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }
    } catch (error: unknown) {
      console.error("Unexpected error updating news:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!news) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Edit News Article
          </DialogTitle>
          <DialogDescription>
            Update the news article details.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">News Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Alumni Success Story: John Doe's Journey"
              required
              className={fieldErrors.title ? "border-red-500" : ""}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formData.title.length}/200 characters (minimum 5)
              </p>
              {fieldErrors.title && (
                <p className="text-xs text-red-500">{fieldErrors.title}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => handleFieldChange("summary", e.target.value)}
              placeholder="Write a brief summary of the news article..."
              className={`min-h-[200px] ${
                fieldErrors.summary ? "border-red-500" : ""
              }`}
              required
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formData.summary.length}/5000 characters (minimum 10)
              </p>
              {fieldErrors.summary && (
                <p className="text-xs text-red-500">{fieldErrors.summary}</p>
              )}
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="space-y-3">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="imageFile" className="text-sm font-medium">
                Upload New Image (Optional)
              </Label>
              <Input
                id="imageFile"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Upload a new image to replace the current one (PNG,
                JPG, GIF up to 5MB)
              </p>
            </div>

            {/* New Image Preview */}
            {formData.imageFile && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Image Preview</Label>
                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(formData.imageFile)}
                    alt="News preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Current Image Display */}
            {news.image && !formData.imageFile && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Image</Label>
                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                  <img
                    src={
                      news.image.startsWith("http")
                        ? news.image
                        : `${
                            import.meta.env.VITE_API_URL?.replace(
                              "/api/v1",
                              ""
                            ) || "http://localhost:3000"
                          }${news.image}`
                    }
                    alt="Current news image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Upload a new image above to replace this one
                </p>
              </div>
            )}
          </div>

          {/* Share Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="isShared" className="text-base">
                Share with Community
              </Label>
              <p className="text-sm text-muted-foreground">
                Make this news visible to all alumni
              </p>
            </div>
            <Switch
              id="isShared"
              checked={formData.isShared}
              onCheckedChange={(checked) =>
                handleFieldChange("isShared", checked)
              }
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading ? "Updating News..." : "Update News"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditNewsDialog;
