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
import { newsAPI } from "@/lib/api";

interface News {
  _id: string;
  title: string;
  summary: string;
  image?: string;
  isShared: boolean;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface DeleteNewsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  news: News | null;
  onNewsDeleted?: () => void;
}

export const DeleteNewsDialog = ({
  open,
  onOpenChange,
  news,
  onNewsDeleted,
}: DeleteNewsDialogProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!news) return;

    setIsLoading(true);

    try {
      const response = await newsAPI.deleteNews(news._id);

      if (response.success) {
        toast({
          title: "News Deleted Successfully",
          description: `"${news.title}" has been deleted successfully.`,
        });

        onOpenChange(false);

        // Notify parent component to refresh news
        if (onNewsDeleted) {
          onNewsDeleted();
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete news",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      console.error("Unexpected error deleting news:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!news) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Delete News Article
          </DialogTitle>
          <DialogDescription className="text-left">
            Are you sure you want to delete this news article? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">{news.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-3">{news.summary}</p>
            <div className="mt-2 text-xs text-gray-500">
              By {news.author?.firstName} {news.author?.lastName} •{" "}
              {new Date(news.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
            className="flex items-center"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            {isLoading ? "Deleting..." : "Delete News"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteNewsDialog;
