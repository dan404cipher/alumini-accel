import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { X, Upload, Calendar, Mail, Phone, FileText, User, Info } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProgramDetail } from "./ProgramDetail";
import Navigation from "@/components/Navigation";

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
  areasOfMentoring: string[];
  fbPreference: string;
  dietaryRestrictions: string;
  optionToReceiveFB: boolean;
  preferredMailingAddress: string;
  eventSlotPreference: "Weekend afternoon" | "Weekday evenings" | "";
  eventMeetupPreference: "Virtual" | "Physical" | "";
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

const EVENT_SLOT_OPTIONS = [
  { value: "Weekend afternoon", label: "Weekend afternoon" },
  { value: "Weekday evenings", label: "Weekday evenings" },
];

const MEETUP_PREFERENCE_OPTIONS = [
  { value: "Virtual", label: "Virtual" },
  { value: "Physical", label: "Physical" },
];

export const ProgramMentorRegistration: React.FC<
  ProgramMentorRegistrationProps
> = ({ programId: propProgramId, onClose, onSuccess }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert old format (object) to new format (string)
  const convertEventSlotPreference = (value: any): "Weekend afternoon" | "Weekday evenings" | "" => {
    if (!value) return "";
    if (typeof value === "string") {
      return value === "Weekend afternoon" || value === "Weekday evenings" ? value : "";
    }
    // Old format was an object - we can't convert it, so return empty
    return "";
  };

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
    areasOfMentoring: [],
    fbPreference: "",
    dietaryRestrictions: "",
    optionToReceiveFB: false,
    preferredMailingAddress: "",
    eventSlotPreference: "",
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
              areasOfMentoring: registration.areasOfMentoring || [],
              fbPreference: registration.fbPreference || "",
              dietaryRestrictions: registration.dietaryRestrictions || "",
              optionToReceiveFB: registration.optionToReceiveFB || false,
              preferredMailingAddress: registration.preferredMailingAddress || registration.personalEmail || "",
              eventSlotPreference: convertEventSlotPreference(registration.eventSlotPreference),
              eventMeetupPreference: registration.eventMeetupPreference === "Virtual" || registration.eventMeetupPreference === "Physical" ? registration.eventMeetupPreference : "",
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
              areasOfMentoring: existingRegistration.areasOfMentoring || [],
              fbPreference: existingRegistration.fbPreference || "",
              dietaryRestrictions: existingRegistration.dietaryRestrictions || "",
              optionToReceiveFB: existingRegistration.optionToReceiveFB || false,
              preferredMailingAddress: existingRegistration.preferredMailingAddress || existingRegistration.personalEmail || "",
              eventSlotPreference: convertEventSlotPreference(existingRegistration.eventSlotPreference),
              eventMeetupPreference: existingRegistration.eventMeetupPreference === "Virtual" || existingRegistration.eventMeetupPreference === "Physical" ? existingRegistration.eventMeetupPreference : "",
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
                areasOfMentoring: prevData.areasOfMentoring || [],
                fbPreference: prevData.fbPreference || "",
                dietaryRestrictions: prevData.dietaryRestrictions || "",
                optionToReceiveFB: prevData.optionToReceiveFB || false,
                preferredMailingAddress:
                  prevData.preferredMailingAddress || prevData.personalEmail || "",
                eventSlotPreference: convertEventSlotPreference(prevData.eventSlotPreference),
                eventMeetupPreference: prevData.eventMeetupPreference === "Virtual" || prevData.eventMeetupPreference === "Physical" ? prevData.eventMeetupPreference : "",
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

  // Validate individual field
  const validateField = (field: keyof RegistrationFormData, value: string | string[] | boolean | undefined): string => {
    switch (field) {
      case "title":
        if (!value || (typeof value === "string" && !value.trim())) return "Title is required";
        return "";
      
      case "firstName":
        if (!value || (typeof value === "string" && !value.trim())) return "First name is required";
        if (typeof value === "string" && value.length > 30) return "First name cannot exceed 30 characters";
        return "";
      
      case "lastName":
        if (!value || (typeof value === "string" && !value.trim())) return "Last name is required";
        if (typeof value === "string" && value.length > 30) return "Last name cannot exceed 30 characters";
        return "";
      
      case "preferredName":
        if (!value || (typeof value === "string" && !value.trim())) return "Preferred name is required";
        if (typeof value === "string" && value.length > 100) return "Preferred name cannot exceed 100 characters";
        return "";
      
      case "mobileNumber": {
        if (!value || typeof value !== "string") return "Mobile number is required";
        // Remove all non-digit characters for validation
        const digitsOnly = value.replace(/\D/g, "");
        if (digitsOnly.length !== 10) return "Mobile number must be exactly 10 digits";
        return "";
      }
      
      case "dateOfBirth": {
        if (!value || typeof value !== "string") return "Date of birth is required";
        const dob = new Date(value);
        const today = new Date();
        const minDate = new Date(
          today.getFullYear() - 16,
          today.getMonth(),
          today.getDate()
        );
        if (dob > minDate) return "You must be at least 16 years old";
        return "";
      }
      
      case "personalEmail": {
        if (!value || typeof value !== "string") return "Personal email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return "Please enter a valid email address";
        return "";
      }
      
      case "preferredMailingAddress": {
        if (!value || typeof value !== "string") return "Preferred mailing address is required";
        const mailingEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!mailingEmailRegex.test(value)) return "Please enter a valid email address";
        return "";
      }
      
      case "classOf":
        if (!value || (typeof value === "string" && !value.trim())) return "Class of year is required";
        return "";
      
      case "areasOfMentoring":
        if (!value || (Array.isArray(value) && value.length === 0)) {
          return "At least one area of mentoring is required";
        }
        return "";
      
      case "eventSlotPreference":
        if (!value || (typeof value === "string" && !value.trim())) return "Event slot preference is required";
        return "";
      
      case "eventMeetupPreference":
        if (!value || (typeof value === "string" && !value.trim())) return "Event meetup preference is required";
        return "";
      
      case "pdpaConsent":
        if (!value || value !== true) return "PDPA consent must be accepted";
        return "";
      
      default:
        return "";
    }
  };

  const handleInputChange = (
    field: keyof RegistrationFormData,
    value: string | string[] | boolean
  ) => {
    // For mobile number, restrict to digits only and max 10 digits
    if (field === "mobileNumber" && typeof value === "string") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      if (digitsOnly.length > 10) {
        // Don't update if it exceeds 10 digits
        return;
      }
      value = digitsOnly;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Validate field in real-time
    const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
      [field]: error,
      }));
  };

  const handleClassOfChange = (value: string) => {
    handleInputChange("classOf", value);
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

    // Validate all fields using the validateField function
    const fieldsToValidate: (keyof RegistrationFormData)[] = [
      "title",
      "firstName",
      "lastName",
      "preferredName",
      "mobileNumber",
      "dateOfBirth",
      "personalEmail",
      "preferredMailingAddress",
      "classOf",
      "areasOfMentoring",
      "eventSlotPreference",
      "eventMeetupPreference",
      "pdpaConsent",
    ];

    fieldsToValidate.forEach((field) => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

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
      // sitEmail is optional - only send if it exists (for edit mode)
      if (formData.sitEmail && formData.sitEmail.trim()) {
        formDataToSend.append("sitEmail", formData.sitEmail);
      }
      // sitStudentId removed from form - not sending it
      formDataToSend.append("classOf", formData.classOf);
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
          "eventSlotPreference",
          formData.eventSlotPreference
        );
      }
      if (formData.eventMeetupPreference) {
        formDataToSend.append(
          "eventMeetupPreference",
          formData.eventMeetupPreference
        );
      }
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
        
        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
        
        // If onClose is provided, use it
        if (onClose) {
          onClose();
        } else {
          // Navigate to a safe page - either program detail or mentorship dashboard
          if (programIdFromUrl) {
            // Navigate to the program detail page
            navigate(`/mentoring-programs?id=${programIdFromUrl}`, { replace: true });
          } else {
            // Fallback to mentorship dashboard
            navigate("/mentoring-programs", { replace: true });
          }
        }
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Don't show error toast if it's a 401 - the interceptor will handle redirect
      if (error.response?.status === 401) {
        // Authentication error - interceptor will redirect to login
        return;
      }
      
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
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab="mentorship" onTabChange={() => {}} />
        <div className="pt-16">
          <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white rounded-lg p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-center">Checking registration status...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (registrationStatus && !registrationStatus.isOpen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation activeTab="mentorship" onTabChange={() => {}} />
        <div className="pt-16">
          <div className="flex items-center justify-center min-h-screen p-4">
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
        </div>
      </div>
    );
  }

  // Show notice if existing registration, but allow editing
  const existingRegistration = registrationStatus?.existingRegistration;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Navigation */}
      <Navigation activeTab="mentorship" onTabChange={() => {}} />
      
      {/* Program Detail Background */}
      <div className="pt-16 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {program && programIdFromUrl && (
            <div className="opacity-25 pointer-events-none">
              <ProgramDetail 
                programId={programIdFromUrl} 
                userRole={user?.role}
              />
            </div>
          )}
        </div>
      </div>

      {/* Registration Form Overlay */}
      <div className="fixed inset-0 flex items-start justify-center z-50 overflow-y-auto pt-20 pb-4 px-4">
        <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full my-4 max-h-[80vh] flex flex-col border-2 border-blue-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b flex-shrink-0">
          <h2 className="text-base font-semibold">
            {isEditMode && isStaff ? "Edit Registration on Behalf" : "Register as Mentor"} {program?.name ? `- ${program.name}` : ""}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  // Navigate to program detail page
                  if (programIdFromUrl) {
                    navigate(`/mentoring-programs?id=${programIdFromUrl}`, { replace: true });
                  } else {
                    navigate("/mentoring-programs", { replace: true });
                  }
                }
              }}
              className="text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Form - Scrollable */}
        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="p-3 space-y-3" noValidate>
          {existingRegistration && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-3">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
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
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                  onBlur={() => {
                    const error = validateField("title", formData.title);
                    setErrors((prev) => ({ ...prev, title: error }));
                  }}
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
                  onBlur={() => {
                    const error = validateField("firstName", formData.firstName);
                    setErrors((prev) => ({ ...prev, firstName: error }));
                  }}
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
                  onBlur={() => {
                    const error = validateField("lastName", formData.lastName);
                    setErrors((prev) => ({ ...prev, lastName: error }));
                  }}
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
                  onBlur={() => {
                    const error = validateField("preferredName", formData.preferredName);
                    setErrors((prev) => ({ ...prev, preferredName: error }));
                  }}
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
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.mobileNumber}
                  onChange={(e) =>
                    handleInputChange("mobileNumber", e.target.value)
                  }
                  onBlur={() => {
                    const error = validateField("mobileNumber", formData.mobileNumber);
                    setErrors((prev) => ({ ...prev, mobileNumber: error }));
                  }}
                  placeholder="Enter 10 digits"
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.mobileNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  required
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
                  onBlur={() => {
                    const error = validateField("dateOfBirth", formData.dateOfBirth);
                    setErrors((prev) => ({ ...prev, dateOfBirth: error }));
                  }}
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
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                  onBlur={() => {
                    const error = validateField("personalEmail", formData.personalEmail);
                    setErrors((prev) => ({ ...prev, personalEmail: error }));
                  }}
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
                  onBlur={() => {
                    const error = validateField("preferredMailingAddress", formData.preferredMailingAddress);
                    setErrors((prev) => ({ ...prev, preferredMailingAddress: error }));
                  }}
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
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
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
                  onBlur={() => {
                    const error = validateField("classOf", formData.classOf);
                    setErrors((prev) => ({ ...prev, classOf: error }));
                  }}
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

            </div>
          </div>

          {/* CV Upload */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Mentor CV (PDF, DOC, DOCX - Max 10MB)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            {cvFile && (
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">{cvFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(cvFile.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCvFile(null);
                    // Clear file input
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                    // Clear error if any
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.cvFile;
                      return newErrors;
                    });
                  }}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
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
            <h3 className="text-sm font-semibold mb-2">F&B Preferences</h3>
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
            <h3 className="text-sm font-semibold mb-2"></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Slot Preference <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.eventSlotPreference}
                    onChange={(e) =>
                    handleInputChange(
                      "eventSlotPreference",
                      e.target.value as "Weekend afternoon" | "Weekday evenings"
                    )
                  }
                  onBlur={() => {
                    const error = validateField("eventSlotPreference", formData.eventSlotPreference);
                    setErrors((prev) => ({ ...prev, eventSlotPreference: error }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.eventSlotPreference
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Preference</option>
                  {EVENT_SLOT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.eventSlotPreference && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.eventSlotPreference}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Event Meet up Preference <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.eventMeetupPreference}
                  onChange={(e) =>
                    handleInputChange(
                      "eventMeetupPreference",
                      e.target.value as "Virtual" | "Physical"
                    )
                  }
                  onBlur={() => {
                    const error = validateField("eventMeetupPreference", formData.eventMeetupPreference);
                    setErrors((prev) => ({ ...prev, eventMeetupPreference: error }));
                  }}
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.eventMeetupPreference
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                  required
                >
                  <option value="">Select Preference</option>
                  {MEETUP_PREFERENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {errors.eventMeetupPreference && (
                  <p className="text-red-600 text-xs mt-1">
                    {errors.eventMeetupPreference}
                </p>
                )}
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
          <div className="flex gap-3 pt-3 border-t sticky bottom-0 bg-white pb-2">
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
    </div>
  );
};

