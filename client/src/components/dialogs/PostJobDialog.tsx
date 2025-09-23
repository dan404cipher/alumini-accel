import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { jobAPI } from "@/lib/api";
import {
  Briefcase,
  DollarSign,
  AlertCircle,
  Calendar,
  Globe,
  Tag,
  Gift,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

interface PostJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

export const PostJobDialog = ({
  open,
  onOpenChange,
  onJobCreated,
}: PostJobDialogProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    companyWebsite: "",
    location: "",
    type: "",
    salaryMin: "",
    salaryMax: "",
    currency: "USD",
    description: "",
    requirements: "",
    benefits: "",
    tags: "",
    deadline: "",
    contactEmail: "",
    applicationUrl: "",
    eeoStatement: false,
  });

  const validateForm = () => {
    const newErrors: string[] = [];

    // Required field validation
    if (!formData.title.trim()) {
      newErrors.push("Job title is required");
    } else if (formData.title.trim().length < 2) {
      newErrors.push("Job title must be at least 2 characters");
    } else if (formData.title.trim().length > 100) {
      newErrors.push("Job title must be less than 100 characters");
    }

    if (!formData.company.trim()) {
      newErrors.push("Company name is required");
    } else if (formData.company.trim().length < 2) {
      newErrors.push("Company name must be at least 2 characters");
    } else if (formData.company.trim().length > 100) {
      newErrors.push("Company name must be less than 100 characters");
    }

    if (!formData.location.trim()) {
      newErrors.push("Location is required");
    } else if (formData.location.trim().length < 2) {
      newErrors.push("Location must be at least 2 characters");
    } else if (formData.location.trim().length > 100) {
      newErrors.push("Location must be less than 100 characters");
    }

    if (!formData.type) {
      newErrors.push("Job type is required");
    }

    if (!formData.description.trim()) {
      newErrors.push("Job description is required");
    } else if (formData.description.trim().length < 10) {
      newErrors.push("Job description must be at least 10 characters");
    } else if (formData.description.trim().length > 2000) {
      newErrors.push("Job description must be less than 2000 characters");
    }

    if (!formData.contactEmail.trim()) {
      newErrors.push("Contact email is required");
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail.trim())
    ) {
      newErrors.push("Please enter a valid email address");
    }

    // Company website validation (required)
    if (!formData.companyWebsite.trim()) {
      newErrors.push("Company website is required");
    } else if (!/^https?:\/\/.+/.test(formData.companyWebsite.trim())) {
      newErrors.push(
        "Company website must be a valid URL starting with http:// or https://"
      );
    }

    // Application URL validation (required)
    if (!formData.applicationUrl.trim()) {
      newErrors.push("Application URL is required");
    } else if (!/^https?:\/\/.+/.test(formData.applicationUrl.trim())) {
      newErrors.push(
        "Application URL must be a valid URL starting with http:// or https://"
      );
    }

    // Deadline validation (required and must be in the future)
    if (!formData.deadline.trim()) {
      newErrors.push("Application deadline is required");
    } else {
      const deadlineDate = new Date(formData.deadline);
      const now = new Date();
      if (deadlineDate <= now) {
        newErrors.push("Application deadline must be in the future");
      }
    }

    // Salary validation - make salary required
    if (!formData.salaryMin.trim()) {
      newErrors.push("Minimum salary is required");
    } else if (!formData.salaryMax.trim()) {
      newErrors.push("Maximum salary is required");
    } else {
      const minSalary = parseFloat(formData.salaryMin);
      const maxSalary = parseFloat(formData.salaryMax);

      if (isNaN(minSalary) || minSalary < 0) {
        newErrors.push("Minimum salary must be a non-negative number");
      }
      if (isNaN(maxSalary) || maxSalary < 0) {
        newErrors.push("Maximum salary must be a non-negative number");
      }
      if (!isNaN(minSalary) && !isNaN(maxSalary) && minSalary > maxSalary) {
        newErrors.push("Minimum salary cannot be greater than maximum salary");
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePreview = () => {
    if (validateForm()) {
      setShowPreview(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      // Parse salary range if provided
      let salaryRange = undefined;
      if (formData.salaryMin && formData.salaryMax) {
        const minSalary = parseFloat(formData.salaryMin);
        const maxSalary = parseFloat(formData.salaryMax);

        if (!isNaN(minSalary) && !isNaN(maxSalary)) {
          salaryRange = {
            min: minSalary,
            max: maxSalary,
            currency: formData.currency,
          };
        }
      }

      // Parse requirements into array
      const requirements = formData.requirements
        ? formData.requirements.split("\n").filter((req) => req.trim())
        : [];

      // Parse benefits into array
      const benefits = formData.benefits
        ? formData.benefits.split("\n").filter((benefit) => benefit.trim())
        : [];

      // Parse tags into array
      const tags = formData.tags
        ? formData.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag)
        : [];

      const jobData = {
        company: formData.company.trim(),
        position: formData.title.trim(),
        location: formData.location.trim(),
        type: formData.type,
        remote: formData.location.toLowerCase().includes("remote"),
        salary: salaryRange,
        description: formData.description.trim(),
        requirements: requirements,
        benefits: benefits,
        tags: tags,
        deadline: formData.deadline,
        companyWebsite: formData.companyWebsite.trim(),
        applicationUrl: formData.applicationUrl.trim(),
        contactEmail: formData.contactEmail.trim(),
      };

      console.log("Submitting job data:", jobData);
      const response = await jobAPI.createJob(jobData);

      if (response.success) {
        toast({
          title: "Job Posted Successfully",
          description: `${formData.title} at ${formData.company} has been posted to the job board.`,
        });

        // Reset form
        setFormData({
          title: "",
          company: "",
          companyWebsite: "",
          location: "",
          type: "",
          salaryMin: "",
          salaryMax: "",
          currency: "USD",
          description: "",
          requirements: "",
          benefits: "",
          tags: "",
          deadline: "",
          contactEmail: "",
          applicationUrl: "",
          eeoStatement: false,
        });

        // Close dialog
        onOpenChange(false);

        // Notify parent to refresh jobs list
        if (onJobCreated) {
          onJobCreated();
        }
      } else {
        // Handle validation errors from backend
        if (response.error && Array.isArray(response.error)) {
          setErrors(response.error);
        } else {
          toast({
            title: "Error",
            description:
              response.message || "Failed to post job. Please try again.",
            variant: "destructive",
          });
        }
      }
    } catch (error: unknown) {
      console.error("Error posting job:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to post job. Please try again.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            {showPreview ? (
              <>
                <Eye className="w-5 h-5 mr-2" />
                Job Preview
              </>
            ) : (
              <>
                <Briefcase className="w-5 h-5 mr-2" />
                Post Job Opportunity
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? "Review your job posting before submitting it to the alumni network."
              : "Share a job opportunity with the alumni network. Posts will be reviewed before publishing."}
          </DialogDescription>
        </DialogHeader>
        {showPreview ? (
          <div className="space-y-4 overflow-y-auto flex-1">
            {/* Job Preview */}
            <div className="border rounded-lg p-6 bg-gradient-card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">
                    {formData.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      {formData.company}
                    </div>
                    <div className="flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      {formData.location}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {formData.type}
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-muted-foreground mb-4">
                {formData.description}
              </p>

              {/* Requirements */}
              {formData.requirements && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Requirements:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {formData.requirements
                      .split("\n")
                      .filter((req) => req.trim())
                      .map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {formData.benefits && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Benefits & Perks:</h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground">
                    {formData.benefits
                      .split("\n")
                      .filter((benefit) => benefit.trim())
                      .map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {formData.tags && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.split(",").map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Salary */}
              {formData.salaryMin && formData.salaryMax && (
                <div className="flex items-center text-success font-semibold mb-4">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                    ? "€"
                    : formData.currency === "GBP"
                    ? "£"
                    : formData.currency === "INR"
                    ? "₹"
                    : formData.currency === "CAD"
                    ? "C$"
                    : formData.currency}{" "}
                  {parseInt(formData.salaryMin).toLocaleString()} -{" "}
                  {formData.currency === "USD"
                    ? "$"
                    : formData.currency === "EUR"
                    ? "€"
                    : formData.currency === "GBP"
                    ? "£"
                    : formData.currency === "INR"
                    ? "₹"
                    : formData.currency === "CAD"
                    ? "C$"
                    : formData.currency}{" "}
                  {parseInt(formData.salaryMax).toLocaleString()}
                </div>
              )}

              {/* EEO Statement */}
              {formData.eeoStatement && (
                <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-muted-foreground">
                  <strong>Equal Employment Opportunity:</strong> We are an equal
                  opportunity employer and value diversity at our company. We do
                  not discriminate on the basis of race, religion, color,
                  national origin, gender, sexual orientation, age, marital
                  status, veteran status, or disability status.
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Edit
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Posting..." : "Post Job"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 overflow-y-auto flex-1 pr-2"
          >
            {/* Validation Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Senior Software Engineer"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                  placeholder="Google"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyWebsite">Company Website *</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="companyWebsite"
                  value={formData.companyWebsite}
                  onChange={(e) =>
                    setFormData({ ...formData, companyWebsite: e.target.value })
                  }
                  placeholder="https://www.company.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="San Francisco, CA"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Job Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={formData.deadline || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      console.log("Deadline changed:", value);
                      setFormData({ ...formData, deadline: value });
                    }}
                    onClick={(e) => {
                      console.log("Deadline input clicked");
                      (e.target as HTMLInputElement).showPicker?.();
                    }}
                    className="pl-10 w-full cursor-pointer"
                    min={new Date().toISOString().slice(0, 16)}
                    step="60"
                    placeholder=""
                    required
                    style={{
                      colorScheme: "light",
                      WebkitAppearance: "none",
                      MozAppearance: "textfield",
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Min Salary *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 h-4 w-4 text-muted-foreground text-sm font-medium">
                    {formData.currency === "USD"
                      ? "$"
                      : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                      ? "£"
                      : formData.currency === "INR"
                      ? "₹"
                      : formData.currency === "CAD"
                      ? "C$"
                      : formData.currency}
                  </span>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMin: e.target.value })
                    }
                    placeholder="120000"
                    min="0"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Max Salary *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 h-4 w-4 text-muted-foreground text-sm font-medium">
                    {formData.currency === "USD"
                      ? "$"
                      : formData.currency === "EUR"
                      ? "€"
                      : formData.currency === "GBP"
                      ? "£"
                      : formData.currency === "INR"
                      ? "₹"
                      : formData.currency === "CAD"
                      ? "C$"
                      : formData.currency}
                  </span>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) =>
                      setFormData({ ...formData, salaryMax: e.target.value })
                    }
                    placeholder="180000"
                    min="0"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="CAD">CAD (C$)</SelectItem>
                    <SelectItem value="AUD">AUD (A$)</SelectItem>
                    <SelectItem value="JPY">JPY (¥)</SelectItem>
                    <SelectItem value="CHF">CHF (CHF)</SelectItem>
                    <SelectItem value="CNY">CNY (¥)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) =>
                  setFormData({ ...formData, contactEmail: e.target.value })
                }
                placeholder="hiring@company.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="applicationUrl">Application URL *</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="applicationUrl"
                  type="url"
                  value={formData.applicationUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, applicationUrl: e.target.value })
                  }
                  placeholder="https://company.com/apply"
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                className="min-h-[100px]"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirements">Requirements</Label>
              <Textarea
                id="requirements"
                value={formData.requirements}
                onChange={(e) =>
                  setFormData({ ...formData, requirements: e.target.value })
                }
                placeholder="List key requirements, skills, and qualifications..."
                className="min-h-[80px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <div className="relative">
                <Gift className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Textarea
                  id="benefits"
                  value={formData.benefits}
                  onChange={(e) =>
                    setFormData({ ...formData, benefits: e.target.value })
                  }
                  placeholder="List benefits and perks offered (one per line)..."
                  className="min-h-[80px] pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags & Skills</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  placeholder="React, JavaScript, Remote, Startup (comma-separated)"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Add relevant skills, technologies, or keywords to help
                candidates find this job
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="eeoStatement"
                  checked={formData.eeoStatement}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      eeoStatement: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="eeoStatement" className="text-sm">
                  Include Equal Employment Opportunity statement
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                This will add a standard EEO statement to your job posting for
                compliance
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="button" variant="outline" onClick={handlePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button type="submit" variant="gradient" disabled={loading}>
                {loading ? "Posting..." : "Post Job"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
