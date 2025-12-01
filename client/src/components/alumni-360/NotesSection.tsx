import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, FileText, User, Clock, Edit, Trash2 } from "lucide-react";
import { AlumniNote } from "@/types/alumni360";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/api";

interface NotesSectionProps {
  notes: AlumniNote[];
  onAddNote: (
    content: string,
    category?: string,
    isPrivate?: boolean
  ) => Promise<void>;
  onUpdateNote?: (
    noteId: string,
    content: string,
    category?: string,
    isPrivate?: boolean
  ) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  loading?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
}

const categoryLabels: Record<string, string> = {
  general: "General",
  meeting: "Meeting",
  call: "Call",
  email: "Email",
  event: "Event",
  donation: "Donation",
  issue: "Issue",
  other: "Other",
};

export const NotesSection = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  loading,
  currentUserId,
  currentUserRole,
}: NotesSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<AlumniNote | null>(null);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onAddNote(content, category, isPrivate);
      setContent("");
      setCategory("general");
      setIsPrivate(false);
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (note: AlumniNote) => {
    setEditingNote(note);
    setContent(note.content);
    setCategory(note.category || "general");
    setIsPrivate(note.isPrivate || false);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingNote || !content.trim() || !onUpdateNote) return;

    setSubmitting(true);
    try {
      await onUpdateNote(editingNote._id, content, category, isPrivate);
      setContent("");
      setCategory("general");
      setIsPrivate(false);
      setEditingNote(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating note:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!onDeleteNote) return;
    if (
      !confirm(
        "Are you sure you want to delete this note? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await onDeleteNote(noteId);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const canEditOrDelete = (note: AlumniNote) => {
    if (!currentUserId) {
      return false;
    }

    // Check if user is admin (super_admin or college_admin)
    const isAdmin =
      currentUserRole === "super_admin" || currentUserRole === "college_admin";

    // Allow edit/delete if user is the creator (staffId matches currentUserId) OR if user is admin
    const staffId = note.staffId?._id || note.staffId?._id?.toString();
    const userId = currentUserId.toString();
    const isCreator = staffId === userId || staffId?.toString() === userId;

    return isCreator || isAdmin;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Notes</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Note</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
              <DialogDescription>
                Add a note about this alumnus. Notes are visible to all staff
                members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your note here..."
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="private" className="text-sm">
                  Private note (only visible to you)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || submitting}
              >
                {submitting ? "Adding..." : "Add Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Note Dialog */}
      {onUpdateNote && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Note</DialogTitle>
              <DialogDescription>
                Update the note content and details.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note Content</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter your note here..."
                  rows={6}
                  className="resize-none"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-private"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="edit-private" className="text-sm">
                  Private note (only visible to you)
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingNote(null);
                  setContent("");
                  setCategory("general");
                  setIsPrivate(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={!content.trim() || submitting}
              >
                {submitting ? "Updating..." : "Update Note"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading notes...
        </div>
      ) : notes.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No notes yet. Add the first note to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note._id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <img
                      src={
                        note.staffId.profilePicture
                          ? getImageUrl(note.staffId.profilePicture)
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${note.staffId.firstName} ${note.staffId.lastName}`
                            )}&background=random&color=fff`
                      }
                      alt={`${note.staffId.firstName} ${note.staffId.lastName}`}
                      className="w-10 h-10 rounded-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">
                          {note.staffId.firstName} {note.staffId.lastName}
                        </span>
                        {note.category && (
                          <Badge variant="outline" className="text-xs">
                            {categoryLabels[note.category] || note.category}
                          </Badge>
                        )}
                        {note.isPrivate && (
                          <Badge variant="secondary" className="text-xs">
                            Private
                          </Badge>
                        )}
                      </div>
                      {(onUpdateNote || onDeleteNote) && (
                        <div className="flex items-center gap-2">
                          {canEditOrDelete(note) ? (
                            <>
                              {onUpdateNote && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(note)}
                                  className="h-8 px-2"
                                  title="Edit note"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">Edit</span>
                                </Button>
                              )}
                              {onDeleteNote && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(note._id)}
                                  className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  title="Delete note"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  <span className="hidden sm:inline">
                                    Delete
                                  </span>
                                </Button>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              (Only creator can edit)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>
                        {format(
                          new Date(note.createdAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
