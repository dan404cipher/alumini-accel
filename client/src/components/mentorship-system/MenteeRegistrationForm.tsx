import React, { useState, useRef, useEffect } from "react";
import { Upload, Calendar, Mail, Phone, FileText, User, X, Info } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import Select from "react-select";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface MenteeRegistrationFormProps {
  programId: string;
  token: string;
  validatedStudentId?: string;
  editId?: string;
  onSuccess?: () => void;
}

interface RegistrationFormData {
  programId: string;
  token: string;
  validatedStudentId?: string;
  title: "Mr" | "Mrs" | "Ms" | "";
  firstName: string;
  lastName: string;
  mobileNumber: string;
  dateOfBirth: string;
  personalEmail: string;
  classOf: string;
  sitMatricNumber: string;
  areasOfMentoring: string[];
  fbPreference: string;
  dietaryRestrictions: string;
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
];

const CLASS_OF_YEARS = Array.from(
  { length: new Date().getFullYear() - 1950 + 1 },
  (_, i) => new Date().getFullYear() - i
).map((year) => ({
  value: year.toString(),
  label: year.toString(),
}));

const EVENT_SLOT_OPTIONS = [
  { value: "Weekend afternoon", label: "Weekend afternoon" },
  { value: "Weekday evenings", label: "Weekday evenings" },
];

const MEETUP_PREFERENCE_OPTIONS = [
  { value: "Virtual", label: "Virtual" },
  { value: "Physical", label: "Physical" },
];

export const MenteeRegistrationForm: React.FC<MenteeRegistrationFormProps> = ({
  programId,
  token,
  validatedStudentId,
  editId,
  onSuccess,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isEditMode = !!editId;
  const isStaff = user?.role === "staff" || user?.role === "super_admin" || user?.role === "college_admin" || user?.role === "hod";

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [newArea, setNewArea] = useState("");
  const [isMailingAddressManuallyEdited, setIsMailingAddressManuallyEdited] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get reCAPTCHA site key from environment variables
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";

  const [formData, setFormData] = useState<RegistrationFormData>({
    programId,
    token,
    validatedStudentId,
    title: "",
    firstName: "",
    lastName: "",
    mobileNumber: "",
    dateOfBirth: "",
    personalEmail: "",
    classOf: "",
    sitMatricNumber: "",
    areasOfMentoring: [],
    fbPreference: "",
    dietaryRestrictions: "",
    preferredMailingAddress: "",
    eventSlotPreference: "",
    eventMeetupPreference: "",
    pdpaConsent: false,
    recaptchaToken: "",
  });
  
  const [editingRegistration, setEditingRegistration] = useState<any>(null);

  // Fetch registration data if editId is present
  useEffect(() => {
    const fetchRegistrationData = async () => {
      if (isEditMode && isStaff && editId) {
        try {
          const response = await api.get(`/mentee-registrations/${editId}`);
          if (response.data.success) {
            const registration = response.data.data.registration;
            setEditingRegistration(registration);
            
            // Pre-fill form with registration data
            setFormData((prev) => ({
              ...prev,
              title: registration.title || "",
              firstName: registration.firstName || "",
              lastName: registration.lastName || "",
              mobileNumber: registration.mobileNumber || "",
              dateOfBirth: registration.dateOfBirth
                ? new Date(registration.dateOfBirth).toISOString().split("T")[0]
                : "",
              personalEmail: registration.personalEmail || "",
              classOf: registration.classOf?.toString() || "",
              sitMatricNumber: registration.sitMatricNumber || "",
              areasOfMentoring: registration.areasOfMentoring || [],
              fbPreference: registration.fbPreference || "",
              dietaryRestrictions: registration.dietaryRestrictions || "",
              preferredMailingAddress: registration.preferredMailingAddress || registration.personalEmail || "",
              eventSlotPreference: registration.eventSlotPreference || "",
              eventMeetupPreference: registration.eventMeetupPreference || "",
              pdpaConsent: true,
            }));
            
            if (registration.validatedStudentId) {
              setFormData((prev) => ({
                ...prev,
                validatedStudentId: registration.validatedStudentId,
              }));
            }
          }
        } catch (error: any) {
          console.error("Error fetching registration:", error);
          toast({
            title: "Error",
            description: error.response?.data?.message || "Failed to load registration data",
            variant: "destructive",
          });
        }
      }
    };
    
    fetchRegistrationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  // Validate individual field
  const validateField = (field: keyof RegistrationFormData, value: string | string[] | boolean | undefined): string => {
    switch (field) {
      case "title":
        if (!value || (typeof value === "string" && !value.trim())) return "Title is required";
        return "";
      
      case "firstName": {
        if (!value || (typeof value === "string" && !value.trim())) return "First name is required";
        if (typeof value === "string" && value.length > 30) return "First name cannot exceed 30 characters";
        if (typeof value === "string" && !/^[a-zA-Z\s]+$/.test(value)) return "First name can only contain letters (a-z, A-Z) and spaces";
        return "";
      }
      
      case "lastName": {
        if (!value || (typeof value === "string" && !value.trim())) return "Last name is required";
        if (typeof value === "string" && value.length > 30) return "Last name cannot exceed 30 characters";
        if (typeof value === "string" && !/^[a-zA-Z\s]+$/.test(value)) return "Last name can only contain letters (a-z, A-Z) and spaces";
        return "";
      }
      
      case "mobileNumber": {
        if (value && typeof value === "string" && value.trim()) {
          const digitsOnly = value.replace(/\D/g, "");
          if (digitsOnly.length !== 10) return "Mobile number must be exactly 10 digits";
        }
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
      
      case "sitMatricNumber": {
        const classOfYear = parseInt(formData.classOf);
        if (classOfYear < 2017 && (!value || (typeof value === "string" && !value.trim()))) {
          return "Matric Number is required for pre-2017";
        }
        return "";
      }
      
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
    value: any
  ) => {
    // Filter invalid characters for first name and last name (only allow letters and spaces)
    if (field === "firstName" || field === "lastName") {
      // Remove any characters that are not letters or spaces
      value = value.replace(/[^a-zA-Z\s]/g, "");
    }

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

    setFormData((prev) => {
      const updated = {
      ...prev,
      [field]: value,
      };

      // Auto-fill preferredMailingAddress when personalEmail changes
      if (field === "personalEmail") {
        // Only auto-fill if:
        // 1. preferredMailingAddress is empty, OR
        // 2. preferredMailingAddress currently matches the old personalEmail (was auto-filled)
        const wasAutoFilled = prev.preferredMailingAddress === prev.personalEmail;
        const isEmpty = !prev.preferredMailingAddress || prev.preferredMailingAddress === "";
        
        if (isEmpty || (wasAutoFilled && !isMailingAddressManuallyEdited)) {
          updated.preferredMailingAddress = value;
        }
      }

      // Track if preferredMailingAddress is manually edited
      // Only mark as manually edited if the new value is different from personalEmail
      if (field === "preferredMailingAddress") {
        if (value !== prev.personalEmail) {
          setIsMailingAddressManuallyEdited(true);
        } else if (value === prev.personalEmail) {
          // If user changes it back to match personalEmail, reset the flag
          setIsMailingAddressManuallyEdited(false);
        }
      }

      return updated;
    });

    // Validate field in real-time
    const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
      [field]: error,
        }));
  };

  const handleClassOfChange = (value: string) => {
    const year = parseInt(value);
    handleInputChange("classOf", value);
    // Clear matric when class changes
    if (year >= 2017) {
      handleInputChange("sitMatricNumber", "");
      // Clear error for matric number if class is >= 2017
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.sitMatricNumber;
        return newErrors;
      });
    } else {
      // Validate matric number if class is < 2017
      const error = validateField("sitMatricNumber", formData.sitMatricNumber);
      setErrors((prev) => ({
        ...prev,
        sitMatricNumber: error,
      }));
    }
    // Validate classOf field
    const error = validateField("classOf", value);
    setErrors((prev) => ({
      ...prev,
      classOf: error,
    }));
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
    
    // Validate first name
    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > 30) {
      newErrors.firstName = "First name cannot exceed 30 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.firstName)) {
      newErrors.firstName = "First name can only contain letters (a-z, A-Z) and spaces";
    }
    
    // Validate last name
    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > 30) {
      newErrors.lastName = "Last name cannot exceed 30 characters";
    } else if (!/^[a-zA-Z\s]+$/.test(formData.lastName)) {
      newErrors.lastName = "Last name can only contain letters (a-z, A-Z) and spaces";
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.personalEmail) newErrors.personalEmail = "Personal email is required";
    if (!formData.classOf) newErrors.classOf = "Class of year is required";

      const classOfYear = parseInt(formData.classOf);
      if (classOfYear < 2017 && !formData.sitMatricNumber)
        newErrors.sitMatricNumber = "Matric Number is required for pre-2017";

    // Validate mobile number if provided (optional field) - exactly 10 digits
    if (formData.mobileNumber && formData.mobileNumber.trim()) {
      // Remove all non-digit characters for validation
      const digitsOnly = formData.mobileNumber.replace(/\D/g, "");
      
      // Validate: exactly 10 digits
      if (digitsOnly.length !== 10) {
        newErrors.mobileNumber = "Mobile number must be exactly 10 digits";
      }
    }

    if (formData.areasOfMentoring.length === 0)
      newErrors.areasOfMentoring = "At least one area of mentoring is required";
    if (!formData.preferredMailingAddress)
      newErrors.preferredMailingAddress = "Preferred mailing address is required";
    if (!formData.eventSlotPreference)
      newErrors.eventSlotPreference = "Event slot preference is required";
    if (!formData.eventMeetupPreference)
      newErrors.eventMeetupPreference = "Event meetup preference is required";
    if (!formData.pdpaConsent)
      newErrors.pdpaConsent = "PDPA consent must be accepted";
    // Only validate reCAPTCHA if site key is configured
    if (recaptchaSiteKey && !formData.recaptchaToken)
      newErrors.recaptchaToken = "Please complete the reCAPTCHA verification";

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

  const handleRecaptchaChange = (token: string | null) => {
    handleInputChange("recaptchaToken", token || "");
    // Clear error when reCAPTCHA is completed
    if (errors.recaptchaToken && token) {
      setErrors((prev) => ({
        ...prev,
        recaptchaToken: "",
      }));
    }
  };

  const handleRecaptchaExpired = () => {
    handleInputChange("recaptchaToken", "");
    setErrors((prev) => ({
      ...prev,
      recaptchaToken: "reCAPTCHA expired. Please verify again.",
    }));
  };

  const handleRecaptchaError = () => {
    handleInputChange("recaptchaToken", "");
    setErrors((prev) => ({
      ...prev,
      recaptchaToken: "reCAPTCHA error. Please try again.",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate reCAPTCHA before form validation (only if site key is configured)
    if (recaptchaSiteKey && !formData.recaptchaToken) {
      setErrors((prev) => ({
        ...prev,
        recaptchaToken: "Please complete the reCAPTCHA verification",
      }));
      toast({
        title: "Verification Required",
        description: "Please complete the reCAPTCHA verification",
        variant: "destructive",
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix all errors before submitting",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("programId", formData.programId);
      // Token is optional for authenticated users - only send if it exists
      if (formData.token) {
        formDataToSend.append("token", formData.token);
      }
      if (formData.validatedStudentId)
        formDataToSend.append("validatedStudentId", formData.validatedStudentId);
      formDataToSend.append("title", formData.title);
      formDataToSend.append("firstName", formData.firstName);
      formDataToSend.append("lastName", formData.lastName);
      if (formData.mobileNumber)
        formDataToSend.append("mobileNumber", formData.mobileNumber);
      formDataToSend.append("dateOfBirth", formData.dateOfBirth);
      formDataToSend.append("personalEmail", formData.personalEmail);
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
        "preferredMailingAddress",
        formData.preferredMailingAddress
      );
      formDataToSend.append("eventSlotPreference", formData.eventSlotPreference);
      formDataToSend.append(
        "eventMeetupPreference",
        formData.eventMeetupPreference
      );
      formDataToSend.append("pdpaConsent", "true");
      // Only send reCAPTCHA token if site key is configured and token exists
      if (recaptchaSiteKey && formData.recaptchaToken) {
        formDataToSend.append("recaptchaToken", formData.recaptchaToken);
      } else if (!recaptchaSiteKey) {
        // If reCAPTCHA is not configured, send a bypass token for development
        formDataToSend.append("recaptchaToken", "bypass-no-recaptcha-configured");
      }

      if (cvFile) {
        formDataToSend.append("menteeCV", cvFile);
      }

      // If in edit mode and staff, use on-behalf endpoint
      let response;
      if (isEditMode && isStaff && editingRegistration) {
        // Get validatedStudentId from registration
        const studentId = editingRegistration.validatedStudentId || editingRegistration.sitMatricNumber;
        if (studentId) {
          formDataToSend.append("validatedStudentId", studentId);
        }
        
        response = await api.post("/mentee-registrations/on-behalf", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
          timeout: 30000,
        });
      } else {
        response = await api.post("/mentee-registrations", formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 30000, // 30 second timeout
        });
      }

      if (response.data.success) {
        const isUpdate = isEditMode && isStaff;
        toast({
          title: isUpdate ? "Registration Updated" : "Registration Submitted",
          description: isUpdate
            ? "Registration updated successfully on behalf of the user."
            : "Your mentee registration has been submitted successfully. You will receive a confirmation email shortly.",
        });
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = "Failed to submit registration. Please try again.";
      
      // Handle network errors
      if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
        errorMessage = "Cannot connect to the server. Please check if the backend server is running on http://localhost:3000";
      } else if (error.code === "ECONNREFUSED") {
        errorMessage = "Connection refused. Please ensure the backend server is running on port 3000.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors && Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
        errorMessage = error.response.data.errors[0];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // If reCAPTCHA verification failed, reset the widget
      if (errorMessage.toLowerCase().includes("recaptcha") && recaptchaRef.current) {
        recaptchaRef.current.reset();
        setFormData((prev) => ({
          ...prev,
          recaptchaToken: "",
        }));
        setErrors((prev) => ({
          ...prev,
          recaptchaToken: "reCAPTCHA verification failed. Please try again.",
        }));
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
        duration: 10000, // Show for 10 seconds for network errors
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3" noValidate>
      {/* Personal Information */}
      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
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
              onBlur={() => {
                if (formData.mobileNumber && formData.mobileNumber.trim()) {
                  const digitsOnly = formData.mobileNumber.replace(/\D/g, "");
                  if (digitsOnly.length !== 10) {
                    setErrors((prev) => ({
                      ...prev,
                      mobileNumber: "Mobile number must be exactly 10 digits",
                    }));
                  } else {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.mobileNumber;
                      return newErrors;
                    });
                  }
                }
              }}
              placeholder="Enter 10 digits"
              className={`w-full px-3 py-2 border rounded-md ${
                errors.mobileNumber ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.mobileNumber && (
              <p className="text-red-600 text-xs mt-1">
                {errors.mobileNumber}
              </p>
            )}
            {!errors.mobileNumber && (
              <p className="text-gray-500 text-xs mt-1">
                Optional. Enter exactly 10 digits.
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
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
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
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
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
                  : !isMailingAddressManuallyEdited && formData.preferredMailingAddress === formData.personalEmail && formData.personalEmail
                  ? "border-blue-300 bg-blue-50"
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
              {!isMailingAddressManuallyEdited && formData.preferredMailingAddress === formData.personalEmail && formData.personalEmail
                ? "Auto-filled from your personal email. You can change it if needed."
                : "Defaults to your personal email"}
            </p>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div>
        <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Academic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Class Of <span className="text-red-500">*</span>
            </label>
            <Select
              value={
                formData.classOf
                  ? CLASS_OF_YEARS.find((option) => option.value === formData.classOf)
                  : null
              }
              onChange={(selectedOption) => {
                if (selectedOption) {
                  handleClassOfChange(selectedOption.value);
                } else {
                  handleClassOfChange("");
                }
              }}
              options={CLASS_OF_YEARS}
              placeholder="Select or type to search year..."
              isSearchable
              isClearable
              className="react-select-container"
              classNamePrefix="react-select"
              styles={{
                control: (baseStyles, state) => ({
                  ...baseStyles,
                  borderColor: errors.classOf
                    ? "#ef4444"
                    : state.isFocused
                    ? "#3b82f6"
                    : "#d1d5db",
                  boxShadow: state.isFocused && !errors.classOf ? "0 0 0 1px #3b82f6" : "none",
                  "&:hover": {
                    borderColor: errors.classOf ? "#ef4444" : "#9ca3af",
                  },
                  minHeight: "42px",
                }),
                placeholder: (baseStyles) => ({
                  ...baseStyles,
                  color: "#9ca3af",
                }),
                menu: (baseStyles) => ({
                  ...baseStyles,
                  zIndex: 9999,
                }),
              }}
              theme={(theme) => ({
                ...theme,
                colors: {
                  ...theme.colors,
                  primary: "#3b82f6",
                  primary25: "#dbeafe",
                  primary50: "#bfdbfe",
                  primary75: "#93c5fd",
                },
              })}
            />
            {errors.classOf && (
              <p className="text-red-600 text-xs mt-1">{errors.classOf}</p>
            )}
          </div>

          {parseInt(formData.classOf) < 2017 && formData.classOf && (
            <div>
                <label className="block text-sm font-medium mb-1">
                  Matric Number <span className="text-red-500">*</span>
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
          Mentee CV (PDF, DOC, DOCX - Max 10MB)
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
        <div className="flex gap-2 mb-1.5">
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
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
        {formData.areasOfMentoring.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1.5">
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
        <h3 className="text-lg font-semibold mb-4">F&B Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
      </div> */}

      {/* Event Preferences */}
      <div>
        <h3 className="text-base font-semibold mb-2"></h3>
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

      {/* reCAPTCHA */}
      <div className="border-t pt-4">
        <label className="block text-sm font-medium mb-2">
          Security Verification {recaptchaSiteKey && <span className="text-red-500">*</span>}
        </label>
        {recaptchaSiteKey ? (
          <>
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={recaptchaSiteKey}
              onChange={handleRecaptchaChange}
              onExpired={handleRecaptchaExpired}
              onError={handleRecaptchaError}
            />
            {errors.recaptchaToken && (
              <p className="text-red-600 text-xs mt-1">{errors.recaptchaToken}</p>
            )}
          </>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> reCAPTCHA is not configured. The form will still work, but reCAPTCHA verification is disabled.
              To enable it, set <code className="bg-yellow-100 px-1 rounded">VITE_RECAPTCHA_SITE_KEY</code> in your environment variables.
            </p>
          </div>
        )}
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
      <div className="flex gap-3 pt-3 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? "Submitting..." : "Submit Registration"}
        </button>
      </div>
    </form>
  );
};

