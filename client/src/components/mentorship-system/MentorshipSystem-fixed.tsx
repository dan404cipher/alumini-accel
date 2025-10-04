// MentorshipSystem.tsx - Refactored to use structured components
// Author: AI Assistant
// Page: Refactored from monolithic mentorship.tsx (1327 lines) into structured system
// Purpose: Main orchestrator for the mentorship management system

import React from "react";
import {
  Users,
  UserCheck,
  TrendingUp,
  Star,
  Search,
  ChevronDown,
  X,
} from "lucide-react";
import { useMentorshipManagement } from "./hooks/useMentorshipManagement";
import { MentorCard } from "./components/MentorCard";
import { RequestCard } from "./components/RequestCard";
import { MentorModal } from "./modals/MentorModal";
import { RequestModal } from "./modals/RequestModal";
import { filterMentors, truncateText } from "./utils";
import type { Mentor } from "./types";

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
    mentores: 15,
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
    mentores: 10,
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
    mentores: 8,
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
  const {
    // State
    mentors,
    requests,
    activeTab,
    openForm,
    openRequestForm,
    selectedMentor,
    contentModal,

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
  } = useMentorshipManagement(sampleMentors);

  // Get filtered mentors
  const filteredMentors = filterMentors(mentors, filters);

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full px-2 sm:px-4 lg:px-6 xl:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl xl:text-4xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                  <span className="break-words">Mentorship Program</span>
                </h1>
                <p className="text-sm sm:text-base text-gray-600 mt-2 max-w-2xl">
                  Connect with experienced professionals and accelerate your
                  career growth
                </p>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={() => setOpenForm(true)}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">
                    Register as Mentor
                  </span>
                </button>
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
            {/* Filters */}
            <div className="bg-white border rounded-lg p-3 sm:p-4 mb-4 shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {/* Search Bar */}
                <div className="sm:col-span-2 lg:col-span-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search mentors, companies, skills..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Industry Filter */}
                <div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">All Industries</option>
                    <option value="Technology">Technology</option>
                    <option value="Education">Education</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>

                <div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="">All Levels</option>
                    <option value="Entry Level">Entry Level</option>
                    <option value="Mid Level">Mid Level</option>
                    <option value="Senior Level">Senior Level</option>
                    <option value="Expert Level">Expert Level</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mentor Grid */}
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
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="bg-white border rounded-lg shadow-sm">
            <div className="p-4">
              <h2 className="text-lg font-semibold mb-4">
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
              <h2 className="text-lg font-semibold mb-4">Active Mentorships</h2>
              <p className="text-gray-600">No active mentorships yet.</p>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
      </div>
    </div>
  );
};

export default MentorshipSystem;
