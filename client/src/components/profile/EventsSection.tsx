import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { eventAPI } from "@/lib/api";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Star,
  ExternalLink,
  CheckCircle,
} from "lucide-react";

interface Event {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  isOnline: boolean;
  type: string;
  status: "registered" | "attended" | "cancelled";
  registeredAt: string;
  attendedAt?: string;
  feedback?: {
    rating: number;
    comment?: string;
  };
}

interface EventsSectionProps {
  eventsRegistered: Array<{
    eventId: string;
    registeredAt: string;
    status: "registered" | "attended" | "cancelled";
  }>;
  eventsAttended: Array<{
    eventId: string;
    attendedAt: string;
    feedback?: {
      rating: number;
      comment?: string;
    };
  }>;
  isEditing: boolean;
  onUpdate: () => void;
}

export const EventsSection = ({
  eventsRegistered,
  eventsAttended,
  isEditing,
  onUpdate,
}: EventsSectionProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"registered" | "attended">(
    "registered"
  );
  const [registeredEventsData, setRegisteredEventsData] = useState<Array<Event & { registrationData: any }>>([]);
  const [attendedEventsData, setAttendedEventsData] = useState<Array<Event & { attendanceData: any }>>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [showAllRegistered, setShowAllRegistered] = useState(false);
  const [showAllAttended, setShowAllAttended] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "registered":
        return "bg-blue-100 text-blue-800";
      case "attended":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? "text-yellow-400 fill-current" : "text-gray-300"
        }`}
      />
    ));
  };

  // Fetch event details for registered events - fetch from API instead of relying on props
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        setLoadingEvents(true);
        // Fetch user's registered events from API
        const response = await eventAPI.getMyRegistrations({ limit: 100 });
        
        if (response.success && response.data) {
          const eventsData = (response.data as { events?: any[] })?.events || [];
          const eventsWithRegistration = eventsData.map((event: any) => {
            // Find the attendee record for this user
            const attendee = event.attendees?.find((a: any) => {
              const userId = typeof a.userId === "string" ? a.userId : a.userId?._id;
              return userId;
            });
            
            return {
              ...event,
              registrationData: {
                eventId: event._id,
                registeredAt: attendee?.registeredAt || event.createdAt,
                status: attendee?.status || "registered",
              },
            };
          });
          setRegisteredEventsData(eventsWithRegistration);
        }
      } catch (error) {
        console.error("Error fetching registered events:", error);
        setRegisteredEventsData([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchRegisteredEvents();
  }, []); // Fetch on mount only

  // Fetch event details for attended events - filter from registered events where status is "attended"
  useEffect(() => {
    const fetchAttendedEvents = async () => {
      try {
        setLoadingEvents(true);
        // Fetch user's registered events and filter for attended ones
        const response = await eventAPI.getMyRegistrations({ limit: 100 });
        
        if (response.success && response.data) {
          const eventsData = (response.data as { events?: any[] })?.events || [];
          // Filter events where user's status is "attended"
          const attendedEvents = eventsData.filter((event: any) => {
            const attendee = event.attendees?.find((a: any) => {
              const userId = typeof a.userId === "string" ? a.userId : a.userId?._id;
              return userId;
            });
            return attendee?.status === "attended";
          });
          
          const eventsWithAttendance = attendedEvents.map((event: any) => {
            const attendee = event.attendees?.find((a: any) => {
              const userId = typeof a.userId === "string" ? a.userId : a.userId?._id;
              return userId;
            });
            
            return {
              ...event,
              attendanceData: {
                eventId: event._id,
                attendedAt: attendee?.attendedAt || attendee?.updatedAt || event.updatedAt,
                feedback: attendee?.feedback,
              },
            };
          });
          setAttendedEventsData(eventsWithAttendance);
        }
      } catch (error) {
        console.error("Error fetching attended events:", error);
        setAttendedEventsData([]);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchAttendedEvents();
  }, []); // Fetch on mount only

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events</CardTitle>
        <CardDescription>
          Track your event registrations and attendance
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("registered")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "registered"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Registered ({registeredEventsData.length})
            </button>
            <button
              onClick={() => setActiveTab("attended")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "attended"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Attended ({attendedEventsData.length})
            </button>
          </div>

          {/* Registered Events */}
          {activeTab === "registered" && (
            <div>
              {loadingEvents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading events...</p>
                </div>
              ) : registeredEventsData.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No events registered yet</p>
                  <Button onClick={() => (window.location.href = "/events")}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Browse Events
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="space-y-4">
                    {(showAllRegistered ? registeredEventsData : registeredEventsData.slice(0, 7)).map((event) => {
                    const statusText = event.registrationData?.status || "registered";
                    const registeredAtStr = event.registrationData?.registeredAt || "";
                    return (
                      <div
                        key={event._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{event.title || "Untitled Event"}</h4>
                              <Badge className={getStatusColor(statusText)}>
                                {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              {event.startDate && (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>
                                    {formatDate(event.startDate)} at {formatTime(event.startDate)}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {registeredAtStr && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>
                                    Registered on {formatDate(registeredAtStr)}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/events/${event._id}`)
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Event
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  {registeredEventsData.length > 7 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllRegistered(!showAllRegistered)}
                      >
                        {showAllRegistered ? "Show Less" : `View All Registered (${registeredEventsData.length})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Attended Events */}
          {activeTab === "attended" && (
            <div>
              {loadingEvents ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading events...</p>
                </div>
              ) : attendedEventsData.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No events attended yet</p>
                  <p className="text-sm text-gray-400">
                    Attend events to see them here
                  </p>
                </div>
              ) : (
                <div>
                  <div className="space-y-4">
                    {(showAllAttended ? attendedEventsData : attendedEventsData.slice(0, 7)).map((event) => {
                    const attendanceData = event.attendanceData;
                    return (
                      <div
                        key={event._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold">{event.title || "Untitled Event"}</h4>
                              <Badge className="bg-green-100 text-green-800">
                                Attended
                              </Badge>
                            </div>

                            <div className="space-y-2 text-sm text-gray-600">
                              {event.startDate && (
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-2" />
                                  <span>
                                    {formatDate(event.startDate)} at {formatTime(event.startDate)}
                                  </span>
                                </div>
                              )}
                              {event.location && (
                                <div className="flex items-center">
                                  <MapPin className="w-4 h-4 mr-2" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                              {attendanceData?.attendedAt && (
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  <span>
                                    Attended on {formatDate(attendanceData.attendedAt)}
                                  </span>
                                </div>
                              )}

                              {attendanceData?.feedback && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <span className="text-sm font-medium">
                                      Your Feedback:
                                    </span>
                                    <div className="flex items-center">
                                      {renderStars(attendanceData.feedback.rating)}
                                    </div>
                                    <span className="text-sm text-gray-600">
                                      ({attendanceData.feedback.rating}/5)
                                    </span>
                                  </div>
                                  {attendanceData.feedback.comment && (
                                    <p className="text-sm text-gray-700">
                                      "{attendanceData.feedback.comment}"
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/events/${event._id}`)
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Event
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                  {attendedEventsData.length > 7 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllAttended(!showAllAttended)}
                      >
                        {showAllAttended ? "Show Less" : `View All Attended (${attendedEventsData.length})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {registeredEventsData.length}
              </div>
              <div className="text-sm text-gray-600">Events Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {attendedEventsData.length}
              </div>
              <div className="text-sm text-gray-600">Events Attended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {registeredEventsData.length > 0
                  ? Math.round(
                      (attendedEventsData.length / registeredEventsData.length) * 100
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
