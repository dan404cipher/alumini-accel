import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mentorshipApi } from "@/services/mentorshipApi";

interface MentorshipItem {
  _id: string;
  domain: string;
  status: string;
  mentor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  mentee: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface DeleteMentorshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorship: MentorshipItem | null;
  onSuccess: () => void;
}

const DeleteMentorshipDialog: React.FC<DeleteMentorshipDialogProps> = ({
  open,
  onOpenChange,
  mentorship,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!mentorship) return;

    setLoading(true);

    try {
      const response = await mentorshipApi.deleteMentorship(mentorship._id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Mentorship cancelled successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.message || "Failed to cancel mentorship");
      }
    } catch (error) {
      console.error("Error cancelling mentorship:", error);
      toast({
        title: "Error",
        description: "Failed to cancel mentorship",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mentorship) return null;

  const getStatusMessage = () => {
    switch (mentorship.status) {
      case "pending":
        return "This will cancel the mentorship request.";
      case "active":
        return "This will end the active mentorship.";
      default:
        return "This will cancel the mentorship.";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Cancel Mentorship
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this mentorship?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">
              Mentorship Details
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <strong>Domain:</strong> {mentorship.domain}
              </p>
              <p>
                <strong>Mentor:</strong> {mentorship.mentor.firstName}{" "}
                {mentorship.mentor.lastName}
              </p>
              <p>
                <strong>Mentee:</strong> {mentorship.mentee.firstName}{" "}
                {mentorship.mentee.lastName}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="capitalize">{mentorship.status}</span>
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> {getStatusMessage()} This action cannot
              be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Cancelling..." : "Cancel Mentorship"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMentorshipDialog;
