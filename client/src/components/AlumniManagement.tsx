import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import BulkUploadAlumni from "./BulkUploadAlumni";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Search,
  Mail,
  Phone,
  GraduationCap,
  Building,
  MapPin,
  Calendar,
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
  currentCompany?: string;
  currentPosition?: string;
  currentLocation?: string;
  linkedinProfile?: string;
  githubProfile?: string;
  bio?: string;
  skills?: string[];
  createdAt: string;
  updatedAt: string;
}

interface College {
  _id: string;
  name: string;
  location: string;
  establishedYear: number;
  website?: string;
  description?: string;
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
  const navigate = useNavigate();

  const [newAlumni, setNewAlumni] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    collegeId: "",
    department: "",
    graduationYear: new Date().getFullYear(),
    currentCompany: "",
    currentPosition: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });

  const [colleges, setColleges] = useState<College[]>([]);

  // Fetch colleges on component mount (only for Super Admin)
  useEffect(() => {
    const fetchColleges = async () => {
      // Only fetch colleges if user is Super Admin
      if (user?.role !== "super_admin") {
        // For College Admin, set their own college
        if ((user as any)?.tenantId) {
          setColleges([
            {
              _id: (user as any).tenantId,
              name: (user as any).tenantName || "Your College",
              establishedYear: new Date().getFullYear(),
              website: "",
              description: "",
              location: "",
            },
          ]);
        }
        return;
      }

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1"
          }/tenants`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setColleges(data.data?.tenants || []);
        }
      } catch (error) {
        console.error("Error fetching colleges:", error);
      }
    };

    fetchColleges();
  }, [user]);

  // Validation function
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!newAlumni.firstName.trim()) {
      errors.firstName = "First name is required";
    }

    if (!newAlumni.lastName.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!newAlumni.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAlumni.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!newAlumni.password.trim()) {
      errors.password = "Password is required";
    } else if (newAlumni.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    if (!newAlumni.collegeId) {
      errors.collegeId = "Please select a college";
    }

    if (!newAlumni.department.trim()) {
      errors.department = "Department is required";
    }

    if (
      !newAlumni.graduationYear ||
      newAlumni.graduationYear < 1900 ||
      newAlumni.graduationYear > new Date().getFullYear() + 10
    ) {
      errors.graduationYear = "Please enter a valid graduation year";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const fetchAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const alumniData = await alumniAPI.getAllAlumni({
        tenantId: user?.tenantId,
      });

      // Ensure alumni is always an array
      const alumniArray = Array.isArray(alumniData.data)
        ? alumniData.data
        : Array.isArray((alumniData.data as any)?.alumni)
        ? (alumniData.data as any).alumni
        : Array.isArray((alumniData.data as any)?.profiles)
        ? (alumniData.data as any).profiles
        : [];
      setAlumni(alumniArray as AlumniProfile[]);
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
  }, [toast, user?.tenantId]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  const handleAlumniClick = (alumni: AlumniProfile) => {
    navigate(`/alumni/${alumni.userId._id}`);
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

      // Create actual user account directly (no approval needed)
      const userData = {
        firstName: newAlumni.firstName.trim(),
        lastName: newAlumni.lastName.trim(),
        email: newAlumni.email.trim(),
        password: newAlumni.password,
        role: "alumni",
        tenantId: newAlumni.collegeId,
        department: newAlumni.department,
      };

      // Import the userAPI to create user directly
      const { userAPI } = await import("@/lib/api");

      // Create user account directly
      const userResponse = await userAPI.createUser(userData);

      if (!userResponse.success) {
        throw new Error(
          userResponse.message || "Failed to create alumni account"
        );
      }

      // Show success message for account creation
      toast({
        title: "Success",
        description: "Alumni account created successfully!",
      });

      // Reset form
      setNewAlumni({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        collegeId: "",
        department: "",
        graduationYear: new Date().getFullYear(),
        currentCompany: "",
        currentPosition: "",
        phoneNumber: "",
        address: "",
        bio: "",
      });

      setCreateLoading(false);
      setIsCreateDialogOpen(false);
      fetchAlumni(); // Refresh the alumni list
    } catch (error) {
      console.error("Error creating alumni:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create alumni account";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCreateLoading(false);
    }
  };

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
        <div className="flex space-x-2">
          <BulkUploadAlumni />
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
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
                  Create a new alumni account with profile information. Make
                  sure to use a unique email address that hasn't been registered
                  before.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAlumni} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={newAlumni.firstName}
                      onChange={(e) =>
                        setNewAlumni({
                          ...newAlumni,
                          firstName: e.target.value,
                        })
                      }
                      placeholder="Enter first name"
                      className={formErrors.firstName ? "border-red-500" : ""}
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
                      onChange={(e) =>
                        setNewAlumni({ ...newAlumni, lastName: e.target.value })
                      }
                      placeholder="Enter last name"
                      className={formErrors.lastName ? "border-red-500" : ""}
                    />
                    {formErrors.lastName && (
                      <p className="text-sm text-red-500">
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newAlumni.email}
                    onChange={(e) =>
                      setNewAlumni({ ...newAlumni, email: e.target.value })
                    }
                    placeholder="Enter email address"
                    className={formErrors.email ? "border-red-500" : ""}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newAlumni.password}
                    onChange={(e) =>
                      setNewAlumni({ ...newAlumni, password: e.target.value })
                    }
                    placeholder="Enter password"
                    className={formErrors.password ? "border-red-500" : ""}
                  />
                  {formErrors.password && (
                    <p className="text-sm text-red-500">
                      {formErrors.password}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="college">College *</Label>
                    <Select
                      value={newAlumni.collegeId}
                      onValueChange={(value) =>
                        setNewAlumni({ ...newAlumni, collegeId: value })
                      }
                    >
                      <SelectTrigger
                        className={formErrors.collegeId ? "border-red-500" : ""}
                      >
                        <SelectValue placeholder="Select college" />
                      </SelectTrigger>
                      <SelectContent>
                        {colleges.map((college) => (
                          <SelectItem key={college._id} value={college._id}>
                            {college.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.collegeId && (
                      <p className="text-sm text-red-500">
                        {formErrors.collegeId}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Input
                      id="department"
                      value={newAlumni.department}
                      onChange={(e) =>
                        setNewAlumni({
                          ...newAlumni,
                          department: e.target.value,
                        })
                      }
                      placeholder="Enter department"
                      className={formErrors.department ? "border-red-500" : ""}
                    />
                    {formErrors.department && (
                      <p className="text-sm text-red-500">
                        {formErrors.department}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year *</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={newAlumni.graduationYear}
                    onChange={(e) =>
                      setNewAlumni({
                        ...newAlumni,
                        graduationYear:
                          parseInt(e.target.value) || new Date().getFullYear(),
                      })
                    }
                    placeholder="Enter graduation year"
                    className={
                      formErrors.graduationYear ? "border-red-500" : ""
                    }
                  />
                  {formErrors.graduationYear && (
                    <p className="text-sm text-red-500">
                      {formErrors.graduationYear}
                    </p>
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
                    {createLoading ? "Creating..." : "Create Alumni"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search alumni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Alumni List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading alumni...</div>
          </div>
        ) : (Array.isArray(alumni) ? alumni : []).filter(
            (alumnus) =>
              `${alumnus.userId?.firstName || ""} ${
                alumnus.userId?.lastName || ""
              }`
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              alumnus.userId?.email
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase()) ||
              alumnus.currentCompany
                ?.toLowerCase()
                .includes(searchTerm.toLowerCase())
          ).length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">
              {searchTerm
                ? "No alumni found matching your search."
                : "No alumni found."}
            </div>
          </div>
        ) : (
          (Array.isArray(alumni) ? alumni : [])
            .filter(
              (alumnus) =>
                `${alumnus.userId?.firstName || ""} ${
                  alumnus.userId?.lastName || ""
                }`
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                alumnus.userId?.email
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase()) ||
                alumnus.currentCompany
                  ?.toLowerCase()
                  .includes(searchTerm.toLowerCase())
            )
            .map((alumni) => (
              <Card
                key={alumni._id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAlumniClick(alumni)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="relative">
                        <img
                          src={
                            alumni.userId?.profileImage
                              ? alumni.userId.profileImage.startsWith("http")
                                ? alumni.userId.profileImage
                                : alumni.userId.profileImage
                              : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                  `${alumni.userId?.firstName || ""} ${
                                    alumni.userId?.lastName || ""
                                  }`
                                )}&background=random&color=fff`
                          }
                          alt={`${alumni.userId?.firstName} ${alumni.userId?.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              `${alumni.userId?.firstName || ""} ${
                                alumni.userId?.lastName || ""
                              }`
                            )}&background=random&color=fff`;
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold">
                            {alumni.userId.firstName} {alumni.userId.lastName}
                          </h3>
                          <Badge variant="secondary">Alumni</Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4" />
                            <span>{alumni.userId.email}</span>
                          </div>
                          {alumni.currentCompany && (
                            <div className="flex items-center space-x-2">
                              <Building className="h-4 w-4" />
                              <span>{alumni.currentCompany}</span>
                              {alumni.currentPosition && (
                                <span>• {alumni.currentPosition}</span>
                              )}
                            </div>
                          )}
                          {alumni.currentLocation && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{alumni.currentLocation}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-2">
                            <GraduationCap className="h-4 w-4" />
                            <span>Class of {alumni.graduationYear}</span>
                          </div>
                          {alumni.experience && alumni.experience > 0 && (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{alumni.experience} years experience</span>
                            </div>
                          )}
                        </div>
                      </div>
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
