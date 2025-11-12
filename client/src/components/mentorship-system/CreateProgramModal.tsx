import React, { useState, useEffect } from "react";
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
import { X, Plus, FileText } from "lucide-react";
import { mentoringProgramAPI, CreateProgramData } from "@/services/mentoringProgramApi";
import { UserSelect } from "./UserSelect";
import { UserMultiSelect } from "./UserMultiSelect";
import { getCharactersRemaining } from "@/utils/mentoringValidation";

interface CreateProgramModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: any; // For edit mode
  onSuccess?: () => void;
}

export const CreateProgramModal: React.FC<CreateProgramModalProps> = ({
  open,
  onOpenChange,
  program,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateProgramData>>({
    category: "",
    name: "",
    shortDescription: "",
    longDescription: "",
    programSchedule: "One-time",
    programDuration: {
      startDate: "",
      endDate: "",
    },
    skillsRequired: [],
    areasOfMentoring: {
      mentor: [],
      mentee: [],
    },
    entryCriteriaRules: "",
    registrationEndDateMentee: "",
    registrationEndDateMentor: "",
    matchingEndDate: "",
    manager: "",
    coordinators: [],
    reportsEscalationsTo: [],
    registrationApprovalBy: "",
    emailTemplateMentorInvitation: "",
    emailTemplateMenteeInvitation: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [mentorAreaInput, setMentorAreaInput] = useState("");
  const [menteeAreaInput, setMenteeAreaInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agreementFile, setAgreementFile] = useState<File | null>(null);

  const isEditMode = !!program;

  useEffect(() => {
    if (program) {
      setFormData({
        category: program.category || "",
        name: program.name || "",
        shortDescription: program.shortDescription || "",
        longDescription: program.longDescription || "",
        programSchedule: program.programSchedule || "One-time",
        programDuration: {
          startDate: program.programDuration?.startDate
            ? new Date(program.programDuration.startDate).toISOString().split("T")[0]
            : "",
          endDate: program.programDuration?.endDate
            ? new Date(program.programDuration.endDate).toISOString().split("T")[0]
            : "",
        },
        skillsRequired: program.skillsRequired || [],
        areasOfMentoring: {
          mentor: program.areasOfMentoring?.mentor || [],
          mentee: program.areasOfMentoring?.mentee || [],
        },
        entryCriteriaRules: program.entryCriteriaRules || "",
        registrationEndDateMentee: program.registrationEndDateMentee
          ? new Date(program.registrationEndDateMentee).toISOString().split("T")[0]
          : "",
        registrationEndDateMentor: program.registrationEndDateMentor
          ? new Date(program.registrationEndDateMentor).toISOString().split("T")[0]
          : "",
        matchingEndDate: program.matchingEndDate
          ? new Date(program.matchingEndDate).toISOString().split("T")[0]
          : "",
        manager: program.manager?._id || program.manager || "",
        coordinators: program.coordinators?.map((c: any) => c._id || c) || [],
        reportsEscalationsTo:
          program.reportsEscalationsTo?.map((r: any) => r._id || r) || [],
        registrationApprovalBy:
          program.registrationApprovalBy?._id || program.registrationApprovalBy || "",
        emailTemplateMentorInvitation:
          program.emailTemplateMentorInvitation?._id ||
          program.emailTemplateMentorInvitation ||
          "",
        emailTemplateMenteeInvitation:
          program.emailTemplateMenteeInvitation?._id ||
          program.emailTemplateMenteeInvitation ||
          "",
      });
    } else {
      resetForm();
    }
  }, [program, open]);

  const resetForm = () => {
    setFormData({
      category: "",
      name: "",
      shortDescription: "",
      longDescription: "",
      programSchedule: "One-time",
      programDuration: {
        startDate: "",
        endDate: "",
      },
      skillsRequired: [],
      areasOfMentoring: {
        mentor: [],
        mentee: [],
      },
      entryCriteriaRules: "",
      registrationEndDateMentee: "",
      registrationEndDateMentor: "",
      matchingEndDate: "",
      manager: "",
      coordinators: [],
      reportsEscalationsTo: [],
      registrationApprovalBy: "",
      emailTemplateMentorInvitation: "",
      emailTemplateMenteeInvitation: "",
    });
    setSkillInput("");
    setMentorAreaInput("");
    setMenteeAreaInput("");
    setAgreementFile(null);
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.category) newErrors.category = "Category is required";
    if (!formData.name || formData.name.trim().length === 0) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 75) {
      newErrors.name = "Name cannot exceed 75 characters";
    }
    if (
      !formData.shortDescription ||
      formData.shortDescription.trim().length === 0
    ) {
      newErrors.shortDescription = "Short description is required";
    } else if (formData.shortDescription.length > 250) {
      newErrors.shortDescription = "Short description cannot exceed 250 characters";
    }
    if (!formData.programDuration?.startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!formData.programDuration?.endDate) {
      newErrors.endDate = "End date is required";
    }
    if (
      formData.programDuration?.startDate &&
      formData.programDuration?.endDate &&
      new Date(formData.programDuration.endDate) <
        new Date(formData.programDuration.startDate)
    ) {
      newErrors.endDate = "End date must be after start date";
    }
    if (!formData.registrationEndDateMentee) {
      newErrors.registrationEndDateMentee = "Mentee registration end date is required";
    }
    if (!formData.registrationEndDateMentor) {
      newErrors.registrationEndDateMentor = "Mentor registration end date is required";
    }
    if (!formData.matchingEndDate) {
      newErrors.matchingEndDate = "Matching end date is required";
    }
    if (
      formData.registrationEndDateMentee &&
      formData.matchingEndDate &&
      new Date(formData.matchingEndDate) <= new Date(formData.registrationEndDateMentee)
    ) {
      newErrors.matchingEndDate =
        "Matching end date must be after mentee registration end date";
    }
    if (
      formData.registrationEndDateMentor &&
      formData.matchingEndDate &&
      new Date(formData.matchingEndDate) <= new Date(formData.registrationEndDateMentor)
    ) {
      newErrors.matchingEndDate =
        "Matching end date must be after mentor registration end date";
    }
    if (!formData.manager) newErrors.manager = "Manager is required";
    if (!formData.registrationApprovalBy) {
      newErrors.registrationApprovalBy = "Registration approval by is required";
    }
    if (
      formData.areasOfMentoring?.mentor.length === 0 &&
      formData.areasOfMentoring?.mentee.length === 0
    ) {
      newErrors.areasOfMentoring =
        "At least one area of mentoring is required for mentor or mentee";
    }
    if (formData.entryCriteriaRules && formData.entryCriteriaRules.length > 2000) {
      newErrors.entryCriteriaRules = "Entry criteria rules cannot exceed 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publish: boolean = false) => {
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const submitData: CreateProgramData = {
        ...formData,
        skillsRequired: formData.skillsRequired || [],
        areasOfMentoring: {
          mentor: formData.areasOfMentoring?.mentor || [],
          mentee: formData.areasOfMentoring?.mentee || [],
        },
        mentoringAgreementForm: agreementFile || undefined,
      } as CreateProgramData;

      if (isEditMode) {
        const response = await mentoringProgramAPI.updateProgram(
          program._id,
          submitData
        );
        if (response.success) {
          toast({
            title: "Success",
            description: "Program updated successfully",
          });
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          throw new Error(response.message || "Failed to update program");
        }
      } else {
        const response = await mentoringProgramAPI.createProgram(submitData);
        if (response.success) {
          const program = response.data as any;
          toast({
            title: "Success",
            description: publish
              ? "Program created and published successfully"
              : "Program created successfully",
          });
          if (publish && program?._id) {
            await mentoringProgramAPI.publishProgram(program._id);
          }
          onOpenChange(false);
          if (onSuccess) onSuccess();
        } else {
          throw new Error(response.message || "Failed to create program");
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Operation failed",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !formData.skillsRequired?.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skillsRequired: [...(formData.skillsRequired || []), skillInput.trim()],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({
      ...formData,
      skillsRequired: formData.skillsRequired?.filter((s) => s !== skill) || [],
    });
  };

  const addMentorArea = () => {
    if (
      mentorAreaInput.trim() &&
      !formData.areasOfMentoring?.mentor.includes(mentorAreaInput.trim())
    ) {
      setFormData({
        ...formData,
        areasOfMentoring: {
          ...formData.areasOfMentoring,
          mentor: [
            ...(formData.areasOfMentoring?.mentor || []),
            mentorAreaInput.trim(),
          ],
        },
      });
      setMentorAreaInput("");
    }
  };

  const removeMentorArea = (area: string) => {
    setFormData({
      ...formData,
      areasOfMentoring: {
        ...formData.areasOfMentoring!,
        mentor: formData.areasOfMentoring?.mentor.filter((a) => a !== area) || [],
      },
    });
  };

  const addMenteeArea = () => {
    if (
      menteeAreaInput.trim() &&
      !formData.areasOfMentoring?.mentee.includes(menteeAreaInput.trim())
    ) {
      setFormData({
        ...formData,
        areasOfMentoring: {
          ...formData.areasOfMentoring,
          mentee: [
            ...(formData.areasOfMentoring?.mentee || []),
            menteeAreaInput.trim(),
          ],
        },
      });
      setMenteeAreaInput("");
    }
  };

  const removeMenteeArea = (area: string) => {
    setFormData({
      ...formData,
      areasOfMentoring: {
        ...formData.areasOfMentoring!,
        mentee: formData.areasOfMentoring?.mentee.filter((a) => a !== area) || [],
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Program" : "Create New Mentoring Program"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the mentoring program details"
              : "Fill in all required fields to create a new mentoring program"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Category */}
          <div>
            <Label>
              Category <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              placeholder="Enter program category"
              className={errors.category ? "border-red-500" : ""}
            />
            {errors.category && (
              <p className="text-sm text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          {/* Name */}
          <div>
            <Label>
              Program Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter program name (max 75 characters)"
              maxLength={75}
              className={errors.name ? "border-red-500" : ""}
            />
            <div className="text-xs text-gray-500 mt-1">
              {getCharactersRemaining(formData.name, 75)} characters remaining
            </div>
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Short Description */}
          <div>
            <Label>
              Short Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              placeholder="Enter short description (max 250 characters)"
              maxLength={250}
              rows={3}
              className={errors.shortDescription ? "border-red-500" : ""}
            />
            <div className="text-xs text-gray-500 mt-1">
              {getCharactersRemaining(formData.shortDescription, 250)} characters
              remaining
            </div>
            {errors.shortDescription && (
              <p className="text-sm text-red-500 mt-1">{errors.shortDescription}</p>
            )}
          </div>

          {/* Long Description */}
          <div>
            <Label>Long Description (Optional)</Label>
            <Textarea
              value={formData.longDescription}
              onChange={(e) =>
                setFormData({ ...formData, longDescription: e.target.value })
              }
              placeholder="Enter detailed description"
              rows={5}
            />
          </div>

          {/* Program Schedule */}
          <div>
            <Label>
              Program Schedule <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.programSchedule}
              onValueChange={(value: "One-time" | "Recurring") =>
                setFormData({ ...formData, programSchedule: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="One-time">One-time</SelectItem>
                <SelectItem value="Recurring">Recurring</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Program Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Start Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.programDuration?.startDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    programDuration: {
                      ...formData.programDuration!,
                      startDate: e.target.value,
                    },
                  })
                }
                className={errors.startDate ? "border-red-500" : ""}
              />
              {errors.startDate && (
                <p className="text-sm text-red-500 mt-1">{errors.startDate}</p>
              )}
            </div>
            <div>
              <Label>
                End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.programDuration?.endDate}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    programDuration: {
                      ...formData.programDuration!,
                      endDate: e.target.value,
                    },
                  })
                }
                className={errors.endDate ? "border-red-500" : ""}
              />
              {errors.endDate && (
                <p className="text-sm text-red-500 mt-1">{errors.endDate}</p>
              )}
            </div>
          </div>

          {/* Skills Required */}
          <div>
            <Label>Skills Required</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Enter skill and press Enter"
              />
              <Button type="button" onClick={addSkill} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.skillsRequired && formData.skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.skillsRequired.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Areas of Mentoring - Mentor */}
          <div>
            <Label>
              Areas of Mentoring (Mentor) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={mentorAreaInput}
                onChange={(e) => setMentorAreaInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMentorArea();
                  }
                }}
                placeholder="Enter area and press Enter"
              />
              <Button type="button" onClick={addMentorArea} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.areasOfMentoring?.mentor &&
              formData.areasOfMentoring.mentor.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.areasOfMentoring.mentor.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => removeMentorArea(area)}
                        className="hover:text-green-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Areas of Mentoring - Mentee */}
          <div>
            <Label>
              Areas of Mentoring (Mentee) <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                value={menteeAreaInput}
                onChange={(e) => setMenteeAreaInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMenteeArea();
                  }
                }}
                placeholder="Enter area and press Enter"
              />
              <Button type="button" onClick={addMenteeArea} variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.areasOfMentoring?.mentee &&
              formData.areasOfMentoring.mentee.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.areasOfMentoring.mentee.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                    >
                      {area}
                      <button
                        type="button"
                        onClick={() => removeMenteeArea(area)}
                        className="hover:text-purple-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
          </div>

          {/* Entry Criteria Rules */}
          <div>
            <Label htmlFor="entryCriteriaRules">
              Entry Criteria Rules <span className="text-gray-500 text-sm font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="entryCriteriaRules"
              value={formData.entryCriteriaRules || ""}
              onChange={(e) => {
                const value = e.target.value;
                // Limit to 2000 characters
                if (value.length <= 2000) {
                  setFormData({ ...formData, entryCriteriaRules: value });
                }
              }}
              placeholder="Enter entry criteria rules that mentors and mentees must meet to participate in this program. For example:&#10;&#10;1. Must be a SIT alumni or current student&#10;2. Minimum 2 years of work experience (for mentors)&#10;3. Must commit to at least 6 months of mentoring&#10;4. Must attend orientation session"
              rows={5}
              className={errors.entryCriteriaRules ? "border-red-500" : ""}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                Define the criteria that participants must meet to be eligible for this program.
                You can use bullet points or numbered lists.
              </p>
              <p className={`text-xs ${
                (formData.entryCriteriaRules?.length || 0) > 1800 
                  ? "text-orange-500" 
                  : "text-gray-400"
              }`}>
                {(formData.entryCriteriaRules?.length || 0)} / 2000 characters
              </p>
            </div>
            {errors.entryCriteriaRules && (
              <p className="text-sm text-red-500 mt-1">{errors.entryCriteriaRules}</p>
            )}
          </div>

          {/* Registration Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Mentee Registration End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.registrationEndDateMentee}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationEndDateMentee: e.target.value,
                  })
                }
                className={errors.registrationEndDateMentee ? "border-red-500" : ""}
              />
              {errors.registrationEndDateMentee && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.registrationEndDateMentee}
                </p>
              )}
            </div>
            <div>
              <Label>
                Mentor Registration End Date <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={formData.registrationEndDateMentor}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    registrationEndDateMentor: e.target.value,
                  })
                }
                className={errors.registrationEndDateMentor ? "border-red-500" : ""}
              />
              {errors.registrationEndDateMentor && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.registrationEndDateMentor}
                </p>
              )}
            </div>
          </div>

          {/* Matching End Date */}
          <div>
            <Label>
              Matching End Date <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={formData.matchingEndDate}
              onChange={(e) =>
                setFormData({ ...formData, matchingEndDate: e.target.value })
              }
              className={errors.matchingEndDate ? "border-red-500" : ""}
            />
            {errors.matchingEndDate && (
              <p className="text-sm text-red-500 mt-1">{errors.matchingEndDate}</p>
            )}
          </div>

          {/* Mentoring Agreement Form */}
          <div>
            <Label>Mentoring Agreement Form</Label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setAgreementFile(e.target.files?.[0] || null)
                }
                className="cursor-pointer"
              />
              {agreementFile && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {agreementFile.name}
                </span>
              )}
            </div>
          </div>

          {/* Manager */}
          <UserSelect
            selectedUserId={formData.manager || ""}
            onUserChange={(userId) => setFormData({ ...formData, manager: userId })}
            label="Manager"
            required
            roles={["staff", "hod"]}
          />
          {errors.manager && (
            <p className="text-sm text-red-500 mt-1">{errors.manager}</p>
          )}

          {/* Coordinators */}
          <UserMultiSelect
            selectedUsers={formData.coordinators || []}
            onUsersChange={(userIds) =>
              setFormData({ ...formData, coordinators: userIds })
            }
            label="Coordinators"
            roles={["staff", "hod"]}
          />

          {/* Reports/Escalations To */}
          <UserMultiSelect
            selectedUsers={formData.reportsEscalationsTo || []}
            onUsersChange={(userIds) =>
              setFormData({ ...formData, reportsEscalationsTo: userIds })
            }
            label="Reports/Escalations To"
            roles={["staff", "hod"]}
          />

          {/* Registration Approval By */}
          <UserSelect
            selectedUserId={formData.registrationApprovalBy || ""}
            onUserChange={(userId) =>
              setFormData({ ...formData, registrationApprovalBy: userId })
            }
            label="Registration Approval By"
            required
            roles={["staff", "hod"]}
          />
          {errors.registrationApprovalBy && (
            <p className="text-sm text-red-500 mt-1">
              {errors.registrationApprovalBy}
            </p>
          )}

          {/* Email Templates - TODO: Implement template selection */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!isEditMode && (
            <Button
              variant="secondary"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save as Draft"}
            </Button>
          )}
          <Button onClick={() => handleSubmit(true)} disabled={loading}>
            {loading
              ? "Saving..."
              : isEditMode
              ? "Update Program"
              : "Create & Publish"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

