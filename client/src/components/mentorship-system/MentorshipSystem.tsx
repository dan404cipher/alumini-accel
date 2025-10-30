// MentorshipSystem.tsx - Refactored to use structured components
// Author: AI Assistant
// Page: Refactored from monolithic mentorship.tsx (1327 lines) into structured system
// Purpose: Main orchestrator for the mentorship management system

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  UserCheck,
  TrendingUp,
  Star,
  Search,
  ChevronDown,
  X,
  Filter,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMentorshipManagement } from "./hooks/useMentorshipManagement";
import { categoryAPI } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MentorCard } from "./components/MentorCard";
import { RequestCard } from "./components/RequestCard";
import { MentorModal } from "./modals/MentorModal";
import { RequestModal } from "./modals/RequestModal";
import { MentorDetailsModal } from "./modals/MentorDetailsModal";
import { filterMentors, truncateText } from "./utils";
import type { Mentor } from "./types";

// Define mentorship interface locally
interface IMentorship {
  _id: string;
  domain: string;
  description: string;
  status: string;
  mentor: { _id: string; firstName: string; lastName: string };
  mentee: { _id: string; firstName: string; lastName: string };
  duration: number;
  goals: string[];
  startDate: string;
  endDate: string;
}
import MentorshipActionMenu from "../mentorship/MentorshipActionMenu";
import EditMentorshipDialog from "../dialogs/EditMentorshipDialog";
import DeleteMentorshipDialog from "../dialogs/DeleteMentorshipDialog";
import EditMentorDialog from "../dialogs/EditMentorDialog";
import DeleteMentorDialog from "../dialogs/DeleteMentorDialog";
import { useAuth } from "@/contexts/AuthContext";
import { mentorshipApi } from "@/services/mentorshipApi";
import { useToast } from "@/hooks/use-toast";

// Sample mentor data for demonstration
const sampleMentors: Mentor[] = [
  {
    name: "Sarah Chen",
    title: "Senior Software Engineer",
    company: "Google",
    yearsExp: 8,
    slots: 3,
    expertise: [
      "Full Stack Development",
      "Machine Learning",
      "Leadership",
      "React",
    ],
    style: "Collaborative, encouraging, and structured",
    hours: "Weekdays 6-8 PM EST",
    timezone: "UTC-5",
    testimonial:
      "I have mentored 15+ developers over the years, helping them land roles at top tech companies. My approach is to understand each mentee's unique goals and create customized learning plans.",
    rating: 4.9,
    mentees: 15,
  },
  {
    name: "Michael Rodriguez",
    title: "Product Manager",
    company: "Microsoft",
    yearsExp: 6,
    slots: 2,
    expertise: [
      "Product Strategy",
      "Agile Development",
      "User Research",
      "Team Leadership",
    ],
    style: "Strategic thinking with hands-on guidance",
    hours: "Weekends flexible",
    timezone: "UTC-8",
    testimonial:
      "Passionate about helping others transition into product management roles. I focus on practical skills and real-world projects.",
    rating: 4.8,
    mentees: 10,
  },
  {
    name: "Dr. Lisa Johnson",
    title: "Research Scientist",
    company: "MIT",
    yearsExp: 12,
    slots: 1,
    expertise: [
      "Research Methods",
      "Data Science",
      "Academic Writing",
      "PhD Guidance",
    ],
    style: "Academic rigor with mentorship focus",
    hours: "Weekdays 9-5 EST",
    timezone: "UTC-5",
    testimonial:
      "I specialize in mentoring graduate students and early-career researchers. My track record includes several successful PhD completions.",
    rating: 5.0,
    mentees: 8,
  },
];

/**
 * Main Mentorship Management System Component
 *
 * This component has been refactored from a single 1327-line file into a
 * structured mentorship system with the following architecture:
 *
 * - types/: All TypeScript interfaces and types
 * - utils/: Utility functions (validation, filtering, formatting)
 * - components/: Reusable UI components (MentorCard, RequestCard)
 * - modals/: Modal components (MentorModal, RequestModal)
 * - hooks/: Custom hooks for state management
 * - index.ts: Main export file
 *
 * Benefits:
 * - Better maintainability (split into focused files)
 * - Reusable components across the mentorship system
 * - Clean separation of concerns
 * - Easier testing and debugging
 * - Better code organization and readability
 */

const MentorshipSystem: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [industryOptions, setIndustryOptions] = useState<string[]>([]);

  // Mentorship management state
  const [myMentorships, setMyMentorships] = useState<IMentorship[]>([]);
  const [loadingMentorships, setLoadingMentorships] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedMentorship, setSelectedMentorship] =
    useState<IMentorship | null>(null);

  // Mentor management state
  const [showEditMentorDialog, setShowEditMentorDialog] = useState(false);
  const [showDeleteMentorDialog, setShowDeleteMentorDialog] = useState(false);
  const [selectedMentorForEdit, setSelectedMentorForEdit] =
    useState<Mentor | null>(null);

  // Mentor details modal state
  const [mentorDetailsModal, setMentorDetailsModal] = useState<{
    isOpen: boolean;
    mentor: Mentor | null;
  }>({
    isOpen: false,
    mentor: null,
  });

  const handleViewMentorDetails = (mentor: Mentor) => {
    setMentorDetailsModal({
      isOpen: true,
      mentor,
    });
  };

  const handleCloseMentorDetails = () => {
    setMentorDetailsModal({
      isOpen: false,
      mentor: null,
    });
  };

  // Load user's mentorships
  const loadMyMentorships = useCallback(async () => {
    if (!user?._id) return;

    setLoadingMentorships(true);
    try {
      const response = await mentorshipApi.getMyMentorships();

      if (response.success && response.data) {
        // Ensure data is an array
        const mentorships = Array.isArray(response.data) ? response.data : [];
        setMyMentorships(mentorships);
      } else {
        setMyMentorships([]);
      }
    } catch (error) {
      console.error("Error loading mentorships:", error);
      toast({
        title: "Error",
        description: "Failed to load mentorships",
        variant: "destructive",
      });
      setMyMentorships([]);
    } finally {
      setLoadingMentorships(false);
    }
  }, [user?._id, toast]);

  // Handle edit mentorship
  const handleEditMentorship = (mentorship: IMentorship) => {
    setSelectedMentorship(mentorship);
    setShowEditDialog(true);
  };

  // Handle delete mentorship
  const handleDeleteMentorship = (mentorship: IMentorship) => {
    setSelectedMentorship(mentorship);
    setShowDeleteDialog(true);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    loadMyMentorships();
    setShowEditDialog(false);
    setSelectedMentorship(null);
  };

  // Handle delete success
  const handleDeleteSuccess = () => {
    loadMyMentorships();
    setShowDeleteDialog(false);
    setSelectedMentorship(null);
  };

  // Handle edit mentor
  const handleEditMentor = (mentor: Mentor) => {
    setSelectedMentorForEdit(mentor);
    setShowEditMentorDialog(true);
  };

  // Handle delete mentor
  const handleDeleteMentor = (mentor: Mentor) => {
    setSelectedMentorForEdit(mentor);
    setShowDeleteMentorDialog(true);
  };

  // Handle mentor edit success
  const handleMentorEditSuccess = () => {
    // TODO: Refresh mentors list
    setShowEditMentorDialog(false);
    setSelectedMentorForEdit(null);
  };

  // Handle mentor delete success
  const handleMentorDeleteSuccess = () => {
    // Remove the deleted mentor from the mentors list
    if (selectedMentorForEdit) {
      setMentors((prevMentors) =>
        prevMentors.filter(
          (mentor) => mentor.userId !== selectedMentorForEdit.userId
        )
      );
    }
    setShowDeleteMentorDialog(false);
    setSelectedMentorForEdit(null);
  };

  // Load mentorships on component mount
  useEffect(() => {
    loadMyMentorships();
  }, [loadMyMentorships]);

  // Load mentorship industries from categories
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await categoryAPI.getAll({
          entityType: "mentorship_category",
        });
        const names = Array.isArray(res.data)
          ? (res.data as any[])
              .filter((c) => c && typeof c.name === "string")
              .map((c) => c.name as string)
          : [];
        if (mounted) setIndustryOptions(names);
      } catch (_e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const {
    // State: mentors, requests, activeTab, openForm, openRequestForm, selectedMentor, contentModal, filters
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

    // Actions
    handleAddMentor,
    handleRequestMentorship,
    handleSubmitRequest,
    handleApproveRequest,
    handleRejectRequest,
    handleOpenContentModal,
    handleCloseContentModal,
    updateFilters,
    setActiveTab,
    setOpenForm,
    setOpenRequestForm,
    refreshData,
  } = useMentorshipManagement(sampleMentors);

  // Get filtered mentors
  const filteredMentors = filterMentors(mentors, filters);

  return (
    <div className="flex gap-6 h-screen w-full overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <div
        className={`
        ${sidebarOpen ? "fixed inset-y-0 left-0 z-50" : "hidden lg:block"}
        w-80 flex-shrink-0 bg-background
      `}
      >
        <div className="sticky top-0 h-screen overflow-y-auto p-6">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Filter className="w-5 h-5 mr-2" />
                  Mentorship
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>Connect with professionals</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Mentors */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Mentors</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search mentors, companies, skills..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      updateFilters({ searchTerm: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Industry Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Select
                  value={filters.selectedIndustry || "__all__"}
                  onValueChange={(v) =>
                    updateFilters({ selectedIndustry: v === "__all__" ? "" : v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Industries</SelectItem>
                    {industryOptions.length === 0 ? null : (
                      industryOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))
                    )}
                    {industryOptions.length === 0 && (
                      <SelectItem value="__noopts__" disabled>
                        No saved categories
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select
                  value={filters.selectedExperienceLevel || "__all__"}
                  onValueChange={(v) =>
                    updateFilters({
                      selectedExperienceLevel: v === "__all__" ? "" : v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Levels</SelectItem>
                    <SelectItem value="Entry Level">Entry Level</SelectItem>
                    <SelectItem value="Mid Level">Mid Level</SelectItem>
                    <SelectItem value="Senior Level">Senior Level</SelectItem>
                    <SelectItem value="Expert Level">Expert Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Register as Mentor Button */}
              <Button
                onClick={() => setOpenForm(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Register as Mentor
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="py-4 px-2 sm:py-6 sm:px-4 lg:px-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 gap-4">
                {/* <div className="flex-1">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                    <span className="break-words">Mentorship Program</span>
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl">
                    Connect with experienced professionals and accelerate your
                    career growth
                  </p>
                </div> */}

                <div className="flex-shrink-0 lg:hidden">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                    className="lg:hidden"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                <div className="flex items-center gap-3 p-3 sm:p-4 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {mentors.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Available Mentors
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {requests.length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Mentorship Requests
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 sm:p-4 bg-purple-50 rounded-lg">
                  <Star className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">
                      {requests.filter((r) => r.status === "Approved").length}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">
                      Active Mentorships
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden bg-white rounded-lg shadow-sm mb-4">
            <div className="flex">
              <button
                onClick={() => setActiveTab("discover")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "discover"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Discover Mentors
              </button>
              <button
                onClick={() => setActiveTab("requests")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "requests"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Requests
              </button>
              <button
                onClick={() => setActiveTab("active")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition ${
                  activeTab === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                Active
              </button>
            </div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:block bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab("discover")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === "discover"
                      ? "border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  Discover Mentors
                </button>
                <button
                  onClick={() => setActiveTab("requests")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === "requests"
                      ? "border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  Mentorship Requests
                </button>
                <button
                  onClick={() => setActiveTab("active")}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition ${
                    activeTab === "active"
                      ? "border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-gray-900 border-transparent"
                  }`}
                >
                  Active Mentorships
                </button>
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "discover" && (
            <div>
              {/* Loading State */}
              {loading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 text-lg">Loading mentors...</p>
                </div>
              )}

              {/* Error State */}
              {error && !loading && (
                <div className="text-center py-12">
                  <div className="text-red-600 text-6xl mb-4">⚠️</div>
                  <p className="text-red-600 text-lg mb-2">
                    Failed to load mentors
                  </p>
                  <p className="text-gray-500 mb-4">{error}</p>
                  <button
                    onClick={refreshData}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Mentor Grid */}
              {!loading && !error && (
                <div>
                  {filteredMentors.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 text-lg">
                        No mentors found matching your criteria
                      </p>
                      <p className="text-gray-500 mt-2">
                        Try adjusting your search or filters
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                      {filteredMentors.map((mentor, index) => (
                        <MentorCard
                          key={index}
                          mentor={mentor}
                          onShowStyle={(style) =>
                            handleOpenContentModal("Mentoring Style", style)
                          }
                          onShowTestimonial={(testimonial) =>
                            handleOpenContentModal("Success Story", testimonial)
                          }
                          onRequestMentorship={() =>
                            handleRequestMentorship(mentor)
                          }
                          onViewDetails={handleViewMentorDetails}
                          onEdit={handleEditMentor}
                          onDelete={handleDeleteMentor}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "requests" && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Mentorship Requests
                </h2>
                {requests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No mentorship requests yet.</p>
                  </div>
                ) : (
                  <div>
                    {requests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        onApprove={handleApproveRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "active" && (
            <div className="bg-white border rounded-lg shadow-sm">
              <div className="p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  My Mentorships
                </h2>
                {loadingMentorships ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading mentorships...</p>
                  </div>
                ) : !Array.isArray(myMentorships) ||
                  myMentorships.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">No mentorships found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myMentorships.map((mentorship) => (
                      <div
                        key={mentorship._id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {mentorship.domain}
                              </h3>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  mentorship.status === "active"
                                    ? "bg-green-100 text-green-800"
                                    : mentorship.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {mentorship.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-2">
                              {mentorship.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>
                                <strong>Mentor:</strong>{" "}
                                {mentorship.mentor?.firstName}{" "}
                                {mentorship.mentor?.lastName}
                              </span>
                              <span>
                                <strong>Mentee:</strong>{" "}
                                {mentorship.mentee?.firstName}{" "}
                                {mentorship.mentee?.lastName}
                              </span>
                              {mentorship.duration && (
                                <span>
                                  <strong>Duration:</strong>{" "}
                                  {mentorship.duration} weeks
                                </span>
                              )}
                            </div>
                            {mentorship.goals &&
                              mentorship.goals.length > 0 && (
                                <div className="mt-2">
                                  <strong className="text-sm text-gray-700">
                                    Goals:
                                  </strong>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {mentorship.goals.map(
                                      (goal: string, index: number) => (
                                        <span
                                          key={index}
                                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                        >
                                          {goal}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                          <div className="ml-4">
                            <MentorshipActionMenu
                              mentorship={mentorship}
                              currentUser={user}
                              onEdit={() => handleEditMentorship(mentorship)}
                              onDelete={() =>
                                handleDeleteMentorship(mentorship)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modals */}
          <MentorModal
            isOpen={openForm}
            onClose={() => setOpenForm(false)}
            onSave={handleAddMentor}
          />

          <RequestModal
            isOpen={openRequestForm}
            onClose={() => setOpenRequestForm(false)}
            onSubmit={(formData) =>
              selectedMentor && handleSubmitRequest(formData, selectedMentor)
            }
            selectedMentor={selectedMentor}
          />

          {/* Full Content Modal */}
          {contentModal.open && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[65] p-4">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-5 relative max-h-[80vh] overflow-y-auto">
                <button
                  onClick={handleCloseContentModal}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <X size={20} />
                </button>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {contentModal.title}
                </h3>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {contentModal.content}
                </div>
                <div className="mt-6 text-right">
                  <button
                    onClick={handleCloseContentModal}
                    className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mentor Details Modal */}
          <MentorDetailsModal
            isOpen={mentorDetailsModal.isOpen}
            onClose={handleCloseMentorDetails}
            mentor={mentorDetailsModal.mentor}
            onRequestMentorship={handleRequestMentorship}
          />

          {/* Edit Mentorship Dialog */}
          <EditMentorshipDialog
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            mentorship={selectedMentorship}
            onSuccess={handleEditSuccess}
          />

          {/* Delete Mentorship Dialog */}
          <DeleteMentorshipDialog
            open={showDeleteDialog}
            onOpenChange={setShowDeleteDialog}
            mentorship={selectedMentorship}
            onSuccess={handleDeleteSuccess}
          />

          {/* Edit Mentor Dialog */}
          <EditMentorDialog
            open={showEditMentorDialog}
            onOpenChange={setShowEditMentorDialog}
            mentor={selectedMentorForEdit}
            onSuccess={handleMentorEditSuccess}
          />

          {/* Delete Mentor Dialog */}
          <DeleteMentorDialog
            open={showDeleteMentorDialog}
            onOpenChange={setShowDeleteMentorDialog}
            mentor={selectedMentorForEdit}
            onSuccess={handleMentorDeleteSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default MentorshipSystem;
