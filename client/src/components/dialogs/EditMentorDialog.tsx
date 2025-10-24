// EditMentorDialog component for editing mentor details
// Author: AI Assistant
// Purpose: Dialog for editing mentor information

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Mentor } from "../mentorship-system/types";

interface EditMentorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentor: Mentor | null;
  onSuccess: () => void;
}

const EditMentorDialog: React.FC<EditMentorDialogProps> = ({
  open,
  onOpenChange,
  mentor,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    company: "",
    yearsExp: "",
    slots: "",
    expertise: "",
    style: "",
    hours: "",
    timezone: "",
    testimonial: "",
    industry: "",
  });
  const [loading, setLoading] = useState(false);

  // Initialize form with mentor data
  useEffect(() => {
    if (mentor) {
      setFormData({
        name: mentor.name || "",
        title: mentor.title || "",
        company: mentor.company || "",
        yearsExp: mentor.yearsExp?.toString() || "",
        slots: mentor.slots?.toString() || "",
        expertise: mentor.expertise?.join(", ") || "",
        style: mentor.style || "",
        hours: mentor.hours || "",
        timezone: mentor.timezone || "",
        testimonial: mentor.testimonial || "",
        industry: mentor.industry || "",
      });
    }
  }, [mentor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mentor) return;

    setLoading(true);
    try {
      // Convert form data back to mentor format
      const updatedMentor: Mentor = {
        ...mentor,
        name: formData.name,
        title: formData.title,
        company: formData.company,
        yearsExp: formData.yearsExp ? parseInt(formData.yearsExp) : "",
        slots: formData.slots ? parseInt(formData.slots) : "",
        expertise: formData.expertise
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
        style: formData.style,
        hours: formData.hours,
        timezone: formData.timezone,
        testimonial: formData.testimonial,
        industry: formData.industry,
      };

      // TODO: Call API to update mentor
      console.log("Updating mentor:", updatedMentor);

      toast({
        title: "Success",
        description: "Mentor updated successfully",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating mentor:", error);
      toast({
        title: "Error",
        description: "Failed to update mentor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!mentor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Mentor Profile</DialogTitle>
          <DialogDescription>
            Update the mentor's information and expertise.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="title">Job Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={formData.industry}
                onChange={(e) => handleInputChange("industry", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="yearsExp">Years of Experience</Label>
              <Input
                id="yearsExp"
                type="number"
                value={formData.yearsExp}
                onChange={(e) => handleInputChange("yearsExp", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="slots">Available Slots</Label>
              <Input
                id="slots"
                type="number"
                value={formData.slots}
                onChange={(e) => handleInputChange("slots", e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expertise">Expertise (comma-separated)</Label>
            <Input
              id="expertise"
              value={formData.expertise}
              onChange={(e) => handleInputChange("expertise", e.target.value)}
              placeholder="React, Node.js, Leadership, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hours">Available Hours</Label>
              <Input
                id="hours"
                value={formData.hours}
                onChange={(e) => handleInputChange("hours", e.target.value)}
                placeholder="Weekdays 6-8 PM EST"
              />
            </div>
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleInputChange("timezone", e.target.value)}
                placeholder="UTC-5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="style">Mentoring Style</Label>
            <Textarea
              id="style"
              value={formData.style}
              onChange={(e) => handleInputChange("style", e.target.value)}
              placeholder="Describe your mentoring approach..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="testimonial">Testimonial</Label>
            <Textarea
              id="testimonial"
              value={formData.testimonial}
              onChange={(e) => handleInputChange("testimonial", e.target.value)}
              placeholder="Share your mentoring experience and success stories..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Mentor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMentorDialog;
