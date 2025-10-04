// Custom hook for mentorship management logic
// Author: AI Assistant
// Purpose: Centralized state management and business logic for mentorship system

import { useState, useCallback } from "react";
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
}

export const useMentorshipManagement = (
  initialMentors: Mentor[] = []
): UseMentorshipManagementReturn => {
  // Core state
  const [mentors, setMentors] = useState<Mentor[]>(initialMentors);
  const [requests, setRequests] = useState<MentorshipRequest[]>([]);
  const [activeTab, setActiveTab] = useState("discover");
  const [openForm, setOpenForm] = useState(false);
  const [openRequestForm, setOpenRequestForm] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);

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

  // Memoized mentor actions
  const handleAddMentor = useCallback((mentor: Mentor) => {
    setMentors((prev) => [...prev, mentor]);
    setOpenForm(false);
  }, []);

  const handleUpdateMentor = useCallback(
    (mentorId: string, updatedMentor: Mentor) => {
      setMentors((prev) =>
        prev.map((mentor) =>
          mentor.name === mentorId ? updatedMentor : mentor
        )
      );
      setOpenForm(false);
    },
    []
  );

  const handleDeleteMentor = useCallback((mentorId: string) => {
    setMentors((prev) => prev.filter((mentor) => mentor.name !== mentorId));
  }, []);

  // Request management
  const handleRequestMentorship = useCallback((mentor: Mentor) => {
    setSelectedMentor(mentor);
    setOpenRequestForm(true);
  }, []);

  const handleSubmitRequest = useCallback(
    (formData: RequestFormData, mentor: Mentor) => {
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
      setOpenRequestForm(false);
      setSelectedMentor(null);
    },
    []
  );

  const handleApproveRequest = useCallback((requestId: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "Approved" } : request
      )
    );
  }, []);

  const handleRejectRequest = useCallback((requestId: string) => {
    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status: "Rejected" } : request
      )
    );
  }, []);

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
  };
};

export default useMentorshipManagement;
