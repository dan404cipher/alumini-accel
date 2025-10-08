import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Building,
  MapPin,
  DollarSign,
  Calendar,
  Plus,
  X,
  Award,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const professionalDetailsSchema = z.object({
  currentCompany: z.string().optional(),
  currentPosition: z.string().optional(),
  currentLocation: z.string().optional(),
  experience: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  currency: z.string().optional(),
  skills: z.array(z.string()).optional(),
  isHiring: z.boolean().optional(),
  availableForMentorship: z.boolean().optional(),
  mentorshipDomains: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
});

type ProfessionalDetailsFormData = z.infer<typeof professionalDetailsSchema>;

interface ProfessionalDetailsFormProps {
  profileData: any;
  onUpdate: () => void;
}

export const ProfessionalDetailsForm = ({
  profileData,
  onUpdate,
}: ProfessionalDetailsFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [achievements, setAchievements] = useState<string[]>(
    profileData?.achievements || []
  );
  const [newAchievement, setNewAchievement] = useState("");
  const [mentorshipDomains, setMentorshipDomains] = useState<string[]>(
    profileData?.mentorshipDomains || []
  );
  const [newDomain, setNewDomain] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<ProfessionalDetailsFormData>({
    resolver: zodResolver(professionalDetailsSchema),
    defaultValues: {
      currentCompany: profileData?.currentCompany || "",
      currentPosition: profileData?.currentPosition || "",
      currentLocation: profileData?.currentLocation || "",
      experience: profileData?.experience || 0,
      salary: profileData?.salary || undefined,
      currency: profileData?.currency || "INR",
      skills: profileData?.skills || [],
      isHiring: profileData?.isHiring || false,
      availableForMentorship: profileData?.availableForMentorship || false,
      mentorshipDomains: profileData?.mentorshipDomains || [],
      achievements: profileData?.achievements || [],
    },
  });

  // Helper functions for achievements
  const addAchievement = () => {
    if (
      newAchievement.trim() &&
      !achievements.includes(newAchievement.trim())
    ) {
      const updatedAchievements = [...achievements, newAchievement.trim()];
      setAchievements(updatedAchievements);
      setValue("achievements", updatedAchievements);
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievement: string) => {
    const updatedAchievements = achievements.filter((a) => a !== achievement);
    setAchievements(updatedAchievements);
    setValue("achievements", updatedAchievements);
  };

  // Helper functions for mentorship domains
  const addDomain = () => {
    if (newDomain.trim() && !mentorshipDomains.includes(newDomain.trim())) {
      const updatedDomains = [...mentorshipDomains, newDomain.trim()];
      setMentorshipDomains(updatedDomains);
      setValue("mentorshipDomains", updatedDomains);
      setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    const updatedDomains = mentorshipDomains.filter((d) => d !== domain);
    setMentorshipDomains(updatedDomains);
    setValue("mentorshipDomains", updatedDomains);
  };

  const onSubmit = async (data: ProfessionalDetailsFormData) => {
    try {
      setIsLoading(true);

      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const response = await fetch(`${apiUrl}/alumni/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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
      console.log("📤 ProfessionalDetailsForm API response:", result);
      if (result.success) {
        console.log("✅ Update successful, calling onUpdate callback...");
        onUpdate();
        toast({
          title: "Success",
          description: "Professional details updated successfully",
        });
      } else {
        throw new Error(
          result.message || "Failed to update professional details"
        );
      }
    } catch (error) {
      console.error("Error updating professional details:", error);
      toast({
        title: "Error",
        description: "Failed to update professional details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professional Details</CardTitle>
        <CardDescription>
          Update your professional information and career details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currentCompany">Current Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="currentCompany"
                  {...register("currentCompany")}
                  placeholder="Enter company name"
                  className="pl-10"
                />
              </div>
              {errors.currentCompany && (
                <p className="text-sm text-red-600">
                  {errors.currentCompany.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentPosition">Current Position</Label>
              <Input
                id="currentPosition"
                {...register("currentPosition")}
                placeholder="Enter your position"
              />
              {errors.currentPosition && (
                <p className="text-sm text-red-600">
                  {errors.currentPosition.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currentLocation">Current Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="currentLocation"
                {...register("currentLocation")}
                placeholder="Enter your location"
                className="pl-10"
              />
            </div>
            {errors.currentLocation && (
              <p className="text-sm text-red-600">
                {errors.currentLocation.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <Input
                id="experience"
                type="number"
                {...register("experience", { valueAsNumber: true })}
                placeholder="0"
                min="0"
              />
              {errors.experience && (
                <p className="text-sm text-red-600">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="salary">Current Salary (Optional)</Label>
              <div className="flex space-x-2">
                <div className="relative flex-1">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="salary"
                    type="number"
                    {...register("salary", { valueAsNumber: true })}
                    placeholder="Enter salary"
                    className="pl-10"
                  />
                </div>
                <Select
                  value={watch("currency") || "INR"}
                  onValueChange={(value) => setValue("currency", value)}
                >
                  <SelectTrigger className="w-20">
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
              {errors.salary && (
                <p className="text-sm text-red-600">{errors.salary.message}</p>
              )}
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                Achievements
              </Label>
              <div className="flex flex-wrap gap-2">
                {achievements.map((achievement, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    {achievement}
                    <button
                      type="button"
                      onClick={() => removeAchievement(achievement)}
                      className="ml-2 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newAchievement}
                  onChange={(e) => setNewAchievement(e.target.value)}
                  placeholder="Add an achievement"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addAchievement())
                  }
                />
                <Button type="button" onClick={addAchievement} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Mentorship Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="availableForMentorship"
                {...register("availableForMentorship")}
              />
              <Label
                htmlFor="availableForMentorship"
                className="flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Available for Mentorship
              </Label>
            </div>

            {watch("availableForMentorship") && (
              <div className="space-y-2">
                <Label>Mentorship Domains</Label>
                <div className="flex flex-wrap gap-2">
                  {mentorshipDomains.map((domain, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {domain}
                      <button
                        type="button"
                        onClick={() => removeDomain(domain)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="Add a mentorship domain"
                    onKeyPress={(e) =>
                      e.key === "Enter" && (e.preventDefault(), addDomain())
                    }
                  />
                  <Button type="button" onClick={addDomain} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Hiring Status */}
          <div className="flex items-center space-x-2">
            <Checkbox id="isHiring" {...register("isHiring")} />
            <Label htmlFor="isHiring">Currently Hiring</Label>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Professional Details"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
