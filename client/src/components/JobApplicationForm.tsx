import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload, User, Mail, Phone, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { jobApplicationAPI } from "@/lib/api";

const jobApplicationSchema = z.object({
  skills: z.array(z.string()).min(1, "At least one skill is required"),
  experience: z
    .string()
    .min(10, "Experience description must be at least 10 characters"),
  contactDetails: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please provide a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 characters"),
  }),
  message: z
    .string()
    .max(1000, "Message must be less than 1000 characters")
    .optional(),
  resume: z.string().optional(),
});

type JobApplicationFormData = z.infer<typeof jobApplicationSchema>;

interface JobApplicationFormProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const JobApplicationForm: React.FC<JobApplicationFormProps> = ({
  jobId,
  jobTitle,
  companyName,
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobApplicationFormData>({
    resolver: zodResolver(jobApplicationSchema),
    defaultValues: {
      skills: [],
      experience: "",
      contactDetails: {
        name:
          user?.firstName && user?.lastName
            ? `${user.firstName} ${user.lastName}`
            : "",
        email: user?.email || "",
        phone: "",
      },
      message: "",
      resume: "",
    },
  });

  const watchedValues = watch();

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      const updatedSkills = [...skills, newSkill.trim()];
      setSkills(updatedSkills);
      setValue("skills", updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = skills.filter((s) => s !== skill);
    setSkills(updatedSkills);
    setValue("skills", updatedSkills);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast({
          title: "Error",
          description: "File size must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      if (
        !file.type.includes("pdf") &&
        !file.type.includes("doc") &&
        !file.type.includes("docx")
      ) {
        toast({
          title: "Error",
          description: "Please upload a PDF, DOC, or DOCX file",
          variant: "destructive",
        });
        return;
      }

      setResumeFile(file);
      setValue("resume", file.name);
    }
  };

  const onSubmit = async (data: JobApplicationFormData) => {
    if (!user?.tenantId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const applicationData = {
        ...data,
        resume: resumeFile ? resumeFile.name : undefined, // TODO: Implement file upload
      };

      await jobApplicationAPI.applyForJob(jobId, applicationData);

      toast({
        title: "Success",
        description: "Application submitted successfully!",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error submitting application:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to submit application",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Apply for Job
        </CardTitle>
        <CardDescription>
          Apply for <strong>{jobTitle}</strong> at{" "}
          <strong>{companyName}</strong>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Contact Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactDetails.name">Full Name *</Label>
                <Input
                  id="contactDetails.name"
                  {...register("contactDetails.name")}
                  placeholder="Your full name"
                />
                {errors.contactDetails?.name && (
                  <p className="text-sm text-red-500">
                    {errors.contactDetails.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactDetails.email">Email Address *</Label>
                <Input
                  id="contactDetails.email"
                  type="email"
                  {...register("contactDetails.email")}
                  placeholder="your.email@example.com"
                />
                {errors.contactDetails?.email && (
                  <p className="text-sm text-red-500">
                    {errors.contactDetails.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactDetails.phone">Phone Number *</Label>
                <Input
                  id="contactDetails.phone"
                  {...register("contactDetails.phone")}
                  placeholder="+1 (555) 123-4567"
                />
                {errors.contactDetails?.phone && (
                  <p className="text-sm text-red-500">
                    {errors.contactDetails.phone.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Skills & Expertise *</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., React, Python, Project Management)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {skill}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeSkill(skill)}
                    />
                  </Badge>
                ))}
              </div>
              {errors.skills && (
                <p className="text-sm text-red-500">{errors.skills.message}</p>
              )}
            </div>
          </div>

          {/* Experience */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Experience Summary *</h3>
            <div className="space-y-2">
              <Textarea
                {...register("experience")}
                placeholder="Describe your relevant experience, projects, and achievements that make you a good fit for this role..."
                rows={6}
              />
              {errors.experience && (
                <p className="text-sm text-red-500">
                  {errors.experience.message}
                </p>
              )}
            </div>
          </div>

          {/* Resume Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Resume Upload (Optional)
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="flex-1"
                />
                {resumeFile && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    {resumeFile.name}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => {
                        setResumeFile(null);
                        setValue("resume", "");
                      }}
                    />
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                Upload your resume (PDF, DOC, or DOCX format, max 5MB)
              </p>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Additional Message (Optional)
            </h3>
            <div className="space-y-2">
              <Textarea
                {...register("message")}
                placeholder="Add any additional information you'd like the employer to know about your application..."
                rows={4}
              />
              {errors.message && (
                <p className="text-sm text-red-500">{errors.message.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobApplicationForm;
