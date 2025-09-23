import React, { useState } from "react";
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
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const skillsInterestsSchema = z.object({
  skills: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

type SkillsInterestsFormData = z.infer<typeof skillsInterestsSchema>;

interface SkillsInterestsFormProps {
  profileData: any;
  userRole: string;
  isEditing: boolean;
  onUpdate: () => void;
}

export const SkillsInterestsForm = ({
  profileData,
  userRole,
  isEditing,
  onUpdate,
}: SkillsInterestsFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(profileData?.skills || []);
  const [interests, setInterests] = useState<string[]>(
    profileData?.careerInterests || []
  );

  // Update local state when profileData changes
  React.useEffect(() => {
    console.log("🔄 SkillsInterestsForm: profileData changed:", profileData);
    setSkills(profileData?.skills || []);
    setInterests(profileData?.careerInterests || []);
  }, [profileData]);
  const [newSkill, setNewSkill] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SkillsInterestsFormData>({
    resolver: zodResolver(skillsInterestsSchema),
    defaultValues: {
      skills: profileData?.skills || [],
      interests: profileData?.careerInterests || [],
    },
  });

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

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      const updatedInterests = [...interests, newInterest.trim()];
      setInterests(updatedInterests);
      setValue("interests", updatedInterests);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    const updatedInterests = interests.filter((i) => i !== interest);
    setInterests(updatedInterests);
    setValue("interests", updatedInterests);
  };

  const onSubmit = async (data: SkillsInterestsFormData) => {
    try {
      setIsLoading(true);

      const isStudent = userRole === "student";
      const apiUrl =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";
      const endpoint = isStudent
        ? `${apiUrl}/students/profile`
        : `${apiUrl}/alumni/profile/skills-interests`;

      const requestData = {
        skills: skills,
        careerInterests: interests, // Now send careerInterests for both students and alumni
      };

      console.log("📤 Sending skills/interests data:", requestData);
      console.log("📤 Endpoint:", endpoint);
      console.log("📤 User role:", userRole);
      console.log("📤 Is student:", isStudent);

      const response = await fetch(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(requestData),
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
          description: "Skills and interests updated successfully",
        });
      } else {
        throw new Error(
          result.message || "Failed to update skills and interests"
        );
      }
    } catch (error) {
      console.error("Error updating skills and interests:", error);
      toast({
        title: "Error",
        description: "Failed to update skills and interests. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Skills & Interests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skills.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Skills
                </Label>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {interests.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-gray-500 mb-2 block">
                  Career Interests
                </Label>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <Badge key={index} variant="outline">
                      {interest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {skills.length === 0 && interests.length === 0 && (
              <p className="text-gray-500">
                No skills or career interests added yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Skills & Interests</CardTitle>
        <CardDescription>
          Add your technical skills and personal interests
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex space-x-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g., React, Python, Marketing)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addSkill())
                  }
                />
                <Button type="button" onClick={addSkill} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {skills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-blue-100 rounded-full px-3 py-1"
                  >
                    <span className="text-sm text-blue-800">{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Career Interests</Label>
              <div className="flex space-x-2">
                <Input
                  value={newInterest}
                  onChange={(e) => setNewInterest(e.target.value)}
                  placeholder="Add a career interest (e.g., AI, Sports, Startups)"
                  onKeyPress={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addInterest())
                  }
                />
                <Button type="button" onClick={addInterest} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {interests.map((interest, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-green-100 rounded-full px-3 py-1"
                  >
                    <span className="text-sm text-green-800">{interest}</span>
                    <button
                      type="button"
                      onClick={() => removeInterest(interest)}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Skills & Interests"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
