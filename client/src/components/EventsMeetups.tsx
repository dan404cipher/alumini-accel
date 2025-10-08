import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
  Star,
  Plus,
  Share,
  Bookmark,
  ExternalLink,
  Edit,
  Trash2,
  MoreVertical,
  Filter,
  X,
  Search,
  Menu,
  DollarSign,
  Globe,
  Building,
  GraduationCap,
  Heart,
} from "lucide-react";
import { CreateEventDialog } from "./dialogs/CreateEventDialog";
import { EditEventDialog } from "./dialogs/EditEventDialog";
import { DeleteEventDialog } from "./dialogs/DeleteEventDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { eventAPI } from "@/lib/api";
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
  startDate: string;
  endDate: string;
  location: string;
  type: string;
  organizer?: {
    firstName: string;
    lastName: string;
  };
  currentAttendees?: number;
  maxAttendees?: number;
  imageUrl?: string;
  tags?: string[];
  price?: number;
  registrationDeadline?: string;
}

interface MappedEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  startDate: string;
  time: string;
  location: string;
  type: string;
  organizer: string;
  attendees: number;
  maxAttendees: number;
  image?: string;
  tags: string[];
  featured: boolean;
  price: string;
  registrationDeadline?: string;
}

// Type for dialog components that expect a different event structure
type DialogEvent = Omit<MappedEvent, "price"> & {
  _id: string;
  endDate: string;
  isOnline: boolean;
  currentAttendees: number;
  price: number;
};

const EventsMeetups = () => {
  const navigate = useNavigate();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<MappedEvent | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [selectedDateRange, setSelectedDateRange] = useState("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  // Check if user can create events
  const canCreateEvents =
    user?.role === "super_admin" ||
    user?.role === "coordinator" ||
    user?.role === "college_admin" ||
    user?.role === "hod" ||
    user?.role === "staff" ||
    user?.role === "alumni";

  // Check if user can edit/delete events
  const canManageEvents =
    user?.role === "super_admin" ||
    user?.role === "coordinator" ||
    user?.role === "college_admin" ||
    user?.role === "hod" ||
    user?.role === "staff" ||
    user?.role === "alumni";

  // Event types for filtering
  const eventTypes = [
    { value: "all", label: "All Events" },
    { value: "meetup", label: "Meetup" },
    { value: "workshop", label: "Workshop" },
    { value: "webinar", label: "Webinar" },
    { value: "conference", label: "Conference" },
    { value: "career_fair", label: "Career Fair" },
    { value: "reunion", label: "Reunion" },
  ];

  // Fetch events from API
  const {
    data: eventsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events", refreshKey, user?.tenantId],
    queryFn: () =>
      eventAPI.getAllEvents({
        limit: 100,
        tenantId: user?.tenantId,
      }), // Fetch up to 100 events for current college
  });

  // Map API events to component format
  const apiEvents =
    (eventsResponse?.data as { events: Event[] } | undefined)?.events || [];

  const mappedEvents = apiEvents.map((event: Event): MappedEvent => {
    return {
      id: event._id,
      title: event.title,
      description: event.description,
      date: new Date(event.startDate).toLocaleDateString(),
      startDate: event.startDate, // Keep original startDate for filtering
      time: new Date(event.startDate).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      location: event.location,
      type: event.type,
      organizer: event.organizer?.firstName
        ? `${event.organizer.firstName} ${event.organizer.lastName}`
        : "Unknown",
      attendees: event.currentAttendees || 0,
      maxAttendees: event.maxAttendees || 0,
      image: event.imageUrl,
      tags: event.tags || [],
      featured: false,
      price: event.price ? `$${event.price}` : "Free",
      registrationDeadline: event.registrationDeadline,
    };
  });

  // Filter events by time periods and event type
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Helper function to filter events by type
  const filterEventsByType = (events: MappedEvent[]) => {
    if (selectedEventType === "all") return events;
    return events.filter((event) => event.type === selectedEventType);
  };

  const upcomingEvents = filterEventsByType(
    mappedEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= tomorrow;
    })
  );

  const todayEvents = filterEventsByType(
    mappedEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate >= today && eventDate < tomorrow;
    })
  );

  const pastEvents = filterEventsByType(
    mappedEvents.filter((event) => {
      const eventDate = new Date(event.startDate);
      return eventDate < today;
    })
  );

  const events = mappedEvents;

  // Function to refresh events
  const handleEventCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Helper function to check if event is in the past
  const isEventPast = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const now = new Date();

    // Check if the event date is before the current date and time
    return eventDateObj < now;
  };

  // Helper function to check if event is today
  const isEventToday = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDateObj >= today && eventDateObj < tomorrow;
  };

  // Helper function to check if registration is closed
  const isRegistrationClosed = (event: MappedEvent) => {
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

  // Helper function to get image URL
  const getImageUrl = (image: string | undefined) => {
    if (!image) return null;

    // If it's a full URL, return as is
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    // If it's a relative path (uploaded image), construct full URL
    if (image.startsWith("/") || image.startsWith("uploads/")) {
      // Use the API base URL but remove /api/v1 for static file serving
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const baseUrl = apiBaseUrl.replace("/api/v1", "");

      // Ensure the image path starts with /uploads/
      let imagePath = image;
      if (image.startsWith("uploads/")) {
        imagePath = `/${image}`;
      }

      const fullUrl = `${baseUrl}${imagePath}`;
      return fullUrl;
    }

    return image;
  };

  // Helper function to render event grid
  const renderEventGrid = (eventsList: MappedEvent[], emptyMessage: string) => {
    if (eventsList.length === 0) {
      const isFiltered = selectedEventType !== "all";
      const selectedTypeLabel =
        eventTypes.find((type) => type.value === selectedEventType)?.label ||
        selectedEventType;

      return (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            {isFiltered ? `No ${selectedTypeLabel} Events Found` : emptyMessage}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isFiltered
              ? `No ${selectedTypeLabel.toLowerCase()} events found. Try selecting a different event type.`
              : emptyMessage === "No Events Found"
              ? "There are no events scheduled at the moment."
              : `No ${emptyMessage.toLowerCase()} at the moment.`}
          </p>
          {isFiltered && (
            <Button
              variant="outline"
              onClick={() => setSelectedEventType("all")}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Clear Filter
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {eventsList.map((event) => (
          <Card
            key={event.id}
            className="group hover:shadow-medium transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0 h-full flex flex-col"
          >
            <div className="relative">
              {getImageUrl(event.image) ? (
                <img
                  src={getImageUrl(event.image)!}
                  alt={event.title}
                  className={`w-full h-48 object-cover rounded-t-lg ${
                    isEventPast(event.startDate) ? "opacity-75" : ""
                  }`}
                  onError={(e) => {
                    // Hide image if it fails to load and show placeholder
                    const img = e.currentTarget as HTMLImageElement;
                    img.style.display = "none";

                    // Show a placeholder div instead
                    const placeholder = document.createElement("div");
                    placeholder.className = `w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center ${
                      isEventPast(event.startDate) ? "opacity-75" : ""
                    }`;
                    placeholder.innerHTML = `
                      <div class="text-center">
                        <svg class="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <p class="text-sm text-gray-500 font-medium">Image unavailable</p>
                      </div>
                    `;
                    img.parentNode?.insertBefore(placeholder, img);
                  }}
                />
              ) : (
                <div
                  className={`w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center ${
                    isEventPast(event.startDate) ? "opacity-75" : ""
                  }`}
                >
                  <div className="text-center">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">
                      No Image
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge
                  variant={getEventTypeBadge(event.type)}
                  className="flex items-center"
                >
                  {getEventTypeIcon(event.type)}
                  <span className="ml-1">{event.type}</span>
                </Badge>
                {isEventPast(event.startDate) && (
                  <Badge variant="secondary" className="bg-gray-500 text-white">
                    Past Event
                  </Badge>
                )}
                {!isEventPast(event.startDate) &&
                  isRegistrationClosed(event) && (
                    <Badge
                      variant="secondary"
                      className="bg-orange-500 text-white"
                    >
                      Registration Closed
                    </Badge>
                  )}
              </div>
            </div>

            <CardContent className="p-4 lg:p-6 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="text-base lg:text-lg font-semibold mb-2 line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-muted-foreground text-xs lg:text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-2 text-xs lg:text-sm text-muted-foreground mb-4">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    <span>{event.attendees} attending</span>
                  </div>
                  {event.registrationDeadline && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        Registration closes:{" "}
                        {new Date(
                          event.registrationDeadline
                        ).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(
                          event.registrationDeadline
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {event.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-success">
                    {event.price}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {event.attendees}/{event.maxAttendees} spots
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewEvent(event)}
                    className="flex-1 text-xs lg:text-sm"
                  >
                    <ExternalLink className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">View</span>
                  </Button>
                  {isRegistrationClosed(event) ? (
                    <Button
                      size="sm"
                      className="flex-1 text-xs lg:text-sm"
                      disabled
                      variant="outline"
                    >
                      {isEventPast(event.startDate)
                        ? "Event Ended"
                        : "Registration Closed"}
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1 text-xs lg:text-sm">
                      Register
                    </Button>
                  )}
                  {canManageEvents && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleEditEvent(event)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Event
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteEvent(event)}
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
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const handleEventUpdated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleEventDeleted = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Handle edit event
  const handleEditEvent = (event: MappedEvent) => {
    setSelectedEvent(event);
    setIsEditEventOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = (event: MappedEvent) => {
    setSelectedEvent(event);
    setIsDeleteEventOpen(true);
  };

  // Handle view event details
  const handleViewEvent = (event: MappedEvent) => {
    navigate(`/events/${event.id}`);
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "Virtual":
        return <Video className="w-4 h-4" />;
      case "Hybrid":
        return <Users className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case "Virtual":
        return "secondary";
      case "Hybrid":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Events & Meetups
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Find events that interest you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Events */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Events</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events, workshops, meetups..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-10"
                  />
                  {searchQuery && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-8 w-8 p-0"
                      onClick={() => setSearchQuery("")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Filters</h3>

                {/* Event Type */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Type</label>
                  <Select
                    value={selectedEventType}
                    onValueChange={setSelectedEventType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Events</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="career_fair">Career Fair</SelectItem>
                      <SelectItem value="reunion">Reunion</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Location</label>
                  <Select
                    value={selectedLocation}
                    onValueChange={setSelectedLocation}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="online">Online/Virtual</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="campus">Campus</SelectItem>
                      <SelectItem value="San Francisco">
                        San Francisco
                      </SelectItem>
                      <SelectItem value="New York">New York</SelectItem>
                      <SelectItem value="Seattle">Seattle</SelectItem>
                      <SelectItem value="Los Angeles">Los Angeles</SelectItem>
                      <SelectItem value="Chicago">Chicago</SelectItem>
                      <SelectItem value="Boston">Boston</SelectItem>
                      <SelectItem value="Austin">Austin</SelectItem>
                      <SelectItem value="London">London</SelectItem>
                      <SelectItem value="Toronto">Toronto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Price</label>
                  <Select
                    value={selectedPrice}
                    onValueChange={setSelectedPrice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select price range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Prices</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="0-25">$0 - $25</SelectItem>
                      <SelectItem value="25-50">$25 - $50</SelectItem>
                      <SelectItem value="50-100">$50 - $100</SelectItem>
                      <SelectItem value="100+">$100+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select
                    value={selectedDateRange}
                    onValueChange={setSelectedDateRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="this_week">This Week</SelectItem>
                      <SelectItem value="next_week">Next Week</SelectItem>
                      <SelectItem value="this_month">This Month</SelectItem>
                      <SelectItem value="next_month">Next Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters */}
                {(searchQuery ||
                  (selectedEventType && selectedEventType !== "all") ||
                  (selectedLocation && selectedLocation !== "all") ||
                  (selectedPrice && selectedPrice !== "all") ||
                  (selectedDateRange && selectedDateRange !== "all")) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedEventType("all");
                      setSelectedLocation("all");
                      setSelectedPrice("all");
                      setSelectedDateRange("all");
                    }}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                )}
              </div>

              {/* Quick Actions */}
              <div className="space-y-3 pt-4 border-t">
                <h3 className="text-sm font-semibold">Quick Actions</h3>
                <div className="space-y-2">
                  {canCreateEvents && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsCreateEventOpen(true)}
                      className="w-full justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Bookmark className="w-4 h-4 mr-2" />
                    My Events
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Calendar View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 p-4 lg:p-6 overflow-y-auto h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-4 h-4 mr-2" />
              Filters
            </Button>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold">
                Events & Meetups
              </h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Connect, learn, and grow with our alumni community •{" "}
                {events.length} events
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="text-muted-foreground">Loading events...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-8">
            <div className="text-destructive">
              Failed to load events. Please try again later.
            </div>
          </div>
        )}

        {/* Events Tabs */}
        {events.length === 0 && !isLoading && !error ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Events Found</h3>
            <p className="text-muted-foreground mb-4">
              There are no events scheduled at the moment.
            </p>
            {canCreateEvents && (
              <Button onClick={() => setIsCreateEventOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            )}
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upcoming" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Upcoming ({upcomingEvents.length})
              </TabsTrigger>
              <TabsTrigger value="today" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Today ({todayEvents.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Past ({pastEvents.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-6">
              {renderEventGrid(upcomingEvents, "No Upcoming Events")}
            </TabsContent>

            <TabsContent value="today" className="mt-6">
              {renderEventGrid(todayEvents, "No Events Today")}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {renderEventGrid(pastEvents, "No Past Events")}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        onEventCreated={handleEventCreated}
      />
      <EditEventDialog
        open={isEditEventOpen}
        onOpenChange={setIsEditEventOpen}
        event={
          selectedEvent
            ? {
                _id: selectedEvent.id,
                title: selectedEvent.title,
                description: selectedEvent.description,
                type: selectedEvent.type,
                startDate: selectedEvent.startDate,
                endDate: selectedEvent.startDate, // Using startDate as fallback since MappedEvent doesn't have endDate
                location: selectedEvent.location,
                isOnline: selectedEvent.type === "webinar",
                maxAttendees: selectedEvent.maxAttendees,
                currentAttendees: selectedEvent.attendees,
                price: parseFloat(selectedEvent.price) || 0,
                tags: selectedEvent.tags,
                image: selectedEvent.image,
                registrationDeadline: selectedEvent.registrationDeadline,
                organizer: {
                  _id: "unknown",
                  firstName: selectedEvent.organizer.split(" ")[0] || "Unknown",
                  lastName:
                    selectedEvent.organizer.split(" ").slice(1).join(" ") ||
                    "Organizer",
                },
              }
            : null
        }
        onEventUpdated={handleEventUpdated}
      />
      <DeleteEventDialog
        open={isDeleteEventOpen}
        onOpenChange={setIsDeleteEventOpen}
        event={
          selectedEvent
            ? {
                _id: selectedEvent.id,
                title: selectedEvent.title,
                description: selectedEvent.description,
                startDate: selectedEvent.startDate,
                endDate: selectedEvent.startDate, // Using startDate as fallback since MappedEvent doesn't have endDate
                location: selectedEvent.location,
                currentAttendees: selectedEvent.attendees,
              }
            : null
        }
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};

export default EventsMeetups;
