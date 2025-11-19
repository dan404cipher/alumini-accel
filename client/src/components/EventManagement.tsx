import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  User,
  Mail,
  Phone,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { eventAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PendingRegistration {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  };
  registeredAt: string;
  status: string;
  approvalStatus: string;
  phone?: string;
  dietaryRequirements?: string;
  emergencyContact?: string;
  additionalNotes?: string;
}

interface EventWithPending {
  _id: string;
  title: string;
  startDate: string;
  endDate?: string;
  location: string;
  image?: string;
  pendingRegistrationsCount: number;
  attendees: PendingRegistration[];
}

const EventManagement: React.FC = () => {
  const { toast } = useToast();
  const [events, setEvents] = useState<EventWithPending[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventWithPending | null>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch events with pending registrations
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getEventsWithPendingRegistrations();
      if (response.success && response.data) {
        setEvents(response.data.events || []);
      }
    } catch (error) {
      console.error("Error fetching events:", error);
      toast({
        title: "Error",
        description: "Failed to load events with pending registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending registrations for a specific event
  const fetchPendingRegistrations = async (eventId: string) => {
    try {
      setLoadingRegistrations(true);
      const response = await eventAPI.getPendingRegistrations(eventId);
      if (response.success && response.data) {
        setPendingRegistrations(response.data.pendingRegistrations || []);
      }
    } catch (error) {
      console.error("Error fetching pending registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load pending registrations",
        variant: "destructive",
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  // Handle event selection
  const handleEventSelect = (event: EventWithPending) => {
    setSelectedEvent(event);
    fetchPendingRegistrations(event._id);
  };

  // Approve registration
  const handleApprove = async (eventId: string, attendeeId: string) => {
    try {
      setProcessing(attendeeId);
      const response = await eventAPI.approveRegistration(eventId, attendeeId);
      if (response.success) {
        toast({
          title: "Success",
          description: "Registration approved successfully",
        });
        // Refresh data
        if (selectedEvent) {
          fetchPendingRegistrations(selectedEvent._id);
          fetchEvents();
        }
      } else {
        throw new Error(response.message || "Failed to approve registration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  // Reject registration
  const handleReject = async () => {
    if (!selectedRegistration || !selectedEvent) return;

    try {
      setProcessing(selectedRegistration._id);
      const response = await eventAPI.rejectRegistration(
        selectedEvent._id,
        selectedRegistration._id,
        rejectionReason || undefined
      );
      if (response.success) {
        toast({
          title: "Success",
          description: "Registration rejected successfully",
        });
        // Refresh data
        fetchPendingRegistrations(selectedEvent._id);
        fetchEvents();
        setRejectDialogOpen(false);
        setSelectedRegistration(null);
        setRejectionReason("");
      } else {
        throw new Error(response.message || "Failed to reject registration");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Event Management</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage pending event registrations
          </p>
        </div>
        <Button onClick={fetchEvents} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No events with pending registrations</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Events List */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-semibold">Events with Pending Registrations</h3>
            <div className="space-y-3">
              {events.map((event) => (
                <Card
                  key={event._id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedEvent?._id === event._id
                      ? "border-blue-500 border-2"
                      : ""
                  }`}
                  onClick={() => handleEventSelect(event)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">
                        {event.title}
                      </CardTitle>
                      <Badge variant="secondary" className="ml-2">
                        {event.pendingRegistrationsCount}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">
                        {format(new Date(event.startDate), "MMM dd, yyyy")}
                      </span>
                    </CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>

          {/* Pending Registrations */}
          <div className="lg:col-span-2">
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                    <p className="text-sm text-gray-500">
                      {pendingRegistrations.length} pending registration
                      {pendingRegistrations.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {loadingRegistrations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  </div>
                ) : pendingRegistrations.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <p className="text-gray-600">No pending registrations</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {pendingRegistrations.map((registration) => (
                      <Card key={registration._id}>
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                {registration.userId.profilePicture ? (
                                  <img
                                    src={registration.userId.profilePicture}
                                    alt={`${registration.userId.firstName} ${registration.userId.lastName}`}
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-5 h-5 text-gray-500" />
                                )}
                              </div>
                              <div>
                                <CardTitle className="text-base">
                                  {registration.userId.firstName}{" "}
                                  {registration.userId.lastName}
                                </CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Mail className="w-3 h-3" />
                                  <span className="text-xs">
                                    {registration.userId.email}
                                  </span>
                                </CardDescription>
                                {registration.phone && (
                                  <CardDescription className="flex items-center gap-2 mt-1">
                                    <Phone className="w-3 h-3" />
                                    <span className="text-xs">{registration.phone}</span>
                                  </CardDescription>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Pending
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="text-sm text-gray-600">
                              <p>
                                <strong>Registered:</strong>{" "}
                                {format(
                                  new Date(registration.registeredAt),
                                  "MMM dd, yyyy 'at' h:mm a"
                                )}
                              </p>
                            </div>
                            {registration.dietaryRequirements && (
                              <div className="text-sm">
                                <strong>Dietary Requirements:</strong>{" "}
                                <span className="text-gray-600">
                                  {registration.dietaryRequirements}
                                </span>
                              </div>
                            )}
                            {registration.emergencyContact && (
                              <div className="text-sm">
                                <strong>Emergency Contact:</strong>{" "}
                                <span className="text-gray-600">
                                  {registration.emergencyContact}
                                </span>
                              </div>
                            )}
                            {registration.additionalNotes && (
                              <div className="text-sm">
                                <strong>Additional Notes:</strong>{" "}
                                <span className="text-gray-600">
                                  {registration.additionalNotes}
                                </span>
                              </div>
                            )}
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApprove(selectedEvent._id, registration._id)
                                }
                                disabled={processing === registration._id}
                                className="flex-1"
                              >
                                {processing === registration._id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  setSelectedRegistration(registration);
                                  setRejectDialogOpen(true);
                                }}
                                disabled={processing === registration._id}
                                className="flex-1"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    Select an event to view pending registrations
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reject Registration</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this registration? You can provide
              an optional reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRegistration && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  {selectedRegistration.userId.firstName}{" "}
                  {selectedRegistration.userId.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedRegistration.userId.email}
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
                setSelectedRegistration(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing === selectedRegistration?._id}
            >
              {processing === selectedRegistration?._id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reject Registration"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManagement;

