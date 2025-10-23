import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

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

interface MentorshipActionMenuProps {
  mentorship: MentorshipItem;
  currentUser: {
    _id: string;
    role: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

const MentorshipActionMenu: React.FC<MentorshipActionMenuProps> = ({
  mentorship,
  currentUser,
  onEdit,
  onDelete,
}) => {
  // Debug logging
  console.log("🔍 MentorshipActionMenu Debug:", {
    mentorship,
    currentUser,
    mentorshipId: mentorship?._id,
    mentorId: mentorship?.mentor?._id,
    menteeId: mentorship?.mentee?._id,
    userId: currentUser?._id,
    userRole: currentUser?.role,
    status: mentorship?.status,
  });

  // Check if user can edit/delete this mentorship
  const isMentor = mentorship.mentor._id === currentUser._id;
  const isMentee = mentorship.mentee._id === currentUser._id;
  const isAdmin = [
    "super_admin",
    "college_admin",
    "admin",
    "moderator",
    "hod",
    "staff",
  ].includes(currentUser.role);

  // Can edit/delete if user is mentor, mentee, or admin
  const canEdit = isMentor || isMentee || isAdmin;
  const canDelete = isMentor || isMentee || isAdmin;

  // Only allow edit/delete for pending or active mentorships
  // But admins can modify any mentorship
  const canModify =
    ["pending", "active"].includes(mentorship.status) || isAdmin;

  console.log("🔍 Permission Check:", {
    isMentor,
    isMentee,
    isAdmin,
    userRole: currentUser.role,
    mentorshipStatus: mentorship.status,
    canEdit,
    canDelete,
    canModify,
    willShow: canEdit || canDelete,
    finalShow: (canEdit || canDelete) && canModify,
  });

  if (!canEdit && !canDelete) {
    console.log("❌ MentorshipActionMenu: No permissions, returning null");
    return null;
  }

  if (!canModify) {
    console.log(
      "❌ MentorshipActionMenu: Cannot modify status, returning null"
    );
    return null;
  }

  console.log("✅ MentorshipActionMenu: Rendering menu");

  return (
    <div className="flex gap-1">
      {/* Test button to verify component is rendering */}
      <Button variant="outline" size="sm" className="h-6 w-6 p-0 text-xs">
        T
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canEdit && canModify && (
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
          )}
          {canDelete && canModify && (
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MentorshipActionMenu;
