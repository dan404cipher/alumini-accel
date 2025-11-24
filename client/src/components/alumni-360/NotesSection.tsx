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
import { Plus, FileText, User, Clock } from "lucide-react";
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
  loading?: boolean;
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
  loading,
}: NotesSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
                    <div className="flex items-center gap-2 mb-1">
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
