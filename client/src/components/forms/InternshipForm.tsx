import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getAuthTokenOrNull } from "@/utils/auth";
import { Plus, X } from "lucide-react";

import { API_BASE_URL } from "@/lib/api";
const internshipSchema = z
  .object({
    company: z.string().min(1, "Company name is required").max(100, "Company name must be less than 100 characters"),
    position: z.string().min(1, "Position is required").max(100, "Position must be less than 100 characters"),
    description: z.string().max(2000, "Description must be less than 2000 characters").optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().optional(),
    isOngoing: z.boolean(),
    location: z.string().max(200, "Location must be less than 200 characters").optional(),
    isRemote: z.boolean(),
    skills: z.array(z.string()).max(20, "Maximum 20 skills allowed").optional(),
    certificateFile: z.any().optional(),
  })
  .refine(
    (data) => {
      // If ongoing, endDate is not required
      if (data.isOngoing) return true;
      // If not ongoing, endDate is required
      return !!data.endDate;
    },
    {
      message: "End date is required when internship is not ongoing",
      path: ["endDate"],
    }
  )
  .refine(
    (data) => {
      // If both dates exist, endDate should be after startDate
      if (data.startDate && data.endDate && !data.isOngoing) {
        return new Date(data.endDate) >= new Date(data.startDate);
      }
      return true;
    },
    {
      message: "End date must be after or equal to start date",
      path: ["endDate"],
    }
  );

type InternshipFormData = z.infer<typeof internshipSchema>;

interface InternshipFormProps {
  internship?: any;
  userRole?: string;
  onSuccess: () => void;
}

export const InternshipForm = ({
  internship,
  userRole = "student",
  onSuccess,
}: InternshipFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(internship?.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<InternshipFormData>({
    resolver: zodResolver(internshipSchema),
    defaultValues: {
      company: internship?.company || "",
      position: internship?.position || "",
      description: internship?.description || "",
      startDate: internship?.startDate
        ? internship.startDate.split("T")[0]
        : "",
      endDate: internship?.endDate ? internship.endDate.split("T")[0] : "",
      isOngoing: internship?.isOngoing || false,
      location: internship?.location || "",
      isRemote: internship?.isRemote || false,
      skills: internship?.skills || [],
      certificateFile: undefined,
    },
  });

  const isOngoing = watch("isOngoing");

  useEffect(() => {
    setValue("skills", skills);
  }, [skills, setValue]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const onSubmit = async (data: InternshipFormData) => {
    try {
      setIsLoading(true);

      // Get token from localStorage or sessionStorage (same logic as AuthContext)
      const token = getAuthTokenOrNull();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const apiUrl =
        API_BASE_URL;
      const baseEndpoint =
        userRole === "student"
          ? `${apiUrl}/students/profile/internships`
          : `${apiUrl}/alumni/profile/internships`;
      const url = internship?._id
        ? `${baseEndpoint}/${internship._id}`
        : baseEndpoint;

      const method = internship?._id ? "PUT" : "POST";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("company", data.company);
      formData.append("position", data.position);
      if (data.description) formData.append("description", data.description);
      formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);
      // Ensure isOngoing is sent as "true" or "false" string
      formData.append("isOngoing", String(data.isOngoing === true || data.isOngoing === "true"));
      if (data.location) formData.append("location", data.location);
      formData.append("isRemote", data.isRemote.toString());
      formData.append("skills", JSON.stringify(skills));
      if (certificateFile) {
        formData.append("certificateFile", certificateFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Check if response is ok before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        onSuccess();
        toast({
          title: "Success",
          description: internship?._id
            ? "Internship updated successfully"
            : "Internship added successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save internship");
      }
    } catch (error) {
      console.error("Error saving internship:", error);
      toast({
        title: "Error",
        description: "Failed to save internship. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input
            id="company"
            {...register("company")}
            placeholder="Enter company name"
          />
          {errors.company && (
            <p className="text-sm text-red-600">{errors.company.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">Position *</Label>
          <Input
            id="position"
            {...register("position")}
            placeholder="Enter position title"
          />
          {errors.position && (
            <p className="text-sm text-red-600">{errors.position.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe your internship experience..."
          rows={3}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date *</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && (
            <p className="text-sm text-red-600">{errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            type="date"
            {...register("endDate")}
            disabled={isOngoing}
          />
          {errors.endDate && (
            <p className="text-sm text-red-600">{errors.endDate.message}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="isOngoing"
          checked={isOngoing}
          onCheckedChange={(checked) =>
            setValue("isOngoing", checked as boolean)
          }
        />
        <Label htmlFor="isOngoing">Currently ongoing</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            {...register("location")}
            placeholder="Enter location"
          />
          {errors.location && (
            <p className="text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="isRemote"
            checked={watch("isRemote")}
            onCheckedChange={(checked) =>
              setValue("isRemote", checked as boolean)
            }
          />
          <Label htmlFor="isRemote">Remote work</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Skills Learned</Label>
        <div className="flex gap-2">
          <Input
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            placeholder="Add a skill"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addSkill())
            }
          />
          <Button type="button" onClick={addSkill} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {skills.map((skill, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="certificateFile">Certificate File (PDF/DOC)</Label>
        <Input
          id="certificateFile"
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Validate file type
              const allowedTypes = [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ];
              
              if (!allowedTypes.includes(file.type)) {
                toast({
                  title: "Invalid file type",
                  description: "Please upload a PDF, DOC, or DOCX file",
                  variant: "destructive",
                });
                e.target.value = ""; // Clear the input
                return;
              }

              // Validate file size (10MB limit)
              const maxSize = 10 * 1024 * 1024; // 10MB
              if (file.size > maxSize) {
                toast({
                  title: "File too large",
                  description: "File size must be less than 10MB. Please compress or choose a smaller file.",
                  variant: "destructive",
                });
                e.target.value = ""; // Clear the input
                return;
              }

              setCertificateFile(file);
            }
          }}
        />
        {certificateFile && (
          <p className="text-sm text-green-600">
            Selected: {certificateFile.name}
          </p>
        )}
        {errors.certificateFile && (
          <p className="text-sm text-red-600">
            {errors.certificateFile.message}
          </p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : internship?._id ? "Update" : "Add"}{" "}
          Internship
        </Button>
      </div>
    </form>
  );
};
