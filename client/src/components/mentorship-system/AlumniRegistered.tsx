import React, { useState, useEffect, useRef } from "react";
import { Calendar, Clock, BookOpen, User, GraduationCap, MessageSquare } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface AlumniRegisteredProps {
  onClose?: () => void;
}

interface MentorRegistration {
  _id: string;
  programId: {
    _id: string;
    name: string;
    category: string;
    status: string;
    programDuration: {
      startDate: string;
      endDate: string;
    };
  };
  submittedAt: string;
  areasOfMentoring: string[];
  status: string;
}

interface MenteeRegistration {
  _id: string;
  programId: {
    _id: string;
    name: string;
    category: string;
    status: string;
    programDuration: {
      startDate: string;
      endDate: string;
    };
  };
  submittedAt: string;
  areasOfMentoring: string[];
  status: string;
}

interface Mentee {
  _id: string;
  matchId: string;
  mentee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    profilePicture?: string;
  } | null;
  registration: {
    _id: string;
    firstName: string;
    lastName: string;
    personalEmail: string;
    classOf: number;
    areasOfMentoring: string[];
    preferredMailingAddress: string;
    mobileNumber?: string;
    dateOfBirth?: string;
  } | null;
  program: {
    _id: string;
    name: string;
    category: string;
  } | null;
  matchedAt: string;
  status: string;
}

export const AlumniRegistered: React.FC<AlumniRegisteredProps> = ({ onClose }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"mentor" | "mentee">("mentor");
  const [mentorRegistrations, setMentorRegistrations] = useState<MentorRegistration[]>([]);
  const [menteeRegistrations, setMenteeRegistrations] = useState<MenteeRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const isInitialMount = useRef(true);

  // Restore active tab from URL params when component mounts or URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl === "mentor" || tabFromUrl === "mentee") {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  // Fetch both registrations on component mount
  useEffect(() => {
    fetchAllRegistrations();
    isInitialMount.current = false;
  }, []);

  // Fetch active tab's registrations when tab changes (for refreshing, but skip on initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
    fetchRegistrations();
    }
  }, [activeTab]);

  // Fetch all registrations (both mentor and mentee) on initial load
  const fetchAllRegistrations = async () => {
    setLoading(true);
    try {
      // Fetch both mentor and mentee registrations in parallel
      const [mentorResponse, menteeResponse] = await Promise.all([
        api.get("/mentor-registrations/my", {
          params: { limit: 100 },
        }),
        api.get("/mentee-registrations/my", {
          params: { limit: 100 },
        }),
      ]);

      if (mentorResponse.data?.success && mentorResponse.data?.data?.registrations) {
        setMentorRegistrations(mentorResponse.data.data.registrations);
      }

      if (menteeResponse.data?.success && menteeResponse.data?.data?.registrations) {
        setMenteeRegistrations(menteeResponse.data.data.registrations);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch registrations for the active tab (used when switching tabs)
  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      if (activeTab === "mentor") {
        const response = await api.get("/mentor-registrations/my", {
          params: { limit: 100 },
        });
        if (response.data?.success && response.data?.data?.registrations) {
          setMentorRegistrations(response.data.data.registrations);
        }
      } else {
        const response = await api.get("/mentee-registrations/my", {
          params: { limit: 100 },
        });
        if (response.data?.success && response.data?.data?.registrations) {
          setMenteeRegistrations(response.data.data.registrations);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch registrations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "submitted":
        return "bg-yellow-100 text-yellow-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleProgramClick = (programId: string, registrationType: "mentor" | "mentee") => {
    const currentPath = window.location.pathname;
    const returnUrl = `${currentPath}?view=registered`;
    navigate(
      `/registered-program-detail?programId=${programId}&type=${registrationType}&returnUrl=${encodeURIComponent(returnUrl)}`
    );
  };

  const handleChatClick = (e: React.MouseEvent, programId: string, registrationType: "mentor" | "mentee") => {
    e.stopPropagation(); // Prevent triggering the card click
    const currentPath = window.location.pathname;
    // Preserve the active tab in the return URL
    const returnUrl = `${currentPath}?view=registered&tab=${activeTab}`;
    navigate(
      `/registered-program-detail?programId=${programId}&type=${registrationType}&returnUrl=${encodeURIComponent(returnUrl)}&tab=chats`
    );
  };

  const isProgramStarted = (startDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const programStart = new Date(startDate);
    programStart.setHours(0, 0, 0, 0);
    return today >= programStart;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">My Registrations</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab("mentor")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "mentor"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Mentor ({mentorRegistrations.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab("mentee")}
            className={`px-4 py-2 font-medium text-sm transition-colors ${
              activeTab === "mentee"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Mentee ({menteeRegistrations.length})
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : activeTab === "mentor" ? (
        <div className="space-y-4">
          {mentorRegistrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>You haven't registered as a mentor for any programs yet.</p>
            </div>
          ) : (
            mentorRegistrations.map((registration) => (
              <div
                key={registration._id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {registration.programId?.name || "Unknown Program"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {registration.programId?.category || "No category"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      registration.status
                    )}`}
                  >
                    {registration.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Registration Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(
                          new Date(registration.submittedAt),
                          "MMM dd, yyyy 'at' hh:mm a"
                        )}
                      </p>
                    </div>
                  </div>

                  {registration.programId?.programDuration && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Program Duration</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(
                            new Date(registration.programId.programDuration.startDate),
                            "MMM dd, yyyy"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(registration.programId.programDuration.endDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {registration.areasOfMentoring &&
                  registration.areasOfMentoring.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                        <p className="text-xs font-semibold text-gray-700">
                          Areas of Mentoring:
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {registration.areasOfMentoring.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Program Group Chat Button - Only show if program has started */}
                {registration.programId?.programDuration?.startDate &&
                  isProgramStarted(registration.programId.programDuration.startDate) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={(e) =>
                          registration.programId?._id &&
                          handleChatClick(e, registration.programId._id, "mentor")
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Program Group Chat
                      </Button>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {menteeRegistrations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>You haven't registered as a mentee for any programs yet.</p>
            </div>
          ) : (
            menteeRegistrations.map((registration) => (
              <div
                key={registration._id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {registration.programId?.name || "Unknown Program"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {registration.programId?.category || "No category"}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(
                      registration.status
                    )}`}
                  >
                    {registration.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Registration Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {format(
                          new Date(registration.submittedAt),
                          "MMM dd, yyyy 'at' hh:mm a"
                        )}
                      </p>
                    </div>
                  </div>

                  {registration.programId?.programDuration && (
                    <div className="flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Program Duration</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(
                            new Date(registration.programId.programDuration.startDate),
                            "MMM dd, yyyy"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(registration.programId.programDuration.endDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {registration.areasOfMentoring &&
                  registration.areasOfMentoring.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start gap-2 mb-2">
                        <BookOpen className="w-4 h-4 text-gray-400 mt-0.5" />
                        <p className="text-xs font-semibold text-gray-700">
                          Areas I Want to Learn:
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {registration.areasOfMentoring.map((area, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Program Group Chat Button - Only show if program has started */}
                {registration.programId?.programDuration?.startDate &&
                  isProgramStarted(registration.programId.programDuration.startDate) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={(e) =>
                          registration.programId?._id &&
                          handleChatClick(e, registration.programId._id, "mentee")
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        size="sm"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Program Group Chat
                      </Button>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

