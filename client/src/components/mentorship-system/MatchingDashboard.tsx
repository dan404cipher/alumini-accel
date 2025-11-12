import React, { useState, useEffect } from "react";
import {
  Play,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  UserPlus,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useNavigate } from "react-router-dom";

interface MatchingDashboardProps {
  programId?: string;
  onClose?: () => void;
  hideBackButton?: boolean;
}

export const MatchingDashboard: React.FC<MatchingDashboardProps> = ({ onClose, hideBackButton = false }) => {
  const [searchParams] = useSearchParams();
  const programIdFromUrl = searchParams.get("programId") || "";
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [selectedProgram, setSelectedProgram] = useState<string>(programIdFromUrl);
  const [programs, setPrograms] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [unmatchedMentees, setUnmatchedMentees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningMatching, setRunningMatching] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  const [selectedMentee, setSelectedMentee] = useState<any>(null);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [availableMentors, setAvailableMentors] = useState<any[]>([]);
  const [creatingMatch, setCreatingMatch] = useState(false);

  useEffect(() => {
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (selectedProgram) {
      fetchStatistics();
      fetchMatches();
      fetchUnmatchedMentees();
    } else {
      setMatches([]);
      setStatistics(null);
      setUnmatchedMentees([]);
    }
  }, [selectedProgram]);

  const fetchPrograms = async () => {
    try {
      const response = await api.get("/mentoring-programs", {
        params: { status: "published" },
      });
      if (response.data.success) {
        setPrograms(response.data.data.programs || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch programs:", error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get(`/matching/${selectedProgram}/statistics`);
      if (response.data.success) {
        setStatistics(response.data.data.statistics);
      }
    } catch (error: any) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const fetchMatches = async () => {
    if (!selectedProgram) {
      setMatches([]);
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/matching/${selectedProgram}/matches`);
      if (response.data.success) {
        setMatches(response.data.data.matches || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch matches:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to fetch matches",
        variant: "destructive",
      });
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnmatchedMentees = async () => {
    try {
      const response = await api.get(`/matching/${selectedProgram}/unmatched`);
      if (response.data.success) {
        setUnmatchedMentees(response.data.data.unmatchedMentees || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch unmatched mentees:", error);
    }
  };

  const handleRunMatching = async () => {
    if (!selectedProgram) {
      toast({
        title: "Error",
        description: "Please select a program",
        variant: "destructive",
      });
      return;
    }

    setRunningMatching(true);
    try {
      const response = await api.post(`/matching/${selectedProgram}/initiate`);
      if (response.data.success) {
        toast({
          title: "Success",
          description: response.data.message,
        });
        fetchStatistics();
        fetchMatches();
        fetchUnmatchedMentees();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to run matching algorithm",
        variant: "destructive",
      });
    } finally {
      setRunningMatching(false);
    }
  };

  const handleManualMatch = async () => {
    // Prevent multiple simultaneous requests
    if (creatingMatch) {
      return;
    }

    if (!selectedMentee || !selectedMentor) {
      toast({
        title: "Error",
        description: "Please select both mentee and mentor",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMentee.registration?._id) {
      toast({
        title: "Error",
        description: "Invalid mentee registration data",
        variant: "destructive",
      });
      return;
    }

    setCreatingMatch(true);
    try {
      const response = await api.post(`/matching/${selectedProgram}/manual`, {
        menteeId: selectedMentee.registration._id,
        mentorId: selectedMentor,
      });

      if (response.data.success) {
        toast({
          title: "Success",
          description: "Manual match created successfully",
        });
        setShowManualMatchModal(false);
        setSelectedMentee(null);
        setSelectedMentor("");
        // Refresh data
        await Promise.all([
          fetchStatistics(),
          fetchMatches(),
          fetchUnmatchedMentees(),
        ]);
      }
    } catch (error: any) {
      console.error("Manual match error:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create manual match",
        variant: "destructive",
      });
    } finally {
      setCreatingMatch(false);
    }
  };

  const fetchAvailableMentors = async () => {
    try {
      const response = await api.get(`/mentor-registrations/program/${selectedProgram}`, {
        params: { status: "approved" },
      });
      if (response.data.success) {
        setAvailableMentors(response.data.data.registrations || []);
      }
    } catch (error: any) {
      console.error("Failed to fetch mentors:", error);
    }
  };

  const openManualMatchModal = (mentee: any) => {
    console.log("openManualMatchModal called with:", mentee);
    // Ensure we're storing the full item with both registration and mentee data
    setSelectedMentee({
      ...mentee,
      registration: mentee.registration || {},
      mentee: mentee.mentee || {}
    });
    setSelectedMentor("");
    fetchAvailableMentors();
    setShowManualMatchModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
      case "auto_rejected":
        return "bg-red-100 text-red-800";
      case "pending_mentor_acceptance":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "accepted":
        return CheckCircle;
      case "rejected":
      case "auto_rejected":
        return XCircle;
      case "pending_mentor_acceptance":
        return Clock;
      default:
        return AlertCircle;
    }
  };

  // Filter matches based on status
  const filteredMatches = matches.filter((match: any) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "pending") {
      return match.status === "pending_mentor_acceptance";
    }
    if (statusFilter === "accepted") {
      return match.status === "accepted";
    }
    if (statusFilter === "rejected") {
      return match.status === "rejected" || match.status === "auto_rejected";
    }
    return true;
  });

  // Calculate days remaining for pending matches
  const getDaysRemaining = (autoRejectAt: Date | string | null | undefined) => {
    if (!autoRejectAt) return null;
    const now = new Date();
    const rejectDate = new Date(autoRejectAt);
    const daysRemaining = Math.ceil(
      (rejectDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysRemaining);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        {!hideBackButton && (
        <button
            onClick={() => onClose ? onClose() : navigate(-1)}
          className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>
        )}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Matching Dashboard</h1>
            <p className="text-gray-600">Manage mentor-mentee matching for programs</p>
          </div>
          <button
            onClick={handleRunMatching}
            disabled={runningMatching || !selectedProgram}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            {runningMatching ? "Running..." : "Run Matching Algorithm"}
          </button>
        </div>
      </div>

      {/* Program Selection */}
      <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Program</label>
        <select
          value={selectedProgram}
          onChange={(e) => {
            setSelectedProgram(e.target.value);
            setStatusFilter("all");
          }}
          className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a program...</option>
          {programs.map((program) => (
            <option key={program._id} value={program._id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProgram && (
        <>
          {/* Statistics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Total Matches</div>
                <div className="text-2xl font-bold text-gray-900">{statistics.total || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Accepted</div>
                <div className="text-2xl font-bold text-green-600">{statistics.accepted || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Pending</div>
                <div className="text-2xl font-bold text-yellow-600">{statistics.pending || 0}</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
                <div className="text-sm text-gray-600 mb-1">Unmatched Mentees</div>
                <div className="text-2xl font-bold text-red-600">
                  {statistics.unmatchedMentees || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border border-gray-200 md:col-span-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Average Match Score</div>
                    <div className="text-xl font-bold text-blue-600">
                      {statistics.averageScore
                        ? statistics.averageScore.toFixed(1)
                        : "0"}%
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Preferred Matches</div>
                    <div className="text-lg font-semibold">{statistics.preferredMatches || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Algorithm Matches</div>
                    <div className="text-lg font-semibold">{statistics.algorithmMatches || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Manual Matches</div>
                    <div className="text-lg font-semibold">{statistics.manualMatches || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status Filter */}
          <div className="mb-4 flex space-x-2">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === "all"
                  ? "bg-blue-100 text-blue-800 border-2 border-blue-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === "pending"
                  ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("accepted")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === "accepted"
                  ? "bg-green-100 text-green-800 border-2 border-green-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <CheckCircle className="w-4 h-4 inline mr-1" />
              Accepted
            </button>
            <button
              onClick={() => setStatusFilter("rejected")}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === "rejected"
                  ? "bg-red-100 text-red-800 border-2 border-red-500"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              <XCircle className="w-4 h-4 inline mr-1" />
              Rejected
            </button>
          </div>

          {/* Unmatched Mentees */}
          {unmatchedMentees.length > 0 && (
            <div className="mb-6 bg-white rounded-lg shadow border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Unmatched Mentees ({unmatchedMentees.length})
                </h2>
              </div>
              <div className="space-y-2">
                {unmatchedMentees.map((item: any) => {
                  const mentee = item.mentee || {};
                  const registration = item.registration || {};
                  const uniqueKey = registration._id || mentee._id || `${registration.personalEmail || mentee.email}`;
                  return (
                    <div
                      key={uniqueKey}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 mb-1">
                          {registration.firstName || mentee.firstName}{" "}
                          {registration.lastName || mentee.lastName}
                        </div>
                          <div className="text-sm text-gray-600 mb-2">
                          {registration.personalEmail || mentee.email}
                          {registration.classOf && ` • Class of ${registration.classOf}`}
                        </div>
                          {registration.areasOfMentoring && registration.areasOfMentoring.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-semibold text-gray-700 mb-1">
                                Areas of Mentoring:
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {registration.areasOfMentoring.map((area: string, areaIdx: number) => (
                                  <span
                                    key={areaIdx}
                                    className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded"
                                  >
                                    {area}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                      <button
                          onClick={() => {
                            console.log("Opening manual match for:", {
                              registration: registration.firstName + " " + registration.lastName,
                              mentee: mentee.firstName + " " + mentee.lastName,
                              item
                            });
                            openManualMatchModal(item);
                          }}
                          className="ml-4 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm flex items-center whitespace-nowrap"
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Manual Match
                      </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matches List */}
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All Matches ({filteredMatches.length})
            </h2>
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading matches...</p>
              </div>
            ) : filteredMatches.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  {statusFilter === "all"
                    ? "No matches found for this program."
                    : `No ${statusFilter} matches found.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMatches.map((match: any) => {
                  const StatusIcon = getStatusIcon(match.status);
                  const statusColor = getStatusColor(match.status);
                  const daysRemaining = getDaysRemaining(match.autoRejectAt);
                  const mentor = match.mentorId || {};
                  const mentee = match.menteeId || {};
                  const menteeReg = match.menteeRegistrationId || {};
                  const mentorReg = match.mentorRegistrationId || {};
                  const program = match.programId || {};

                  return (
                    <div
                      key={match._id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColor}`}
                            >
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {match.status === "pending_mentor_acceptance"
                                ? "Pending"
                                : match.status === "accepted"
                                ? "Accepted"
                                : match.status === "rejected"
                                ? "Rejected"
                                : match.status === "auto_rejected"
                                ? "Auto Rejected"
                                : match.status}
                            </span>
                            {match.matchType && (
                              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {match.matchType === "preferred"
                                  ? "Preferred"
                                  : match.matchType === "algorithm"
                                  ? "Algorithm"
                                  : match.matchType === "manual"
                                  ? "Manual"
                                  : match.matchType}
                              </span>
                            )}
                            {match.matchScore !== undefined && (
                              <span className="text-xs font-semibold text-blue-600">
                                Score: {match.matchScore.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Mentor Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                Mentor
                              </h4>
                              <p className="text-sm text-gray-900">
                                {mentorReg?.preferredName ||
                                  `${mentor.firstName || ""} ${mentor.lastName || ""}`.trim() ||
                                  "N/A"}
                              </p>
                              <p className="text-xs text-gray-600">
                                {mentor.email || "N/A"}
                              </p>
                              {mentorReg?.areasOfMentoring &&
                                mentorReg.areasOfMentoring.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {mentorReg.areasOfMentoring
                                      .slice(0, 3)
                                      .map((area: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded"
                                        >
                                          {area}
                                        </span>
                                      ))}
                                  </div>
                                )}
                            </div>
                            {/* Mentee Info */}
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                                Mentee
                              </h4>
                              <p className="text-sm text-gray-900">
                                {menteeReg?.firstName || mentee.firstName || ""}{" "}
                                {menteeReg?.lastName || mentee.lastName || ""}
                              </p>
                              <p className="text-xs text-gray-600">
                                {menteeReg?.personalEmail || mentee.email || "N/A"}
                                {menteeReg?.classOf && ` • Class of ${menteeReg.classOf}`}
                              </p>
                              {menteeReg?.areasOfMentoring &&
                                menteeReg.areasOfMentoring.length > 0 && (
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {menteeReg.areasOfMentoring
                                      .slice(0, 3)
                                      .map((area: string, idx: number) => (
                                        <span
                                          key={idx}
                                          className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded"
                                        >
                                          {area}
                                        </span>
                                      ))}
                                  </div>
                                )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          {match.status === "pending_mentor_acceptance" &&
                            daysRemaining !== null && (
                              <div
                                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium mb-2 ${
                                  daysRemaining > 3
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {daysRemaining > 0
                                  ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`
                                  : "Expired"}
                              </div>
                            )}
                          {match.matchedAt && (
                            <p className="text-xs text-gray-500">
                              Matched: {new Date(match.matchedAt).toLocaleDateString()}
                            </p>
                          )}
                          {program.name && (
                            <p className="text-xs text-gray-500 mt-1">{program.name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Manual Matching Modal */}
      {showManualMatchModal && selectedMentee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Manual Matching</h2>
            <div className="mb-4">
              <div className="font-medium text-gray-700 mb-2">Mentee:</div>
              <div className="p-3 bg-gray-50 rounded border">
                {selectedMentee?.registration?.firstName || selectedMentee?.mentee?.firstName || "Unknown"}{" "}
                {selectedMentee?.registration?.lastName || selectedMentee?.mentee?.lastName || ""}
              </div>
              {selectedMentee?.registration?.personalEmail && (
                <div className="text-xs text-gray-500 mt-1">
                  {selectedMentee.registration.personalEmail}
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Mentor:
              </label>
              <select
                value={selectedMentor}
                onChange={(e) => setSelectedMentor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a mentor...</option>
                {availableMentors.map((mentor) => {
                  const user = mentor.userId || {};
                  const mentorName = mentor.preferredName || `${user.firstName} ${user.lastName}`;
                  const areaText = mentor.areasOfMentoring && mentor.areasOfMentoring.length > 0
                    ? ` - ${mentor.areasOfMentoring[0]}`
                    : '';
                  return (
                    <option key={mentor._id} value={user._id || mentor.userId}>
                      {mentorName}{areaText}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowManualMatchModal(false);
                  setSelectedMentee(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleManualMatch();
                }}
                disabled={!selectedMentor || creatingMatch}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {creatingMatch ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  "Create Match"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

