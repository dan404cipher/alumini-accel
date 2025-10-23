import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Trash2 } from "lucide-react";

interface GalleryActionMenuProps {
  gallery: {
    _id: string;
    title: string;
    createdBy: {
      _id: string;
    };
  };
  currentUser: {
    _id: string;
    role: string;
  } | null;
  onEdit: () => void;
  onDelete: () => void;
}

const GalleryActionMenu: React.FC<GalleryActionMenuProps> = ({
  gallery,
  currentUser,
  onEdit,
  onDelete,
}) => {
  // Check if user can edit/delete this gallery
  const isCreator = currentUser?._id === gallery.createdBy._id;
  const isAdmin =
    currentUser?.role === "admin" ||
    currentUser?.role === "super_admin" ||
    currentUser?.role === "college_admin";
  const isModerator = currentUser?.role === "moderator";
  const isHOD = currentUser?.role === "hod";
  const isStaff = currentUser?.role === "staff";

  const canEdit = isCreator || isAdmin || isModerator || isHOD || isStaff;
  const canDelete = isCreator || isAdmin || isModerator || isHOD || isStaff;

  // Don't show menu if user can't perform any actions
  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Gallery
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Gallery
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GalleryActionMenu;
