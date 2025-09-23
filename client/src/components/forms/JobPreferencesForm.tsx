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
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, MapPin, DollarSign, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const jobPreferencesSchema = z.object({
  preferredJobLocation: z.array(z.string()).optional(),
  preferredJobTypes: z.array(z.string()).optional(),
  expectedSalary: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string().optional(),
    })
    .optional(),
  isAvailableForInternships: z.boolean().optional(),
  isAvailableForProjects: z.boolean().optional(),
  isAvailableForMentorship: z.boolean().optional(),
  mentorshipDomains: z.array(z.string()).optional(),
});

type JobPreferencesFormData = z.infer<typeof jobPreferencesSchema>;

interface JobPreferencesFormProps {
  profileData: any;
  isEditing: boolean;
  onUpdate: () => void;
}

export const JobPreferencesForm = ({
  profileData,
  isEditing,
  onUpdate,
}: JobPreferencesFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [preferredLocations, setPreferredLocations] = useState<string[]>(
    profileData?.preferredJobLocation || []
  );
  const [preferredJobTypes, setPreferredJobTypes] = useState<string[]>(
    profileData?.preferredJobTypes || []
  );
  const [mentorshipDomains, setMentorshipDomains] = useState<string[]>(
    profileData?.mentorshipDomains || []
  );
  const [newLocation, setNewLocation] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<JobPreferencesFormData>({
    resolver: zodResolver(jobPreferencesSchema),
    defaultValues: {
      preferredJobLocation: profileData?.preferredJobLocation || [],
      preferredJobTypes: profileData?.preferredJobTypes || [],
      expectedSalary: profileData?.expectedSalary || {
        min: undefined,
        max: undefined,
        currency: "INR",
      },
      isAvailableForInternships: profileData?.isAvailableForInternships ?? true,
      isAvailableForProjects: profileData?.isAvailableForProjects ?? true,
      isAvailableForMentorship: profileData?.isAvailableForMentorship ?? false,
      mentorshipDomains: profileData?.mentorshipDomains || [],
    },
  });

  const isAvailableForInternships = watch("isAvailableForInternships");
  const isAvailableForProjects = watch("isAvailableForProjects");
  const isAvailableForMentorship = watch("isAvailableForMentorship");

  const addLocation = () => {
    if (
      newLocation.trim() &&
      !preferredLocations.includes(newLocation.trim())
    ) {
      const updated = [...preferredLocations, newLocation.trim()];
      setPreferredLocations(updated);
      setValue("preferredJobLocation", updated);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    const updated = preferredLocations.filter((l) => l !== location);
    setPreferredLocations(updated);
    setValue("preferredJobLocation", updated);
  };

  const addDomain = () => {
    if (newDomain.trim() && !mentorshipDomains.includes(newDomain.trim())) {
      const updated = [...mentorshipDomains, newDomain.trim()];
      setMentorshipDomains(updated);
      setValue("mentorshipDomains", updated);
      setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    const updated = mentorshipDomains.filter((d) => d !== domain);
    setMentorshipDomains(updated);
    setValue("mentorshipDomains", updated);
  };

  const toggleJobType = (jobType: string) => {
    const updated = preferredJobTypes.includes(jobType)
      ? preferredJobTypes.filter((t) => t !== jobType)
      : [...preferredJobTypes, jobType];
    setPreferredJobTypes(updated);
    setValue("preferredJobTypes", updated);
  };

  const onSubmit = async (data: JobPreferencesFormData) => {
    try {
      setIsLoading(true);

      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/students/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          preferredJobLocation: preferredLocations,
          preferredJobTypes: preferredJobTypes,
          expectedSalary: data.expectedSalary,
          isAvailableForInternships: data.isAvailableForInternships,
          isAvailableForProjects: data.isAvailableForProjects,
          isAvailableForMentorship: data.isAvailableForMentorship,
          mentorshipDomains: mentorshipDomains,
        }),
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
          description: "Job preferences updated successfully",
        });
      } else {
        throw new Error(result.message || "Failed to update job preferences");
      }
    } catch (error) {
      console.error("Error updating job preferences:", error);
      toast({
        title: "Error",
        description: "Failed to update job preferences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const jobTypes = [
    "full-time",
    "part-time",
    "internship",
    "contract",
    "freelance",
  ];

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {preferredLocations.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Preferred Locations
                </Label>
                <div className="flex flex-wrap gap-2">
                  {preferredLocations.map((location, index) => (
                    <Badge key={index} variant="secondary">
                      <MapPin className="w-3 h-3 mr-1" />
                      {location}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {preferredJobTypes.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Preferred Job Types
                </Label>
                <div className="flex flex-wrap gap-2">
                  {preferredJobTypes.map((type, index) => (
                    <Badge key={index} variant="outline">
                      <Briefcase className="w-3 h-3 mr-1" />
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profileData?.expectedSalary && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Expected Salary
                </Label>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">
                    {profileData.expectedSalary.min &&
                    profileData.expectedSalary.max
                      ? `${profileData.expectedSalary.min} - ${profileData.expectedSalary.max} ${profileData.expectedSalary.currency}`
                      : profileData.expectedSalary.min
                      ? `Above ${profileData.expectedSalary.min} ${profileData.expectedSalary.currency}`
                      : `Below ${profileData.expectedSalary.max} ${profileData.expectedSalary.currency}`}
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox checked={isAvailableForInternships} disabled />
                <Label className="text-sm">Available for Internships</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={isAvailableForProjects} disabled />
                <Label className="text-sm">Available for Projects</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox checked={isAvailableForMentorship} disabled />
                <Label className="text-sm">Available for Mentorship</Label>
              </div>
            </div>

            {mentorshipDomains.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Mentorship Domains
                </Label>
                <div className="flex flex-wrap gap-2">
                  {mentorshipDomains.map((domain, index) => (
                    <Badge key={index} variant="secondary">
                      {domain}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {preferredLocations.length === 0 &&
              preferredJobTypes.length === 0 &&
              !profileData?.expectedSalary && (
                <p className="text-gray-500">No job preferences set yet</p>
              )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Preferences</CardTitle>
        <CardDescription>
          Set your job preferences and career goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Preferred Locations */}
          <div className="space-y-2">
            <Label>Preferred Job Locations</Label>
            <div className="flex space-x-2">
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                placeholder="Add a location (e.g., Bangalore, Remote)"
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addLocation())
                }
              />
              <Button type="button" onClick={addLocation} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {preferredLocations.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center bg-blue-100 rounded-full px-3 py-1"
                >
                  <MapPin className="w-3 h-3 mr-1 text-blue-600" />
                  <span className="text-sm text-blue-800">{location}</span>
                  <button
                    type="button"
                    onClick={() => removeLocation(location)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Preferred Job Types */}
          <div className="space-y-2">
            <Label>Preferred Job Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {jobTypes.map((jobType) => (
                <div key={jobType} className="flex items-center space-x-2">
                  <Checkbox
                    id={jobType}
                    checked={preferredJobTypes.includes(jobType)}
                    onCheckedChange={() => toggleJobType(jobType)}
                  />
                  <Label htmlFor={jobType} className="text-sm">
                    {jobType.charAt(0).toUpperCase() + jobType.slice(1)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Salary */}
          <div className="space-y-4">
            <Label>Expected Salary</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salaryMin">Minimum (LPA)</Label>
                <Input
                  id="salaryMin"
                  type="number"
                  {...register("expectedSalary.min", { valueAsNumber: true })}
                  placeholder="e.g., 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="salaryMax">Maximum (LPA)</Label>
                <Input
                  id="salaryMax"
                  type="number"
                  {...register("expectedSalary.max", { valueAsNumber: true })}
                  placeholder="e.g., 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={watch("expectedSalary.currency") || "INR"}
                  onValueChange={(value) =>
                    setValue("expectedSalary.currency", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="space-y-4">
            <Label>Availability</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="internships"
                  checked={isAvailableForInternships}
                  onCheckedChange={(checked) =>
                    setValue("isAvailableForInternships", checked as boolean)
                  }
                />
                <Label htmlFor="internships" className="text-sm">
                  Available for Internships
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="projects"
                  checked={isAvailableForProjects}
                  onCheckedChange={(checked) =>
                    setValue("isAvailableForProjects", checked as boolean)
                  }
                />
                <Label htmlFor="projects" className="text-sm">
                  Available for Projects
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mentorship"
                  checked={isAvailableForMentorship}
                  onCheckedChange={(checked) =>
                    setValue("isAvailableForMentorship", checked as boolean)
                  }
                />
                <Label htmlFor="mentorship" className="text-sm">
                  Available for Mentorship
                </Label>
              </div>
            </div>
          </div>

          {/* Mentorship Domains */}
          {isAvailableForMentorship && (
            <div className="space-y-2">
              <Label>Mentorship Domains</Label>
              <div className="flex space-x-2">
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="Add a domain (e.g., Web Development, Data Science)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addDomain())
                  }
                />
                <Button type="button" onClick={addDomain} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {mentorshipDomains.map((domain, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-green-100 rounded-full px-3 py-1"
                  >
                    <span className="text-sm text-green-800">{domain}</span>
                    <button
                      type="button"
                      onClick={() => removeDomain(domain)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Job Preferences"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
