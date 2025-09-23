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

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required"),
  description: z.string().min(1, "Project description is required"),
  technologies: z
    .array(z.string())
    .min(1, "At least one technology is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isOngoing: z.boolean(),
  githubUrl: z
    .string()
    .min(1, "GitHub URL is required")
    .refine(
      (val) => {
        return /^https?:\/\/(www\.)?github\.com\/.+/.test(val);
      },
      {
        message:
          "Please enter a valid GitHub URL (e.g., https://github.com/username/repo)",
      }
    ),
  liveUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true; // Allow empty
        return /^https?:\/\/.+/.test(val);
      },
      {
        message: "Please enter a valid URL (e.g., https://example.com)",
      }
    ),
  teamMembers: z
    .array(
      z.object({
        name: z.string().min(1, "Name is required"),
        role: z.string().min(1, "Role is required"),
      })
    )
    .min(1, "At least one team member is required"),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  project?: any;
  onSuccess: () => void;
  userRole?: string;
}

export const ProjectForm = ({
  project,
  onSuccess,
  userRole = "student",
}: ProjectFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [technologies, setTechnologies] = useState<string[]>(
    project?.technologies || []
  );
  const [newTechnology, setNewTechnology] = useState("");
  const [teamMembers, setTeamMembers] = useState(
    project?.teamMembers || [{ name: "", role: "" }]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title || "",
      description: project?.description || "",
      technologies: project?.technologies || [],
      startDate: project?.startDate ? project.startDate.split("T")[0] : "",
      endDate: project?.endDate ? project.endDate.split("T")[0] : "",
      isOngoing: project?.isOngoing || false,
      githubUrl: project?.githubUrl || "",
      liveUrl: project?.liveUrl || "",
      teamMembers: project?.teamMembers || [],
    },
  });

  const isOngoing = watch("isOngoing");

  useEffect(() => {
    setValue("technologies", technologies);
  }, [technologies, setValue]);

  useEffect(() => {
    setValue("teamMembers", teamMembers);
  }, [teamMembers, setValue]);

  const addTechnology = () => {
    if (newTechnology.trim() && !technologies.includes(newTechnology.trim())) {
      setTechnologies([...technologies, newTechnology.trim()]);
      setNewTechnology("");
    }
  };

  const removeTechnology = (tech: string) => {
    setTechnologies(technologies.filter((t) => t !== tech));
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", role: "" }]);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = teamMembers.map((member, i) =>
      i === index ? { ...member, [field]: value } : member
    );
    setTeamMembers(updated);
  };

  const onSubmit = async (data: ProjectFormData) => {
    try {
      setIsLoading(true);

      const projectData = {
        ...data,
        technologies,
        teamMembers: teamMembers.filter((member) => member.name && member.role),
        // Convert empty strings to undefined for optional URL fields
        githubUrl:
          data.githubUrl && data.githubUrl.trim() !== ""
            ? data.githubUrl
            : undefined,
        liveUrl:
          data.liveUrl && data.liveUrl.trim() !== "" ? data.liveUrl : undefined,
        // Handle endDate properly - don't send empty string for ongoing projects
        endDate:
          data.isOngoing || !data.endDate || data.endDate.trim() === ""
            ? undefined
            : data.endDate,
      };

      console.log("📤 Sending project data:", projectData);

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const baseEndpoint =
        userRole === "student"
          ? `${apiUrl}/students/profile/projects`
          : `${apiUrl}/alumni/profile/projects`;
      const url = project?._id
        ? `${baseEndpoint}/${project._id}`
        : baseEndpoint;

      const method = project?._id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(projectData),
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
          description: project?._id
            ? "Project updated successfully"
            : "Project added successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Project Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter project title"
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea
          id="description"
          {...register("description")}
          placeholder="Describe your project..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Technologies Used *</Label>
        <div className="flex space-x-2">
          <Input
            value={newTechnology}
            onChange={(e) => setNewTechnology(e.target.value)}
            placeholder="Add technology (e.g., React, Python)"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addTechnology())
            }
          />
          <Button type="button" onClick={addTechnology} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {technologies.map((tech, index) => (
            <div
              key={index}
              className="flex items-center bg-gray-100 rounded-full px-3 py-1"
            >
              <span className="text-sm">{tech}</span>
              <button
                type="button"
                onClick={() => removeTechnology(tech)}
                className="ml-2 text-gray-500 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        {errors.technologies && (
          <p className="text-sm text-red-600">{errors.technologies.message}</p>
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
        <Label htmlFor="isOngoing">This project is ongoing</Label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="githubUrl">GitHub URL *</Label>
          <Input
            id="githubUrl"
            {...register("githubUrl")}
            placeholder="https://github.com/username/repo"
          />
          {errors.githubUrl && (
            <p className="text-sm text-red-600">{errors.githubUrl.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="liveUrl">Live Demo URL</Label>
          <Input
            id="liveUrl"
            {...register("liveUrl")}
            placeholder="https://yourproject.com"
          />
          {errors.liveUrl && (
            <p className="text-sm text-red-600">{errors.liveUrl.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Team Members *</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addTeamMember}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Member
          </Button>
        </div>

        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
          >
            <div className="space-y-2">
              <Label htmlFor={`member-name-${index}`}>Name</Label>
              <Input
                id={`member-name-${index}`}
                value={member.name}
                onChange={(e) =>
                  updateTeamMember(index, "name", e.target.value)
                }
                placeholder="Member name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`member-role-${index}`}>Role</Label>
              <Input
                id={`member-role-${index}`}
                value={member.role}
                onChange={(e) =>
                  updateTeamMember(index, "role", e.target.value)
                }
                placeholder="e.g., Frontend Developer"
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeTeamMember(index)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : project?._id
            ? "Update Project"
            : "Add Project"}
        </Button>
      </div>
    </form>
  );
};
