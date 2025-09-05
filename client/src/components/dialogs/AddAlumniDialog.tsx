import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, UserPlus } from "lucide-react";
import { invitationAPI } from "@/lib/api";

interface AddAlumniDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddAlumniDialog = ({
  open,
  onOpenChange,
}: AddAlumniDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    graduationYear: "2024", // Default to current year
    degree: "",
    currentRole: "",
    company: "",
    location: "",
    linkedinProfile: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error("Name is required");
      }
      if (!formData.email.trim()) {
        throw new Error("Email is required");
      }
      if (!formData.graduationYear.trim()) {
        throw new Error("Graduation year is required");
      }

      const graduationYear = parseInt(formData.graduationYear);
      if (
        isNaN(graduationYear) ||
        graduationYear < 1950 ||
        graduationYear > new Date().getFullYear() + 5
      ) {
        throw new Error("Please enter a valid graduation year");
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error("Please enter a valid email address");
      }

      // Prepare invitation data
      const invitationData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        graduationYear: graduationYear,
        degree: formData.degree.trim() || undefined,
        currentRole: formData.currentRole.trim() || undefined,
        company: formData.company.trim() || undefined,
        location: formData.location.trim() || undefined,
        linkedinProfile: formData.linkedinProfile.trim() || undefined,
      };

      console.log("Sending invitation data:", invitationData);

      // Call API to send invitation
      const response = await invitationAPI.sendInvitation(invitationData);

      console.log("API response:", response);

      if (!response.success) {
        // Show specific validation errors if available
        if (response.errors && Array.isArray(response.errors)) {
          throw new Error(response.errors.join(", "));
        }

        // Handle specific business logic errors
        if (response.message === "Invitation already sent to this email") {
          throw new Error(
            "An invitation has already been sent to this email address. Please try a different email or contact the person directly."
          );
        }

        throw new Error(response.message || "Failed to send invitation");
      }

      toast({
        title: "Invitation Sent Successfully",
        description: `An invitation has been sent to ${formData.email}. They will receive an email to complete their profile.`,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        graduationYear: "2024",
        degree: "",
        currentRole: "",
        company: "",
        location: "",
        linkedinProfile: "",
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            Add Alumni
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a new alumnus. They will receive an email to
            join the network and complete their profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="john@example.com"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year *</Label>
              <Select
                value={formData.graduationYear}
                onValueChange={(value) =>
                  setFormData({ ...formData, graduationYear: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 50 }, (_, i) => 2024 - i).map(
                    (year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="degree">Degree</Label>
              <Input
                id="degree"
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
                placeholder="Computer Science"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current Role</Label>
              <Input
                id="currentRole"
                value={formData.currentRole}
                onChange={(e) =>
                  setFormData({ ...formData, currentRole: e.target.value })
                }
                placeholder="Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Google"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
              <Input
                id="linkedinProfile"
                value={formData.linkedinProfile}
                onChange={(e) =>
                  setFormData({ ...formData, linkedinProfile: e.target.value })
                }
                placeholder="https://linkedin.com/in/johndoe"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={loading}>
              {loading ? "Sending Invitation..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
