// MentorActionMenu component for mentor management actions
// Author: AI Assistant
// Purpose: 3-dot menu for editing and deleting mentors

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Mentor } from "../types";

interface MentorActionMenuProps {
  mentor: Mentor;
  currentUser: any;
  onEdit: (mentor: Mentor) => void;
  onDelete: (mentor: Mentor) => void;
}

const MentorActionMenu: React.FC<MentorActionMenuProps> = ({
  mentor,
  currentUser,
  onEdit,
  onDelete,
}) => {
  // Check if user can edit/delete this mentor
  const isOwner = mentor.userId === currentUser?._id;
  const isAdmin = [
    "super_admin",
    "college_admin",
    "admin",
    "moderator",
    "hod",
    "staff",
  ].includes(currentUser?.role);

  const canEdit = isOwner || isAdmin;
  const canDelete = isOwner || isAdmin;

  // Don't show menu if user has no permissions
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onEdit(mentor);
            }}
            className="cursor-pointer"
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Mentor
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              onDelete(mentor);
            }}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Mentor
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default MentorActionMenu;
