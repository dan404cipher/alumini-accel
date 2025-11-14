import { useState } from "react";
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
import { GraduationCap, Award, BookOpen } from "lucide-react";

const academicDetailsSchema = z.object({
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
  currentCGPA: z.number().min(0).max(10).optional(),
  currentGPA: z.number().min(0).max(4).optional(),
  skills: z.array(z.string()).optional(),
  careerInterests: z.array(z.string()).optional(),
  isAvailableForInternships: z.boolean().optional(),
  isAvailableForProjects: z.boolean().optional(),
  isAvailableForMentorship: z.boolean().optional(),
  mentorshipDomains: z.array(z.string()).optional(),
});

type AcademicDetailsFormData = z.infer<typeof academicDetailsSchema>;

interface AcademicDetailsFormProps {
  profileData: any;
  onUpdate: () => void;
}

export const AcademicDetailsForm = ({
  profileData,
  onUpdate,
}: AcademicDetailsFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AcademicDetailsFormData>({
    resolver: zodResolver(academicDetailsSchema),
    defaultValues: {
      currentYear: profileData?.currentYear || "1st Year",
      currentCGPA: profileData?.currentCGPA || undefined,
      currentGPA: profileData?.currentGPA || undefined,
      skills: profileData?.skills || [],
      careerInterests: profileData?.careerInterests || [],
      isAvailableForInternships: profileData?.isAvailableForInternships ?? true,
      isAvailableForProjects: profileData?.isAvailableForProjects ?? true,
      isAvailableForMentorship: profileData?.isAvailableForMentorship ?? false,
      mentorshipDomains: profileData?.mentorshipDomains || [],
    },
  });

  const onSubmit = async (data: AcademicDetailsFormData) => {
    try {
      setIsLoading(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/students/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
          description: "Academic details updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to update academic details");
      }
    } catch (error) {
      console.error("Error updating academic details:", error);
      toast({
        title: "Error",
        description: "Failed to update academic details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Academic Details</CardTitle>
        <CardDescription>
          Update your current academic information and career goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
              {isLoading ? "Updating..." : "Update Academic Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
