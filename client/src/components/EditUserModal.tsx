import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { userAPI } from "@/lib/api";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Save,
  X,
} from "lucide-react";

interface EditUserModalProps {
  user: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    status: string;
    tenantId?: string;
    department?: string;
    phone?: string;
    bio?: string;
    location?: string;
    linkedinProfile?: string;
    githubProfile?: string;
    website?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated: (updatedUser: any) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        bio: user.bio || "",
        location: user.location || "",
      });
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate field lengths
    if (
      formData.firstName.trim().length < 2 ||
      formData.firstName.trim().length > 50
    ) {
      toast({
        title: "Error",
        description: "First name must be between 2 and 50 characters",
        variant: "destructive",
      });
      return;
    }

    if (
      formData.lastName.trim().length < 2 ||
      formData.lastName.trim().length > 50
    ) {
      toast({
        title: "Error",
        description: "Last name must be between 2 and 50 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    if (formData.phone && formData.phone.trim() !== "") {
      const phoneRegex = /^\+?[\d\s-()]+$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        toast({
          title: "Error",
          description:
            "Please provide a valid phone number (e.g., +1 636-962-1215 or (636) 962-1215)",
          variant: "destructive",
        });
        return;
      }
    }

    // Validate bio length
    if (formData.bio && formData.bio.length > 500) {
      toast({
        title: "Error",
        description: "Bio cannot exceed 500 characters",
        variant: "destructive",
      });
      return;
    }

    // Validate location length
    if (formData.location && formData.location.length > 100) {
      toast({
        title: "Error",
        description: "Location cannot exceed 100 characters",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Prepare data - only send non-empty fields
      const updateData: any = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      };

      // Add optional fields only if they have values
      if (formData.phone && formData.phone.trim() !== "") {
        updateData.phone = formData.phone.trim();
      }
      if (formData.bio && formData.bio.trim() !== "") {
        updateData.bio = formData.bio.trim();
      }
      if (formData.location && formData.location.trim() !== "") {
        updateData.location = formData.location.trim();
      }

      console.log("Sending update data:", updateData);

      const response = await userAPI.updateUser(user._id, updateData);

      if (response.success) {
        toast({
          title: "Success",
          description: "User updated successfully",
        });

        // Update the user in the parent component
        const updatedUser = {
          ...user,
          ...updateData,
        };
        onUserUpdated(updatedUser);
        onClose();
      } else {
        throw new Error(response.message || "Failed to update user");
      }
    } catch (error) {
      console.error("Update user error:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin":
        return "bg-red-100 text-red-800";
      case "college_admin":
        return "bg-blue-100 text-blue-800";
      case "hod":
        return "bg-green-100 text-green-800";
      case "staff":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <User className="w-5 h-5" />
            <span>Edit User</span>
            <Badge className={getRoleBadgeColor(user.role)}>
              {user.role.replace("_", " ").toUpperCase()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Enter first name (2-50 characters)"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.firstName.length}/50 characters
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Enter last name (2-50 characters)"
                    maxLength={50}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.lastName.length}/50 characters
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+1 636-962-1215 or (636) 962-1215"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-500">
                  Include country code and formatting (spaces, dashes, or
                  parentheses)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Enter location (max 100 characters)"
                    className="pl-10"
                    maxLength={100}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {formData.location.length}/100 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Bio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Enter user bio (max 500 characters)"
                  className="w-full p-3 border rounded-md resize-none"
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Read-only Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                System Information (Read-only)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-gray-500">Role</Label>
                  <div className="mt-1">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-500">Status</Label>
                  <div className="mt-1">
                    <Badge className="bg-green-100 text-green-800">
                      {user.status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {user.tenantId && (
                <div>
                  <Label className="text-sm text-gray-500">College ID</Label>
                  <p className="mt-1 text-sm font-medium">
                    {typeof user.tenantId === "string"
                      ? user.tenantId.slice(-6)
                      : user.tenantId?._id?.slice(-6) ||
                        user.tenantId?.name ||
                        "N/A"}
                  </p>
                </div>
              )}

              {user.department && (
                <div>
                  <Label className="text-sm text-gray-500">Department</Label>
                  <p className="mt-1 text-sm font-medium">{user.department}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;
