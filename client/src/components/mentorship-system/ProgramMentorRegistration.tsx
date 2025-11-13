import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Upload, Calendar, Mail, Phone, FileText, User, Info, LogOut } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ProgramMentorRegistrationProps {
  programId?: string;
  onClose?: () => void;
  onSuccess?: () => void;
}

interface RegistrationFormData {
  programId: string;
  title: "Mr" | "Mrs" | "Ms" | "Dr" | "";
  firstName: string;
  lastName: string;
  preferredName: string;
  mobileNumber: string;
  dateOfBirth: string;
  personalEmail: string;
  sitEmail?: string; // Optional - removed from form
  classOf: string;
  sitStudentId?: string; // Optional - removed from form
  sitMatricNumber: string;
  areasOfMentoring: string[];
  fbPreference: string;
  dietaryRestrictions: string;
  optionToReceiveFB: boolean;
  preferredMailingAddress: string;
  eventSlotPreference: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  } | null;
  eventMeetupPreference: string;
  pdpaConsent: boolean;
  recaptchaToken: string;
}

const TITLE_OPTIONS = [
  { value: "Mr", label: "Mr" },
  { value: "Mrs", label: "Mrs" },
  { value: "Ms", label: "Ms" },
  { value: "Dr", label: "Dr" },
];

const CLASS_OF_YEARS = Array.from(
  { length: new Date().getFullYear() - 1950 + 1 },
  (_, i) => new Date().getFullYear() - i
);

export const ProgramMentorRegistration: React.FC<
  ProgramMentorRegistrationProps
> = ({ programId: propProgramId, onClose, onSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, user } = useAuth();

  const programIdFromUrl = searchParams.get("programId") || propProgramId || "";
  const editId = searchParams.get("editId") || "";
  const isEditMode = !!editId;
  const isStaff = user?.role === "staff" || user?.role === "super_admin" || user?.role === "college_admin" || user?.role === "hod";

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [registrationStatus, setRegistrationStatus] = useState<any>(null);
  const [prePopulatedData, setPrePopulatedData] = useState<any>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [newArea, setNewArea] = useState("");
  const [editingRegistration, setEditingRegistration] = useState<any>(null);

  const [formData, setFormData] = useState<RegistrationFormData>({
    programId: programIdFromUrl,
    title: "",
    firstName: "",
    lastName: "",
    preferredName: "",
    mobileNumber: "",
    dateOfBirth: "",
    personalEmail: "",
    sitEmail: "",
    classOf: "",
    sitStudentId: "",
    sitMatricNumber: "",
    areasOfMentoring: [],
    fbPreference: "",
    dietaryRestrictions: "",
    optionToReceiveFB: false,
    preferredMailingAddress: "",
    eventSlotPreference: null,
    eventMeetupPreference: "",
    pdpaConsent: false,
    recaptchaToken: "",
  });

  // Check registration status on mount
  useEffect(() => {
    const checkRegistration = async () => {
      if (!programIdFromUrl) {
        setChecking(false);
        toast({
          title: "Error",
          description: "Program ID is required",
          variant: "destructive",
        });
        return;
      }

      // If editId is present and user is staff, fetch registration data directly
      if (isEditMode && isStaff && editId) {
        try {
          const registrationResponse = await api.get(
            `/mentor-registrations/${editId}`
          );
          if (registrationResponse.data.success) {
            const registration = registrationResponse.data.data.registration;
            const programResponse = await api.get(
              `/mentoring-programs/${programIdFromUrl}`
            );
            if (programResponse.data.success) {
              setProgram(programResponse.data.data.program);
            }
            
            // Store registration for later use
            setEditingRegistration(registration);
            
            // Pre-fill form with registration data
            setFormData((prev) => ({
              ...prev,
              title: registration.title || "",
              firstName: registration.firstName || "",
              lastName: registration.lastName || "",
              preferredName: registration.preferredName || "",
              mobileNumber: registration.mobileNumber || "",
              dateOfBirth: registration.dateOfBirth
                ? new Date(registration.dateOfBirth).toISOString().split("T")[0]
                : "",
              personalEmail: registration.personalEmail || "",
              sitEmail: registration.sitEmail || "",
              classOf: registration.classOf?.toString() || "",
              sitStudentId: registration.sitStudentId || "",
              sitMatricNumber: registration.sitMatricNumber || "",
              areasOfMentoring: registration.areasOfMentoring || [],
              fbPreference: registration.fbPreference || "",
              dietaryRestrictions: registration.dietaryRestrictions || "",
              optionToReceiveFB: registration.optionToReceiveFB || false,
              preferredMailingAddress: registration.preferredMailingAddress || registration.personalEmail || "",
              eventSlotPreference: registration.eventSlotPreference || null,
              eventMeetupPreference: registration.eventMeetupPreference || "",
              pdpaConsent: true,
            }));
            
            setRegistrationStatus({ isOpen: true, isEditMode: true });
            setChecking(false);
            return;
          }
        } catch (error: any) {
          console.error("Error fetching registration:", error);
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to load registration data",
            variant: "destructive",
          });
          setChecking(false);
          return;
        }
      }

      try {
        // Check registration closure date (skip if staff editing)
        if (!isEditMode || !isStaff) {
          const statusResponse = await api.get(
            `/mentor-registrations/check-closure/${programIdFromUrl}`
          );

          if (statusResponse.data.success) {
          const { isOpen, programStatus, existingRegistration, registrationEndDate } =
            statusResponse.data.data;

          // If not open, determine the reason
          if (!isOpen) {
            let message = "Program registration has expired";
            
            // Check if it's a status issue or date issue
            if (programStatus !== "published") {
              message = "This program is not currently accepting registrations";
            } else if (registrationEndDate) {
              const endDate = new Date(registrationEndDate);
              const today = new Date();
              const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const endDateMidnight = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
              
              if (endDateMidnight < todayMidnight) {
                message = "Program registration has expired";
              } else {
                message = "This program is not currently accepting registrations";
              }
            }
            
            setRegistrationStatus({
              isOpen: false,
              message: message,
            });
            setChecking(false);
            return;
          }

          if (existingRegistration) {
            // Get program details
            try {
              const programResponse = await api.get(
                `/mentoring-programs/${programIdFromUrl}`
              );
              if (programResponse.data.success) {
                setProgram(programResponse.data.data.program);
              }
            } catch (err) {
              console.error("Error fetching program:", err);
            }

            // Pre-populate form with existing registration data
            setFormData((prev) => ({
              ...prev,
              title: existingRegistration.title || "",
              firstName: existingRegistration.firstName || "",
              lastName: existingRegistration.lastName || "",
              preferredName: existingRegistration.preferredName || "",
              mobileNumber: existingRegistration.mobileNumber || "",
              dateOfBirth: existingRegistration.dateOfBirth
                ? new Date(existingRegistration.dateOfBirth).toISOString().split("T")[0]
                : "",
              personalEmail: existingRegistration.personalEmail || "",
              sitEmail: existingRegistration.sitEmail || "",
              classOf: existingRegistration.classOf?.toString() || "",
              sitStudentId: existingRegistration.sitStudentId || "",
              sitMatricNumber: existingRegistration.sitMatricNumber || "",
              areasOfMentoring: existingRegistration.areasOfMentoring || [],
              fbPreference: existingRegistration.fbPreference || "",
              dietaryRestrictions: existingRegistration.dietaryRestrictions || "",
              optionToReceiveFB: existingRegistration.optionToReceiveFB || false,
              preferredMailingAddress: existingRegistration.preferredMailingAddress || existingRegistration.personalEmail || "",
              eventSlotPreference: existingRegistration.eventSlotPreference || null,
              eventMeetupPreference: existingRegistration.eventMeetupPreference || "",
              pdpaConsent: true, // Already consented
            }));
            
            setRegistrationStatus({
              isOpen: true,
              existingRegistration,
            });
            setChecking(false);
            // Continue to show form with pre-populated data
            return;
          }

          // Get program details
          const programResponse = await api.get(
            `/mentoring-programs/${programIdFromUrl}`
          );
          if (programResponse.data.success) {
            setProgram(programResponse.data.data.program);
          }

          // Try to pre-populate from previous registration
          try {
            const prePopulateResponse = await api.get(
              `/mentor-registrations/pre-populate/${programIdFromUrl}`
            );
            if (
              prePopulateResponse.data.success &&
              prePopulateResponse.data.data.previousData
            ) {
              const prevData = prePopulateResponse.data.data.previousData;
              setPrePopulatedData(prevData);
              // Pre-fill form with previous data
              setFormData((prev) => ({
                ...prev,
                title: prevData.title || "",
                firstName: prevData.firstName || "",
                lastName: prevData.lastName || "",
                preferredName: prevData.preferredName || "",
                mobileNumber: prevData.mobileNumber || "",
                dateOfBirth: prevData.dateOfBirth
                  ? new Date(prevData.dateOfBirth).toISOString().split("T")[0]
                  : "",
                personalEmail: prevData.personalEmail || "",
                sitEmail: prevData.sitEmail || "",
                classOf: prevData.classOf?.toString() || "",
                sitStudentId: prevData.sitStudentId || "",
                sitMatricNumber: prevData.sitMatricNumber || "",
                areasOfMentoring: prevData.areasOfMentoring || [],
                fbPreference: prevData.fbPreference || "",
                dietaryRestrictions: prevData.dietaryRestrictions || "",
                optionToReceiveFB: prevData.optionToReceiveFB || false,
                preferredMailingAddress:
                  prevData.preferredMailingAddress || prevData.personalEmail || "",
                eventSlotPreference: prevData.eventSlotPreference || null,
                eventMeetupPreference: prevData.eventMeetupPreference || "",
              }));
            }
          } catch (err) {
            // No previous data - that's okay
          }

          setRegistrationStatus({ isOpen: true });
        }
      } else {
          // If staff editing, just set status to open
          const programResponse = await api.get(
            `/mentoring-programs/${programIdFromUrl}`
          );
          if (programResponse.data.success) {
            setProgram(programResponse.data.data.program);
          }
          setRegistrationStatus({ isOpen: true });
        }
      } catch (error: any) {
        console.error("Error checking registration:", error);
        toast({
          title: "Error",
          description:
            error.response?.data?.message ||
            "Failed to check registration status",
          variant: "destructive",
        });
      } finally {
        setChecking(false);
      }
    };

    checkRegistration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programIdFromUrl, editId]);

  const handleInputChange = (
    field: keyof RegistrationFormData,
    value: any
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleClassOfChange = (value: string) => {
    const year = parseInt(value);
    handleInputChange("classOf", value);
    // Clear matric number when class changes (sitStudentId removed from form)
    if (year >= 2017) {
      handleInputChange("sitMatricNumber", "");
    }
  };

  const addArea = () => {
    if (newArea.trim() && formData.areasOfMentoring.length < 10) {
      if (newArea.length > 100) {
        setErrors((prev) => ({
          ...prev,
          areasOfMentoring: "Each area cannot exceed 100 characters",
        }));
        return;
      }
      handleInputChange("areasOfMentoring", [
        ...formData.areasOfMentoring,
        newArea.trim(),
      ]);
      setNewArea("");
      if (errors.areasOfMentoring) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.areasOfMentoring;
          return newErrors;
        });
      }
    }
  };

  const removeArea = (index: number) => {
    handleInputChange(
      "areasOfMentoring",
      formData.areasOfMentoring.filter((_, i) => i !== index)
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!allowedTypes.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          cvFile: "Only PDF, DOC, and DOCX files are allowed",
        }));
        return;
      }
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          cvFile: "File size must be less than 10MB",
        }));
        return;
      }
      setCvFile(file);
      if (errors.cvFile) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.cvFile;
          return newErrors;
        });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.firstName || formData.firstName.length > 30)
      newErrors.firstName = "First name is required (max 30 characters)";
    if (!formData.lastName || formData.lastName.length > 30)
      newErrors.lastName = "Last name is required (max 30 characters)";
    if (!formData.preferredName || formData.preferredName.length > 100)
      newErrors.preferredName = "Preferred name is required (max 100 characters)";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.personalEmail) newErrors.personalEmail = "Personal email is required";
    if (!formData.classOf) newErrors.classOf = "Class of year is required";

    const classOfYear = parseInt(formData.classOf);
    if (classOfYear < 2017 && !formData.sitMatricNumber)
      newErrors.sitMatricNumber = "SIT Matric Number is required for pre-2017";

    if (formData.areasOfMentoring.length === 0)
      newErrors.areasOfMentoring = "At least one area of mentoring is required";
    if (!formData.preferredMailingAddress)
      newErrors.preferredMailingAddress = "Preferred mailing address is required";
    if (!formData.pdpaConsent)
      newErrors.pdpaConsent = "PDPA consent must be accepted";

    // Validate date of birth (min 16 years)
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const minDate = new Date(
        today.getFullYear() - 16,
        today.getMonth(),
        today.getDate()
      );
      if (dob > minDate) {
        newErrors.dateOfBirth = "You must be at least 16 years old";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      });
      return;
    }

    // Generate a dummy reCAPTCHA token (in production, use actual reCAPTCHA)
    // For now, we'll send a placeholder
    const recaptchaToken = "manual-submission-" + Date.now();

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("programId", formData.programId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      formDataToSend.append("preferredName", formData.preferredName);
      if (formData.mobileNumber)
        formDataToSend.append("mobileNumber", formData.mobileNumber);
      formDataToSend.append("dateOfBirth", formData.dateOfBirth);
      formDataToSend.append("personalEmail", formData.personalEmail);
      // sitEmail and sitStudentId removed from form - not sending them
      formDataToSend.append("classOf", formData.classOf);
      if (formData.sitMatricNumber)
        formDataToSend.append("sitMatricNumber", formData.sitMatricNumber);
      formData.areasOfMentoring.forEach((area) => {
        formDataToSend.append("areasOfMentoring[]", area);
      });
      if (formData.fbPreference)
        formDataToSend.append("fbPreference", formData.fbPreference);
      if (formData.dietaryRestrictions)
        formDataToSend.append("dietaryRestrictions", formData.dietaryRestrictions);
      formDataToSend.append(
        "optionToReceiveFB",
        formData.optionToReceiveFB.toString()
      );
      formDataToSend.append(
        "preferredMailingAddress",
        formData.preferredMailingAddress
      );
      if (formData.eventSlotPreference) {
        formDataToSend.append(
          "eventSlotPreference[startDate]",
          formData.eventSlotPreference.startDate
        );
        formDataToSend.append(
          "eventSlotPreference[endDate]",
          formData.eventSlotPreference.endDate
        );
        if (formData.eventSlotPreference.startTime)
          formDataToSend.append(
            "eventSlotPreference[startTime]",
            formData.eventSlotPreference.startTime
          );
        if (formData.eventSlotPreference.endTime)
          formDataToSend.append(
            "eventSlotPreference[endTime]",
            formData.eventSlotPreference.endTime
          );
      }
      if (formData.eventMeetupPreference)
        formDataToSend.append(
          "eventMeetupPreference",
          formData.eventMeetupPreference
        );
      formDataToSend.append("pdpaConsent", "true");
      formDataToSend.append("recaptchaToken", recaptchaToken);

      if (cvFile) {
        formDataToSend.append("mentorCV", cvFile);
      }

      // If in edit mode and staff, use on-behalf endpoint
      let response;
      if (isEditMode && isStaff && editingRegistration) {
        // Get userId from registration
        const userId = editingRegistration.userId?._id || editingRegistration.userId;
        if (!userId) {
          toast({
            title: "Error",
            description: "User ID not found in registration",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        formDataToSend.append("userId", userId);
        
        response = await api.post("/mentor-registrations/on-behalf", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      } else {
        response = await api.post("/mentor-registrations", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
      }

      if (response.data.success) {
        const isUpdate = (existingRegistration && existingRegistration.status === "submitted") || (isEditMode && isStaff);
        toast({
          title: isUpdate ? "Registration Updated" : "Registration Submitted",
          description: isUpdate
            ? isEditMode && isStaff
              ? "Registration updated successfully on behalf of the user."
              : "Your mentor registration has been updated successfully. You will be notified once it's reviewed."
            : "Your mentor registration has been submitted successfully. You will be notified once it's reviewed.",
        });
        if (onSuccess) onSuccess();
        if (onClose) onClose();
        else navigate(-1);
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0] ||
        "Failed to submit registration. Please try again.";
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-center">Checking registration status...</p>
        </div>
      </div>
    );
  }

  if (registrationStatus && !registrationStatus.isOpen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-red-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">Registration Closed</h2>
            <p className="text-gray-600 mb-4">{registrationStatus.message}</p>
            <button
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show notice if existing registration, but allow editing
  const existingRegistration = registrationStatus?.existingRegistration;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <h2 className="text-xl font-bold">
            {isEditMode && isStaff ? "Edit Registration on Behalf" : "Register as Mentor"} {program?.name ? `- ${program.name}` : ""}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md flex items-center gap-2 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {existingRegistration && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Existing Registration Found
                  </h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    You have already submitted a registration for this program. Your form has been pre-filled with your existing data. You can review and update your information below.
                  </p>
                  <p className="text-xs text-yellow-700">
                    <strong>Current Status:</strong>{" "}
                    <span className="font-semibold capitalize">
                      {existingRegistration.status}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          {prePopulatedData && !existingRegistration && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> We found your previous registration data.
                Please review and update if needed.
              </p>
            </div>
          )}

          {/* Entry Criteria Rules */}
          {program?.entryCriteriaRules && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Entry Criteria Rules
              </h3>
              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                {program.entryCriteriaRules.split('\n').map((line, idx) => {
                  if (/^[\d\-•·]\s/.test(line.trim()) || line.trim().startsWith('-')) {
                    return (
                      <div key={idx} className="ml-4 mb-1">
                        {line.trim()}
                      </div>
                    );
                  }
                  return (
                    <p key={idx} className="mb-2">
                      {line}
                    </p>
                  );
                })}
              </div>
              <p className="text-xs text-blue-700 mt-2 font-medium">
                Please ensure you meet these criteria before proceeding with registration.
              </p>
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.title}
                  onChange={(e) =>
                    handleInputChange("title", e.target.value as any)
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.title ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Title</option>
                  {TITLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.title && (
                  <p className="text-red-600 text-xs mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  maxLength={30}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.firstName ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.firstName && (
                  <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.firstName.length}/30
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  maxLength={30}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.lastName ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.lastName && (
                  <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.lastName.length}/30
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.preferredName}
                  onChange={(e) =>
                    handleInputChange("preferredName", e.target.value)
                  }
                  maxLength={100}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.preferredName ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.preferredName && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.preferredName}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  {formData.preferredName.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    handleInputChange("mobileNumber", e.target.value)
                  }
                  placeholder="+65 1234 5678"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.mobileNumber ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.mobileNumber && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date of Birth <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  max={new Date(
                    new Date().getFullYear() - 16,
                    new Date().getMonth(),
                    new Date().getDate()
                  )
                    .toISOString()
                    .split("T")[0]}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.dateOfBirth ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.dateOfBirth && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.dateOfBirth}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Email Information */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Personal Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) =>
                    handleInputChange("personalEmail", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.personalEmail ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                />
                {errors.personalEmail && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.personalEmail}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Preferred Mailing Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.preferredMailingAddress}
                  onChange={(e) =>
                    handleInputChange("preferredMailingAddress", e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.preferredMailingAddress
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                />
                {errors.preferredMailingAddress && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.preferredMailingAddress}
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-1">
                  Defaults to your personal email
                </p>
              </div>
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Academic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Class Of <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.classOf}
                  onChange={(e) => handleClassOfChange(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.classOf ? "border-red-500" : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Year</option>
                  {CLASS_OF_YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.classOf && (
                  <p className="text-red-600 text-xs mt-1">{errors.classOf}</p>
                )}
              </div>

              {parseInt(formData.classOf) < 2017 && formData.classOf && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    SIT Matric Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.sitMatricNumber}
                    onChange={(e) =>
                      handleInputChange("sitMatricNumber", e.target.value)
                    }
                    maxLength={10}
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.sitMatricNumber
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                  />
                  {errors.sitMatricNumber && (
                    <p className="text-red-600 text-xs mt-1">
                      {errors.sitMatricNumber}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {formData.sitMatricNumber.length}/10
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Mentor CV (PDF, DOC, DOCX - Max 10MB)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {cvFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {cvFile.name}
              </p>
            )}
            {errors.cvFile && (
              <p className="text-red-600 text-xs mt-1">{errors.cvFile}</p>
            )}
          </div>

          {/* Areas of Mentoring */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Areas of Mentoring <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addArea();
                  }
                }}
                placeholder="Enter area (max 100 chars)"
                maxLength={100}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={addArea}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {formData.areasOfMentoring.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.areasOfMentoring.map((area, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeArea(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {errors.areasOfMentoring && (
              <p className="text-red-600 text-xs mt-1">
                {errors.areasOfMentoring}
              </p>
            )}
          </div>

          {/* F&B Preferences */}
          {/* <div>
            <h3 className="text-base font-semibold mb-3">F&B Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  F&B Preference
                </label>
                <input
                  type="text"
                  value={formData.fbPreference}
                  onChange={(e) => handleInputChange("fbPreference", e.target.value)}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-gray-500 text-xs mt-1">
                  {formData.fbPreference.length}/100
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Dietary Restrictions
                </label>
                <input
                  type="text"
                  value={formData.dietaryRestrictions}
                  onChange={(e) =>
                    handleInputChange("dietaryRestrictions", e.target.value)
                  }
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-gray-500 text-xs mt-1">
                  {formData.dietaryRestrictions.length}/100
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="optionToReceiveFB"
                  checked={formData.optionToReceiveFB}
                  onChange={(e) =>
                    handleInputChange("optionToReceiveFB", e.target.checked)
                  }
                  className="mr-2"
                />
                <label htmlFor="optionToReceiveFB" className="text-sm">
                  Option to receive F&B
                </label>
              </div>
            </div>
          </div> */}

          {/* Event Preferences */}
          <div>
            <h3 className="text-base font-semibold mb-3">Event Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Slot Preference
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={
                      formData.eventSlotPreference?.startDate || ""
                    }
                    onChange={(e) =>
                      handleInputChange("eventSlotPreference", {
                        ...(formData.eventSlotPreference || {}),
                        startDate: e.target.value,
                        endDate: formData.eventSlotPreference?.endDate || "",
                        startTime: formData.eventSlotPreference?.startTime || "",
                        endTime: formData.eventSlotPreference?.endTime || "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="date"
                    value={formData.eventSlotPreference?.endDate || ""}
                    onChange={(e) =>
                      handleInputChange("eventSlotPreference", {
                        ...(formData.eventSlotPreference || {}),
                        startDate: formData.eventSlotPreference?.startDate || "",
                        endDate: e.target.value,
                        startTime: formData.eventSlotPreference?.startTime || "",
                        endTime: formData.eventSlotPreference?.endTime || "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Meet up Preference
                </label>
                <input
                  type="text"
                  value={formData.eventMeetupPreference}
                  onChange={(e) =>
                    handleInputChange("eventMeetupPreference", e.target.value)
                  }
                  maxLength={100}
                  placeholder="e.g., Virtual, Physical"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
                <p className="text-gray-500 text-xs mt-1">
                  {formData.eventMeetupPreference.length}/100
                </p>
              </div>
            </div>
          </div>

          {/* PDPA Consent */}
          <div className="border-t pt-4">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="pdpaConsent"
                checked={formData.pdpaConsent}
                onChange={(e) => handleInputChange("pdpaConsent", e.target.checked)}
                className="mt-1 mr-2"
                required
              />
              <label htmlFor="pdpaConsent" className="text-sm">
                I consent to the processing of my personal data in accordance with
                the{" "}
                <a
                  href="/pdpa"
                  target="_blank"
                  className="text-blue-600 hover:underline"
                >
                  PDPA document
                </a>{" "}
                <span className="text-red-500">*</span>
              </label>
            </div>
            {errors.pdpaConsent && (
              <p className="text-red-600 text-xs mt-1">{errors.pdpaConsent}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4 border-t sticky bottom-0 bg-white pb-2">
            <button
              type="button"
              onClick={() => (onClose ? onClose() : navigate(-1))}
              className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : "Submit Registration"}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

