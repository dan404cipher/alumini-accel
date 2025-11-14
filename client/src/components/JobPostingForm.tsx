import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { categoryAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Calendar, MapPin, Building2, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { jobAPI } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const jobPostingSchema = z.object({
  title: z.string().min(2, "Job title must be at least 2 characters"),
  company: z.string().min(2, "Company name must be at least 2 characters"),
  position: z.string().min(2, "Position must be at least 2 characters"),
  location: z.string().min(2, "Location must be at least 2 characters"),
  type: z.enum(["full-time", "part-time", "internship", "contract"]),
  experience: z.enum(["entry", "mid", "senior", "lead"]),
  industry: z.enum([
    "technology",
    "finance",
    "healthcare",
    "education",
    "consulting",
    "marketing",
    "sales",
    "operations",
    "other",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
  requirements: z
    .array(z.string())
    .min(1, "At least one requirement is required"),
  benefits: z.array(z.string()).optional(),
  salaryMin: z.number().min(0, "Minimum salary must be positive"),
  salaryMax: z.number().min(0, "Maximum salary must be positive"),
  currency: z.string().default("USD"),
  deadline: z.string().optional(),
  remote: z.boolean().default(false),
  companyWebsite: z.string().url().optional().or(z.literal("")),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

type JobPostingFormData = z.infer<typeof jobPostingSchema>;

interface JobPostingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const JobPostingForm: React.FC<JobPostingFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({ entityType: "job_industry", isActive: "true" });
        const names = Array.isArray(res.data)
          ? (res.data as any[]).filter((c) => c && typeof c.name === "string").map((c) => c.name as string)
          : [];
        if (mounted) setIndustryOptions(names);
      } catch (_) {
        if (mounted) setIndustryOptions([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newBenefit, setNewBenefit] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobPostingFormData>({
    resolver: zodResolver(jobPostingSchema),
    defaultValues: {
      type: "full-time",
      experience: "mid",
      industry: "technology",
      currency: "USD",
      remote: false,
      requiredSkills: [],
      requirements: [],
      benefits: [],
    },
  });

  const watchedValues = watch();

  const addSkill = () => {
    if (newSkill.trim() && !requiredSkills.includes(newSkill.trim())) {
      const updatedSkills = [...requiredSkills, newSkill.trim()];
      setRequiredSkills(updatedSkills);
      setValue("requiredSkills", updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = requiredSkills.filter((s) => s !== skill);
    setRequiredSkills(updatedSkills);
    setValue("requiredSkills", updatedSkills);
  };

  const addRequirement = () => {
    if (
      newRequirement.trim() &&
      !requirements.includes(newRequirement.trim())
    ) {
      const updatedRequirements = [...requirements, newRequirement.trim()];
      setRequirements(updatedRequirements);
      setValue("requirements", updatedRequirements);
      setNewRequirement("");
    }
  };

  const removeRequirement = (requirement: string) => {
    const updatedRequirements = requirements.filter((r) => r !== requirement);
    setRequirements(updatedRequirements);
    setValue("requirements", updatedRequirements);
  };

  const addBenefit = () => {
    if (newBenefit.trim() && !benefits.includes(newBenefit.trim())) {
      const updatedBenefits = [...benefits, newBenefit.trim()];
      setBenefits(updatedBenefits);
      setValue("benefits", updatedBenefits);
      setNewBenefit("");
    }
  };

  const removeBenefit = (benefit: string) => {
    const updatedBenefits = benefits.filter((b) => b !== benefit);
    setBenefits(updatedBenefits);
    setValue("benefits", updatedBenefits);
  };

  const onSubmit = async (data: JobPostingFormData) => {
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
      const jobData = {
        ...data,
        salary: {
          min: data.salaryMin,
          max: data.salaryMax,
          currency: data.currency,
        },
        deadline: data.deadline
          ? new Date(data.deadline).toISOString()
          : undefined,
        tenantId: user.tenantId,
      };

      await jobAPI.createJob(jobData);

      toast({
        title: "Success",
        description: "Job posted successfully!",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error posting job:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to post job",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          Post a New Job
        </CardTitle>
        <CardDescription>
          Create a job posting to attract talented alumni to your organization.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Basic Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="e.g., Senior Software Engineer"
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company Name *</Label>
                <Input
                  id="company"
                  {...register("company")}
                  placeholder="e.g., Tech Corp"
                />
                {errors.company && (
                  <p className="text-sm text-red-500">
                    {errors.company.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position *</Label>
                <Input
                  id="position"
                  {...register("position")}
                  placeholder="e.g., Software Engineer"
                />
                {errors.position && (
                  <p className="text-sm text-red-500">
                    {errors.position.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g., San Francisco, CA"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select
                  value={watchedValues.type}
                  onValueChange={(value) => setValue("type", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level *</Label>
                <Select
                  value={watchedValues.experience}
                  onValueChange={(value) =>
                    setValue("experience", value as any)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                    <SelectItem value="lead">Lead Level</SelectItem>
                  </SelectContent>
                </Select>
                {errors.experience && (
                  <p className="text-sm text-red-500">
                    {errors.experience.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry *</Label>
                <Select
                  value={watchedValues.industry}
                  onValueChange={(value) => setValue("industry", value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.length === 0 ? (
                      <SelectItem value="__noopts__" disabled>
                        No saved industries
                      </SelectItem>
                    ) : (
                      industryOptions.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.industry && (
                  <p className="text-sm text-red-500">
                    {errors.industry.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe the role, responsibilities, and what makes this opportunity unique..."
                rows={6}
              />
              {errors.description && (
                <p className="text-sm text-red-500">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          {/* Required Skills */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Required Skills *</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a required skill"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {requiredSkills.map((skill, index) => (
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
              {errors.requiredSkills && (
                <p className="text-sm text-red-500">
                  {errors.requiredSkills.message}
                </p>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Requirements *</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="Add a requirement"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addRequirement())
                  }
                />
                <Button type="button" onClick={addRequirement} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {requirements.map((requirement, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="flex-1">{requirement}</span>
                    <X
                      className="w-4 h-4 cursor-pointer text-gray-500"
                      onClick={() => removeRequirement(requirement)}
                    />
                  </div>
                ))}
              </div>
              {errors.requirements && (
                <p className="text-sm text-red-500">
                  {errors.requirements.message}
                </p>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Benefits (Optional)</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newBenefit}
                  onChange={(e) => setNewBenefit(e.target.value)}
                  placeholder="Add a benefit"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addBenefit())
                  }
                />
                <Button type="button" onClick={addBenefit} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                  >
                    <span className="flex-1">{benefit}</span>
                    <X
                      className="w-4 h-4 cursor-pointer text-gray-500"
                      onClick={() => removeBenefit(benefit)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Salary & Compensation */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Salary & Compensation</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Minimum Salary *</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  {...register("salaryMin", { valueAsNumber: true })}
                  placeholder="e.g., 80000"
                />
                {errors.salaryMin && (
                  <p className="text-sm text-red-500">
                    {errors.salaryMin.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="salaryMax">Maximum Salary *</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  {...register("salaryMax", { valueAsNumber: true })}
                  placeholder="e.g., 120000"
                />
                {errors.salaryMax && (
                  <p className="text-sm text-red-500">
                    {errors.salaryMax.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watchedValues.currency}
                  onValueChange={(value) => setValue("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Input id="deadline" type="date" {...register("deadline")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyWebsite">Company Website</Label>
                <Input
                  id="companyWebsite"
                  {...register("companyWebsite")}
                  placeholder="https://company.com"
                />
                {errors.companyWebsite && (
                  <p className="text-sm text-red-500">
                    {errors.companyWebsite.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register("contactEmail")}
                  placeholder="hr@company.com"
                />
                {errors.contactEmail && (
                  <p className="text-sm text-red-500">
                    {errors.contactEmail.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>
                  <input
                    type="checkbox"
                    {...register("remote")}
                    className="mr-2"
                  />
                  Remote work available
                </Label>
              </div>
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
              {isSubmitting ? "Posting Job..." : "Post Job"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobPostingForm;
