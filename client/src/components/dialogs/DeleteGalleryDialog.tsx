import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { galleryAPI } from "@/lib/api";

interface DeleteGalleryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gallery: { _id: string; title: string } | null;
  onSuccess: () => void;
}

const DeleteGalleryDialog: React.FC<DeleteGalleryDialogProps> = ({
  open,
  onOpenChange,
  gallery,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    if (!gallery) return;

    setLoading(true);

    try {
      const response = await galleryAPI.deleteGallery(gallery._id);

      if (response.success) {
        toast({
          title: "Success",
          description: "Gallery deleted successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.message || "Failed to delete gallery");
      }
    } catch (error) {
      console.error("Error deleting gallery:", error);
      toast({
        title: "Error",
        description: "Failed to delete gallery",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!gallery) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Delete Gallery
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{gallery.title}"? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-end gap-2 pt-4">
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
            {loading ? "Deleting..." : "Delete Gallery"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteGalleryDialog;
