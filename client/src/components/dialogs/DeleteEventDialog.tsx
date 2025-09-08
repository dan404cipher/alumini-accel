import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, AlertTriangle } from "lucide-react";
import { eventAPI } from "@/lib/api";

interface Event {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  currentAttendees: number;
}

interface DeleteEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event | null;
  onEventDeleted?: () => void;
}

export const DeleteEventDialog = ({
  open,
  onOpenChange,
  event,
  onEventDeleted,
}: DeleteEventDialogProps) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!event) return;

    setIsDeleting(true);

    try {
      const response = await eventAPI.deleteEvent(event._id);

      if (response.success) {
        toast({
          title: "Event Deleted Successfully",
          description: `${event.title} has been deleted successfully.`,
        });

        onOpenChange(false);

        // Notify parent component to refresh events
        if (onEventDeleted) {
          onEventDeleted();
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete event",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error deleting event:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!event) return null;

  const eventDate = new Date(event.startDate).toLocaleDateString();
  const eventTime = new Date(event.startDate).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete Event
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the event
            and remove all associated data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">Event Details:</h4>
            <div className="space-y-1 text-sm text-red-700">
              <p>
                <strong>Title:</strong> {event.title}
              </p>
              <p>
                <strong>Date:</strong> {eventDate} at {eventTime}
              </p>
              <p>
                <strong>Location:</strong> {event.location}
              </p>
              <p>
                <strong>Current Attendees:</strong> {event.currentAttendees}
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Warning:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    All registered attendees will be notified of the
                    cancellation
                  </li>
                  <li>
                    Event data and attendee information will be permanently
                    removed
                  </li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
