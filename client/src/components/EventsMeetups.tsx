import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";
import { CreateEventDialog } from "./dialogs/CreateEventDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { eventAPI } from "@/lib/api";

const EventsMeetups = () => {
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();

  // Check if user can create events
  const canCreateEvents =
    user?.role === "super_admin" || user?.role === "coordinator";

  // Fetch events from API
  const {
    data: eventsResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["events", refreshKey],
    queryFn: () => eventAPI.getAllEvents(),
  });

  // Hardcoded sample events
  const hardcodedEvents = [
    {
      id: 1,
      title: "Tech Alumni Meetup 2024",
      description:
        "Join our annual tech alumni gathering featuring networking, panel discussions, and startup showcases.",
      date: "March 15, 2024",
      time: "6:00 PM - 9:00 PM",
      location: "San Francisco Convention Center",
      type: "In-Person",
      organizer: "Sarah Chen",
      attendees: 127,
      maxAttendees: 200,
      image:
        "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
      tags: ["Technology", "Networking", "Career"],
      featured: true,
      price: "Free",
    },
    {
      id: 2,
      title: "Alumni Startup Pitch Night",
      description:
        "Watch innovative startups founded by our alumni present their ideas to investors and the community.",
      date: "April 22, 2024",
      time: "7:00 PM - 10:00 PM",
      location: "Virtual Event",
      type: "Virtual",
      organizer: "Michael Rodriguez",
      attendees: 89,
      maxAttendees: 150,
      image:
        "https://images.unsplash.com/photo-1511578314322-379afb4d4f5d?w=400&h=200&fit=crop",
      tags: ["Startup", "Pitch", "Investment"],
      featured: true,
      price: "$25",
    },
    {
      id: 3,
      title: "Career Development Workshop",
      description:
        "Learn essential skills for career advancement including resume building, interview techniques, and networking strategies.",
      date: "May 10, 2024",
      time: "2:00 PM - 5:00 PM",
      location: "University Campus",
      type: "In-Person",
      organizer: "Dr. Jennifer Liu",
      attendees: 45,
      maxAttendees: 60,
      image:
        "https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&h=200&fit=crop",
      tags: ["Career", "Workshop", "Skills"],
      featured: false,
      price: "Free",
    },
    {
      id: 4,
      title: "Alumni Reunion 2024",
      description:
        "Celebrate our annual alumni reunion with food, drinks, music, and reconnecting with old friends.",
      date: "June 8, 2024",
      time: "5:00 PM - 11:00 PM",
      location: "Grand Hotel Ballroom",
      type: "In-Person",
      organizer: "Alumni Association",
      attendees: 234,
      maxAttendees: 300,
      image:
        "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=200&fit=crop",
      tags: ["Reunion", "Social", "Celebration"],
      featured: false,
      price: "$50",
    },
  ];

  // Map API events to component format
  const apiEvents = eventsResponse?.data?.events || [];
  const mappedEvents = apiEvents.map((event: any) => ({
    id: event._id,
    title: event.title,
    description: event.description,
    date: new Date(event.startDate).toLocaleDateString(),
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
    image:
      event.image ||
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop",
    tags: event.tags || [],
    featured: false,
    price: event.price ? `$${event.price}` : "Free",
  }));

  const events = error
    ? hardcodedEvents
    : [...mappedEvents, ...hardcodedEvents];

  // Function to refresh events
  const handleEventCreated = () => {
    setRefreshKey((prev) => prev + 1);
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
            Failed to load events. Showing sample events.
          </div>
        </div>
      )}

      {/* Featured Events */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Featured Events</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events
            .filter((event) => event.featured)
            .map((event) => (
              <Card
                key={event.id}
                className="group hover:shadow-strong transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0 overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="success" className="flex items-center">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant={getEventTypeBadge(event.type)}
                      className="flex items-center"
                    >
                      {getEventTypeIcon(event.type)}
                      <span className="ml-1">{event.type}</span>
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {event.title}
                      </h3>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {event.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="w-4 h-4 mr-2" />
                        {event.date}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Clock className="w-4 h-4 mr-2" />
                        {event.time}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.location}
                      </div>
                      <div className="flex items-center text-muted-foreground">
                        <Users className="w-4 h-4 mr-2" />
                        {event.attendees}/{event.maxAttendees}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          Organized by{" "}
                        </span>
                        <span className="text-primary font-medium">
                          {event.organizer}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-success">
                        {event.price}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1">Register Now</Button>
                      <Button variant="ghost" size="icon">
                        <Bookmark className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Share className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* All Events */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">All Upcoming Events</h2>
        <div className="space-y-4">
          {events
            .filter((event) => !event.featured)
            .map((event) => (
              <Card
                key={event.id}
                className="group hover:shadow-medium transition-smooth cursor-pointer animate-fade-in-up bg-gradient-card border-0"
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-24 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold mb-1">
                            {event.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mb-2 line-clamp-1">
                            {event.description}
                          </p>
                        </div>
                        <Badge
                          variant={getEventTypeBadge(event.type)}
                          className="flex items-center ml-4"
                        >
                          {getEventTypeIcon(event.type)}
                          <span className="ml-1">{event.type}</span>
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {event.date}
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {event.time}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.attendees} attending
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {event.tags.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-success">
                            {event.price}
                          </span>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button size="sm">Register</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" size="lg">
          Load More Events
        </Button>
      </div>

      {/* Dialogs */}
      <CreateEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
};

export default EventsMeetups;
