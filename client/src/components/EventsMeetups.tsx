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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const EventsMeetups = () => {
  const navigate = useNavigate();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isEditEventOpen, setIsEditEventOpen] = useState(false);
  const [isDeleteEventOpen, setIsDeleteEventOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  // Check if user can create events
  const canCreateEvents =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Check if user can edit/delete events
  const canManageEvents =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Fetch events from API
  const {
    data: eventsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events", refreshKey],
    queryFn: () => eventAPI.getAllEvents({ limit: 100 }), // Fetch up to 100 events
  });

  // Map API events to component format
  const apiEvents = eventsResponse?.data?.events || [];
  const mappedEvents = apiEvents.map((event: any) => {
    console.log("Event from API:", {
      id: event._id,
      title: event.title,
      image: event.image,
    });
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
      image: event.image,
      tags: event.tags || [],
      featured: false,
      price: event.price ? `$${event.price}` : "Free",
    };
  });

  // Filter events by time periods
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const upcomingEvents = mappedEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= tomorrow;
  });

  const todayEvents = mappedEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate >= today && eventDate < tomorrow;
  });

  const pastEvents = mappedEvents.filter((event) => {
    const eventDate = new Date(event.startDate);
    return eventDate < today;
  });

  // Debug: Log the number of events in each category
  console.log(`Total events: ${mappedEvents.length}`);
  console.log(`Upcoming events: ${upcomingEvents.length}`);
  console.log(`Today events: ${todayEvents.length}`);
  console.log(`Past events: ${pastEvents.length}`);

  const events = mappedEvents;

  // Function to refresh events
  const handleEventCreated = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Helper function to check if event is in the past
  const isEventPast = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return eventDateObj < today;
  };

  // Helper function to check if event is today
  const isEventToday = (eventDate: string) => {
    const eventDateObj = new Date(eventDate);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return eventDateObj >= today && eventDateObj < tomorrow;
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
      // Remove /api/v1 from the base URL for static file serving
      const baseUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
      ).replace("/api/v1", "");
      const fullUrl = `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
      console.log("Image URL constructed:", {
        original: image,
        baseUrl,
        fullUrl,
      });
      return fullUrl;
    }

    return image;
  };

  // Helper function to render event grid
  const renderEventGrid = (eventsList: any[], emptyMessage: string) => {
    if (eventsList.length === 0) {
      return (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-muted-foreground">
            {emptyMessage === "No Events Found"
              ? "There are no events scheduled at the moment."
              : `No ${emptyMessage.toLowerCase()} at the moment.`}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                    isEventPast(event.date) ? "opacity-75" : ""
                  }`}
                  onLoad={() =>
                    console.log(
                      "Image loaded successfully:",
                      getImageUrl(event.image)
                    )
                  }
                  onError={(e) => {
                    console.log(
                      "Image failed to load:",
                      getImageUrl(event.image)
                    );
                    // Hide image if it fails to load
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div
                  className={`w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg flex items-center justify-center ${
                    isEventPast(event.date) ? "opacity-75" : ""
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
                {isEventPast(event.date) && (
                  <Badge variant="secondary" className="bg-gray-500 text-white">
                    Past Event
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {event.description}
                </p>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
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

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewEvent(event)}
                    className="flex-1"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Details
                  </Button>
                  {isEventPast(event.date) ? (
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled
                      variant="outline"
                    >
                      Event Ended
                    </Button>
                  ) : (
                    <Button size="sm" className="flex-1">
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
  const handleEditEvent = (event: any) => {
    setSelectedEvent(event);
    setIsEditEventOpen(true);
  };

  // Handle delete event
  const handleDeleteEvent = (event: any) => {
    setSelectedEvent(event);
    setIsDeleteEventOpen(true);
  };

  // Handle view event details
  const handleViewEvent = (event: any) => {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Events & Meetups</h1>
          <p className="text-muted-foreground">
            Connect, learn, and grow with our alumni community
          </p>
        </div>
        {canCreateEvents && (
          <Button
            variant="gradient"
            size="lg"
            onClick={() => setIsCreateEventOpen(true)}
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Event
          </Button>
        )}
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

      {/* Dialogs */}
      <CreateEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        onEventCreated={handleEventCreated}
      />
      <EditEventDialog
        open={isEditEventOpen}
        onOpenChange={setIsEditEventOpen}
        event={selectedEvent}
        onEventUpdated={handleEventUpdated}
      />
      <DeleteEventDialog
        open={isDeleteEventOpen}
        onOpenChange={setIsDeleteEventOpen}
        event={selectedEvent}
        onEventDeleted={handleEventDeleted}
      />
    </div>
  );
};

export default EventsMeetups;
