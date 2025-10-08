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

const researchSchema = z.object({
  title: z.string().min(1, "Research title is required"),
  description: z.string().min(1, "Description is required"),
  supervisor: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  isOngoing: z.boolean(),
  publicationFile: z.any().optional(),
  conferenceFile: z.any().optional(),
  keywords: z.array(z.string()).optional(),
  status: z.enum(["ongoing", "completed", "published", "presented"]),
});

type ResearchFormData = z.infer<typeof researchSchema>;

interface ResearchFormProps {
  research?: any;
  userRole?: string;
  onSuccess: () => void;
}

export const ResearchForm = ({
  research,
  userRole = "student",
  onSuccess,
}: ResearchFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [keywords, setKeywords] = useState<string[]>(research?.keywords || []);
  const [newKeyword, setNewKeyword] = useState("");
  const [publicationFile, setPublicationFile] = useState<File | null>(null);
  const [conferenceFile, setConferenceFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ResearchFormData>({
    resolver: zodResolver(researchSchema),
    defaultValues: {
      title: research?.title || "",
      description: research?.description || "",
      supervisor: research?.supervisor || "",
      startDate: research?.startDate ? research.startDate.split("T")[0] : "",
      endDate: research?.endDate ? research.endDate.split("T")[0] : "",
      isOngoing: research?.isOngoing || false,
      publicationFile: undefined,
      conferenceFile: undefined,
      keywords: research?.keywords || [],
      status: research?.status || "ongoing",
    },
  });

  const isOngoing = watch("isOngoing");

  useEffect(() => {
    setValue("keywords", keywords);
  }, [keywords, setValue]);

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const onSubmit = async (data: ResearchFormData) => {
    try {
      setIsLoading(true);

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const baseEndpoint =
        userRole === "student"
          ? `${apiUrl}/students/profile/research`
          : `${apiUrl}/alumni/profile/research`;
      const url = research?._id
        ? `${baseEndpoint}/${research._id}`
        : baseEndpoint;

      const method = research?._id ? "PUT" : "POST";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      if (data.supervisor) formData.append("supervisor", data.supervisor);
      formData.append("startDate", data.startDate);
      if (data.endDate) formData.append("endDate", data.endDate);
      formData.append("isOngoing", data.isOngoing.toString());
      formData.append("status", data.status);
      formData.append("keywords", JSON.stringify(keywords));
      if (publicationFile) {
        formData.append("publicationFile", publicationFile);
      }
      if (conferenceFile) {
        formData.append("conferenceFile", conferenceFile);
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
          description: research?._id
            ? "Research work updated successfully"
            : "Research work added successfully",
        });
      } else {
        throw new Error(result.message || "Failed to save research work");
      }
    } catch (error) {
      console.error("Error saving research work:", error);
      toast({
        title: "Error",
        description: "Failed to save research work. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Research Title *</Label>
        <Input
          id="title"
          {...register("title")}
          placeholder="Enter research title"
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
          placeholder="Describe your research work..."
          rows={4}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="supervisor">Supervisor</Label>
        <Input
          id="supervisor"
          {...register("supervisor")}
          placeholder="Enter supervisor name"
        />
        {errors.supervisor && (
          <p className="text-sm text-red-600">{errors.supervisor.message}</p>
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

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <select
          id="status"
          {...register("status")}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="ongoing">Ongoing</option>
          <option value="completed">Completed</option>
          <option value="published">Published</option>
          <option value="presented">Presented</option>
        </select>
        {errors.status && (
          <p className="text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Keywords</Label>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder="Add a keyword"
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), addKeyword())
            }
          />
          <Button type="button" onClick={addKeyword} size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((keyword, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-sm"
              >
                <span>{keyword}</span>
                <button
                  type="button"
                  onClick={() => removeKeyword(keyword)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="publicationFile">Publication File (PDF/DOC)</Label>
          <Input
            id="publicationFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const allowedTypes = [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ];
                if (allowedTypes.includes(file.type)) {
                  setPublicationFile(file);
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
          {publicationFile && (
            <p className="text-sm text-green-600">
              Selected: {publicationFile.name}
            </p>
          )}
          {errors.publicationFile && (
            <p className="text-sm text-red-600">
              {errors.publicationFile.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="conferenceFile">Conference File (PDF/DOC)</Label>
          <Input
            id="conferenceFile"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const allowedTypes = [
                  "application/pdf",
                  "application/msword",
                  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ];
                if (allowedTypes.includes(file.type)) {
                  setConferenceFile(file);
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
          {conferenceFile && (
            <p className="text-sm text-green-600">
              Selected: {conferenceFile.name}
            </p>
          )}
          {errors.conferenceFile && (
            <p className="text-sm text-red-600">
              {errors.conferenceFile.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : research?._id ? "Update" : "Add"} Research
          Work
        </Button>
      </div>
    </form>
  );
};
