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
import { Plus, X, Tag } from "lucide-react";
import { AlumniFlag } from "@/types/alumni360";

interface FlagsSectionProps {
  flags: AlumniFlag[];
  onAddFlag: (data: { flagType: string; flagValue: string; description?: string }) => Promise<void>;
  onRemoveFlag: (flagType: string) => Promise<void>;
  loading?: boolean;
}

const flagTypes = [
  { value: "vip", label: "VIP" },
  { value: "major_donor", label: "Major Donor" },
  { value: "inactive", label: "Inactive" },
  { value: "at_risk", label: "At Risk" },
  { value: "high_engagement", label: "High Engagement" },
  { value: "mentor", label: "Mentor" },
  { value: "speaker", label: "Speaker" },
  { value: "volunteer", label: "Volunteer" },
  { value: "custom", label: "Custom" },
];

const flagColors: Record<string, string> = {
  vip: "bg-purple-100 text-purple-800 border-purple-300",
  major_donor: "bg-amber-100 text-amber-800 border-amber-300",
  inactive: "bg-gray-100 text-gray-800 border-gray-300",
  at_risk: "bg-red-100 text-red-800 border-red-300",
  high_engagement: "bg-green-100 text-green-800 border-green-300",
  mentor: "bg-blue-100 text-blue-800 border-blue-300",
  speaker: "bg-indigo-100 text-indigo-800 border-indigo-300",
  volunteer: "bg-teal-100 text-teal-800 border-teal-300",
  custom: "bg-slate-100 text-slate-800 border-slate-300",
};

export const FlagsSection = ({
  flags,
  onAddFlag,
  onRemoveFlag,
  loading,
}: FlagsSectionProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flagType, setFlagType] = useState<string>("");
  const [flagValue, setFlagValue] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!flagType || !flagValue.trim()) return;

    setSubmitting(true);
    try {
      await onAddFlag({ flagType, flagValue, description });
      setFlagType("");
      setFlagValue("");
      setDescription("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error adding flag:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (flagType: string) => {
    if (!confirm("Are you sure you want to remove this flag?")) return;
    try {
      await onRemoveFlag(flagType);
    } catch (error) {
      console.error("Error removing flag:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Flags</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Flag</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Flag</DialogTitle>
              <DialogDescription>
                Add a flag to mark important information about this alumnus.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Flag Type</label>
                <Select value={flagType} onValueChange={setFlagType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select flag type" />
                  </SelectTrigger>
                  <SelectContent>
                    {flagTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Flag Value</label>
                <Input
                  value={flagValue}
                  onChange={(e) => setFlagValue(e.target.value)}
                  placeholder="Enter flag value"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add description..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!flagType || !flagValue.trim() || submitting}
              >
                {submitting ? "Adding..." : "Add Flag"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading flags...</div>
      ) : flags.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Tag className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No flags yet. Add flags to mark important information.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          {flags.map((flag) => (
            <Badge
              key={flag._id}
              variant="outline"
              className={`${flagColors[flag.flagType] || flagColors.custom} text-sm py-2 px-3 flex items-center gap-2`}
            >
              <span>{flag.flagValue}</span>
              <button
                onClick={() => handleRemove(flag.flagType)}
                className="hover:bg-black/10 rounded-full p-0.5"
                aria-label="Remove flag"
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

