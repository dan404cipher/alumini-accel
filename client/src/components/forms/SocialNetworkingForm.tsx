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
import { useToast } from "@/hooks/use-toast";
import { Linkedin, Github, Twitter, Globe, Plus, X } from "lucide-react";

const socialNetworkingSchema = z.object({
  linkedinProfile: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^https?:\/\/(www\.)?linkedin\.com\/in\/.+/.test(val);
      },
      {
        message:
          "Please enter a valid LinkedIn URL (e.g., https://linkedin.com/in/username)",
      }
    ),
  githubProfile: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^https?:\/\/(www\.)?github\.com\/.+/.test(val);
      },
      {
        message:
          "Please enter a valid GitHub URL (e.g., https://github.com/username)",
      }
    ),
  portfolioUrl: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^https?:\/\/.+/.test(val);
      },
      {
        message:
          "Please enter a valid portfolio URL (e.g., https://yourportfolio.com)",
      }
    ),
  twitterHandle: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^@?[\w]{1,15}$/.test(val);
      },
      {
        message: "Please enter a valid Twitter handle (e.g., @username)",
      }
    ),
  website: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val || val.trim() === "") return true;
        return /^https?:\/\/.+/.test(val);
      },
      {
        message: "Please enter a valid website URL (e.g., https://example.com)",
      }
    ),
  otherSocialHandles: z
    .array(
      z.object({
        platform: z.string().min(1, "Platform is required"),
        handle: z.string().min(1, "Handle is required"),
        url: z
          .string()
          .optional()
          .refine(
            (val) => {
              if (!val || val.trim() === "") return true;
              return /^https?:\/\/.+/.test(val);
            },
            {
              message: "Please enter a valid URL (e.g., https://example.com)",
            }
          ),
      })
    )
    .optional(),
});

type SocialNetworkingFormData = z.infer<typeof socialNetworkingSchema>;

interface SocialNetworkingFormProps {
  user: {
    linkedinProfile?: string;
    githubProfile?: string;
    twitterHandle?: string;
    website?: string;
  };
  profileData: any;
  onUpdate: () => void;
}

export const SocialNetworkingForm = ({
  user,
  profileData,
  onUpdate,
}: SocialNetworkingFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [otherHandles, setOtherHandles] = useState(
    profileData?.otherSocialHandles || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SocialNetworkingFormData>({
    resolver: zodResolver(socialNetworkingSchema),
    defaultValues: {
      linkedinProfile: user.linkedinProfile || "",
      githubProfile: user.githubProfile || "",
      portfolioUrl: profileData?.portfolioUrl || "",
      twitterHandle: user.twitterHandle || "",
      website: user.website || "",
      otherSocialHandles: otherHandles,
    },
  });

  const addOtherHandle = () => {
    const newHandle = { platform: "", handle: "", url: "" };
    setOtherHandles([...otherHandles, newHandle]);
  };

  const removeOtherHandle = (index: number) => {
    setOtherHandles(otherHandles.filter((_, i) => i !== index));
  };

  const updateOtherHandle = (index: number, field: string, value: string) => {
    const updated = otherHandles.map((handle, i) =>
      i === index ? { ...handle, [field]: value } : handle
    );
    setOtherHandles(updated);
  };

  const onSubmit = async (data: SocialNetworkingFormData) => {
    try {
      setIsLoading(true);

      // Update user profile for basic social links
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1";
      const userResponse = await fetch(`${apiUrl}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          linkedinProfile: data.linkedinProfile || undefined,
          githubProfile: data.githubProfile || undefined,
          twitterHandle: data.twitterHandle || undefined,
          website: data.website || undefined,
        }),
      });

      // Update profile-specific data
      const profileData = {
        portfolioUrl: data.portfolioUrl || undefined,
        otherSocialHandles: otherHandles.filter(
          (handle) => handle.platform && handle.handle
        ),
      };

      const isStudent = user.role === "student";
      const endpoint = isStudent
        ? `${apiUrl}/students/profile`
        : `${apiUrl}/alumni/profile`;

      const profileResponse = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(profileData),
      });

      // Check if user profile update was successful
      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("User profile API Error Response:", errorText);
        throw new Error(
          `User profile update failed: HTTP ${userResponse.status}: ${errorText}`
        );
      }

      // Check if profile-specific update was successful
      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error("Profile API Error Response:", errorText);
        throw new Error(
          `Profile update failed: HTTP ${profileResponse.status}: ${errorText}`
        );
      }

      onUpdate();
      toast({
        title: "Success",
        description: "Social networking information updated successfully",
      });
    } catch (error) {
      console.error("Error updating social networking:", error);
      toast({
        title: "Error",
        description:
          "Failed to update social networking information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social & Networking</CardTitle>
        <CardDescription>
          Update your social media profiles and networking information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedinProfile">LinkedIn Profile</Label>
              <div className="relative">
                <Linkedin className="absolute left-3 top-3 h-4 w-4 text-blue-600" />
                <Input
                  id="linkedinProfile"
                  {...register("linkedinProfile")}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="pl-10"
                />
              </div>
              {errors.linkedinProfile && (
                <p className="text-sm text-red-600">
                  {errors.linkedinProfile.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="githubProfile">GitHub Profile</Label>
              <div className="relative">
                <Github className="absolute left-3 top-3 h-4 w-4 text-gray-800" />
                <Input
                  id="githubProfile"
                  {...register("githubProfile")}
                  placeholder="https://github.com/yourusername"
                  className="pl-10"
                />
              </div>
              {errors.githubProfile && (
                <p className="text-sm text-red-600">
                  {errors.githubProfile.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolioUrl">Portfolio Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                <Input
                  id="portfolioUrl"
                  {...register("portfolioUrl")}
                  placeholder="https://yourportfolio.com"
                  className="pl-10"
                />
              </div>
              {errors.portfolioUrl && (
                <p className="text-sm text-red-600">
                  {errors.portfolioUrl.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="twitterHandle">Twitter Handle</Label>
              <div className="relative">
                <Twitter className="absolute left-3 top-3 h-4 w-4 text-blue-400" />
                <Input
                  id="twitterHandle"
                  {...register("twitterHandle")}
                  placeholder="@yourusername or yourusername"
                  className="pl-10"
                />
              </div>
              {errors.twitterHandle && (
                <p className="text-sm text-red-600">
                  {errors.twitterHandle.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Personal Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-purple-600" />
                <Input
                  id="website"
                  {...register("website")}
                  placeholder="https://yourwebsite.com"
                  className="pl-10"
                />
              </div>
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </div>

          {/* Other Social Handles */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Other Social Handles</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOtherHandle}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Handle
              </Button>
            </div>

            {otherHandles.map((handle, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg"
              >
                <div className="space-y-2">
                  <Label htmlFor={`platform-${index}`}>Platform</Label>
                  <Input
                    id={`platform-${index}`}
                    value={handle.platform}
                    onChange={(e) =>
                      updateOtherHandle(index, "platform", e.target.value)
                    }
                    placeholder="e.g., Instagram, YouTube"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`handle-${index}`}>Handle</Label>
                  <Input
                    id={`handle-${index}`}
                    value={handle.handle}
                    onChange={(e) =>
                      updateOtherHandle(index, "handle", e.target.value)
                    }
                    placeholder="e.g., @username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`url-${index}`}>URL (Optional)</Label>
                  <div className="flex space-x-2">
                    <Input
                      id={`url-${index}`}
                      value={handle.url}
                      onChange={(e) =>
                        updateOtherHandle(index, "url", e.target.value)
                      }
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOtherHandle(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Social Information"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
