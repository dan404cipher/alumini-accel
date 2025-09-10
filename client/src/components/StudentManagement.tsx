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
  User,
  Calendar,
  BookOpen,
} from "lucide-react";
import { studentAPI } from "@/lib/api";

interface StudentProfile {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    phone?: string;
  };
  university: string;
  department: string;
  program: string;
  batchYear: number;
  graduationYear: number;
  rollNumber: string;
  studentId: string;
  currentYear: string;
  currentCGPA?: number;
  currentGPA?: number;
  skills: string[];
  careerInterests: string[];
  linkedinProfile?: string;
  githubProfile?: string;
  isActive: boolean;
  createdAt: string;
}

const StudentManagement = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
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

      case "phone":
        if (
          value &&
          !/^[\+]?[1-9][\d]{0,15}$/.test(value.replace(/[\s\-\(\)]/g, ""))
        ) {
          errors.phone = "Please enter a valid phone number";
        } else {
          delete errors.phone;
        }
        break;

      case "university":
        if (value && value.trim().length > 100) {
          errors.university = "University name cannot exceed 100 characters";
        } else {
          delete errors.university;
        }
        break;

      case "department":
        if (value && value.trim().length > 100) {
          errors.department = "Department cannot exceed 100 characters";
        } else {
          delete errors.department;
        }
        break;

      case "program":
        if (value && value.trim().length > 100) {
          errors.program = "Program cannot exceed 100 characters";
        } else {
          delete errors.program;
        }
        break;

      case "batchYear": {
        const year = parseInt(value);
        if (!value) {
          errors.batchYear = "Batch year is required";
        } else if (
          isNaN(year) ||
          year < 1950 ||
          year > new Date().getFullYear() + 1
        ) {
          errors.batchYear = "Please enter a valid batch year";
        } else {
          delete errors.batchYear;
        }
        break;
      }

      case "rollNumber":
        if (value && value.trim().length > 20) {
          errors.rollNumber = "Roll number cannot exceed 20 characters";
        } else {
          delete errors.rollNumber;
        }
        break;

      case "studentId":
        if (value && value.trim().length > 20) {
          errors.studentId = "Student ID cannot exceed 20 characters";
        } else {
          delete errors.studentId;
        }
        break;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const requiredFields = ["firstName", "lastName", "email", "batchYear"];
    let isValid = true;

    requiredFields.forEach((field) => {
      if (
        !validateField(
          field,
          newStudent[field as keyof typeof newStudent] as string
        )
      ) {
        isValid = false;
      }
    });

    // Validate optional fields
    Object.keys(newStudent).forEach((field) => {
      if (!requiredFields.includes(field)) {
        validateField(
          field,
          newStudent[field as keyof typeof newStudent] as string
        );
      }
    });

    return isValid && Object.keys(formErrors).length === 0;
  };

  const [newStudent, setNewStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "Student@123", // Default password
    phone: "",
    university: "",
    department: "",
    program: "",
    batchYear: new Date().getFullYear(),
    graduationYear: new Date().getFullYear() + 4,
    rollNumber: "",
    studentId: "",
    currentYear: "1st Year",
    currentCGPA: "",
    currentGPA: "",
    skills: "",
    careerInterests: "",
    linkedinProfile: "",
    githubProfile: "",
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log("Fetching students...");
      console.log("Current user:", user);
      console.log("Token in localStorage:", localStorage.getItem("token"));
      const response = await studentAPI.getAllStudents();
      console.log("Students API response:", response);

      // Handle different response structures and ensure we always have an array
      let studentsData = [];

      if (response && response.data && response.data.profiles) {
        studentsData = Array.isArray(response.data.profiles)
          ? response.data.profiles
          : [];
      } else if (response && response.data && Array.isArray(response.data)) {
        studentsData = response.data;
      } else if (Array.isArray(response)) {
        studentsData = response;
      } else if (response && Array.isArray(response.students)) {
        studentsData = response.students;
      } else {
        console.error("Unexpected response structure:", response);
        studentsData = [];
      }

      console.log("Processed students data:", studentsData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
      setStudents([]); // Ensure students is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
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
        firstName: newStudent.firstName.trim(),
        lastName: newStudent.lastName.trim(),
        email: newStudent.email.trim(),
        password: newStudent.password,
        phone: newStudent.phone?.trim() || undefined,
        role: "student",
        status: "active", // Admin-created accounts should be active
      };

      console.log("Sending user data:", userData);

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
        console.error("Registration error response:", errorData);
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

      // Create student profile
      const profileData = {
        university: newStudent.university,
        department: newStudent.department,
        program: newStudent.program,
        batchYear: parseInt(newStudent.batchYear.toString()),
        graduationYear: parseInt(newStudent.graduationYear.toString()),
        rollNumber: newStudent.rollNumber,
        studentId: newStudent.studentId,
        currentYear: newStudent.currentYear,
        currentCGPA: newStudent.currentCGPA
          ? parseFloat(newStudent.currentCGPA)
          : undefined,
        currentGPA: newStudent.currentGPA
          ? parseFloat(newStudent.currentGPA)
          : undefined,
        skills: newStudent.skills
          ? newStudent.skills.split(",").map((s) => s.trim())
          : [],
        careerInterests: newStudent.careerInterests
          ? newStudent.careerInterests.split(",").map((s) => s.trim())
          : [],
        linkedinProfile: newStudent.linkedinProfile || undefined,
        githubProfile: newStudent.githubProfile || undefined,
      };

      const profileResponse = await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1"
        }/students/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(profileData),
        }
      );

      if (!profileResponse.ok) {
        const errorData = await profileResponse.json();
        throw new Error(
          errorData.message || "Failed to create student profile"
        );
      }

      toast({
        title: "Student Created",
        description: `Account created for ${newStudent.firstName} ${newStudent.lastName}`,
      });

      // Reset form
      setNewStudent({
        firstName: "",
        lastName: "",
        email: "",
        password: "Student@123",
        phone: "",
        university: "",
        department: "",
        program: "",
        batchYear: new Date().getFullYear(),
        graduationYear: new Date().getFullYear() + 4,
        rollNumber: "",
        studentId: "",
        currentYear: "1st Year",
        currentCGPA: "",
        currentGPA: "",
        skills: "",
        careerInterests: "",
        linkedinProfile: "",
        githubProfile: "",
      });
      setFormErrors({}); // Clear validation errors

      setIsCreateDialogOpen(false);
      fetchStudents();
    } catch (error) {
      console.error("Error creating student:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create student account",
        variant: "destructive",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredStudents = Array.isArray(students)
    ? students.filter(
        (student) =>
          `${student.userId.firstName} ${student.userId.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.userId.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          student.university.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.program.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Check if user has permission to manage students
  const canManageStudents =
    user?.role === "super_admin" ||
    user?.role === "admin" ||
    user?.role === "coordinator";

  if (!canManageStudents) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h2>
              <p className="text-gray-600">
                You don't have permission to manage students.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Student Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage student accounts and profiles
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Student Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Student Account</DialogTitle>
              <DialogDescription>
                Create a new student account with profile information
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={newStudent.firstName}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        firstName: e.target.value,
                      });
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
                    value={newStudent.lastName}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        lastName: e.target.value,
                      });
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
                  value={newStudent.email}
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, email: e.target.value });
                    validateField("email", e.target.value);
                  }}
                  className={formErrors.email ? "border-red-500" : ""}
                  required
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newStudent.phone}
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, phone: e.target.value });
                    validateField("phone", e.target.value);
                  }}
                  className={formErrors.phone ? "border-red-500" : ""}
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={newStudent.university}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        university: e.target.value,
                      });
                      validateField("university", e.target.value);
                    }}
                    className={formErrors.university ? "border-red-500" : ""}
                  />
                  {formErrors.university && (
                    <p className="text-sm text-red-500">
                      {formErrors.university}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={newStudent.department}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        department: e.target.value,
                      });
                      validateField("department", e.target.value);
                    }}
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
                <Label htmlFor="program">Program</Label>
                <Input
                  id="program"
                  value={newStudent.program}
                  onChange={(e) => {
                    setNewStudent({ ...newStudent, program: e.target.value });
                    validateField("program", e.target.value);
                  }}
                  className={formErrors.program ? "border-red-500" : ""}
                />
                {formErrors.program && (
                  <p className="text-sm text-red-500">{formErrors.program}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batchYear">Batch Year *</Label>
                  <Input
                    id="batchYear"
                    type="number"
                    value={newStudent.batchYear}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        batchYear: parseInt(e.target.value),
                      });
                      validateField("batchYear", e.target.value);
                    }}
                    className={formErrors.batchYear ? "border-red-500" : ""}
                    required
                  />
                  {formErrors.batchYear && (
                    <p className="text-sm text-red-500">
                      {formErrors.batchYear}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={newStudent.graduationYear}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        graduationYear: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentYear">Current Year</Label>
                  <Select
                    value={newStudent.currentYear}
                    onValueChange={(value) =>
                      setNewStudent({ ...newStudent, currentYear: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1st Year">1st Year</SelectItem>
                      <SelectItem value="2nd Year">2nd Year</SelectItem>
                      <SelectItem value="3rd Year">3rd Year</SelectItem>
                      <SelectItem value="4th Year">4th Year</SelectItem>
                      <SelectItem value="5th Year">5th Year</SelectItem>
                      <SelectItem value="Final Year">Final Year</SelectItem>
                      <SelectItem value="Graduate">Graduate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rollNumber">Roll Number</Label>
                  <Input
                    id="rollNumber"
                    value={newStudent.rollNumber}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        rollNumber: e.target.value,
                      });
                      validateField("rollNumber", e.target.value);
                    }}
                    className={formErrors.rollNumber ? "border-red-500" : ""}
                  />
                  {formErrors.rollNumber && (
                    <p className="text-sm text-red-500">
                      {formErrors.rollNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    value={newStudent.studentId}
                    onChange={(e) => {
                      setNewStudent({
                        ...newStudent,
                        studentId: e.target.value,
                      });
                      validateField("studentId", e.target.value);
                    }}
                    className={formErrors.studentId ? "border-red-500" : ""}
                  />
                  {formErrors.studentId && (
                    <p className="text-sm text-red-500">
                      {formErrors.studentId}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentCGPA">Current CGPA (Optional)</Label>
                  <Input
                    id="currentCGPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={newStudent.currentCGPA}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        currentCGPA: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentGPA">Current GPA (Optional)</Label>
                  <Input
                    id="currentGPA"
                    type="number"
                    step="0.01"
                    min="0"
                    max="4"
                    value={newStudent.currentGPA}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        currentGPA: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Input
                  id="skills"
                  value={newStudent.skills}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, skills: e.target.value })
                  }
                  placeholder="React, Python, JavaScript"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="careerInterests">
                  Career Interests (comma-separated)
                </Label>
                <Input
                  id="careerInterests"
                  value={newStudent.careerInterests}
                  onChange={(e) =>
                    setNewStudent({
                      ...newStudent,
                      careerInterests: e.target.value,
                    })
                  }
                  placeholder="Software Development, Data Science, AI"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="linkedinProfile">
                    LinkedIn Profile (Optional)
                  </Label>
                  <Input
                    id="linkedinProfile"
                    type="url"
                    value={newStudent.linkedinProfile}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        linkedinProfile: e.target.value,
                      })
                    }
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubProfile">
                    GitHub Profile (Optional)
                  </Label>
                  <Input
                    id="githubProfile"
                    type="url"
                    value={newStudent.githubProfile}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        githubProfile: e.target.value,
                      })
                    }
                    placeholder="https://github.com/username"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Student"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search students by name, email, university, department, or program..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Students List */}
      <div className="grid gap-6">
        {filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No students found
                </h3>
                <p className="text-gray-600">
                  {searchTerm
                    ? "No students match your search criteria."
                    : "No students have been created yet."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredStudents.map((student) => (
            <Card
              key={student._id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {student.userId.firstName} {student.userId.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <Mail className="w-4 h-4 mr-1" />
                      {student.userId.email}
                    </CardDescription>
                  </div>
                  <Badge variant={student.isActive ? "default" : "secondary"}>
                    {student.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.university}
                      </p>
                      <p className="text-sm text-gray-600">
                        {student.department} - {student.program}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Batch {student.batchYear}
                      </p>
                      <p className="text-sm text-gray-600">
                        Graduation: {student.graduationYear}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {student.currentYear}
                      </p>
                      <p className="text-sm text-gray-600">
                        {student.rollNumber} / {student.studentId}
                      </p>
                    </div>
                  </div>

                  {student.currentCGPA && (
                    <div className="flex items-center">
                      <div className="w-4 h-4 mr-2 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-yellow-800">
                          G
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          CGPA: {student.currentCGPA}
                        </p>
                        {student.currentGPA && (
                          <p className="text-sm text-gray-600">
                            GPA: {student.currentGPA}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {student.skills && student.skills.length > 0 && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Skills:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {student.skills.slice(0, 5).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {student.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{student.skills.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {(student.linkedinProfile || student.githubProfile) && (
                    <div className="md:col-span-2 lg:col-span-3">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Social Profiles:
                      </p>
                      <div className="flex space-x-4">
                        {student.linkedinProfile && (
                          <a
                            href={student.linkedinProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            LinkedIn
                          </a>
                        )}
                        {student.githubProfile && (
                          <a
                            href={student.githubProfile}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-800 hover:text-gray-600 text-sm"
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(students) ? students.length : 0}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <GraduationCap className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(students)
                    ? students.filter((s) => s.isActive).length
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Active Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Array.isArray(students)
                    ? new Set(students.map((s) => s.batchYear)).size
                    : 0}
                </p>
                <p className="text-sm text-gray-600">Different Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentManagement;
