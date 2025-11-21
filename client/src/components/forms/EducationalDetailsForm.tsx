import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { useToast } from "@/hooks/use-toast";
import { getAuthTokenOrNull } from "@/utils/auth";
import { GraduationCap, Calendar, Hash } from "lucide-react";
import { categoryAPI, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const educationalDetailsSchema = z
  .object({
    department: z.string().min(1, "Department is required"),
    program: z.string().min(1, "Program is required"),
    batchYear: z
      .number()
      .min(2000, "Batch year must be 2000 or later")
      .max(
        new Date().getFullYear() + 1,
        "Batch year cannot be in the far future"
      ),
    graduationYear: z
      .number()
      .min(2000, "Graduation year must be 2000 or later")
      .max(
        new Date().getFullYear() + 10,
        "Graduation year cannot be more than 10 years in the future"
      ),
    rollNumber: z
      .string()
      .min(1, "Roll number is required")
      .max(50, "Roll number cannot exceed 50 characters")
      .regex(
        /^[A-Za-z0-9\-_]+$/,
        "Roll number can only contain letters, numbers, hyphens, and underscores"
      ),
    studentId: z
      .string()
      .max(50, "Student ID cannot exceed 50 characters")
      .regex(
        /^[A-Za-z0-9\-_]*$/,
        "Student ID can only contain letters, numbers, hyphens, and underscores"
      )
      .optional()
      .or(z.literal("")),
    currentYear: z
      .enum([
        "1st Year",
        "2nd Year",
        "3rd Year",
        "4th Year",
        "5th Year",
        "Final Year",
        "Graduate",
      ])
      .optional(),
    currentCGPA: z
      .union([
        z
          .number()
          .min(0, "CGPA cannot be negative")
          .max(10, "CGPA cannot exceed 10"),
        z.nan(),
        z.undefined(),
        z.null(),
      ])
      .optional(),
    currentGPA: z
      .union([
        z
          .number()
          .min(0, "GPA cannot be negative")
          .max(4, "GPA cannot exceed 4"),
        z.nan(),
        z.undefined(),
        z.null(),
      ])
      .optional(),
  })
  .refine(
    (data) => {
      // Graduation year should be greater than or equal to batch year
      if (data.graduationYear && data.batchYear) {
        return data.graduationYear >= data.batchYear;
      }
      return true;
    },
    {
      message: "Graduation year must be greater than or equal to batch year",
      path: ["graduationYear"],
    }
  );

type EducationalDetailsFormData = z.infer<typeof educationalDetailsSchema>;

interface EducationalDetailsFormProps {
  profileData: any;
  userRole: string;
  onUpdate: () => void;
}

export const EducationalDetailsForm = ({
  profileData,
  userRole,
  onUpdate,
}: EducationalDetailsFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<
    Array<{ _id: string; name: string; programs?: string[] }>
  >([]);
  const [programs, setPrograms] = useState<
    Array<{ _id: string; name: string }>
  >([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EducationalDetailsFormData>({
    resolver: zodResolver(educationalDetailsSchema),
    defaultValues: {
      department: profileData?.department || "",
      program: profileData?.program || "",
      batchYear: profileData?.batchYear || new Date().getFullYear(),
      graduationYear:
        profileData?.graduationYear || new Date().getFullYear() + 4,
      rollNumber: profileData?.rollNumber || "",
      studentId: profileData?.studentId || "",
      currentYear: profileData?.currentYear || "1st Year",
      currentCGPA: profileData?.currentCGPA || undefined,
      currentGPA: profileData?.currentGPA || undefined,
    },
  });

  const selectedProgram = watch("program");

  const onSubmit = async (data: EducationalDetailsFormData) => {
    console.log("Form submitted with data:", data);

    try {
      setIsLoading(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Determine endpoint based on user's actual role
      const isStudent = userRole === "student";
      const apiUrl = API_BASE_URL;
      const endpoint = isStudent
        ? `${apiUrl}/students/profile`
        : `${apiUrl}/alumni/profile`;

      // Ensure numeric fields are properly converted
      const processedData: any = {
        ...data,
        batchYear: Number(data.batchYear),
        graduationYear: Number(data.graduationYear),
      };

      // For alumni, remove currentYear but keep CGPA/GPA (historical student data)
      if (!isStudent) {
        delete processedData.currentYear;
        // Keep CGPA and GPA for alumni (they might want to preserve their student academic records)
        if (
          data.currentCGPA !== undefined &&
          data.currentCGPA !== null &&
          !isNaN(Number(data.currentCGPA))
        ) {
          processedData.currentCGPA = Number(data.currentCGPA);
        }
        if (
          data.currentGPA !== undefined &&
          data.currentGPA !== null &&
          !isNaN(Number(data.currentGPA))
        ) {
          processedData.currentGPA = Number(data.currentGPA);
        }
      } else {
        // For students, handle CGPA and GPA - only include if they have valid values
        if (
          data.currentCGPA !== undefined &&
          data.currentCGPA !== null &&
          !isNaN(Number(data.currentCGPA))
        ) {
          processedData.currentCGPA = Number(data.currentCGPA);
        }
        if (
          data.currentGPA !== undefined &&
          data.currentGPA !== null &&
          !isNaN(Number(data.currentGPA))
        ) {
          processedData.currentGPA = Number(data.currentGPA);
        }
      }

      // Remove undefined values to avoid sending them
      Object.keys(processedData).forEach((key) => {
        if (processedData[key] === undefined) {
          delete processedData[key];
        }
      });

      console.log("Processed data to send:", processedData);

      const response = await fetch(endpoint, {
        method: profileData ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(processedData),
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        onUpdate();
        toast({
          title: "Success",
          description: "Educational details updated successfully",
        });
      } else {
        throw new Error(
          result.message || "Failed to update educational details"
        );
      }
    } catch (error) {
      console.error("Error updating educational details:", error);
      toast({
        title: "Error",
        description: "Failed to update educational details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Determine if user is a student - check role or if currentYear exists
  const isStudent =
    userRole === "student" || profileData?.currentYear !== undefined;

  // Fetch categories for department and program
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const [deptResponse, progResponse] = await Promise.all([
          categoryAPI.getAll({ entityType: "department", isActive: "true" }),
          categoryAPI.getAll({ entityType: "program", isActive: "true" }),
        ]);

        if (deptResponse.success && deptResponse.data) {
          setDepartments(deptResponse.data);
        }
        if (progResponse.success && progResponse.data) {
          setPrograms(progResponse.data);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
        // Don't show error toast as categories are optional
      } finally {
        setLoadingCategories(false);
      }
    };

    if (user?.tenantId) {
      fetchCategories();
    }
  }, [user?.tenantId]);

  // Filter departments based on selected program
  const filteredDepartments = selectedProgram
    ? (() => {
        // Find the selected program's ID
        const selectedProgramObj = programs.find(
          (p) => p.name === selectedProgram
        );
        if (!selectedProgramObj) {
          return []; // If program not found, show no departments
        }

        // Only show departments that are linked to the selected program
        return departments.filter((dept) => {
          // If department has no programs linked, don't show it (must be linked to a program)
          if (!dept.programs || dept.programs.length === 0) {
            return false;
          }

          // Handle both string IDs and populated objects
          const deptProgramIds = dept.programs
            .map((p: any) => {
              if (typeof p === "string") return p;
              if (p && typeof p === "object" && p._id) return p._id;
              return null;
            })
            .filter((id: string | null) => id !== null);

          // Only show if this department is linked to the selected program
          return deptProgramIds.includes(selectedProgramObj._id);
        });
      })()
    : []; // If no program selected, show no departments

  // When program changes, validate and potentially clear department
  useEffect(() => {
    if (selectedProgram) {
      const currentDepartment = watch("department");
      if (currentDepartment) {
        const selectedProgramObj = programs.find(
          (p) => p.name === selectedProgram
        );
        if (selectedProgramObj) {
          const currentDeptObj = departments.find(
            (d) => d.name === currentDepartment
          );
          // If current department is not valid for selected program, clear it
          if (
            currentDeptObj &&
            currentDeptObj.programs &&
            currentDeptObj.programs.length > 0
          ) {
            // Handle both string IDs and populated objects
            const deptProgramIds = currentDeptObj.programs
              .map((p: any) => {
                if (typeof p === "string") return p;
                if (p && typeof p === "object" && p._id) return p._id;
                return null;
              })
              .filter((id: string | null) => id !== null);

            if (!deptProgramIds.includes(selectedProgramObj._id)) {
              setValue("department", "");
            }
          }
        }
      }
    }
  }, [selectedProgram, programs, departments, setValue, watch]);

  // Update form values when profileData changes
  useEffect(() => {
    if (profileData) {
      setValue("department", profileData.department || "");
      setValue("program", profileData.program || "");
      setValue("batchYear", profileData.batchYear || new Date().getFullYear());
      setValue(
        "graduationYear",
        profileData.graduationYear || new Date().getFullYear() + 4
      );
      setValue("rollNumber", profileData.rollNumber || "");
      setValue("studentId", profileData.studentId || "");
      setValue("currentYear", profileData.currentYear || "1st Year");
      setValue("currentCGPA", profileData.currentCGPA || undefined);
      setValue("currentGPA", profileData.currentGPA || undefined);
    }
  }, [profileData, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Educational Details</CardTitle>
        <CardDescription>
          {isStudent
            ? "Update your current academic information"
            : "Update your educational background"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit(
            (data) => {
              console.log("Form validation passed, submitting:", data);
              onSubmit(data);
            },
            (errors) => {
              console.error("Form validation errors:", errors);
              // Show first error to user
              const firstError = Object.values(errors)[0];
              if (firstError) {
                toast({
                  title: "Validation Error",
                  description:
                    firstError.message || "Please check the form for errors",
                  variant: "destructive",
                });
              }
            }
          )}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="program">Program *</Label>
              <Select
                value={watch("program") || ""}
                onValueChange={(value) => {
                  setValue("program", value);
                  // Clear department when program changes
                  setValue("department", "");
                }}
                disabled={loadingCategories}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((prog) => (
                    <SelectItem key={prog._id} value={prog.name}>
                      {prog.name}
                    </SelectItem>
                  ))}
                  {/* If current value is not in categories, show it as an option */}
                  {watch("program") &&
                    !programs.some((p) => p.name === watch("program")) && (
                      <SelectItem value={watch("program") || ""}>
                        {watch("program")}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
              {loadingCategories && (
                <p className="text-xs text-gray-500">Loading programs...</p>
              )}
              {errors.program && (
                <p className="text-sm text-red-600">{errors.program.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={watch("department") || ""}
                onValueChange={(value) => setValue("department", value)}
                disabled={loadingCategories || !selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !selectedProgram
                        ? "Select program first"
                        : filteredDepartments.length === 0
                        ? "No departments available"
                        : "Select department"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredDepartments.map((dept) => (
                    <SelectItem key={dept._id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                  {/* If current value is not in filtered categories, show it as an option */}
                  {watch("department") &&
                    !filteredDepartments.some(
                      (d) => d.name === watch("department")
                    ) && (
                      <SelectItem value={watch("department") || ""}>
                        {watch("department")}
                      </SelectItem>
                    )}
                </SelectContent>
              </Select>
              {!selectedProgram && (
                <p className="text-xs text-gray-500">
                  Please select a program first
                </p>
              )}
              {selectedProgram && filteredDepartments.length === 0 && (
                <p className="text-xs text-yellow-600">
                  No departments available for this program. Please contact
                  admin to link departments.
                </p>
              )}
              {loadingCategories && (
                <p className="text-xs text-gray-500">Loading departments...</p>
              )}
              {errors.department && (
                <p className="text-sm text-red-600">
                  {errors.department.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="batchYear">Batch Year *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="batchYear"
                  type="number"
                  {...register("batchYear", { valueAsNumber: true })}
                  placeholder="e.g., 2020"
                  className="pl-10"
                  min="2000"
                  max={new Date().getFullYear() + 1}
                />
              </div>
              {errors.batchYear && (
                <p className="text-sm text-red-600">
                  {errors.batchYear.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="graduationYear">Graduation Year *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="graduationYear"
                  type="number"
                  {...register("graduationYear", { valueAsNumber: true })}
                  placeholder="e.g., 2024"
                  className="pl-10"
                  min="2000"
                  max={new Date().getFullYear() + 10}
                />
              </div>
              {errors.graduationYear && (
                <p className="text-sm text-red-600">
                  {errors.graduationYear.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rollNumber">Roll Number *</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="rollNumber"
                  {...register("rollNumber")}
                  placeholder="e.g., 20CS001 or CS20-001"
                  className="pl-10"
                  maxLength={50}
                />
              </div>
              {errors.rollNumber && (
                <p className="text-sm text-red-600">
                  {errors.rollNumber.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Letters, numbers, hyphens, and underscores only
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="studentId"
                  {...register("studentId")}
                  placeholder="e.g., STU2024001 (optional)"
                  className="pl-10"
                  maxLength={50}
                />
              </div>
              {errors.studentId && (
                <p className="text-sm text-red-600">
                  {errors.studentId.message}
                </p>
              )}
              <p className="text-xs text-gray-500">
                Optional. Letters, numbers, hyphens, and underscores only
              </p>
            </div>
          </div>

          {isStudent && (
            <div className="space-y-2">
              <Label htmlFor="currentYear">Current Year</Label>
              <Select
                value={watch("currentYear") || ""}
                onValueChange={(value) => setValue("currentYear", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select current year" />
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
              {errors.currentYear && (
                <p className="text-sm text-red-600">
                  {errors.currentYear.message}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentCGPA">Current CGPA</Label>
              <Input
                id="currentCGPA"
                type="number"
                step="0.01"
                {...register("currentCGPA", { valueAsNumber: true })}
                placeholder="e.g., 8.5"
                min="0"
                max="10"
              />
              {errors.currentCGPA && (
                <p className="text-sm text-red-600">
                  {errors.currentCGPA.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentGPA">Current GPA</Label>
              <Input
                id="currentGPA"
                type="number"
                step="0.01"
                {...register("currentGPA", { valueAsNumber: true })}
                placeholder="e.g., 3.5"
                min="0"
                max="4"
              />
              {errors.currentGPA && (
                <p className="text-sm text-red-600">
                  {errors.currentGPA.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Educational Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
