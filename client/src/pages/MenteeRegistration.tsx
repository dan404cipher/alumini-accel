import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { X, AlertCircle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { MenteeRegistrationForm } from "@/components/mentorship-system/MenteeRegistrationForm";

export const MenteeRegistration: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const token = searchParams.get("token");
  const programId = searchParams.get("programId");
  const editId = searchParams.get("editId") || "";
  const isEditMode = !!editId;
  const isStaff = user?.role === "staff" || user?.role === "super_admin" || user?.role === "college_admin" || user?.role === "hod";

  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showStudentIDValidation, setShowStudentIDValidation] = useState(true);
  const [validatedStudentId, setValidatedStudentId] = useState<string>("");
  const [studentIdProgramId, setStudentIdProgramId] = useState<string>("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Validate token and program on mount
  useEffect(() => {
    const validateAccess = async () => {
      // If editId is present and user is staff, skip token validation
      if (isEditMode && isStaff && editId) {
        try {
          // Fetch program and registration data
          const programResponse = await api.get(`/mentoring-programs/${programId}`);
          if (programResponse.data.success) {
            setProgram(programResponse.data.data.program);
            setIsValid(true);
            setShowStudentIDValidation(false);
          } else {
            setError("Program not found");
          }
        } catch (error: any) {
          console.error("Error fetching program:", error);
          setError(error.response?.data?.message || "Failed to load program");
        } finally {
          setLoading(false);
        }
        return;
      }

      // If user is authenticated (alumni) and has programId but no token, allow direct access
      if (user && programId && !token) {
        try {
          const programResponse = await api.get(`/mentoring-programs/${programId}`);
          if (programResponse.data.success) {
            const program = programResponse.data.data.program;
            setProgram(program);
            
            // Check if registration is still open
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const endDate = new Date(program.registrationEndDateMentee);
            const endDateMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            
            if (endDateMidnight < today) {
              setError("Program registration has expired.");
              setIsValid(false);
            } else if (program.status !== "published") {
              setError("This program is not currently accepting registrations.");
              setIsValid(false);
            } else {
              setIsValid(true);
              setShowStudentIDValidation(false); // Skip student ID validation for authenticated users
            }
          } else {
            setError("Program not found");
            setIsValid(false);
          }
        } catch (error: any) {
          console.error("Error fetching program:", error);
          setError(error.response?.data?.message || "Failed to load program");
          setIsValid(false);
        } finally {
          setLoading(false);
        }
        return;
      }

      // For public/unauthenticated access, token is required
      if (!token || !programId) {
        setError("Invalid registration link. Token and Program ID are required.");
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(
          `/mentee-registrations/token/${token}?programId=${programId}`
        );

        if (response.data.success) {
          setProgram(response.data.data.program);
          setIsValid(response.data.data.isOpen);
          if (!response.data.data.isOpen) {
            setError(
              response.data.message ||
                "Program registration has expired or is not open."
            );
          }
        } else {
          setError(response.data.message || "Invalid registration link.");
        }
      } catch (error: any) {
        console.error("Validation error:", error);
        setError(
          error.response?.data?.message ||
            "Failed to validate registration link. Please check the link and try again."
        );
      } finally {
        setLoading(false);
      }
    };

    validateAccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, programId, editId]);

  const handleStudentIDValidation = async (studentId: string) => {
    if (!programId) {
      toast({
        title: "Error",
        description: "Program ID is missing",
        variant: "destructive",
      });
      return;
    }

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
        setStudentIdProgramId(programId);
        setIsValid(true); // Ensure isValid is true after successful validation
        setError(null); // Clear any previous errors
        setShowStudentIDValidation(false);
        console.log("Student ID validated successfully, showing form...");
        toast({
          title: "Success",
          description: "Student ID validated successfully",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: response.data.message || "Invalid student ID",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Student ID validation error:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to validate student ID",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating registration link...</p>
        </div>
      </div>
    );
  }

  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Closed
            </h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showStudentIDValidation) {
    return (
      <StudentIDValidationStep
        onValidate={handleStudentIDValidation}
        programName={program?.name || ""}
      />
    );
  }

  // Show error page only if there's an error and we're not showing student ID validation
  if (error || !isValid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Registration Closed
            </h2>
            <p className="text-gray-600 mb-6">{error || "Registration is not available"}</p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  {isEditMode && isStaff ? "Edit Registration on Behalf" : "Mentee Registration"}
                </h1>
                <p className="text-blue-100">
                  {program?.name || "Mentoring Program"}
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="text-white hover:text-blue-200 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6">
            {registrationSuccess ? (
              <div className="text-center py-12">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Registration Submitted Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your mentee registration has been submitted successfully. You will receive a confirmation email shortly.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setRegistrationSuccess(false);
                      window.location.reload();
                    }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                  >
                    Submit Another Registration
                  </button>
                  <div>
                    <button
                      onClick={() => navigate("/")}
                      className="text-blue-600 hover:text-blue-700 underline"
                    >
                      Return to Home
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              program && programId ? (
                <MenteeRegistrationForm
                  programId={programId}
                  token={token || ""} // Token is optional for authenticated users
                  validatedStudentId={validatedStudentId}
                  editId={isEditMode ? editId : undefined}
                  onSuccess={() => {
                    setRegistrationSuccess(true);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600">Loading form...</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Student ID Validation Step Component
interface StudentIDValidationStepProps {
  onValidate: (studentId: string) => void;
  programName: string;
}

const StudentIDValidationStep: React.FC<StudentIDValidationStepProps> = ({
  onValidate,
  programName,
}) => {
  const [studentId, setStudentId] = useState("");
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Student ID Validation
          </h2>
          <p className="text-gray-600">
            Please enter your student ID to continue with registration
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

export default MenteeRegistration;

