import { useState } from "react";
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
              Registered ({eventsRegistered.length})
            </button>
            <button
              onClick={() => setActiveTab("attended")}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === "attended"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Attended ({eventsAttended.length})
            </button>
          </div>

          {/* Registered Events */}
          {activeTab === "registered" && (
            <div>
              {eventsRegistered.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No events registered yet</p>
                  <Button onClick={() => (window.location.href = "/events")}>
                    <Calendar className="w-4 h-4 mr-2" />
                    Browse Events
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsRegistered.map((event, index) => {
                    const statusText =
                      typeof (event as any).status === "string"
                        ? (event as any).status
                        : "registered";
                    const registeredAtStr =
                      typeof (event as any).registeredAt === "string"
                        ? (event as any).registeredAt
                        : "";
                    const eventIdSafe =
                      (event as any).eventId || (event as any).id || (event as any)._id;
                    return (
                    <div
                      key={eventIdSafe || index}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">Event {index + 1}</h4>
                            <Badge className={getStatusColor(statusText)}>
                              {statusText.charAt(0).toUpperCase() +
                                statusText.slice(1)}
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-2" />
                              <span>
                                Registered on {registeredAtStr ? formatDate(registeredAtStr) : "-"}
                              </span>
                            </div>

                            {event.status === "attended" &&
                              event.attendedAt && (
                                <div className="flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  <span>
                                    Attended on {formatDate(event.attendedAt)}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {eventIdSafe && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                (window.location.href = `/events/${eventIdSafe}`)
                              }
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              View Event
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );})}
                </div>
              )}
            </div>
          )}

          {/* Attended Events */}
          {activeTab === "attended" && (
            <div>
              {eventsAttended.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No events attended yet</p>
                  <p className="text-sm text-gray-400">
                    Attend events to see them here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {eventsAttended.map((event, index) => (
                    <div
                      key={event.eventId || index}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-semibold">Event {index + 1}</h4>
                            <Badge className="bg-green-100 text-green-800">
                              Attended
                            </Badge>
                          </div>

                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                              <span>
                                Attended on {formatDate(event.attendedAt)}
                              </span>
                            </div>

                            {event.feedback && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                  <span className="text-sm font-medium">
                                    Your Feedback:
                                  </span>
                                  <div className="flex items-center">
                                    {renderStars(event.feedback.rating)}
                                  </div>
                                  <span className="text-sm text-gray-600">
                                    ({event.feedback.rating}/5)
                                  </span>
                                </div>
                                {event.feedback.comment && (
                                  <p className="text-sm text-gray-700">
                                    "{event.feedback.comment}"
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
                              (window.location.href = `/events/${event.eventId}`)
                            }
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View Event
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {eventsRegistered.length}
              </div>
              <div className="text-sm text-gray-600">Events Registered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {eventsAttended.length}
              </div>
              <div className="text-sm text-gray-600">Events Attended</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {eventsAttended.length > 0
                  ? Math.round(
                      (eventsAttended.length / eventsRegistered.length) * 100
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
