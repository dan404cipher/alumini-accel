import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Building,
  MapPin,
} from "lucide-react";
import { alumniAPI } from "@/lib/api";

interface AlumniProfile {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  graduationYear: number;
  degree: string;
  major: string;
  currentCompany: string;
  currentPosition: string;
  location: string;
  bio: string;
  skills: string[];
  linkedinProfile: string;
  githubProfile: string;
  isActive: boolean;
  createdAt: string;
}

interface AlumniResponse {
  data?:
    | AlumniProfile[]
    | {
        alumni?: AlumniProfile[];
        results?: AlumniProfile[];
      };
}

const AlumniManagement = () => {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  // Form validation functions
  const validateField = (name: string, value: string) => {
    const errors = { ...formErrors };

    switch (name) {
      case "firstName":
        if (!value.trim()) {
          errors.firstName = "First name is required";
        } else if (value.trim().length < 2 || value.trim().length > 50) {
          errors.firstName = "First name must be between 2 and 50 characters";
        } else {
          delete errors.firstName;
        }
        break;

      case "lastName":
        if (!value.trim()) {
          errors.lastName = "Last name is required";
        } else if (value.trim().length < 2 || value.trim().length > 50) {
          errors.lastName = "Last name must be between 2 and 50 characters";
        } else {
          delete errors.lastName;
        }
        break;

      case "email":
        if (!value.trim()) {
          errors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address";
        } else {
          delete errors.email;
        }
        break;

      case "graduationYear": {
        const year = parseInt(value);
        if (!value) {
          errors.graduationYear = "Graduation year is required";
        } else if (
          isNaN(year) ||
          year < 1950 ||
          year > new Date().getFullYear() + 1
        ) {
          errors.graduationYear = "Please enter a valid graduation year";
        } else {
          delete errors.graduationYear;
        }
        break;
      }

      case "major":
        if (value && value.trim().length > 100) {
          errors.major = "Major cannot exceed 100 characters";
        } else {
          delete errors.major;
        }
        break;

      case "currentCompany":
        if (value && value.trim().length > 100) {
          errors.currentCompany = "Company name cannot exceed 100 characters";
        } else {
          delete errors.currentCompany;
        }
        break;

      case "currentPosition":
        if (value && value.trim().length > 100) {
          errors.currentPosition = "Position cannot exceed 100 characters";
        } else {
          delete errors.currentPosition;
        }
        break;

      case "location":
        if (value && value.trim().length > 100) {
          errors.location = "Location cannot exceed 100 characters";
        } else {
          delete errors.location;
        }
        break;

      case "bio":
        if (value && value.trim().length > 500) {
          errors.bio = "Bio cannot exceed 500 characters";
        } else {
          delete errors.bio;
        }
        break;

      case "linkedinProfile":
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          errors.linkedinProfile = "Please enter a valid URL";
        } else {
          delete errors.linkedinProfile;
        }
        break;

      case "githubProfile":
        if (value && !/^https?:\/\/.+\..+/.test(value)) {
          errors.githubProfile = "Please enter a valid URL";
        } else {
          delete errors.githubProfile;
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "email", "graduationYear"];
    let isValid = true;

    requiredFields.forEach((field) => {
      if (
        !validateField(
          field,
          newAlumni[field as keyof typeof newAlumni] as string
        )
      ) {
        isValid = false;
      }
    });

    // Validate optional fields
    Object.keys(newAlumni).forEach((field) => {
      if (!requiredFields.includes(field)) {
        validateField(
          field,
          newAlumni[field as keyof typeof newAlumni] as string
        );
      }
    });

    return isValid && Object.keys(formErrors).length === 0;
  };

  const [newAlumni, setNewAlumni] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Alumni@123", // Default password
    graduationYear: new Date().getFullYear(),
    degree: "",
    major: "",
    currentCompany: "",
    currentPosition: "",
    location: "",
    bio: "",
    skills: "",
    linkedinProfile: "",
    githubProfile: "",
  });

  useEffect(() => {
    fetchAlumni();
  }, []);

  const fetchAlumni = async () => {
    try {
      setLoading(true);
      console.log("Fetching alumni...");
      console.log("Current user:", user);
      console.log("Token in localStorage:", localStorage.getItem("token"));
      const response = await alumniAPI.getAllAlumni();
      console.log("Alumni API response:", response);

      // Handle different response structures
      let alumniData: AlumniProfile[] = [];

      if (response && response.data) {
        // If response.data is an array, use it directly
        if (Array.isArray(response.data)) {
          alumniData = response.data;
        }
        // If response.data has nested arrays, try to extract them
        else {
          const data = response.data as {
            alumni?: AlumniProfile[];
            results?: AlumniProfile[];
          };
          if (data.alumni && Array.isArray(data.alumni)) {
            alumniData = data.alumni;
          } else if (data.results && Array.isArray(data.results)) {
            alumniData = data.results;
          } else {
            console.warn("Unexpected response structure:", response.data);
            alumniData = [];
          }
        }
      } else {
        console.warn("No data in response:", response);
        alumniData = [];
      }

      console.log("Processed alumni data:", alumniData);
      setAlumni(alumniData);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      console.error("Error details:", error.response?.data);
      console.error("Error status:", error.response?.status);
      setAlumni([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch alumni data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      // Validate form
      if (!validateForm()) {
        toast({
          title: "Validation Error",
          description: "Please fix the errors in the form before submitting",
          variant: "destructive",
        });
        setCreateLoading(false);
        return;
      }

      // First create the user account
      const userData = {
        firstName: newAlumni.firstName.trim(),
        lastName: newAlumni.lastName.trim(),
        email: newAlumni.email.trim(),
        password: newAlumni.password,
        role: "alumni",
        status: "active", // Admin-created accounts should be active
      };

      console.log("Sending alumni user data:", userData);

      // Create user account
      const userResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(userData),
        }
      );

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error("Alumni registration error response:", errorData);
        console.error("Validation errors:", errorData.errors);

        // Handle specific error cases
        if (errorData.message === "User with this email already exists") {
          throw new Error(
            "An account with this email already exists. Please use a different email address."
          );
        }

        throw new Error(errorData.message || "Failed to create user account");
      }

      const userResult = await userResponse.json();
      const userId = userResult.data.user._id;

      // Create alumni profile using the user's token (since they now have alumni role)
      const profileData = {
        batchYear: parseInt(newAlumni.graduationYear.toString()), // Use graduation year as batch year
        graduationYear: parseInt(newAlumni.graduationYear.toString()),
        department: newAlumni.major || "General", // Use major as department or default
        degree: newAlumni.degree || undefined,
        major: newAlumni.major || undefined,
        currentCompany: newAlumni.currentCompany || undefined,
        currentPosition: newAlumni.currentPosition || undefined,
        currentLocation: newAlumni.location || undefined,
        skills: newAlumni.skills
          ? newAlumni.skills.split(",").map((s) => s.trim())
          : [],
        linkedinProfile: newAlumni.linkedinProfile || undefined,
        githubProfile: newAlumni.githubProfile || undefined,
        bio: newAlumni.bio || undefined,
      };

      console.log("Sending alumni profile data:", profileData);

      // Use the newly created user's token for profile creation
      const profileResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/alumni/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userResult.data.token}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        console.error("Profile creation error response:", errorData);
        console.error("Profile validation errors:", errorData.errors);
        throw new Error(errorData.message || "Failed to create alumni profile");
      }

      toast({
        title: "Alumni Created",
        description: `Account created for ${newAlumni.firstName} ${newAlumni.lastName}`,
      });

      // Reset form
      setNewAlumni({
        firstName: "",
        lastName: "",
        email: "",
        password: "Alumni@123",
        graduationYear: new Date().getFullYear(),
        degree: "",
        major: "",
        currentCompany: "",
        currentPosition: "",
        location: "",
        bio: "",
        skills: "",
        linkedinProfile: "",
        githubProfile: "",
      });

      setIsCreateDialogOpen(false);
      fetchAlumni();
    } catch (error) {
      console.error("Error creating alumni:", error);
      toast({
        title: "Error",
        description: "Failed to create alumni account",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredAlumni = (alumni || []).filter(
    (alumnus) =>
      `${alumnus.userId.firstName} ${alumnus.userId.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      alumnus.userId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.currentCompany.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if user has permission to manage alumni
  const canManageAlumni =
    user?.role === "super_admin" || user?.role === "coordinator";

  if (!canManageAlumni) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground mb-4">
          Access Denied
        </h2>
        <p className="text-muted-foreground">
          You don't have permission to manage alumni accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alumni Management</h1>
          <p className="text-muted-foreground">
            Create and manage alumni accounts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Alumni Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Alumni Account</DialogTitle>
              <DialogDescription>
                Create a new alumni account with profile information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAlumni} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newAlumni.firstName}
                    onChange={(e) => {
                      setNewAlumni({ ...newAlumni, firstName: e.target.value });
                      validateField("firstName", e.target.value);
                    }}
                    className={formErrors.firstName ? "border-red-500" : ""}
                    required
                  />
                  {formErrors.firstName && (
                    <p className="text-sm text-red-500">
                      {formErrors.firstName}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={newAlumni.lastName}
                    onChange={(e) => {
                      setNewAlumni({ ...newAlumni, lastName: e.target.value });
                      validateField("lastName", e.target.value);
                    }}
                    className={formErrors.lastName ? "border-red-500" : ""}
                    required
                  />
                  {formErrors.lastName && (
                    <p className="text-sm text-red-500">
                      {formErrors.lastName}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newAlumni.email}
                  onChange={(e) => {
                    setNewAlumni({ ...newAlumni, email: e.target.value });
                    validateField("email", e.target.value);
                  }}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={newAlumni.graduationYear}
                    onChange={(e) => {
                      setNewAlumni({
                        ...newAlumni,
                        graduationYear: parseInt(e.target.value),
                      });
                      validateField("graduationYear", e.target.value);
                    }}
                    className={
                      formErrors.graduationYear ? "border-red-500" : ""
                    }
                    required
                  />
                  {formErrors.graduationYear && (
                    <p className="text-sm text-red-500">
                      {formErrors.graduationYear}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="degree">Degree</Label>
                  <Select
                    onValueChange={(value) =>
                      setNewAlumni({ ...newAlumni, degree: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bachelor">Bachelor's</SelectItem>
                      <SelectItem value="Master">Master's</SelectItem>
                      <SelectItem value="PhD">PhD</SelectItem>
                      <SelectItem value="Certificate">Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="major">Major/Field of Study</Label>
                <Input
                  id="major"
                  value={newAlumni.major}
                  onChange={(e) => {
                    setNewAlumni({ ...newAlumni, major: e.target.value });
                    validateField("major", e.target.value);
                  }}
                  className={formErrors.major ? "border-red-500" : ""}
                />
                {formErrors.major && (
                  <p className="text-sm text-red-500">{formErrors.major}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCompany">Current Company</Label>
                  <Input
                    id="currentCompany"
                    value={newAlumni.currentCompany}
                    onChange={(e) =>
                      setNewAlumni({
                        ...newAlumni,
                        currentCompany: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentPosition">Current Position</Label>
                  <Input
                    id="currentPosition"
                    value={newAlumni.currentPosition}
                    onChange={(e) =>
                      setNewAlumni({
                        ...newAlumni,
                        currentPosition: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newAlumni.location}
                  onChange={(e) =>
                    setNewAlumni({ ...newAlumni, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={newAlumni.skills}
                  onChange={(e) =>
                    setNewAlumni({ ...newAlumni, skills: e.target.value })
                  }
                  placeholder="JavaScript, React, Node.js, Python"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <textarea
                  id="bio"
                  className={`w-full p-2 border rounded-md ${
                    formErrors.bio ? "border-red-500" : ""
                  }`}
                  rows={3}
                  value={newAlumni.bio}
                  onChange={(e) => {
                    setNewAlumni({ ...newAlumni, bio: e.target.value });
                    validateField("bio", e.target.value);
                  }}
                />
                {formErrors.bio && (
                  <p className="text-sm text-red-500">{formErrors.bio}</p>
                )}
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Account"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search alumni by name, email, or company..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Alumni List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading alumni...</p>
          </div>
        ) : filteredAlumni.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No alumni found</p>
          </div>
        ) : (
          filteredAlumni.map((alumnus) => (
            <Card key={alumnus._id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {alumnus.userId.firstName} {alumnus.userId.lastName}
                      </h3>
                      <Badge variant="secondary">{alumnus.userId.role}</Badge>
                      {alumnus.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{alumnus.userId.email}</span>
                      </div>

                      {alumnus.currentCompany && (
                        <div className="flex items-center space-x-2">
                          <Building className="w-4 h-4" />
                          <span>{alumnus.currentCompany}</span>
                        </div>
                      )}

                      {alumnus.location && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4" />
                          <span>{alumnus.location}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <GraduationCap className="w-4 h-4" />
                        <span>
                          {alumnus.graduationYear} - {alumnus.degree} in{" "}
                          {alumnus.major}
                        </span>
                      </div>
                    </div>

                    {alumnus.skills && alumnus.skills.length > 0 && (
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {alumnus.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AlumniManagement;
