import React, { useState, useEffect } from "react";
import { Search, User, Building, Award, Check, X, ArrowUp, ArrowDown, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";

interface Mentor {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  preferredName: string;
  areasOfMentoring: string[];
  personalEmail: string;
  sitEmail: string;
  classOf: number;
  currentCompany?: string;
  currentPosition?: string;
  industry?: string;
}

interface SelectedMentor {
  mentor: Mentor;
  order: number; // 1, 2, or 3
}

export const MenteeMentorSelection: React.FC = () => {
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId") || "";
  const token = searchParams.get("token") || "";
  const validatedStudentIdFromUrl = searchParams.get("validatedStudentId") || "";
  const { toast } = useToast();
  
  // Student ID validation state
  const [isValidated, setIsValidated] = useState(false);
  const [validatedStudentId, setValidatedStudentId] = useState("");
  const [showValidation, setShowValidation] = useState(true);
  const [validating, setValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [programName, setProgramName] = useState("");
  
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [selectedMentors, setSelectedMentors] = useState<SelectedMentor[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");

  // Check if already validated from URL params
  useEffect(() => {
    if (validatedStudentIdFromUrl) {
      setValidatedStudentId(validatedStudentIdFromUrl);
      setIsValidated(true);
      setShowValidation(false);
    }
  }, [validatedStudentIdFromUrl]);

  // Fetch program name for validation step
  useEffect(() => {
    if (programId && !programName) {
      fetchProgramName();
    }
  }, [programId]);

  // Fetch mentors only after validation
  useEffect(() => {
    if (programId && isValidated && !showValidation) {
      fetchApprovedMentors();
    }
  }, [programId, isValidated, showValidation]);

  const fetchProgramName = async () => {
    try {
      const response = await api.get(`/mentoring-programs/${programId}`);
      if (response.data.success) {
        setProgramName(response.data.data.program?.name || "");
      }
    } catch (error) {
      // Silently fail - program name is optional
    }
  };

  const fetchApprovedMentors = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/mentor-registrations/program/${programId}`, {
        params: { status: "approved" },
      });

      if (response.data.success) {
        const registrations = response.data.data.registrations || [];
        // Fetch mentor user details and profiles
        const mentorsWithDetails = await Promise.all(
          registrations.map(async (reg: any) => {
            try {
              const userResponse = await api.get(`/users/${reg.userId}`);
              const user = userResponse.data.success ? userResponse.data.data.user : null;
              
              // Try to get alumni profile
              let profile = null;
              if (user) {
                try {
                  const profileResponse = await api.get(`/alumni/profile/${user._id}`);
                  profile = profileResponse.data.success ? profileResponse.data.data : null;
                } catch {
                  // Profile may not exist
                }
              }

              return {
                _id: reg._id,
                userId: user || reg.userId,
                preferredName: reg.preferredName,
                areasOfMentoring: reg.areasOfMentoring || [],
                personalEmail: reg.personalEmail,
                sitEmail: reg.sitEmail,
                classOf: reg.classOf,
                currentCompany: profile?.currentCompany || user?.currentCompany,
                currentPosition: profile?.currentPosition || user?.currentPosition,
                industry: profile?.industry,
              };
            } catch {
              return null;
            }
          })
        );

        setMentors(mentorsWithDetails.filter(Boolean));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch mentors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMentor = (mentor: Mentor, order: number) => {
    const newSelected = [...selectedMentors];

    // Remove mentor if already selected
    const existingIndex = newSelected.findIndex((s) => s.mentor._id === mentor._id);
    if (existingIndex !== -1) {
      newSelected.splice(existingIndex, 1);
    }

    // Remove any mentor already at this order
    const orderIndex = newSelected.findIndex((s) => s.order === order);
    if (orderIndex !== -1) {
      newSelected.splice(orderIndex, 1);
    }

    // Add new selection
    newSelected.push({ mentor, order });
    newSelected.sort((a, b) => a.order - b.order);

    setSelectedMentors(newSelected);
  };

  const handleRemoveMentor = (mentorId: string) => {
    setSelectedMentors(selectedMentors.filter((s) => s.mentor._id !== mentorId));
  };

  const handleMoveOrder = (mentorId: string, direction: "up" | "down") => {
    const newSelected = [...selectedMentors];
    const index = newSelected.findIndex((s) => s.mentor._id === mentorId);
    
    if (index === -1) return;

    const currentOrder = newSelected[index].order;
    let newOrder: number;

    if (direction === "up" && currentOrder > 1) {
      newOrder = currentOrder - 1;
    } else if (direction === "down" && currentOrder < 3) {
      newOrder = currentOrder + 1;
    } else {
      return;
    }

    // Swap with mentor at new order if exists
    const swapIndex = newSelected.findIndex((s) => s.order === newOrder);
    if (swapIndex !== -1) {
      newSelected[swapIndex].order = currentOrder;
    }

    newSelected[index].order = newOrder;
    newSelected.sort((a, b) => a.order - b.order);
    setSelectedMentors(newSelected);
  };

  const handleStudentIDValidation = async (studentId: string) => {
    if (!programId) {
      toast({
        title: "Error",
        description: "Program ID is missing",
        variant: "destructive",
      });
      return;
    }

    if (!token) {
      toast({
        title: "Error",
        description: "Registration token is missing",
        variant: "destructive",
      });
      return;
    }

    setValidating(true);
    setValidationError("");

    try {
      const response = await api.post(
        `/mentee-registrations/token/${token}/validate-student`,
        {
          studentId,
          programId,
        }
      );

      if (response.data.success) {
        setValidatedStudentId(response.data.data.studentId);
        setIsValidated(true);
        setShowValidation(false);
        toast({
          title: "Success",
          description: "Student ID validated successfully",
        });
      } else {
        setValidationError(response.data.message || "Invalid student ID");
        toast({
          title: "Validation Failed",
          description: response.data.message || "Invalid student ID",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to validate student ID";
      setValidationError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setValidating(false);
    }
  };

  const handleSubmit = async () => {
    if (selectedMentors.length !== 3) {
      toast({
        title: "Error",
        description: "Please select exactly 3 mentors",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const preferredMentorIds = selectedMentors
        .sort((a, b) => a.order - b.order)
        .map((s) => s.mentor.userId._id);
      
      const response = await api.post(`/matching/${programId}/submit-preferences`, {
        preferredMentorIds,
        validatedStudentId: validatedStudentId || validatedStudentIdFromUrl,
        token,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Your mentor preferences have been submitted successfully",
        });
        // Redirect or show success message
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to submit preferences",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      !searchTerm ||
      mentor.preferredName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.userId.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.userId.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mentor.areasOfMentoring.some((area) =>
        area.toLowerCase().includes(searchTerm.toLowerCase())
      );

    const matchesIndustry =
      !filterIndustry ||
      (mentor.industry && mentor.industry.toLowerCase().includes(filterIndustry.toLowerCase())) ||
      (mentor.currentCompany &&
        mentor.currentCompany.toLowerCase().includes(filterIndustry.toLowerCase()));

    return matchesSearch && matchesIndustry;
  });

  const isSelected = (mentorId: string) => {
    return selectedMentors.some((s) => s.mentor._id === mentorId);
  };

  const getSelectionOrder = (mentorId: string) => {
    const selected = selectedMentors.find((s) => s.mentor._id === mentorId);
    return selected ? selected.order : null;
  };

  // Show validation step if not validated
  if (showValidation && !isValidated) {
    return (
      <StudentIDValidationStep
        onValidate={handleStudentIDValidation}
        programName={programName}
        error={validationError}
        validating={validating}
      />
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Select Your Preferred Mentors
        </h1>
        <p className="text-gray-600">
          Please select 3 mentors in order of preference (1st choice, 2nd choice, 3rd choice)
        </p>
      </div>

      {/* Selected Mentors Preview */}
      {selectedMentors.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Your Selected Mentors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((order) => {
              const selected = selectedMentors.find((s) => s.order === order);
              return (
                <div
                  key={order}
                  className={`border-2 rounded-lg p-4 ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50 border-dashed"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-gray-700">
                      {order === 1 ? "1st" : order === 2 ? "2nd" : "3rd"} Choice
                    </span>
                    {selected && (
                      <button
                        onClick={() => handleRemoveMentor(selected.mentor._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {selected ? (
                    <div>
                      <div className="font-medium text-gray-900">
                        {selected.mentor.preferredName ||
                          `${selected.mentor.userId.firstName} ${selected.mentor.userId.lastName}`}
                      </div>
                      {selected.mentor.currentCompany && (
                        <div className="text-sm text-gray-600">{selected.mentor.currentCompany}</div>
                      )}
                      <div className="flex space-x-2 mt-2">
                        {order > 1 && (
                          <button
                            onClick={() => handleMoveOrder(selected.mentor._id, "up")}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <ArrowUp className="w-3 h-3 inline" />
                          </button>
                        )}
                        {order < 3 && (
                          <button
                            onClick={() => handleMoveOrder(selected.mentor._id, "down")}
                            className="text-xs px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          >
                            <ArrowDown className="w-3 h-3 inline" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No mentor selected</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or expertise..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
            <input
              type="text"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
              placeholder="Filter by industry..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Mentors List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.map((mentor) => {
            const selectedOrder = getSelectionOrder(mentor._id);
            return (
              <div
                key={mentor._id}
                className={`bg-white rounded-lg shadow border-2 p-4 ${
                  isSelected(mentor._id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {mentor.preferredName ||
                        `${mentor.userId.firstName} ${mentor.userId.lastName}`}
                    </h3>
                    {selectedOrder && (
                      <span className="inline-block mt-1 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                        {selectedOrder === 1 ? "1st" : selectedOrder === 2 ? "2nd" : "3rd"} Choice
                      </span>
                    )}
                  </div>
                  {isSelected(mentor._id) ? (
                    <Check className="w-5 h-5 text-blue-600" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>

                <div className="space-y-2 text-sm">
                  {mentor.currentCompany && (
                    <div className="flex items-center text-gray-600">
                      <Building className="w-4 h-4 mr-2" />
                      {mentor.currentCompany}
                    </div>
                  )}
                  {mentor.currentPosition && (
                    <div className="text-gray-600">{mentor.currentPosition}</div>
                  )}
                  {mentor.industry && (
                    <div className="text-gray-600">Industry: {mentor.industry}</div>
                  )}
                  <div className="text-gray-600">Class of {mentor.classOf}</div>
                  {mentor.areasOfMentoring && mentor.areasOfMentoring.length > 0 && (
                    <div>
                      <div className="font-medium text-gray-700 mb-1">Areas of Expertise:</div>
                      <div className="flex flex-wrap gap-1">
                        {mentor.areasOfMentoring.slice(0, 3).map((area, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {area}
                          </span>
                        ))}
                        {mentor.areasOfMentoring.length > 3 && (
                          <span className="px-2 py-1 text-gray-500 text-xs">
                            +{mentor.areasOfMentoring.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Selection Buttons */}
                <div className="mt-4 flex space-x-2">
                  {!isSelected(mentor._id) ? (
                    <>
                      {selectedMentors.length < 3 && (
                        <>
                          <button
                            onClick={() =>
                              handleSelectMentor(
                                mentor,
                                selectedMentors.length === 0
                                  ? 1
                                  : selectedMentors.length === 1
                                  ? 2
                                  : 3
                              )
                            }
                            className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Select
                          </button>
                          {selectedMentors.length > 0 && (
                            <select
                              onChange={(e) =>
                                handleSelectMentor(mentor, parseInt(e.target.value))
                              }
                              className="px-2 py-2 border border-gray-300 rounded text-sm"
                              defaultValue=""
                            >
                              <option value="">Choose order...</option>
                              {[1, 2, 3]
                                .filter(
                                  (order) =>
                                    !selectedMentors.some((s) => s.order === order)
                                )
                                .map((order) => (
                                  <option key={order} value={order}>
                                    {order === 1 ? "1st" : order === 2 ? "2nd" : "3rd"} Choice
                                  </option>
                                ))}
                            </select>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleRemoveMentor(mentor._id)}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Button */}
      {selectedMentors.length === 3 && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium text-lg"
          >
            {submitting ? "Submitting..." : "Submit Preferences"}
          </button>
        </div>
      )}
    </div>
  );
};

// Student ID Validation Step Component
interface StudentIDValidationStepProps {
  onValidate: (studentId: string) => void;
  programName: string;
  error?: string;
  validating?: boolean;
}

const StudentIDValidationStep: React.FC<StudentIDValidationStepProps> = ({
  onValidate,
  programName,
  error: externalError,
  validating: externalValidating,
}) => {
  const [studentId, setStudentId] = useState("");
  const [validating, setValidating] = useState(externalValidating || false);
  const [error, setError] = useState(externalError || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId.trim()) {
      setError("Student ID is required");
      return;
    }

    if (studentId.length > 20) {
      setError("Student ID cannot exceed 20 characters");
      return;
    }

    setValidating(true);
    setError("");

    try {
      await onValidate(studentId.trim());
    } catch (err) {
      setError("Failed to validate student ID. Please try again.");
    } finally {
      setValidating(false);
    }
  };

  // Update error when external error changes
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  // Update validating when external validating changes
  useEffect(() => {
    if (externalValidating !== undefined) {
      setValidating(externalValidating);
    }
  }, [externalValidating]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Student ID Validation
          </h2>
          <p className="text-gray-600">
            Please enter your student ID to continue with mentor selection
            {programName && (
              <>
                {" "}
                for <strong>{programName}</strong>
              </>
            )}
            .
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={studentId}
              onChange={(e) => {
                setStudentId(e.target.value);
                setError("");
              }}
              placeholder="Enter your student ID"
              maxLength={20}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                error ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              required
              disabled={validating}
            />
            {error && (
              <p className="text-red-600 text-sm mt-1">{error}</p>
            )}
            <p className="text-gray-500 text-xs mt-1">
              {studentId.length}/20 characters
            </p>
          </div>

          <button
            type="submit"
            disabled={validating || !studentId.trim()}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {validating ? "Validating..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

