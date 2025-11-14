import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Flag,
  Share2,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ActionMenuProps {
  // Entity information
  entityId: string;
  entityType: "post" | "comment";
  entityAuthorId: string;

  // User permissions
  canEdit: boolean;
  canDelete: boolean;
  canReport: boolean;
  canShare: boolean;

  // Callbacks
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: (reason: string, description: string) => void;
  onShare?: () => void;

  // Optional props
  className?: string;
  size?: "sm" | "md" | "lg";
}

const REPORT_REASONS = [
  { value: "spam", label: "Spam" },
  { value: "harassment", label: "Harassment" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "violence", label: "Violence" },
  { value: "misinformation", label: "Misinformation" },
  { value: "copyright_violation", label: "Copyright Violation" },
  { value: "other", label: "Other" },
];

export const ActionMenu: React.FC<ActionMenuProps> = ({
  entityId,
  entityType,
  entityAuthorId,
  canEdit,
  canDelete,
  canReport,
  canShare,
  onEdit,
  onDelete,
  onReport,
  onShare,
  className = "",
  size = "sm",
}) => {
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteDialog(false);
  };

  const handleReport = () => {
    if (!reportReason) {
      toast({
        title: "Error",
        description: "Please select a reason for reporting",
        variant: "destructive",
      });
      return;
    }

    if (onReport) {
      onReport(reportReason, reportDescription);
    }

    setShowReportDialog(false);
    setReportReason("");
    setReportDescription("");

    toast({
      title: "Success",
      description: `${entityType} reported successfully`,
    });
  };

  const handleShare = async () => {
    if (onShare) {
      onShare();
      return;
    }

    // Default share behavior
    const url = `${window.location.origin}/community/post/${entityId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Check out this ${entityType}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or failed:", error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Success",
          description: "Link copied to clipboard",
        });
      } catch (error) {
        console.error("Failed to copy to clipboard:", error);
        toast({
          title: "Error",
          description: "Failed to copy link",
          variant: "destructive",
        });
      }
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/community/post/${entityId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case "sm":
        return "h-6 w-6";
      case "md":
        return "h-8 w-8";
      case "lg":
        return "h-10 w-10";
      default:
        return "h-6 w-6";
    }
  };

  const getIconSize = () => {
    switch (size) {
      case "sm":
        return "w-3 h-3";
      case "md":
        return "w-4 h-4";
      case "lg":
        return "w-5 h-5";
      default:
        return "w-3 h-3";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`${getButtonSize()} p-0 hover:bg-gray-100 ${className}`}
          >
            <MoreHorizontal className={getIconSize()} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {canEdit && (
            <DropdownMenuItem onClick={onEdit} className="cursor-pointer">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
          )}

          {canDelete && (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          )}

          {canShare && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleShare}
                className="cursor-pointer"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="cursor-pointer"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
            </>
          )}

          {canReport && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowReportDialog(true)}
                className="cursor-pointer text-orange-600 focus:text-orange-600"
              >
                <Flag className="w-4 h-4 mr-2" />
                Report
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {entityType}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {entityType}? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report {entityType}</DialogTitle>
            <DialogDescription>
              Help us understand what's wrong with this {entityType}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for reporting</Label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Additional details (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about why you're reporting this content..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-gray-500">
                {reportDescription.length}/500 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={!reportReason}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionMenu;
