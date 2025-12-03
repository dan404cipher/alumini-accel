import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlumniStudentAnalytics } from "./admin/analytics/AlumniStudentAnalytics";
import { categoryAPI } from "@/lib/api";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// duplicate Select import removed
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
import { getAuthTokenOrNull } from "@/utils/auth";
import BulkUploadAlumni from "./BulkUploadAlumni";
import ExportAlumniData from "./ExportAlumniData";
import BulkUploadStudents from "./BulkUploadStudents";
import ExportStudentsData from "./ExportStudentsData";
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
import { alumniAPI, API_BASE_URL } from "@/lib/api";

interface AlumniProfile {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    profileImage?: string;
    profilePicture?: string;
  };
  graduationYear: number;
  experience?: number;
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
  const [isFormValid, setIsFormValid] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [alumniPage, setAlumniPage] = useState(1);
  const [alumniLimit] = useState(10);
  const [totalAlumni, setTotalAlumni] = useState(0);
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
    role: "alumni", // Default to alumni, can be changed to "student"
    graduationYear: new Date().getFullYear(),
    currentCompany: "",
    currentPosition: "",
    phoneNumber: "",
    address: "",
    bio: "",
  });

  const [colleges, setColleges] = useState<College[]>([]);
  const [collegeFilter, setCollegeFilter] = useState("all");
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  
  // URL-based navigation
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("subtab") || "management";

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("subtab", value);
    setSearchParams(newParams);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "department",
          isActive: "true",
        });
        const names = Array.isArray(res.data)
          ? (res.data as any[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setDepartmentOptions(names);
      } catch (_) {
        if (mounted) setDepartmentOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
          // Preselect college for non-super admins
          setNewAlumni((prev) => ({
            ...prev,
            collegeId: (user as any).tenantId,
          }));
        }
        return;
      }

      try {
        // Get token from localStorage or sessionStorage (same logic as AuthContext)
        const token = getAuthTokenOrNull();

        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await fetch(`${API_BASE_URL}/tenants`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
  const computeErrors = () => {
    const errors: Record<string, string> = {};

    const first = newAlumni.firstName.trim();
    if (!first) {
      errors.firstName = "First name is required";
    } else if (first.length < 2 || first.length > 50) {
      errors.firstName = "First name must be between 2 and 50 characters";
    }

    const last = newAlumni.lastName.trim();
    if (!last) {
      errors.lastName = "Last name is required";
    } else if (last.length < 2 || last.length > 50) {
      errors.lastName = "Last name must be between 2 and 50 characters";
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

    // Validate graduationYear - required for students
    if (newAlumni.role === "student") {
      if (
        !newAlumni.graduationYear ||
        newAlumni.graduationYear < 1900 ||
        newAlumni.graduationYear > new Date().getFullYear() + 10
      ) {
        errors.graduationYear = "Please enter a valid graduation year";
      }
    } else if (
      !newAlumni.graduationYear ||
      newAlumni.graduationYear < 1900 ||
      newAlumni.graduationYear > new Date().getFullYear() + 10
    ) {
      errors.graduationYear = "Please enter a valid graduation year";
    }

    return errors;
  };

  const validateForm = (): boolean => {
    const errors = computeErrors();
    setHasInteracted(true);
    setFormErrors(errors);
    const valid = Object.keys(errors).length === 0;
    setIsFormValid(valid);
    return valid;
  };

  // Inline auto-validation (debounced) as the user types
  useEffect(() => {
    const timer = setTimeout(() => {
      const errors = computeErrors();
      setIsFormValid(Object.keys(errors).length === 0);
      // Only show inline errors after interaction; otherwise keep the UI clean
      if (hasInteracted) {
        setFormErrors(errors);
      } else {
        setFormErrors({});
      }
    }, 250);
    return () => clearTimeout(timer);
    // Revalidate whenever any field changes
  }, [
    newAlumni.firstName,
    newAlumni.lastName,
    newAlumni.email,
    newAlumni.password,
    newAlumni.collegeId,
    newAlumni.department,
    newAlumni.graduationYear,
    hasInteracted,
  ]);

  const fetchAlumni = useCallback(async () => {
    try {
      setLoading(true);
      const alumniData = await alumniAPI.getAllAlumni({
        tenantId:
          user?.role === "super_admin" && collegeFilter !== "all"
            ? collegeFilter
            : user?.tenantId,
        page: alumniPage,
        limit: alumniLimit,
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

      // Get total count from pagination response
      const total =
        (alumniData.data as any)?.pagination?.total ||
        (alumniData.data as any)?.total ||
        (alumniData as any)?.pagination?.total ||
        alumniArray.length;
      setTotalAlumni(total);
    } catch (error) {
      console.error("Error fetching alumni:", error);
      console.error("Error details:", (error as any).response?.data);
      console.error("Error status:", (error as any).response?.status);
      setAlumni([]); // Set empty array on error
      toast({
        title: "Error",
        description: "Failed to fetch alumni data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, user?.tenantId, user?.role, collegeFilter, alumniPage, alumniLimit]);

  useEffect(() => {
    fetchAlumni();
  }, [fetchAlumni]);

  // Reset page when search term changes
  useEffect(() => {
    setAlumniPage(1);
  }, [searchTerm]);

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
      const userData: any = {
        firstName: newAlumni.firstName.trim(),
        lastName: newAlumni.lastName.trim(),
        email: newAlumni.email.trim(),
        password: newAlumni.password,
        role: newAlumni.role || "alumni",
        tenantId: newAlumni.collegeId,
        department: newAlumni.department,
      };

      // Add graduationYear if role is student
      if (newAlumni.role === "student") {
        userData.graduationYear = newAlumni.graduationYear;
      }

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
      const roleLabel = newAlumni.role === "student" ? "Student" : "Alumni";
      toast({
        title: "Success",
        description: `${roleLabel} account created successfully!`,
      });

      // Reset form
      setNewAlumni({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        collegeId: "",
        department: "",
        role: "alumni",
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

  const filteredAlumni = (Array.isArray(alumni) ? alumni : []).filter(
    (alumnus) =>
      `${alumnus.userId?.firstName || ""} ${alumnus.userId?.lastName || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      alumnus.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alumnus.currentCompany?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build pagination display text to keep JSX simple
  const paginationText: string = searchTerm
    ? `Showing ${filteredAlumni.length} result${
        filteredAlumni.length !== 1 ? "s" : ""
      }` +
      (filteredAlumni.length !== alumni.length
        ? ` (filtered from ${alumni.length} on this page)`
        : "") +
      ` - Total: ${totalAlumni} alumni`
    : `Showing ${(alumniPage - 1) * alumniLimit + 1} to ${Math.min(
        alumniPage * alumniLimit,
        totalAlumni
      )} of ${totalAlumni} alumni`;

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
      <TabsList className="w-full max-w-xl">
        <TabsTrigger value="management" className="flex-1">
          Alumni & Student Management
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex-1">
          Reports & Analytics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="management" className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex justify-between items-center">
         
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              Total: {totalAlumni}
            </Badge>
            {filteredAlumni.length !== alumni.length && (
              <Badge variant="secondary" className="text-sm">
                Filtered: {filteredAlumni.length}
              </Badge>
            )}
            <div className="flex space-x-2">
              <BulkUploadAlumni />
              <ExportAlumniData />
              <BulkUploadStudents />
              <ExportStudentsData />
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create User Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New User Account</DialogTitle>
                    <DialogDescription>
                      Create a new user account (Student or Alumni) with profile
                      information. Make sure to use a unique email address that
                      hasn't been registered before. Students with graduation
                      year ≤ current year will be eligible for alumni promotion.
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
                          className={
                            formErrors.firstName ? "border-red-500" : ""
                          }
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
                            setNewAlumni({
                              ...newAlumni,
                              lastName: e.target.value,
                            })
                          }
                          placeholder="Enter last name"
                          className={
                            formErrors.lastName ? "border-red-500" : ""
                          }
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
                        <p className="text-sm text-red-500">
                          {formErrors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={newAlumni.password}
                        onChange={(e) =>
                          setNewAlumni({
                            ...newAlumni,
                            password: e.target.value,
                          })
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

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={newAlumni.role}
                        onValueChange={(value) => {
                          setHasInteracted(true);
                          setNewAlumni({ ...newAlumni, role: value });
                        }}
                      >
                        <SelectTrigger
                          className={formErrors.role ? "border-red-500" : ""}
                        >
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alumni">Alumni</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                        </SelectContent>
                      </Select>
                      {formErrors.role && (
                        <p className="text-sm text-red-500">
                          {formErrors.role}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {user?.role === "super_admin" && (
                        <div className="space-y-2">
                          <Label htmlFor="college">College *</Label>
                          <Select
                            value={newAlumni.collegeId}
                            onValueChange={(value) => {
                              setHasInteracted(true);
                              setNewAlumni({ ...newAlumni, collegeId: value });
                            }}
                          >
                            <SelectTrigger
                              className={
                                formErrors.collegeId ? "border-red-500" : ""
                              }
                            >
                              <SelectValue placeholder="Select college" />
                            </SelectTrigger>
                            <SelectContent>
                              {colleges.map((college) => (
                                <SelectItem
                                  key={college._id}
                                  value={college._id}
                                >
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
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="department">Department *</Label>
                        <Select
                          value={newAlumni.department}
                          onValueChange={(v) => {
                            setHasInteracted(true);
                            setNewAlumni({ ...newAlumni, department: v });
                          }}
                        >
                          <SelectTrigger
                            className={
                              formErrors.department ? "border-red-500" : ""
                            }
                          >
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departmentOptions.length === 0 ? (
                              <SelectItem value="__noopts__" disabled>
                                No saved departments
                              </SelectItem>
                            ) : (
                              departmentOptions.map((name) => (
                                <SelectItem key={name} value={name}>
                                  {name}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        {formErrors.department && (
                          <p className="text-sm text-red-500">
                            {formErrors.department}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="graduationYear">
                        Graduation Year{" "}
                        {newAlumni.role === "student" ? "*" : ""}
                      </Label>
                      <Input
                        id="graduationYear"
                        type="number"
                        value={newAlumni.graduationYear}
                        onChange={(e) =>
                          setNewAlumni({
                            ...newAlumni,
                            graduationYear:
                              parseInt(e.target.value) ||
                              new Date().getFullYear(),
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
                      {newAlumni.role === "student" && (
                        <p className="text-xs text-muted-foreground">
                          Required for students. Students with graduation year ≤
                          current year will be eligible for alumni promotion.
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
                      <Button
                        type="submit"
                        disabled={createLoading || !isFormValid}
                        onClick={() => setHasInteracted(true)}
                      >
                        {createLoading
                          ? "Creating..."
                          : newAlumni.role === "student"
                          ? "Create Student"
                          : "Create Alumni"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
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

          {user?.role === "super_admin" && (
            <div className="w-[200px]">
              <Select value={collegeFilter} onValueChange={setCollegeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by College" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Colleges</SelectItem>
                  {colleges.map((college) => (
                    <SelectItem key={college._id} value={college._id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Enhanced Alumni List */}
        <div className="grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
                <div className="text-muted-foreground">Loading alumni...</div>
              </div>
            </div>
          ) : filteredAlumni.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {searchTerm
                      ? "No alumni found matching your search"
                      : "No alumni found"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm
                      ? "Try adjusting your search terms"
                      : "Create your first alumni account to get started"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredAlumni.map((alumni) => (
              <Card
                key={alumni._id}
                className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-blue-500"
                onClick={() => handleAlumniClick(alumni)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <img
                        src={
                          alumni.userId?.profileImage ||
                          alumni.userId?.profilePicture
                            ? (
                                alumni.userId.profileImage ||
                                alumni.userId.profilePicture
                              ).startsWith("http")
                              ? alumni.userId.profileImage ||
                                alumni.userId.profilePicture
                              : `${API_BASE_URL.replace("/api/v1", "")}${
                                  alumni.userId.profileImage ||
                                  alumni.userId.profilePicture
                                }`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                `${alumni.userId?.firstName || ""} ${
                                  alumni.userId?.lastName || ""
                                }`
                              )}&background=0ea5e9&color=fff&size=128`
                        }
                        alt={`${alumni.userId?.firstName} ${alumni.userId?.lastName}`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shadow-md"
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            `${alumni.userId?.firstName || ""} ${
                              alumni.userId?.lastName || ""
                            }`
                          )}&background=0ea5e9&color=fff&size=128`;
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold">
                              {alumni.userId.firstName} {alumni.userId.lastName}
                            </h3>
                            <Badge variant="secondary" className="font-normal">
                              Alumni
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">
                              {alumni.userId.email}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {alumni.currentCompany && (
                          <div className="flex items-center gap-2 text-sm">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">
                              {alumni.currentCompany}
                              {alumni.currentPosition &&
                                ` • ${alumni.currentPosition}`}
                            </span>
                          </div>
                        )}
                        {alumni.currentLocation && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground truncate">
                              {alumni.currentLocation}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Class of {alumni.graduationYear}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Pagination Controls */}
        {!loading && totalAlumni > 0 && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              <span>{paginationText}</span>
            </div>
            {!searchTerm && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alumniPage <= 1 || loading}
                  onClick={() => setAlumniPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground px-2">
                    Page {alumniPage} of{" "}
                    {Math.max(1, Math.ceil(totalAlumni / alumniLimit))}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    alumniPage >= Math.ceil(totalAlumni / alumniLimit) ||
                    loading
                  }
                  onClick={() => setAlumniPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="analytics" className="space-y-6">
        <AlumniStudentAnalytics />
      </TabsContent>
    </Tabs>
  );
};

export default AlumniManagement;
