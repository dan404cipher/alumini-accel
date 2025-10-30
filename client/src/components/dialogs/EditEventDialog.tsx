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
import { eventAPI, categoryAPI } from "@/lib/api";

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
  registrationDeadline?: string;
  onlineUrl?: string;
  organizerNotes?: string;
  speakers?: Array<{
    name: string;
    title: string;
    company: string;
    bio: string;
  }>;
  agenda?: Array<{
    title: string;
    speaker: string;
    description: string;
  }>;
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
  const [eventTypes, setEventTypes] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "meetup", label: "Meetup" },
    { value: "workshop", label: "Workshop" },
    { value: "webinar", label: "Webinar" },
    { value: "conference", label: "Conference" },
    { value: "career_fair", label: "Career Fair" },
    { value: "reunion", label: "Reunion" },
  ]);
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
    registrationDeadline: "",
    imageFile: null as File | null,
    onlineUrl: "",
    organizerNotes: "",
    speakers: [] as Array<{
      name: string;
      title: string;
      company: string;
      bio: string;
    }>,
    agenda: [] as Array<{
      title: string;
      speaker: string;
      description: string;
    }>,
  });

  // Fetch custom event type categories
  useEffect(() => {
    const fetchEventTypes = async () => {
      try {
        const response = await categoryAPI.getAll({
          entityType: "event_type",
          isActive: "true",
        });
        console.log("Event types API response (EditDialog):", response);

        if (response.success && response.data && Array.isArray(response.data)) {
          const customTypes = response.data.map((cat: any) => ({
            value: cat._id,
            label: cat.name,
          }));
          console.log("Custom event types found (EditDialog):", customTypes);

          // Merge default types with custom categories
          const allTypes = [
            { value: "meetup", label: "Meetup" },
            { value: "workshop", label: "Workshop" },
            { value: "webinar", label: "Webinar" },
            { value: "conference", label: "Conference" },
            { value: "career_fair", label: "Career Fair" },
            { value: "reunion", label: "Reunion" },
            ...customTypes,
          ];
          console.log(
            "All event types (default + custom) (EditDialog):",
            allTypes
          );
          setEventTypes(allTypes);
        } else {
          console.warn(
            "Event types response format unexpected (EditDialog):",
            response
          );
          // Still use default types
          setEventTypes([
            { value: "meetup", label: "Meetup" },
            { value: "workshop", label: "Workshop" },
            { value: "webinar", label: "Webinar" },
            { value: "conference", label: "Conference" },
            { value: "career_fair", label: "Career Fair" },
            { value: "reunion", label: "Reunion" },
          ]);
        }
      } catch (error) {
        // If error, just use default types
        console.error(
          "Failed to fetch custom event types (EditDialog):",
          error
        );
        setEventTypes([
          { value: "meetup", label: "Meetup" },
          { value: "workshop", label: "Workshop" },
          { value: "webinar", label: "Webinar" },
          { value: "conference", label: "Conference" },
          { value: "career_fair", label: "Career Fair" },
          { value: "reunion", label: "Reunion" },
        ]);
      }
    };

    if (open) {
      fetchEventTypes();
    }
  }, [open]);

  // Populate form data when event changes
  useEffect(() => {
    if (event) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);

      // Check if dates are valid
      const isValidStartDate = !isNaN(startDate.getTime());
      const isValidEndDate = !isNaN(endDate.getTime());

      // Handle registration deadline
      const registrationDeadline = event.registrationDeadline
        ? new Date(event.registrationDeadline)
        : null;
      const isValidRegistrationDeadline =
        registrationDeadline && !isNaN(registrationDeadline.getTime());

      setFormData({
        title: event.title || "",
        description: event.description || "",
        startDate: isValidStartDate
          ? startDate.toISOString().split("T")[0]
          : "",
        startTime: isValidStartDate ? startDate.toTimeString().slice(0, 5) : "",
        endDate: isValidEndDate ? endDate.toISOString().split("T")[0] : "",
        endTime: isValidEndDate ? endDate.toTimeString().slice(0, 5) : "",
        location: event.location || "",
        type: event.type || "",
        maxAttendees: event.maxAttendees?.toString() || "",
        price: event.price?.toString() || "",
        priceType: event.price > 0 ? "paid" : "free",
        tags: event.tags?.join(", ") || "",
        registrationDeadline: isValidRegistrationDeadline
          ? registrationDeadline.toISOString().split("T")[0]
          : "",
        onlineUrl: event.onlineUrl || "",
        organizerNotes: event.organizerNotes || "",
        speakers: event.speakers || [],
        agenda: event.agenda || [],
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
        // Add onlineUrl for webinars if provided
        ...(formData.type === "webinar" && formData.onlineUrl
          ? { onlineUrl: formData.onlineUrl }
          : {}),
        // Add registration deadline if provided
        ...(formData.registrationDeadline
          ? {
              registrationDeadline: new Date(
                formData.registrationDeadline
              ).toISOString(),
            }
          : {}),
        // Add speakers if provided (filter out empty items)
        ...(formData.speakers.length > 0
          ? {
              speakers: formData.speakers.filter(
                (speaker) => speaker.name.trim() && speaker.title.trim()
              ),
            }
          : {}),
        // Add agenda if provided (filter out empty items)
        ...(formData.agenda.length > 0
          ? {
              agenda: formData.agenda.filter((item) => item.title.trim()),
            }
          : {}),
        // Add organizer notes if provided
        ...(formData.organizerNotes
          ? { organizerNotes: formData.organizerNotes }
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

      // Handle image file upload
      let response;
      if (formData.imageFile) {
        const formDataToSend = new FormData();

        // Add all event data as JSON
        formDataToSend.append("eventData", JSON.stringify(eventData));

        // Add the image file
        formDataToSend.append("image", formData.imageFile);

        response = await eventAPI.updateEventWithImage(
          event._id,
          formDataToSend
        );
      } else {
        response = await eventAPI.updateEvent(event._id, eventData);
      }

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
                  {eventTypes.map((eventType) => (
                    <SelectItem key={eventType.value} value={eventType.value}>
                      {eventType.label}
                    </SelectItem>
                  ))}
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
            <Label htmlFor="registrationDeadline">Registration Deadline</Label>
            <Input
              id="registrationDeadline"
              type="date"
              value={formData.registrationDeadline}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  registrationDeadline: e.target.value,
                });
                if (fieldErrors.registrationDeadline) {
                  setFieldErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.registrationDeadline;
                    return newErrors;
                  });
                }
              }}
              className={
                fieldErrors.registrationDeadline ? "border-red-500" : ""
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Set a deadline for event registration
            </p>
            {fieldErrors.registrationDeadline && (
              <p className="text-xs text-red-500">
                {fieldErrors.registrationDeadline}
              </p>
            )}
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

          {/* Image Upload Section */}
          <div className="space-y-3">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="imageFile" className="text-sm font-medium">
                Upload New Image File
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

            {/* Image Preview */}
            {formData.imageFile && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">New Image Preview</Label>
                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                  <img
                    src={URL.createObjectURL(formData.imageFile)}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}

            {/* Current Image Display */}
            {event?.image && !formData.imageFile && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Current Image</Label>
                <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                  <img
                    src={
                      event.image.startsWith("http")
                        ? event.image
                        : `${
                            import.meta.env.VITE_API_BASE_URL?.replace(
                              "/api/v1",
                              ""
                            ) || "http://localhost:3000"
                          }${event.image}`
                    }
                    alt="Current event image"
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

          {/* Online URL for webinars */}
          {formData.type === "webinar" && (
            <div className="space-y-2">
              <Label htmlFor="onlineUrl">Online Meeting URL</Label>
              <Input
                id="onlineUrl"
                value={formData.onlineUrl}
                onChange={(e) => handleFieldChange("onlineUrl", e.target.value)}
                placeholder="https://meet.google.com/abc-defg-hij"
                className={fieldErrors.onlineUrl ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                Enter the meeting link for this webinar
              </p>
              {fieldErrors.onlineUrl && (
                <p className="text-xs text-red-500">{fieldErrors.onlineUrl}</p>
              )}
            </div>
          )}

          {/* Organizer Notes */}
          <div className="space-y-2">
            <Label htmlFor="organizerNotes">Organizer Notes</Label>
            <Textarea
              id="organizerNotes"
              value={formData.organizerNotes}
              onChange={(e) =>
                handleFieldChange("organizerNotes", e.target.value)
              }
              placeholder="Internal notes about the event (not visible to attendees)..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Internal notes for event management (optional)
            </p>
          </div>

          {/* Speakers Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Speakers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    speakers: [
                      ...prev.speakers,
                      { name: "", title: "", company: "", bio: "" },
                    ],
                  }));
                }}
              >
                Add Speaker
              </Button>
            </div>

            {formData.speakers.map((speaker, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Speaker {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        speakers: prev.speakers.filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor={`speaker-name-${index}`}>Name *</Label>
                    <Input
                      id={`speaker-name-${index}`}
                      value={speaker.name}
                      onChange={(e) => {
                        const newSpeakers = [...formData.speakers];
                        newSpeakers[index].name = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          speakers: newSpeakers,
                        }));
                      }}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`speaker-title-${index}`}>Title *</Label>
                    <Input
                      id={`speaker-title-${index}`}
                      value={speaker.title}
                      onChange={(e) => {
                        const newSpeakers = [...formData.speakers];
                        newSpeakers[index].title = e.target.value;
                        setFormData((prev) => ({
                          ...prev,
                          speakers: newSpeakers,
                        }));
                      }}
                      placeholder="Senior Software Engineer"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`speaker-company-${index}`}>Company *</Label>
                  <Input
                    id={`speaker-company-${index}`}
                    value={speaker.company}
                    onChange={(e) => {
                      const newSpeakers = [...formData.speakers];
                      newSpeakers[index].company = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        speakers: newSpeakers,
                      }));
                    }}
                    placeholder="Google Inc."
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`speaker-bio-${index}`}>Bio</Label>
                  <Textarea
                    id={`speaker-bio-${index}`}
                    value={speaker.bio}
                    onChange={(e) => {
                      const newSpeakers = [...formData.speakers];
                      newSpeakers[index].bio = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        speakers: newSpeakers,
                      }));
                    }}
                    placeholder="Brief bio about the speaker..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Agenda Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Event Agenda</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setFormData((prev) => ({
                    ...prev,
                    agenda: [
                      ...prev.agenda,
                      { title: "", speaker: "", description: "" },
                    ],
                  }));
                }}
              >
                Add Agenda Item
              </Button>
            </div>

            {formData.agenda.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Agenda Item {index + 1}</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        agenda: prev.agenda.filter((_, i) => i !== index),
                      }));
                    }}
                  >
                    Remove
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`agenda-speaker-${index}`}>Speaker</Label>
                  <Input
                    id={`agenda-speaker-${index}`}
                    value={item.speaker}
                    onChange={(e) => {
                      const newAgenda = [...formData.agenda];
                      newAgenda[index].speaker = e.target.value;
                      setFormData((prev) => ({ ...prev, agenda: newAgenda }));
                    }}
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`agenda-title-${index}`}>Title *</Label>
                  <Input
                    id={`agenda-title-${index}`}
                    value={item.title}
                    onChange={(e) => {
                      const newAgenda = [...formData.agenda];
                      newAgenda[index].title = e.target.value;
                      setFormData((prev) => ({ ...prev, agenda: newAgenda }));
                    }}
                    placeholder="Welcome & Introduction"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`agenda-description-${index}`}>
                    Description
                  </Label>
                  <Textarea
                    id={`agenda-description-${index}`}
                    value={item.description}
                    onChange={(e) => {
                      const newAgenda = [...formData.agenda];
                      newAgenda[index].description = e.target.value;
                      setFormData((prev) => ({ ...prev, agenda: newAgenda }));
                    }}
                    placeholder="Brief description of this agenda item..."
                    className="min-h-[60px]"
                  />
                </div>
              </div>
            ))}
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
