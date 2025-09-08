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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, MapPin, Clock } from "lucide-react";
import { eventAPI } from "@/lib/api";

interface Event {
  _id: string;
  title: string;
  description: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  maxAttendees: number;
  currentAttendees: number;
  price: number;
  tags: string[];
  image?: string;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface EditEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEventUpdated?: () => void;
}

export const EditEventDialog = ({
  open,
  onOpenChange,
  event,
  onEventUpdated,
}: EditEventDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    location: "",
    type: "",
    maxAttendees: "",
    price: "",
    priceType: "free", // "free" or "paid"
    tags: "",
    image: "",
  });

  // Populate form data when event changes
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDate: startDate.toISOString().split("T")[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endDate: endDate.toISOString().split("T")[0],
        endTime: endDate.toTimeString().slice(0, 5),
        location: event.location || "",
        type: event.type || "",
        maxAttendees: event.maxAttendees?.toString() || "",
        price: event.price?.toString() || "",
        priceType: event.price > 0 ? "paid" : "free",
        tags: event.tags?.join(", ") || "",
        image: event.image || "",
      });
    }
  }, [event]);

  const validateForm = () => {
    const errors: string[] = [];

    // Trim all string fields
    const trimmedTitle = formData.title.trim();
    const trimmedDescription = formData.description.trim();
    const trimmedLocation = formData.location.trim();
    const trimmedTags = formData.tags.trim();
    const trimmedImage = formData.image.trim();

    // Required field validation
    if (!trimmedTitle) errors.push("Event title is required");
    if (!trimmedDescription) errors.push("Event description is required");
    if (!formData.startDate) errors.push("Event start date is required");
    if (!formData.startTime) errors.push("Event start time is required");
    if (!formData.endDate) errors.push("Event end date is required");
    if (!formData.endTime) errors.push("Event end time is required");
    if (!trimmedLocation) errors.push("Event location is required");
    if (!formData.type) errors.push("Event type is required");
    if (!formData.maxAttendees) errors.push("Maximum attendees is required");
    if (!formData.priceType) errors.push("Event pricing type is required");

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
      trimmedDescription &&
      (trimmedDescription.length < 10 || trimmedDescription.length > 2000)
    ) {
      errors.push(
        `Description must be between 10 and 2000 characters (current: ${trimmedDescription.length})`
      );
    }

    if (
      trimmedLocation &&
      (trimmedLocation.length < 2 || trimmedLocation.length > 200)
    ) {
      errors.push(
        `Location must be between 2 and 200 characters (current: ${trimmedLocation.length})`
      );
    }

    // Date and time validation
    if (
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime
    ) {
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);
      const now = new Date();

      if (startDateTime <= now) {
        errors.push("Event start time must be in the future");
      }

      if (endDateTime <= startDateTime) {
        errors.push("End time must be after start time");
      }
    }

    // Numeric validation
    if (formData.maxAttendees) {
      if (
        isNaN(Number(formData.maxAttendees)) ||
        Number(formData.maxAttendees) < 1
      ) {
        errors.push("Maximum attendees must be a positive number");
      }
    }

    if (formData.priceType === "paid") {
      if (!formData.price) {
        errors.push("Price is required for paid events");
      } else if (isNaN(Number(formData.price)) || Number(formData.price) < 0) {
        errors.push("Price must be a non-negative number");
      }
    }

    // URL validation for image
    if (trimmedImage && !isValidUrl(trimmedImage)) {
      errors.push("Event image must be a valid URL");
    }

    // Tags validation
    if (trimmedTags) {
      const tagsArray = trimmedTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      if (tagsArray.some((tag) => tag.length > 50)) {
        errors.push("Each tag must be 50 characters or less");
      }
    }

    return errors;
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
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

      case "description":
        const trimmedDesc = value.trim();
        if (!trimmedDesc) {
          errors.push("Description is required");
        } else if (trimmedDesc.length < 10 || trimmedDesc.length > 2000) {
          errors.push(
            `Description must be between 10 and 2000 characters (current: ${trimmedDesc.length})`
          );
        }
        break;

      case "location":
        const trimmedLoc = value.trim();
        if (!trimmedLoc) {
          errors.push("Location is required");
        } else if (trimmedLoc.length < 2 || trimmedLoc.length > 200) {
          errors.push(
            `Location must be between 2 and 200 characters (current: ${trimmedLoc.length})`
          );
        }
        break;

      case "image":
        const trimmedImg = value.trim();
        if (trimmedImg && !isValidUrl(trimmedImg)) {
          errors.push("Image must be a valid URL");
        }
        break;

      case "maxAttendees":
        if (value && (isNaN(Number(value)) || Number(value) < 1)) {
          errors.push("Maximum attendees must be a positive number");
        }
        break;

      case "price":
        if (formData.priceType === "paid") {
          if (!value) {
            errors.push("Price is required for paid events");
          } else if (isNaN(Number(value)) || Number(value) < 0) {
            errors.push("Price must be a non-negative number");
          }
        }
        break;

      case "tags":
        if (value) {
          const tagsArray = value
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0);
          if (tagsArray.some((tag) => tag.length > 50)) {
            errors.push("Each tag must be 50 characters or less");
          }
        }
        break;
    }

    return errors[0] || null; // Return first error or null
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Clear previous error for this field
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });

    // Validate field if it has content
    if (value.trim()) {
      const error = validateField(fieldName, value);
      if (error) {
        setFieldErrors((prev) => ({ ...prev, [fieldName]: error }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!event) return;

    // Validate form using comprehensive validation
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      // Show validation errors in form fields instead of toast
      const fieldErrorMap: { [key: string]: string } = {};

      // Map validation errors to specific fields
      validationErrors.forEach((error) => {
        if (error.includes("Title")) {
          fieldErrorMap.title = error;
        } else if (error.includes("Description")) {
          fieldErrorMap.description = error;
        } else if (error.includes("Location")) {
          fieldErrorMap.location = error;
        } else if (error.includes("Event start time")) {
          fieldErrorMap.startTime = error;
        } else if (error.includes("End time must be")) {
          fieldErrorMap.endTime = error;
        } else if (error.includes("Maximum attendees")) {
          fieldErrorMap.maxAttendees = error;
        } else if (error.includes("Event pricing type")) {
          fieldErrorMap.priceType = error;
        } else if (error.includes("Price")) {
          fieldErrorMap.price = error;
        } else if (error.includes("Image")) {
          fieldErrorMap.image = error;
        } else if (error.includes("tag")) {
          fieldErrorMap.tags = error;
        } else if (error.includes("required")) {
          // For required field errors, show on the first empty field
          if (!formData.title.trim()) fieldErrorMap.title = error;
          else if (!formData.description.trim())
            fieldErrorMap.description = error;
          else if (!formData.location.trim()) fieldErrorMap.location = error;
          else if (!formData.startDate) fieldErrorMap.startDate = error;
          else if (!formData.startTime) fieldErrorMap.startTime = error;
          else if (!formData.endDate) fieldErrorMap.endDate = error;
          else if (!formData.endTime) fieldErrorMap.endTime = error;
          else if (!formData.type) fieldErrorMap.type = error;
          else if (!formData.maxAttendees) fieldErrorMap.maxAttendees = error;
          else if (!formData.priceType) fieldErrorMap.priceType = error;
        }
      });

      // Handle specific field requirements
      if (!formData.title.trim())
        fieldErrorMap.title = "Event title is required";
      if (!formData.description.trim())
        fieldErrorMap.description = "Event description is required";
      if (!formData.location.trim())
        fieldErrorMap.location = "Event location is required";
      if (!formData.startDate)
        fieldErrorMap.startDate = "Event start date is required";
      if (!formData.startTime)
        fieldErrorMap.startTime = "Event start time is required";
      if (!formData.endDate)
        fieldErrorMap.endDate = "Event end date is required";
      if (!formData.endTime)
        fieldErrorMap.endTime = "Event end time is required";
      if (!formData.type) fieldErrorMap.type = "Event type is required";
      if (!formData.maxAttendees)
        fieldErrorMap.maxAttendees = "Maximum attendees is required";
      if (!formData.priceType)
        fieldErrorMap.priceType = "Event pricing type is required";

      setFieldErrors(fieldErrorMap);
      return;
    }

    setIsLoading(true);

    try {
      // Prepare event data for API
      const startDateTime = new Date(
        `${formData.startDate}T${formData.startTime}`
      );
      const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

      const trimmedTitle = formData.title.trim();
      const trimmedDescription = formData.description.trim();
      const trimmedLocation = formData.location.trim();
      const trimmedImage = formData.image.trim();
      const trimmedTags = formData.tags.trim();

      const eventData: any = {
        title: trimmedTitle,
        description: trimmedDescription,
        type: formData.type,
        startDate: startDateTime.toISOString(),
        endDate: endDateTime.toISOString(),
        location: trimmedLocation,
        isOnline: formData.type === "webinar" ? true : false,
        // Only add meetingLink for webinars and if it's a valid URL
        ...(formData.type === "webinar" && trimmedLocation.startsWith("http")
          ? { meetingLink: trimmedLocation }
          : {}),
      };

      // Only add optional fields if they have values
      if (formData.maxAttendees) {
        eventData.maxAttendees = parseInt(formData.maxAttendees);
      }
      if (formData.priceType === "paid" && formData.price) {
        eventData.price = parseFloat(formData.price);
      } else if (formData.priceType === "free") {
        eventData.price = 0;
      }
      if (trimmedTags) {
        eventData.tags = trimmedTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
      }
      if (trimmedImage) {
        eventData.image = trimmedImage;
      }

      console.log("Event data being sent:", eventData);
      const response = await eventAPI.updateEvent(event._id, eventData);
      console.log("API response:", response);

      if (response.success) {
        toast({
          title: "Event Updated Successfully",
          description: `${formData.title} has been updated successfully.`,
        });

        onOpenChange(false);

        // Notify parent component to refresh events
        if (onEventUpdated) {
          onEventUpdated();
        }
      } else {
        // Handle API error response
        let errorMessage = response.message || "Failed to update event";
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
    } catch (error: any) {
      console.error("Unexpected error updating event:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Edit Event
          </DialogTitle>
          <DialogDescription>
            Update the event details. All registered alumni will be notified of
            changes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder="Tech Alumni Meetup 2024"
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
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              placeholder="Describe the event, activities, and what attendees can expect..."
              className={`min-h-[100px] ${
                fieldErrors.description ? "border-red-500" : ""
              }`}
              required
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {formData.description.length}/2000 characters (minimum 10)
              </p>
              {fieldErrors.description && (
                <p className="text-xs text-red-500">
                  {fieldErrors.description}
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setFormData({ ...formData, startDate: e.target.value });
                  if (fieldErrors.startDate) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.startDate;
                      return newErrors;
                    });
                  }
                }}
                required
                className={fieldErrors.startDate ? "border-red-500" : ""}
              />
              {fieldErrors.startDate && (
                <p className="text-xs text-red-500">{fieldErrors.startDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => {
                  setFormData({ ...formData, startTime: e.target.value });
                  if (fieldErrors.startTime) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.startTime;
                      return newErrors;
                    });
                  }
                }}
                required
                className={fieldErrors.startTime ? "border-red-500" : ""}
              />
              {fieldErrors.startTime && (
                <p className="text-xs text-red-500">{fieldErrors.startTime}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                min={
                  formData.startDate || new Date().toISOString().split("T")[0]
                }
                onChange={(e) => {
                  setFormData({ ...formData, endDate: e.target.value });
                  if (fieldErrors.endDate) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.endDate;
                      return newErrors;
                    });
                  }
                }}
                required
                className={fieldErrors.endDate ? "border-red-500" : ""}
              />
              {fieldErrors.endDate && (
                <p className="text-xs text-red-500">{fieldErrors.endDate}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => {
                  setFormData({ ...formData, endTime: e.target.value });
                  if (fieldErrors.endTime) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.endTime;
                      return newErrors;
                    });
                  }
                }}
                required
                className={fieldErrors.endTime ? "border-red-500" : ""}
              />
              {fieldErrors.endTime && (
                <p className="text-xs text-red-500">{fieldErrors.endTime}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleFieldChange("location", e.target.value)}
                placeholder="University Campus or Virtual"
                required
                className={fieldErrors.location ? "border-red-500" : ""}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">
                  {formData.location.length}/200 characters (minimum 2)
                </p>
                {fieldErrors.location && (
                  <p className="text-xs text-red-500">{fieldErrors.location}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Event Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value });
                  if (fieldErrors.type) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.type;
                      return newErrors;
                    });
                  }
                }}
              >
                <SelectTrigger
                  className={fieldErrors.type ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="career_fair">Career Fair</SelectItem>
                  <SelectItem value="reunion">Reunion</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.type && (
                <p className="text-xs text-red-500">{fieldErrors.type}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxAttendees">Max Attendees *</Label>
              <Input
                id="maxAttendees"
                type="number"
                value={formData.maxAttendees}
                onChange={(e) =>
                  handleFieldChange("maxAttendees", e.target.value)
                }
                placeholder="100"
                required
                className={fieldErrors.maxAttendees ? "border-red-500" : ""}
              />
              {fieldErrors.maxAttendees && (
                <p className="text-xs text-red-500">
                  {fieldErrors.maxAttendees}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Event Pricing *</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="free"
                      name="priceType"
                      value="free"
                      checked={formData.priceType === "free"}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          priceType: e.target.value,
                          price: "",
                        });
                        if (fieldErrors.price) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.price;
                            return newErrors;
                          });
                        }
                        if (fieldErrors.priceType) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.priceType;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    <Label htmlFor="free" className="text-sm font-normal">
                      Free Event
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="paid"
                      name="priceType"
                      value="paid"
                      checked={formData.priceType === "paid"}
                      onChange={(e) => {
                        setFormData({ ...formData, priceType: e.target.value });
                        if (fieldErrors.priceType) {
                          setFieldErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.priceType;
                            return newErrors;
                          });
                        }
                      }}
                    />
                    <Label htmlFor="paid" className="text-sm font-normal">
                      Paid Event
                    </Label>
                  </div>
                </div>
                {fieldErrors.priceType && (
                  <p className="text-xs text-red-500">
                    {fieldErrors.priceType}
                  </p>
                )}
                {formData.priceType === "paid" && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (USD) *</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) =>
                          handleFieldChange("price", e.target.value)
                        }
                        placeholder="25.00"
                        className={`pl-8 ${
                          fieldErrors.price ? "border-red-500" : ""
                        }`}
                      />
                    </div>
                    {fieldErrors.price && (
                      <p className="text-xs text-red-500">
                        {fieldErrors.price}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="image">Event Image URL</Label>
            <Input
              id="image"
              value={formData.image}
              onChange={(e) => handleFieldChange("image", e.target.value)}
              placeholder="https://example.com/event-image.jpg"
              className={fieldErrors.image ? "border-red-500" : ""}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Optional: Add an image URL to make your event more attractive
              </p>
              {fieldErrors.image && (
                <p className="text-xs text-red-500">{fieldErrors.image}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleFieldChange("tags", e.target.value)}
              placeholder="Networking, Technology, Career (comma separated)"
              className={fieldErrors.tags ? "border-red-500" : ""}
            />
            {fieldErrors.tags && (
              <p className="text-xs text-red-500">{fieldErrors.tags}</p>
            )}
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
              {isLoading ? "Updating Event..." : "Update Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
