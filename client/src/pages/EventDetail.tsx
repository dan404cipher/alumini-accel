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
  TrendingUp,
  Sparkles,
  ChevronRight,
  Menu,
  X,
  Maximize2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { eventAPI, categoryAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { EditEventDialog } from "@/components/dialogs/EditEventDialog";
import { DeleteEventDialog } from "@/components/dialogs/DeleteEventDialog";
import { RegistrationFormDialog } from "@/components/dialogs/RegistrationFormDialog";
import ShareEventDialog from "@/components/dialogs/ShareEventDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const [isRegistered, setIsRegistered] = useState(false);
  const [isPendingPayment, setIsPendingPayment] = useState(false);
  const [typeLabel, setTypeLabel] = useState<string>("");
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

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
    (eventResponse?.data as { event?: Event })?.event ||
    (eventResponse?.data as Event | undefined);

  // Fetch suggested events (after event is loaded)
  const {
    data: suggestedEventsResponse,
    isLoading: isLoadingSuggested,
    error: suggestedEventsError,
  } = useQuery({
    queryKey: ["suggestedEvents", event?._id, event?.type],
    queryFn: () =>
      eventAPI.getAllEvents({
        limit: 10,
        page: 1,
      }),
    enabled: !!event?._id,
  });

  // Filter and prepare suggested events (exclude current event, prioritize by type/tags)
  const allEvents = ((suggestedEventsResponse?.data as { events?: Event[] })
    ?.events ||
    (suggestedEventsResponse?.data as Event[]) ||
    []) as Event[];
  const suggestedEvents = allEvents
    .filter((e: Event) => e._id !== event?._id)
    .sort((a: Event, b: Event) => {
      // Prioritize: same type > upcoming > recent
      const aIsSameType = a.type === event?.type;
      const bIsSameType = b.type === event?.type;
      if (aIsSameType && !bIsSameType) return -1;
      if (!aIsSameType && bIsSameType) return 1;

      // Then prioritize upcoming events
      const aIsUpcoming = new Date(a.startDate) >= new Date();
      const bIsUpcoming = new Date(b.startDate) >= new Date();
      if (aIsUpcoming && !bIsUpcoming) return -1;
      if (!aIsUpcoming && bIsUpcoming) return 1;

      // Finally sort by date (newest first)
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    })
    .slice(0, 5);

  // Check if user is registered for this event
  useEffect(() => {
    if (event && user) {
      const eventWithAttendees = event as Event & {
        attendees?: Array<{
          userId?: { _id: string } | string;
          status: string;
        }>;
      };
      const myAttendee = eventWithAttendees.attendees?.find(
        (attendee) =>
          (typeof attendee.userId === "object" &&
            attendee.userId?._id === user._id) ||
          attendee.userId === user._id
      );
      setIsRegistered(!!myAttendee && myAttendee.status === "registered");
      setIsPendingPayment(
        !!myAttendee && myAttendee.status === "pending_payment"
      );
    } else {
      setIsRegistered(false);
      setIsPendingPayment(false);
    }
  }, [event, user]);

  // Resolve type label when type is an ObjectId
  useEffect(() => {
    const resolveType = async () => {
      if (!event?.type) {
        setTypeLabel("");
        return;
      }
      const rawType = event.type as unknown as string;
      // If looks like ObjectId, fetch category name
      if (/^[0-9a-fA-F]{24}$/.test(rawType)) {
        try {
          const res = await categoryAPI.getById(rawType);
          const resData = res as
            | { data?: { name?: string; category?: { name?: string } } }
            | { data?: { name?: string } };
          const name =
            resData?.data?.name ||
            (resData?.data as { category?: { name?: string } })?.category?.name;
          setTypeLabel(name || "");
        } catch {
          setTypeLabel("");
        }
      } else {
        // Enum string – prettify
        const pretty =
          rawType.charAt(0).toUpperCase() + rawType.slice(1).replace("_", " ");
        setTypeLabel(pretty);
      }
    };
    resolveType();
  }, [event?.type]);

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
    setIsRegistrationOpen(true);
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
    return `₹${price.toFixed(2)}`;
  };

  // Helper function to format registration deadline
  const formatRegistrationDeadline = (
    deadline: string | undefined
  ): { formatted: string; isPast: boolean } | string => {
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
    const norm = (typeLabel || type || "").toString().toLowerCase();
    switch (norm) {
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

  // Helper function to calculate days until event
  const getDaysUntilEvent = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const now = new Date();
    const diffTime = eventDateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Helper function to format days until event
  const formatDaysUntil = (days: number) => {
    if (days < 0) return "Past";
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 7) return `${days} days`;
    if (days < 30) return `${Math.floor(days / 7)} weeks`;
    return `${Math.floor(days / 30)} months`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div>
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
        <div className="text-center">
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Suggested Events */}
        <aside
          className={`
            ${
              sidebarOpen
                ? "fixed inset-y-0 left-0 z-50"
                : "hidden lg:block lg:fixed lg:top-16 lg:left-0 lg:z-40"
            }
            top-16 w-[280px] sm:w-80 flex-shrink-0 bg-background ${
              sidebarOpen ? "h-[calc(100vh-4rem)]" : "h-[calc(100vh-4rem)]"
            } border-r transition-transform duration-300 ease-in-out
          `}
        >
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            {/* Close button for mobile */}
            {sidebarOpen && (
              <div className="flex justify-end mb-4 lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            <Card className="h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Suggested Events
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Other events you might be interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSuggested ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-28 sm:h-32 bg-gray-200 rounded-lg"></div>
                        <div className="h-4 bg-gray-200 rounded mt-2 w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded mt-1 w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : suggestedEventsError ? (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">Unable to load events</p>
                  </div>
                ) : suggestedEvents.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-3">
                      {suggestedEvents.map((suggestedEvent: Event) => (
                        <div
                          key={suggestedEvent._id}
                          onClick={() => {
                            navigate(`/events/${suggestedEvent._id}`);
                            setSidebarOpen(false);
                          }}
                          className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-all hover:border-blue-300"
                        >
                          {suggestedEvent.image &&
                            getImageUrl(suggestedEvent.image) && (
                              <div className="relative w-full h-28 sm:h-32 overflow-hidden bg-gray-100">
                                <img
                                  src={getImageUrl(suggestedEvent.image)!}
                                  alt={suggestedEvent.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              </div>
                            )}
                          <div className="p-2 sm:p-3">
                            <h4 className="font-semibold text-xs sm:text-sm text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                              {suggestedEvent.title}
                            </h4>
                            <div className="flex items-center text-xs text-gray-500 mb-1">
                              <Calendar className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span className="truncate">
                                {formatDate(suggestedEvent.startDate)}
                              </span>
                            </div>
                            <div className="flex items-center text-xs text-gray-500">
                              {suggestedEvent.isOnline ? (
                                <Video className="w-3 h-3 mr-1 flex-shrink-0" />
                              ) : (
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {suggestedEvent.location}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full mt-4 text-xs sm:text-sm"
                      onClick={() => {
                        navigate("/events");
                        setSidebarOpen(false);
                      }}
                    >
                      View All Events
                      <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-6 sm:py-8 text-gray-500">
                    <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-xs sm:text-sm">
                      No suggested events at the moment
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
            {/* Mobile Header with Sidebar Toggle */}
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden h-9 w-9"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/events")}
                  className="hidden sm:flex"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Events
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/events")}
                  className="sm:hidden h-9 w-9"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Event Image */}
            {event.image && getImageUrl(event.image) && (
              <Card className="mb-6 overflow-hidden p-0">
                <div
                  className="relative w-full aspect-video max-h-[500px] overflow-hidden bg-gray-100 cursor-pointer group"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <img
                    src={getImageUrl(event.image)!}
                    alt={event.title}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                    style={{
                      imageRendering: "-webkit-optimize-contrast",
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 rounded-full p-2 shadow-lg">
                      <Maximize2 className="w-6 h-6 text-gray-900" />
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <div className="space-y-4 sm:space-y-6">
              {/* Event Meta Info and Actions */}
              <Card className="mb-6">
                <CardHeader className="pb-4">
                  {/* Event Meta Info */}
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formatDate(event.startDate)}
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(event.startDate)} -{" "}
                      {formatTime(event.endDate)}
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
                        {(() => {
                          const deadline = formatRegistrationDeadline(
                            event.registrationDeadline
                          );
                          if (typeof deadline === "string") {
                            return (
                              <span className="text-gray-600">{deadline}</span>
                            );
                          }
                          return (
                            <span
                              className={
                                deadline.isPast
                                  ? "text-red-600"
                                  : "text-gray-600"
                              }
                            >
                              Registration closes: {deadline.formatted}
                            </span>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-center text-green-600 font-semibold mb-4">
                    <span className="text-base sm:text-lg">
                      {formatPrice(event.price)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    {isRegistrationClosed(event) ? (
                      <Button
                        disabled
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {isEventPast(event.startDate)
                          ? "Event Ended"
                          : "Registration Closed"}
                      </Button>
                    ) : isRegistered ? (
                      <Button variant="secondary" className="w-full sm:w-auto">
                        <Users className="w-4 h-4 mr-2" />
                        Registered
                      </Button>
                    ) : isPendingPayment ? (
                      <Button
                        onClick={handleRegister}
                        className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Complete Payment
                      </Button>
                    ) : (
                      <Button
                        onClick={handleRegister}
                        className="w-full sm:w-auto"
                      >
                        <Users className="w-4 h-4 mr-2" />
                        Register Now
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={handleSaveEvent}
                      className={`w-full sm:w-auto ${
                        savedEvents.has(event._id) ? "text-yellow-600" : ""
                      }`}
                    >
                      <Bookmark
                        className={`w-4 h-4 mr-2 ${
                          savedEvents.has(event._id) ? "fill-current" : ""
                        }`}
                      />
                      {savedEvents.has(event._id) ? "Saved" : "Save Event"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleShareEvent}
                      className="w-full sm:w-auto"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                    {canManageEvents && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                          >
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
                </CardHeader>
              </Card>

              {/* Event Title, Description, Speakers, and Agenda - Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left Column: Title and Description */}
                <div className="space-y-4 sm:space-y-6">
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="text-base sm:text-lg lg:text-xl text-gray-600 mb-4">
                        {typeLabel || "Type"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="prose max-w-none">
                        {event.description
                          ?.split("\n")
                          .map((paragraph, index) => (
                            <p
                              key={index}
                              className="mb-3 sm:mb-4 text-sm sm:text-base text-gray-700 leading-relaxed"
                            >
                              {paragraph}
                            </p>
                          )) || (
                          <p className="text-sm sm:text-base text-gray-500">
                            No description available
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column: Speakers and Agenda */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Speakers */}
                  {event.speakers && event.speakers.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl">
                          Speakers
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {event.speakers.map((speaker, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 sm:space-x-4"
                            >
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base">
                                  {speaker.name}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {speaker.title}
                                </p>
                                <p className="text-xs sm:text-sm text-gray-500">
                                  {speaker.company}
                                </p>
                                {speaker.bio && (
                                  <p className="text-xs sm:text-sm text-gray-700 mt-2 leading-relaxed">
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
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl">
                          Speakers
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-500 italic">
                          No speakers available for this event.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* Agenda */}
                  {event.agenda && event.agenda.length > 0 ? (
                    <Card>
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl">
                          Event Agenda
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          {event.agenda.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start space-x-3 sm:space-x-4"
                            >
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base">
                                  {item.title}
                                </h4>
                                {item.speaker && (
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    by {item.speaker}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-xs sm:text-sm text-gray-700 mt-2 leading-relaxed">
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
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg sm:text-xl">
                          Event Agenda
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-gray-500 italic">
                          No agenda items available for this event.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>

              {/* Event Details - Single Column */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl">
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4 sm:space-y-6">
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                      Event Type
                    </h4>
                    <div className="flex items-center">
                      {getEventTypeIcon(event.type)}
                      <span className="ml-2 text-sm sm:text-base">
                        {typeLabel || "Type"}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                      Date & Time
                    </h4>
                    <p className="text-sm sm:text-base text-gray-700">
                      {formatDate(event.startDate)} at{" "}
                      {formatTime(event.startDate)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
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
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                      Location
                    </h4>
                    <div className="flex items-start">
                      {event.isOnline ? (
                        <Video className="w-4 h-4 mr-2 mt-1 text-blue-600 flex-shrink-0" />
                      ) : (
                        <MapPin className="w-4 h-4 mr-2 mt-1 text-gray-600 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm sm:text-base text-gray-700 break-words">
                          {event.location}
                        </p>
                        {event.isOnline && (
                          <p className="text-xs sm:text-sm text-blue-600 mt-1">
                            Online Event
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                      Attendance
                    </h4>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm sm:text-base text-gray-700">
                        {event.currentAttendees || 0} of{" "}
                        {event.maxAttendees || 0} spots filled
                      </span>
                      <div className="w-20 sm:w-24 bg-gray-200 rounded-full h-2 flex-shrink-0">
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
                    <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                      Pricing
                    </h4>
                    <p className="text-base sm:text-lg font-semibold text-green-600">
                      {formatPrice(event.price)}
                    </p>
                  </div>

                  {event.registrationDeadline && (
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-2">
                        Registration Deadline
                      </h4>
                      {(() => {
                        const deadline = formatRegistrationDeadline(
                          event.registrationDeadline
                        );
                        if (typeof deadline === "string") {
                          return (
                            <p className="text-sm sm:text-base text-gray-700">
                              {deadline}
                            </p>
                          );
                        }
                        return (
                          <>
                            <p
                              className={`text-sm sm:text-base ${
                                deadline.isPast
                                  ? "text-red-600"
                                  : "text-gray-700"
                              }`}
                            >
                              {deadline.formatted}
                            </p>
                            {deadline.isPast && (
                              <p className="text-xs sm:text-sm text-red-600 mt-1">
                                Registration has closed
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl">Tags</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs sm:text-sm"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Event Dialog */}
      {event && (
        <EditEventDialog
          open={isEditEventOpen}
          onOpenChange={setIsEditEventOpen}
          event={
            event as unknown as Parameters<typeof EditEventDialog>[0]["event"]
          }
          onEventUpdated={handleEventUpdated}
        />
      )}

      {/* Delete Event Dialog */}
      {event && (
        <DeleteEventDialog
          open={isDeleteEventOpen}
          onOpenChange={setIsDeleteEventOpen}
          event={
            event as unknown as Parameters<typeof DeleteEventDialog>[0]["event"]
          }
          onEventDeleted={handleEventDeleted}
        />
      )}

      {/* Share Event Dialog */}
      {event && (
        <ShareEventDialog
          isOpen={isShareEventOpen}
          onClose={() => setIsShareEventOpen(false)}
          event={
            event as unknown as Parameters<typeof ShareEventDialog>[0]["event"]
          }
        />
      )}

      {/* Registration Form Dialog */}
      {event && (
        <RegistrationFormDialog
          isOpen={isRegistrationOpen}
          onClose={() => setIsRegistrationOpen(false)}
          event={{
            id: event._id,
            title: event.title,
            date: new Date(event.startDate).toLocaleDateString(),
            time: new Date(event.startDate).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            location: event.location,
            price: event.price ? `₹${event.price}` : "Free",
            maxAttendees: event.maxAttendees || 0,
            attendees: event.currentAttendees || 0,
          }}
          onRegistrationSuccess={() => {
            // Refresh event data to get latest attendee status
            window.location.reload();
          }}
        />
      )}

      {/* Image Modal */}
      {event.image && getImageUrl(event.image) && (
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-transparent border-0">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={getImageUrl(event.image)!}
                alt={event.title}
                className="max-w-full max-h-[95vh] w-auto h-auto object-contain rounded-lg"
                style={{
                  imageRendering: "-webkit-optimize-contrast",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EventDetail;
