import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  MapPin,
  Globe,
  Star,
  CheckCircle,
  Clock,
  XCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";

interface Event {
  _id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  status?: string;
  attendees?: Array<{
    userId: string;
    status: string;
    registeredAt: string;
  }>;
  registrations?: Array<{
    userId: string;
    status: string;
  }>;
  feedback?: Array<{
    rating: number;
    comment?: string;
  }>;
}

interface EventsSectionProps {
  events: Event[];
  engagementMetrics?: {
    eventsAttended: number;
    lastEventDate: string | null;
  };
}

const getStatusBadge = (event: Event) => {
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  if (event.status === "cancelled") {
    return (
      <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Cancelled
      </Badge>
    );
  }
  
  if (now < startDate) {
    return (
      <Badge variant="secondary">
        <Clock className="w-3 h-3 mr-1" />
        Upcoming
      </Badge>
    );
  }
  
  if (now >= startDate && now <= endDate) {
    return (
      <Badge variant="default" className="bg-blue-500">
        <Clock className="w-3 h-3 mr-1" />
        Ongoing
      </Badge>
    );
  }
  
  return (
    <Badge variant="default" className="bg-green-500">
      <CheckCircle className="w-3 h-3 mr-1" />
      Completed
    </Badge>
  );
};

export const EventsSection = ({ events, engagementMetrics }: EventsSectionProps) => {
  const formatDate = (date: string) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (date: string) => {
    if (!date) return "N/A";
    try {
      return format(new Date(date), "MMM dd, yyyy 'at' h:mm a");
    } catch {
      return "N/A";
    }
  };

  // Separate events into attended and registered
  const { attendedEvents, registeredEvents } = useMemo(() => {
    const now = new Date();
    const attended: Event[] = [];
    const registered: Event[] = [];

    events.forEach((event) => {
      const eventDate = new Date(event.startDate);
      if (eventDate < now) {
        attended.push(event);
      } else {
        registered.push(event);
      }
    });

    // Sort by date (most recent first)
    attended.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    registered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return { attendedEvents: attended, registeredEvents: registered };
  }, [events]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Events</h2>
      </div>

      <Tabs defaultValue="attended" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="attended" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Events Attended ({attendedEvents.length})
          </TabsTrigger>
          <TabsTrigger value="registered" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Events Registered ({registeredEvents.length})
          </TabsTrigger>
        </TabsList>

        {/* Events Attended Tab */}
        <TabsContent value="attended" className="space-y-4">
          {attendedEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No events attended yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {attendedEvents.map((event) => (
                <Card key={event._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(event.startDate)}</span>
                          </div>
                          {event.isOnline ? (
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              <span>Online Event</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.type && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.type}</span>
                            </div>
                          )}
                          {event.feedback && event.feedback.length > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span>
                                {(
                                  event.feedback.reduce((sum, f) => sum + f.rating, 0) /
                                  event.feedback.length
                                ).toFixed(1)}
                                /5.0
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(event)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Events Registered Tab */}
        <TabsContent value="registered" className="space-y-4">
          {registeredEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No upcoming events registered</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {registeredEvents.map((event) => (
                <Card key={event._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDateTime(event.startDate)}</span>
                          </div>
                          {event.isOnline ? (
                            <div className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              <span>Online Event</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.type && (
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              <span>{event.type}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="ml-4">
                        {getStatusBadge(event)}
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

