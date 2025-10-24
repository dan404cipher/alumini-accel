import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mentorshipApi } from "@/services/mentorshipApi";

interface MentorshipItem {
  _id: string;
  domain: string;
  goals: string[];
  duration: number;
  startDate: string;
  endDate: string;
  notes?: string;
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

interface EditMentorshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentorship: MentorshipItem | null;
  onSuccess: () => void;
}

const EditMentorshipDialog: React.FC<EditMentorshipDialogProps> = ({
  open,
  onOpenChange,
  mentorship,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    domain: "",
    goals: [] as string[],
    duration: 0,
    startDate: "",
    endDate: "",
    notes: "",
  });
  const [newGoal, setNewGoal] = useState("");

  const domains = [
    "Technology",
    "Business",
    "Healthcare",
    "Education",
    "Finance",
    "Marketing",
    "Engineering",
    "Design",
    "Research",
    "Leadership",
    "Career Development",
    "Other",
  ];

  // Initialize form data when mentorship changes
  useEffect(() => {
    if (mentorship) {
      setFormData({
        domain: mentorship.domain || "",
        goals: mentorship.goals || [],
        duration: mentorship.duration || 0,
        startDate: mentorship.startDate
          ? new Date(mentorship.startDate).toISOString().split("T")[0]
          : "",
        endDate: mentorship.endDate
          ? new Date(mentorship.endDate).toISOString().split("T")[0]
          : "",
        notes: mentorship.notes || "",
      });
    }
  }, [mentorship]);

  const addGoal = () => {
    if (newGoal.trim() && !formData.goals.includes(newGoal.trim())) {
      setFormData((prev) => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()],
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (goalToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      goals: prev.goals.filter((goal) => goal !== goalToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mentorship) return;

    if (!formData.domain.trim()) {
      toast({
        title: "Error",
        description: "Domain is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.goals.length === 0) {
      toast({
        title: "Error",
        description: "At least one goal is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Start date and end date are required",
        variant: "destructive",
      });
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await mentorshipApi.updateMentorship(mentorship._id, {
        domain: formData.domain.trim(),
        goals: formData.goals,
        duration: formData.duration,
        startDate: formData.startDate,
        endDate: formData.endDate,
        notes: formData.notes.trim(),
      });

      if (response.success) {
        toast({
          title: "Success",
          description: "Mentorship updated successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        throw new Error(response.message || "Failed to update mentorship");
      }
    } catch (error) {
      console.error("Error updating mentorship:", error);
      toast({
        title: "Error",
        description: "Failed to update mentorship",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mentorship) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Mentorship</DialogTitle>
          <DialogDescription>
            Update your mentorship details and goals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="domain">Domain *</Label>
            <Select
              value={formData.domain}
              onValueChange={(value) =>
                setFormData({ ...formData, domain: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select domain" />
              </SelectTrigger>
              <SelectContent>
                {domains.map((domain) => (
                  <SelectItem key={domain} value={domain}>
                    {domain}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Goals *</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="Enter a goal"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addGoal();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addGoal}
                  disabled={!newGoal.trim()}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.goals.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.goals.map((goal, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {goal}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeGoal(goal)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="duration">Duration (weeks)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="52"
              value={formData.duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  duration: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Enter duration in weeks"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  required
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
            <div>
              <Label htmlFor="endDate">End Date *</Label>
              <div className="relative">
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  required
                />
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes about the mentorship"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Mentorship"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMentorshipDialog;
