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
import { Plus, X } from "lucide-react";

const internshipSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  description: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isOngoing: z.boolean(),
  location: z.string().optional(),
  isRemote: z.boolean(),
  stipendAmount: z.number().optional(),
  stipendCurrency: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certificateFile: z.any().optional(),
});

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
      stipendAmount: internship?.stipend?.amount || undefined,
      stipendCurrency: internship?.stipend?.currency || "USD",
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

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
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
      formData.append("isOngoing", data.isOngoing.toString());
      if (data.location) formData.append("location", data.location);
      formData.append("isRemote", data.isRemote.toString());
      if (data.stipendAmount) {
        formData.append("stipendAmount", data.stipendAmount.toString());
        formData.append("stipendCurrency", data.stipendCurrency || "USD");
      }
      formData.append("skills", JSON.stringify(skills));
      if (certificateFile) {
        formData.append("certificateFile", certificateFile);
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
        <Checkbox id="isOngoing" {...register("isOngoing")} />
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
          <Checkbox id="isRemote" {...register("isRemote")} />
          <Label htmlFor="isRemote">Remote work</Label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stipendAmount">Stipend Amount</Label>
          <Input
            id="stipendAmount"
            type="number"
            {...register("stipendAmount", { valueAsNumber: true })}
            placeholder="Enter amount"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stipendCurrency">Currency</Label>
          <Input
            id="stipendCurrency"
            {...register("stipendCurrency")}
            placeholder="USD"
          />
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
              if (allowedTypes.includes(file.type)) {
                setCertificateFile(file);
              } else {
                toast({
                  title: "Invalid file type",
                  description: "Please upload a PDF or DOC file",
                  variant: "destructive",
                });
              }
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
