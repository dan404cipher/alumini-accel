import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, AlertCircle, CheckCircle, Clock, XCircle, MessageSquare } from "lucide-react";
import { AlumniIssue } from "@/types/alumni360";
import { format } from "date-fns";
import { getImageUrl } from "@/lib/api";

interface IssuesSectionProps {
  issues: AlumniIssue[];
  onCreateIssue: (data: { title: string; description: string; priority?: string }) => Promise<void>;
  onUpdateIssue: (issueId: string, data: { status?: string; response?: string }) => Promise<void>;
  loading?: boolean;
}

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 border-yellow-300",
  resolved: "bg-green-100 text-green-800 border-green-300",
  closed: "bg-gray-100 text-gray-800 border-gray-300",
};

const priorityColors: Record<string, string> = {
  low: "bg-gray-100 text-gray-800",
  medium: "bg-blue-100 text-blue-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

export const IssuesSection = ({
  issues,
  onCreateIssue,
  onUpdateIssue,
  loading,
}: IssuesSectionProps) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<AlumniIssue | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("medium");
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateIssue = async () => {
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    try {
      await onCreateIssue({ title, description, priority });
      setTitle("");
      setDescription("");
      setPriority("medium");
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Error creating issue:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddResponse = async (issueId: string) => {
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      await onUpdateIssue(issueId, { response });
      setResponse("");
      setSelectedIssue(null);
    } catch (error) {
      console.error("Error adding response:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Issues</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create Issue</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Issue</DialogTitle>
              <DialogDescription>
                Create a new issue for this alumnus. Issues help track and resolve problems.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Issue title"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={6}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateIssue}
                disabled={!title.trim() || !description.trim() || submitting}
              >
                {submitting ? "Creating..." : "Create Issue"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading issues...</div>
      ) : issues.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No issues yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => (
            <Card key={issue._id}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-base">{issue.title}</h3>
                        <Badge
                          variant="outline"
                          className={`${statusColors[issue.status]} text-xs`}
                        >
                          {issue.status.replace("_", " ")}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`${priorityColors[issue.priority]} text-xs`}
                        >
                          {issue.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words">
                        {issue.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>
                          Created: {format(new Date(issue.createdAt), "MMM dd, yyyy")}
                        </span>
                        {issue.raisedBy && (
                          <span>
                            By: {issue.raisedBy.firstName} {issue.raisedBy.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  {issue.responses && issue.responses.length > 0 && (
                    <div className="border-t pt-3 space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Responses ({issue.responses.length})
                      </h4>
                      {issue.responses.map((response, idx) => (
                        <div key={idx} className="bg-muted p-3 rounded-md">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium">
                              {response.staffId.firstName} {response.staffId.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(response.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {response.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Response */}
                  {issue.status !== "resolved" && issue.status !== "closed" && (
                    <div className="border-t pt-3">
                      {selectedIssue?._id === issue._id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={response}
                            onChange={(e) => setResponse(e.target.value)}
                            placeholder="Add a response..."
                            rows={3}
                            className="resize-none"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddResponse(issue._id)}
                              disabled={!response.trim() || submitting}
                            >
                              {submitting ? "Adding..." : "Add Response"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedIssue(null);
                                setResponse("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedIssue(issue)}
                          className="w-full sm:w-auto"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Add Response
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

