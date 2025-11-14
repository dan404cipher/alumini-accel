// DeleteMentorDialog component for confirming mentor deletion
// Author: AI Assistant
// Purpose: Confirmation dialog for deleting mentors

import React, { useState } from "react";
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
import { AlertTriangle } from "lucide-react";
import type { Mentor } from "../mentorship-system/types";

interface DeleteMentorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  onSuccess: () => void;
}

const DeleteMentorDialog: React.FC<DeleteMentorDialogProps> = ({
  open,
  onOpenChange,
  mentor,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!mentor) return;

    setLoading(true);
    try {
      // TODO: Call API to delete mentor
      console.log("Deleting mentor:", mentor);

      toast({
        title: "Success",
        description: "Mentor deleted successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting mentor:", error);
      toast({
        title: "Error",
        description: "Failed to delete mentor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mentor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete Mentor
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{mentor.name}</strong> from
            the mentorship program?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-800">
                <p className="font-medium mb-1">
                  This action cannot be undone.
                </p>
                <p>
                  This will permanently remove the mentor from the program and
                  may affect active mentorships.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
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
            {loading ? "Deleting..." : "Delete Mentor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMentorDialog;
