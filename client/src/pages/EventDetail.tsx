import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  Users,
  Star,
  ExternalLink,
  Bookmark,
  Mail,
  Globe,
  Video,
  Award,
  Edit,
  Trash2,
  MoreVertical,
  Share2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { eventAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { EditEventDialog } from "@/components/dialogs/EditEventDialog";
import { DeleteEventDialog } from "@/components/dialogs/DeleteEventDialog";
import ShareEventDialog from "@/components/dialogs/ShareEventDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  tags?: string[];
  image?: string;
  registrationDeadline?: string;
  organizer: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  speakers?: Array<{
    name: string;
    title: string;
    company: string;
    bio?: string;
    photo?: string;
  }>;
  agenda?: Array<{
    title: string;
    speaker?: string;
    description?: string;
  }>;
  meetingLink?: string;
}

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const [isShareEventOpen, setIsShareEventOpen] = useState(false);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());

  // Fetch event data
  const {
    data: eventResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => eventAPI.getEventById(id!),
    enabled: !!id,
  });

  // Extract event data from API response
  const event =
    eventResponse?.data?.event || (eventResponse?.data as Event | undefined);

  // Load saved events from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("savedEvents");
    if (saved) {
      setSavedEvents(new Set(JSON.parse(saved)));
    }
  }, []);

  // Check if user can manage events
  const canManageEvents =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Handle save/unsave event
  const handleSaveEvent = () => {
    if (!event) return;

    const newSaved = new Set(savedEvents);
    if (newSaved.has(event._id)) {
      newSaved.delete(event._id);
      toast({
        title: "Event Removed",
        description: "Event removed from your saved events.",
      });
    } else {
      newSaved.add(event._id);
      toast({
        title: "Event Saved",
        description: "Event added to your saved events.",
      });
    }
    setSavedEvents(newSaved);
    localStorage.setItem("savedEvents", JSON.stringify([...newSaved]));
  };

  // Handle register for event
  const handleRegister = () => {
    if (!event) return;

    // TODO: Implement event registration API call
    toast({
      title: "Registration Successful",
      description: "You have successfully registered for this event.",
    });
  };

  // Handle edit event
  const handleEditEvent = () => {
    setIsEditEventOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = () => {
    setIsDeleteEventOpen(true);
  };

  // Handle share event
  const handleShareEvent = () => {
    if (!event) return;
    setIsShareEventOpen(true);
  };

  // Handle event updated
  const handleEventUpdated = () => {
    // Refresh the event data
    window.location.reload();
  };

  // Handle event deleted
  const handleEventDeleted = () => {
    navigate("/events");
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Helper function to format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to format price
  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null || price === 0) return "Free";
    return `$${price.toFixed(2)}`;
  };

  // Helper function to format registration deadline
  const formatRegistrationDeadline = (deadline: string | undefined) => {
    if (!deadline) return "No deadline set";
    const date = new Date(deadline);
    const now = new Date();
    const isPast = date < now;

    return {
      formatted: date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      isPast,
    };
  };

  // Helper function to get image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;

    // If it's a full URL, return as is
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // If it's a relative path (uploaded image), use proxy path
    if (image.startsWith("/") || image.startsWith("uploads/")) {
      // Ensure the image path starts with /uploads/ for proxy
      let imagePath = image;
      if (image.startsWith("uploads/")) {
        imagePath = `/${image}`;
      }
      return imagePath;
    }

    return image;
  };

  // Helper function to check if event is in the past
  const isEventPast = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const now = new Date();
    return eventDateObj < now;
  };

  // Helper function to check if registration is closed
  const isRegistrationClosed = (event: Event) => {
    const now = new Date();

    // If event has passed, registration is closed
    if (isEventPast(event.startDate)) {
      return true;
    }

    // If registration deadline has passed, registration is closed
    if (event.registrationDeadline) {
      const deadlineDate = new Date(event.registrationDeadline);
      return deadlineDate < now;
    }

    // If no registration deadline set, registration is open until event starts
    return false;
  };

  // Helper function to get event type icon
  const getEventTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "webinar":
        return <Video className="w-4 h-4" />;
      case "workshop":
        return <Award className="w-4 h-4" />;
      case "conference":
        return <Users className="w-4 h-4" />;
      case "meetup":
        return <Users className="w-4 h-4" />;
      case "career_fair":
        return <Award className="w-4 h-4" />;
      case "reunion":
        return <Star className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Event Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The event you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/events")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate("/events")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Events
        </Button>

        {/* Event Image */}
        {event.image && getImageUrl(event.image) && (
          <Card className="mb-6 overflow-hidden">
            <div className="relative w-full flex justify-center">
              <img
                src={getImageUrl(event.image)!}
                alt={event.title}
                className="w-full h-auto object-contain"
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                }}
                onError={(e) => {
                  // Hide image if it fails to load
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </Card>
        )}
        {/* Event Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  {event.title}
                </CardTitle>
                <CardDescription className="text-xl text-gray-600 mb-4">
                  {event.type.charAt(0).toUpperCase() +
                    event.type.slice(1).replace("_", " ")}
                </CardDescription>

                {/* Event Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(event.startDate)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTime(event.startDate)} - {formatTime(event.endDate)}
                  </div>
                  <div className="flex items-center">
                    {event.isOnline ? (
                      <Video className="w-4 h-4 mr-1" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-1" />
                    )}
                    {event.location}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {event.currentAttendees || 0}/{event.maxAttendees || 0}{" "}
                    attendees
                  </div>
                  {event.registrationDeadline && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span
                        className={
                          formatRegistrationDeadline(event.registrationDeadline)
                            .isPast
                            ? "text-red-600"
                            : "text-gray-600"
                        }
                      >
                        Registration closes:{" "}
                        {
                          formatRegistrationDeadline(event.registrationDeadline)
                            .formatted
                        }
                      </span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-center text-green-600 font-semibold mb-4">
                  <span className="text-lg">{formatPrice(event.price)}</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 flex-wrap">
                  {isRegistrationClosed(event) ? (
                    <Button
                      disabled
                      variant="outline"
                      className="flex-1 sm:flex-none"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      {isEventPast(event.startDate)
                        ? "Event Ended"
                        : "Registration Closed"}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleRegister}
                      className="flex-1 sm:flex-none"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Register Now
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={handleSaveEvent}
                    className={
                      savedEvents.has(event._id) ? "text-yellow-600" : ""
                    }
                  >
                    <Bookmark
                      className={`w-4 h-4 mr-2 ${
                        savedEvents.has(event._id) ? "fill-current" : ""
                      }`}
                    />
                    {savedEvents.has(event._id) ? "Saved" : "Save Event"}
                  </Button>
                  <Button variant="outline" onClick={handleShareEvent}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  {canManageEvents && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline">
                          <MoreVertical className="w-4 h-4 mr-2" />
                          Manage
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEditEvent}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDeleteEvent}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Event
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Event Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  {event.description?.split("\n").map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  )) || <p>No description available</p>}
                </div>
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Event Type
                  </h4>
                  <div className="flex items-center">
                    {getEventTypeIcon(event.type)}
                    <span className="ml-2">
                      {event.type.charAt(0).toUpperCase() +
                        event.type.slice(1).replace("_", " ")}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Date & Time
                  </h4>
                  <p className="text-gray-700">
                    {formatDate(event.startDate)} at{" "}
                    {formatTime(event.startDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Duration:{" "}
                    {Math.round(
                      (new Date(event.endDate).getTime() -
                        new Date(event.startDate).getTime()) /
                        (1000 * 60 * 60)
                    )}{" "}
                    hours
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Location</h4>
                  <div className="flex items-start">
                    {event.isOnline ? (
                      <Video className="w-4 h-4 mr-2 mt-1 text-blue-600" />
                    ) : (
                      <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-600" />
                    )}
                    <div>
                      <p className="text-gray-700">{event.location}</p>
                      {event.isOnline && (
                        <p className="text-sm text-blue-600">Online Event</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Attendance
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-700">
                      {event.currentAttendees || 0} of {event.maxAttendees || 0}{" "}
                      spots filled
                    </span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            100,
                            ((event.currentAttendees || 0) /
                              (event.maxAttendees || 1)) *
                              100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing</h4>
                  <p className="text-lg font-semibold text-green-600">
                    {formatPrice(event.price)}
                  </p>
                </div>

                {event.registrationDeadline && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Registration Deadline
                    </h4>
                    <p
                      className={`${
                        formatRegistrationDeadline(event.registrationDeadline)
                          .isPast
                          ? "text-red-600"
                          : "text-gray-700"
                      }`}
                    >
                      {
                        formatRegistrationDeadline(event.registrationDeadline)
                          .formatted
                      }
                    </p>
                    {formatRegistrationDeadline(event.registrationDeadline)
                      .isPast && (
                      <p className="text-sm text-red-600 mt-1">
                        Registration has closed
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Speakers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.speakers.map((speaker, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold">{speaker.name}</h4>
                          <p className="text-sm text-gray-600">
                            {speaker.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {speaker.company}
                          </p>
                          {speaker.bio && (
                            <p className="text-sm text-gray-700 mt-2">
                              {speaker.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Speakers</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 italic">
                    No speakers available for this event.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: speakers = {JSON.stringify(event.speakers)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Agenda */}
            {event.agenda && event.agenda.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Event Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.agenda.map((item, index) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="flex-1">
                          <h4 className="font-semibold">{item.title}</h4>
                          {item.speaker && (
                            <p className="text-sm text-gray-600">
                              by {item.speaker}
                            </p>
                          )}
                          {item.description && (
                            <p className="text-sm text-gray-700 mt-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Event Agenda</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 italic">
                    No agenda items available for this event.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: agenda = {JSON.stringify(event.agenda)}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type</span>
                  <div className="flex items-center">
                    {getEventTypeIcon(event.type)}
                    <span className="ml-1">
                      {event.type.charAt(0).toUpperCase() +
                        event.type.slice(1).replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location</span>
                  <span
                    className="text-right max-w-32 truncate"
                    title={event.location}
                  >
                    {event.location}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Online</span>
                  <span>{event.isOnline ? "Yes" : "No"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Attendees</span>
                  <span>{event.maxAttendees || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Attendees</span>
                  <span>{event.currentAttendees || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price</span>
                  <span className="font-semibold">
                    {formatPrice(event.price)}
                  </span>
                </div>
                {event.registrationDeadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Registration Deadline</span>
                    <span
                      className={`text-right ${
                        formatRegistrationDeadline(event.registrationDeadline)
                          .isPast
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {
                        formatRegistrationDeadline(event.registrationDeadline)
                          .formatted
                      }
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Event Status</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      new Date(event.startDate) > new Date()
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {new Date(event.startDate) > new Date()
                      ? "Upcoming"
                      : "Past"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Link */}
            {event.meetingLink && (
              <Card>
                <CardHeader>
                  <CardTitle>Join Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => window.open(event.meetingLink, "_blank")}
                    className="w-full"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    Join Online
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Organizer */}
            <Card>
              <CardHeader>
                <CardTitle>Organized By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {event.organizer?.firstName || "Unknown"}{" "}
                      {event.organizer?.lastName || "Organizer"}
                    </p>
                    <p className="text-sm text-gray-600">Event Organizer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Edit Event Dialog */}
        {event && (
          <EditEventDialog
            open={isEditEventOpen}
            onOpenChange={setIsEditEventOpen}
            event={event as any}
            onEventUpdated={handleEventUpdated}
          />
        )}

        {/* Delete Event Dialog */}
        {event && (
          <DeleteEventDialog
            open={isDeleteEventOpen}
            onOpenChange={setIsDeleteEventOpen}
            event={event as any}
            onEventDeleted={handleEventDeleted}
          />
        )}

        {/* Share Event Dialog */}
        {event && (
          <ShareEventDialog
            isOpen={isShareEventOpen}
            onClose={() => setIsShareEventOpen(false)}
            event={event as any}
          />
        )}
      </div>
    </div>
  );
};

export default EventDetail;
