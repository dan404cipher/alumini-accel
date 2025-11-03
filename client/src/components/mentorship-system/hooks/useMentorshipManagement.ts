// Custom hook for mentorship management logic
// Author: AI Assistant
// Purpose: Centralized state management and business logic for mentorship system

import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { mentorshipApi } from "@/services/mentorshipApi";
import type {
  Mentor,
  MentorshipRequest,
  RequestFormData,
  MentorshipFilters,
  ContentModalProps,
} from "../types";
import * as utils from "../utils";

interface UseMentorshipManagementReturn {
  // State
  mentors: Mentor[];
  requests: MentorshipRequest[];
  activeTab: string;
  openForm: boolean;
  openRequestForm: boolean;
  selectedMentor: Mentor | null;
  contentModal: ContentModalProps;
  filters: MentorshipFilters;
  loading: boolean;
  error: string | null;

  // Setters
  setMentors: (mentors: Mentor[]) => void;
  setRequests: (requests: MentorshipRequest[]) => void;
  setActiveTab: (tab: string) => void;
  setOpenForm: (open: boolean) => void;
  setOpenRequestForm: (open: boolean) => void;
  setSelectedMentor: (mentor: Mentor | null) => void;

  // Actions
  handleAddMentor: (mentor: Mentor) => void;
  handleUpdateMentor: (mentorId: string, updatedMentor: Mentor) => void;
  handleDeleteMentor: (mentorId: string) => void;
  handleRequestMentorship: (mentor: Mentor) => void;
  handleSubmitRequest: (formData: RequestFormData, mentor: Mentor) => void;
  handleApproveRequest: (requestId: string) => void;
  handleRejectRequest: (requestId: string) => void;
  handleOpenContentModal: (title: string, content: string) => void;
  handleCloseContentModal: () => void;
  updateFilters: (newFilters: Partial<MentorshipFilters>) => void;
  getMentorshipStats: () => {
    totalMentors: number;
    totalRequests: number;
    activeMentorships: number;
  };
  refreshData: () => Promise<void>;
}

export const useMentorshipManagement = (
  initialMentors: Mentor[] = []
): UseMentorshipManagementReturn => {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // Core state
  const [mentors, setMentors] = useState<Mentor[]>(initialMentors);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [openForm, setOpenForm] = useState(false);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [contentModal, setContentModal] = useState<ContentModalProps>({
    open: false,
    title: "",
    content: "",
  });

  // Filter state
  const [filters, setFilters] = useState<MentorshipFilters>({
    searchTerm: "",
    selectedIndustry: "",
    selectedExperienceLevel: "",
  });

  // Transform API mentor data to frontend format
  const transformMentorFromApi = (apiMentor: any): Mentor => {
    return {
      userId: apiMentor.userId?._id || apiMentor.userId, // Add userId for API calls
      name:
        `${apiMentor.userId?.firstName || ""} ${
          apiMentor.userId?.lastName || ""
        }`.trim() || "Unknown Mentor",
      title: apiMentor.currentPosition || "Professional",
      company: apiMentor.currentCompany || "Unknown Company",
      yearsExp: apiMentor.experience || 0,
      slots: apiMentor.availableSlots?.length || 1,
      expertise: apiMentor.mentorshipDomains || [],
      style: "Collaborative and supportive", // This field is not stored in AlumniProfile
      hours: "Flexible", // This field is not stored in AlumniProfile
      timezone: "UTC", // This field is not stored in AlumniProfile
      testimonial:
        apiMentor.testimonials?.[0]?.content ||
        "Experienced professional ready to help",
      rating: 4.5, // Default rating since it's not stored
      mentees: 0, // Default mentees count
      profile: apiMentor.userId?.profilePicture || "",
      availableSlots: apiMentor.availableSlots || [],
    };
  };

  // Transform API mentorship request to frontend format
  const transformRequestFromApi = (apiRequest: any): MentorshipRequest => {
    return {
      id: apiRequest._id || utils.generateRequestId(),
      applicantName:
        `${apiRequest.mentee?.firstName || ""} ${
          apiRequest.mentee?.lastName || ""
        }`.trim() || "Unknown Applicant",
      applicantProfile: apiRequest.mentee?.profilePicture || "",
      applicantEducation: apiRequest.mentee?.education || "Student",
      applicantYear: apiRequest.mentee?.graduationYear || "2024",
      mentorName:
        `${apiRequest.mentor?.firstName || ""} ${
          apiRequest.mentor?.lastName || ""
        }`.trim() || "Unknown Mentor",
      mentorTitle: apiRequest.mentor?.title || "Professional",
      mentorCompany: apiRequest.mentor?.company || "Unknown Company",
      careerGoals: Array.isArray(apiRequest.goals)
        ? apiRequest.goals.join(", ")
        : apiRequest.goals || "",
      challenges: apiRequest.description || "",
      background: apiRequest.background || "",
      expectations: apiRequest.expectations || "",
      timeCommitment: apiRequest.timeCommitment || "Flexible",
      communicationMethod: apiRequest.communicationMethod || "Email",
      specificQuestions: apiRequest.specificQuestions || "",
      status:
        apiRequest.status === "PENDING"
          ? "Pending"
          : apiRequest.status === "ACCEPTED"
          ? "Approved"
          : apiRequest.status === "REJECTED"
          ? "Rejected"
          : "Pending",
      submittedAt: new Date(apiRequest.createdAt || Date.now()),
    };
  };

  // Load mentors from API
  const loadMentors = async () => {
    try {
      setLoading(true);
      setError(null);

      const isApiAvailable = await mentorshipApi.checkApiHealth();

      if (isApiAvailable) {
        const response = await mentorshipApi.getMentors();
        if (response.success && response.data) {
          const mentorsData = response.data.alumni || [];
          const transformedMentors = mentorsData.map(transformMentorFromApi);
          setMentors(transformedMentors);
        }
      } else {
        // Fallback to initial mentors if API is not available
        setMentors(initialMentors);
      }
    } catch (error) {
      console.error("Error loading mentors:", error);
      setError("Failed to load mentors");
      // Fallback to initial mentors
      setMentors(initialMentors);
    } finally {
      setLoading(false);
    }
  };

  // Load mentorship requests from API
  const loadRequests = async () => {
    try {
      const isApiAvailable = await mentorshipApi.checkApiHealth();

      if (isApiAvailable) {
        const response = await mentorshipApi.getMyMentorships();
        if (response.success && response.data) {
          const requestsData = response.data.mentorships || [];
          // Show INCOMING requests for the current user (where they are the mentor)
          const userRequests = requestsData.filter((request: any) => {
            return request.mentorId === currentUser?._id;
          });
          const transformedRequests = userRequests.map(transformRequestFromApi);
          setRequests(transformedRequests);
        }
      }
    } catch (error) {
      console.error("Error loading mentorship requests:", error);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadMentors();
    loadRequests();
  }, []);

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([loadMentors(), loadRequests()]);
  };

  // Memoized mentor actions
  const handleAddMentor = useCallback(
    async (mentor: Mentor) => {
      // Check if user is a student - students cannot register as mentors
      if (currentUser?.role === "student") {
        toast({
          title: "Restriction",
          description: "Students cannot register as mentors. Please contact your administrator if you need to update your role.",
          variant: "destructive",
          duration: 5000,
        });
        setOpenForm(false);
        return;
      }

      try {
        // Transform mentor data to API format
        const mentorData = {
          mentorshipDomains: mentor.expertise,
          mentoringStyle: mentor.style,
          availableHours: mentor.hours,
          timezone: mentor.timezone,
          bio: mentor.testimonial,
          currentPosition: mentor.title, // Add title/position
          currentCompany: mentor.company, // Add company
          experience: mentor.yearsExp, // Add experience
          testimonials: mentor.testimonial
            ? [
                {
                  content: mentor.testimonial,
                  author: "Self",
                  date: new Date(),
                },
              ]
            : [],
          availableSlots: (mentor.availableSlots || []).map((slot: any) => ({
            day: slot.day,
            timeSlots: slot.timeSlots || [],
            startDate: slot.startDate ? new Date(slot.startDate) : undefined,
            endDate: slot.endDate ? new Date(slot.endDate) : undefined,
          })),
        };

        const isApiAvailable = await mentorshipApi.checkApiHealth();

        if (isApiAvailable) {
          const response = await mentorshipApi.registerAsMentor(mentorData);

          if (response.success) {
            // Check if this was an update or new registration
            if (response.message?.includes("updated")) {
              toast({
                title: "Mentor Information Updated",
                description: `${mentor.name}'s mentor profile has been updated successfully.`,
                duration: 3000,
              });
            } else {
              toast({
                title: "Mentor Registered",
                description: `${mentor.name} has been successfully registered as a mentor.`,
                duration: 3000,
              });
            }

            // Refresh mentors to show the updated information
            await loadMentors();
          } else {
            // Handle specific error cases
            if (response.message?.includes("Alumni profile not found")) {
              toast({
                title: "Profile Required",
                description:
                  "Please create your alumni profile first before registering as a mentor.",
                variant: "destructive",
                duration: 5000,
              });
            } else {
              toast({
                title: "Registration Failed",
                description:
                  response.message ||
                  "Failed to register as mentor. Please try again.",
                variant: "destructive",
                duration: 5000,
              });
            }
          }
        } else {
          // Fallback to local state if API is not available
          setMentors((prev) => [...prev, mentor]);
          toast({
            title: "Mentor Added",
            description: `${mentor.name} has been added to the mentorship program.`,
            duration: 3000,
          });
        }

        setOpenForm(false);
      } catch (error) {
        console.error("Error adding mentor:", error);
        toast({
          title: "Error",
          description: "Failed to register as mentor. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast, loadMentors]
  );

  const handleUpdateMentor = useCallback(
    async (mentorId: string, updatedMentor: Mentor) => {
      try {
        setMentors((prev) =>
          prev.map((mentor) =>
            mentor.name === mentorId ? updatedMentor : mentor
          )
        );
        setOpenForm(false);
        toast({
          title: "Mentor Updated",
          description: `${updatedMentor.name}'s profile has been updated.`,
          duration: 3000,
        });
      } catch (error) {
        console.error("Error updating mentor:", error);
        toast({
          title: "Error",
          description: "Failed to update mentor. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  const handleDeleteMentor = useCallback(
    async (mentorId: string) => {
      try {
        setMentors((prev) => prev.filter((mentor) => mentor.name !== mentorId));
        toast({
          title: "Mentor Removed",
          description: "Mentor has been removed from the program.",
          duration: 3000,
        });
      } catch (error) {
        console.error("Error deleting mentor:", error);
        toast({
          title: "Error",
          description: "Failed to remove mentor. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  // Request management
  const handleRequestMentorship = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setOpenRequestForm(true);
  }, []);

  const handleSubmitRequest = useCallback(
    async (formData: RequestFormData, mentor: Mentor) => {
      try {
        // Create mentorship request via API
        const isApiAvailable = await mentorshipApi.checkApiHealth();

        if (isApiAvailable) {
          const requestData = {
            mentorId: mentor.userId, // Use the actual userId from mentor object
            domain: formData.careerGoals,
            description: formData.challenges, // Map challenges to description
            goals: [formData.careerGoals], // Convert string to array
            background: formData.background,
            expectations: formData.expectations,
            specificQuestions: formData.specificQuestions,
            timeCommitment: formData.timeCommitment,
            communicationMethod: formData.communicationMethod,
            startDate: new Date().toISOString(), // Add required start date
          };

          const response = await mentorshipApi.createMentorship(requestData);

          if (response.success) {
            toast({
              title: "Request Submitted",
              description: `Your mentorship request to ${mentor.name} has been submitted successfully.`,
              duration: 3000,
            });

            // Refresh requests to show the new one
            await loadRequests();
          }
        } else {
          // Fallback to local state if API is not available
          const requestData: MentorshipRequest = {
            id: utils.generateRequestId(),
            applicantName: formData.applicantName,
            applicantProfile: formData.applicantProfile,
            applicantEducation: formData.applicantEducation,
            applicantYear: formData.applicantYear,
            mentorName: mentor.name,
            mentorTitle: mentor.title,
            mentorCompany: mentor.company,
            careerGoals: formData.careerGoals,
            challenges: formData.challenges,
            background: formData.background,
            expectations: formData.expectations,
            timeCommitment: formData.timeCommitment,
            communicationMethod: formData.communicationMethod,
            specificQuestions: formData.specificQuestions,
            status: "Pending",
            submittedAt: new Date(),
          };

          setRequests((prev) => [...prev, requestData]);
          toast({
            title: "Request Submitted",
            description: `Your mentorship request to ${mentor.name} has been submitted successfully.`,
            duration: 3000,
          });
        }

        setOpenRequestForm(false);
        setSelectedMentor(null);
      } catch (error) {
        console.error("Error submitting request:", error);
        toast({
          title: "Error",
          description: "Failed to submit mentorship request. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  const handleApproveRequest = useCallback(
    async (requestId: string) => {
      try {
        const isApiAvailable = await mentorshipApi.checkApiHealth();

        if (isApiAvailable) {
          const response = await mentorshipApi.acceptMentorship(requestId);

          if (response.success) {
            toast({
              title: "Request Approved",
              description: "Mentorship request has been approved.",
              duration: 3000,
            });

            // Refresh requests to show updated status
            await loadRequests();
          }
        } else {
          // Fallback to local state
          setRequests((prev) =>
            prev.map((request) =>
              request.id === requestId
                ? { ...request, status: "Approved" }
                : request
            )
          );
          toast({
            title: "Request Approved",
            description: "Mentorship request has been approved.",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error approving request:", error);
        toast({
          title: "Error",
          description: "Failed to approve request. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        const isApiAvailable = await mentorshipApi.checkApiHealth();

        if (isApiAvailable) {
          const response = await mentorshipApi.rejectMentorship(requestId);

          if (response.success) {
            toast({
              title: "Request Rejected",
              description: "Mentorship request has been rejected.",
              duration: 3000,
            });

            // Refresh requests to show updated status
            await loadRequests();
          }
        } else {
          // Fallback to local state
          setRequests((prev) =>
            prev.map((request) =>
              request.id === requestId
                ? { ...request, status: "Rejected" }
                : request
            )
          );
          toast({
            title: "Request Rejected",
            description: "Mentorship request has been rejected.",
            duration: 3000,
          });
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
        toast({
          title: "Error",
          description: "Failed to reject request. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      }
    },
    [toast]
  );

  // Content modal management
  const handleOpenContentModal = useCallback(
    (title: string, content: string) => {
      setContentModal({
        open: true,
        title,
        content,
      });
    },
    []
  );

  const handleCloseContentModal = useCallback(() => {
    setContentModal({
      open: false,
      title: "",
      content: "",
    });
  }, []);

  // Filter management
  const updateFilters = useCallback(
    (newFilters: Partial<MentorshipFilters>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    []
  );

  // Statistics calculation
  const getMentorshipStats = useCallback(() => {
    return {
      totalMentors: mentors.length,
      totalRequests: requests.length,
      activeMentorships: requests.filter(
        (request) => request.status === "Approved"
      ).length,
    };
  }, [mentors.length, requests]);

  return {
    // State
    mentors,
    requests,
    activeTab,
    openForm,
    openRequestForm,
    selectedMentor,
    contentModal,
    filters,
    loading,
    error,

    // Setters
    setMentors,
    setRequests,
    setActiveTab,
    setOpenForm,
    setOpenRequestForm,
    setSelectedMentor,

    // Actions
    handleAddMentor,
    handleUpdateMentor,
    handleDeleteMentor,
    handleRequestMentorship,
    handleSubmitRequest,
    handleApproveRequest,
    handleRejectRequest,
    handleOpenContentModal,
    handleCloseContentModal,
    updateFilters,
    getMentorshipStats,
    refreshData,
  };
};

export default useMentorshipManagement;
