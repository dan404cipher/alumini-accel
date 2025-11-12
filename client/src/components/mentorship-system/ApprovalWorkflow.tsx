import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Filter, CheckCircle, XCircle, Clock, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RegistrationReviewCard } from "./RegistrationReviewCard";
import Navigation from "@/components/Navigation";

interface ApprovalWorkflowProps {
  programId?: string;
}

export const ApprovalWorkflow: React.FC<ApprovalWorkflowProps> = ({
  programId,
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [navActiveTab, setNavActiveTab] = useState("mentoring-approvals");
  
  // STAFF, HOD, and College Admin can approve/disapprove
  const canApproveDisapprove = user?.role === "staff" || user?.role === "hod" || user?.role === "college_admin";
  const [activeTab, setActiveTab] = useState<"mentors" | "mentees">("mentors");
  const [stageFilter, setStageFilter] = useState<"submitted" | "approved" | "rejected">(
    "submitted"
  );
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>(programId || "");
  const [programs, setPrograms] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDisapproveModal, setShowDisapproveModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const isFetchingRef = useRef(false); // Prevent duplicate API calls

  // Fetch programs
  useEffect(() => {
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
    fetchPrograms();
  }, []);

  // Fetch registrations - use useCallback to prevent stale closures
  const fetchRegistrations = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log("Already fetching, skipping duplicate call");
      return;
    }

    // Check if token exists before making API call
    const token = localStorage.getItem("token");
    if (!token) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view registrations",
        variant: "destructive",
      });
      setRegistrations([]);
      setLoading(false);
      return;
    }

    isFetchingRef.current = true;
    setLoading(true);

    try {
      const endpoint =
        activeTab === "mentors"
          ? "/mentoring-approvals/mentors"
          : "/mentoring-approvals/mentees";
      
      const params: any = {
        status: stageFilter,
        page,
        limit: 20,
      };
      if (selectedProgram) {
        params.programId = selectedProgram;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }

      console.log(`Fetching ${activeTab} registrations:`, { endpoint, params });

      // Ensure token is in headers
      const response = await api.get(endpoint, { 
        params,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log(`Response for ${activeTab}:`, response.data);

      if (response.data && response.data.success) {
        const registrationsData = response.data.data?.registrations || [];
        setRegistrations(registrationsData);
        setTotalPages(response.data.data?.pagination?.totalPages || 1);
        
        // Log if no registrations found
        if (registrationsData.length === 0) {
          console.log(`No ${activeTab} registrations found with current filters`);
        }
      } else {
        console.warn(`Unexpected response format for ${activeTab}:`, response.data);
        setRegistrations([]);
        setTotalPages(1);
      }
    } catch (error: any) {
      console.error(`Fetch ${activeTab} registrations error:`, error);
      setRegistrations([]);
      setTotalPages(1);
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.data?.message?.includes("token")) {
        toast({
          title: "Authentication Error",
          description: error.response?.data?.message || "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        // Clear invalid token
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        // Optionally redirect to login after a delay
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        // Only show error toast if it's not a network error or if it's a meaningful error
        const errorMessage = error.response?.data?.message || error.message || "Failed to fetch registrations";
        if (errorMessage !== "Network Error" || error.response) {
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [activeTab, stageFilter, selectedProgram, page, searchTerm, toast]);

  // Fetch statistics
  const fetchStatistics = async () => {
    try {
      const params: any = {};
      if (selectedProgram) {
        params.programId = selectedProgram;
      }
      const response = await api.get("/mentoring-approvals/statistics", {
        params,
      });
      if (response.data.success) {
        setStatistics(response.data.data);
      }
    } catch (error: any) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  // Fetch registrations when tab or filters change
  useEffect(() => {
    // Reset page when tab changes
    if (activeTab) {
      setPage(1);
    }
  }, [activeTab]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchRegistrations();
    fetchStatistics();
  }, [fetchRegistrations]);

  const handleApprove = async (registration: any) => {
    if (processing) return;
    setProcessing(true);
    try {
      const endpoint =
        activeTab === "mentors"
          ? `/mentoring-approvals/mentors/${registration._id}/approve`
          : `/mentoring-approvals/mentees/${registration._id}/approve`;

      const response = await api.put(endpoint, { notes: "" });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Registration approved successfully",
        });
        fetchRegistrations();
        fetchStatistics();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to approve registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = (registration: any) => {
    setSelectedRegistration(registration);
    setRejectionReason("");
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast({
        title: "Error",
        description: "Rejection reason must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    if (processing || !selectedRegistration) return;
    setProcessing(true);
    try {
      const endpoint =
        activeTab === "mentors"
          ? `/mentoring-approvals/mentors/${selectedRegistration._id}/reject`
          : `/mentoring-approvals/mentees/${selectedRegistration._id}/reject`;

      const response = await api.put(endpoint, {
        reason: rejectionReason,
        notes: "",
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Registration rejected successfully",
        });
        setShowRejectModal(false);
        fetchRegistrations();
        fetchStatistics();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to reject registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReconsider = async (registration: any) => {
    if (processing) return;
    setProcessing(true);
    try {
      // Convert "mentors" to "mentor" and "mentees" to "mentee" for backend
      const type = activeTab === "mentors" ? "mentor" : "mentee";
      const response = await api.put(`/mentoring-approvals/${registration._id}/reconsider`, {
        type: type,
        notes: "",
      });
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Registration reconsidered successfully",
        });
        fetchRegistrations();
        fetchStatistics();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to reconsider registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDisapprove = (registration: any) => {
    setSelectedRegistration(registration);
    setRejectionReason("");
    setShowDisapproveModal(true);
  };

  const confirmDisapprove = async () => {
    if (!rejectionReason.trim() || rejectionReason.trim().length < 10) {
      toast({
        title: "Error",
        description: "Reason must be at least 10 characters",
        variant: "destructive",
      });
      return;
    }

    if (processing || !selectedRegistration) return;
    setProcessing(true);
    try {
      // Convert "mentors" to "mentor" and "mentees" to "mentee" for backend
      const type = activeTab === "mentors" ? "mentor" : "mentee";
      const response = await api.put(
        `/mentoring-approvals/${selectedRegistration._id}/disapprove`,
        {
          type: type,
          reason: rejectionReason,
          notes: "",
        }
      );
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Registration disapproved successfully",
        });
        setShowDisapproveModal(false);
        fetchRegistrations();
        fetchStatistics();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to disapprove registration",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleFillOnBehalf = (registration: any) => {
    // Navigate to registration form with pre-filled data
    const programId = registration.programId?._id || registration.programId;
    const url = activeTab === "mentor" 
      ? `/mentor-registration?programId=${programId}&editId=${registration._id}`
      : `/mentee-registration?programId=${programId}&editId=${registration._id}`;
    window.location.href = url;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation activeTab={navActiveTab} onTabChange={setNavActiveTab} />
      <main className="flex-1 w-full pt-16">
        <div className="p-6">
          <div className="mb-6">
            <button
              onClick={() => navigate(-1)}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Mentoring Approval Workflow
            </h1>
            <p className="text-gray-600">
              Review and manage mentor and mentee registrations
            </p>
          </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending Mentors</div>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.mentors?.pending || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending Mentees</div>
            <div className="text-2xl font-bold text-yellow-600">
              {statistics.mentees?.pending || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Approved</div>
            <div className="text-2xl font-bold text-green-600">
              {statistics.total?.approved || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Rejected</div>
            <div className="text-2xl font-bold text-red-600">
              {statistics.total?.rejected || 0}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Program Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Program
            </label>
            <select
              value={selectedProgram}
              onChange={(e) => {
                setSelectedProgram(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Programs</option>
              {programs.map((program) => (
                <option key={program._id} value={program._id}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => {
              if (activeTab !== "mentors") {
                setRegistrations([]); // Clear previous data immediately
                setActiveTab("mentors");
                setPage(1);
              }
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "mentors"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Mentors
          </button>
          <button
            onClick={() => {
              if (activeTab !== "mentees") {
                setRegistrations([]); // Clear previous data immediately
                setActiveTab("mentees");
                setPage(1);
              }
            }}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "mentees"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Mentees
          </button>
        </nav>
      </div>

      {/* Stage Filter */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => {
            setStageFilter("submitted");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            stageFilter === "submitted"
              ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-500"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Clock className="w-4 h-4 inline mr-1" />
          Submitted
        </button>
        <button
          onClick={() => {
            setStageFilter("approved");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            stageFilter === "approved"
              ? "bg-green-100 text-green-800 border-2 border-green-500"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <CheckCircle className="w-4 h-4 inline mr-1" />
          Approved
        </button>
        <button
          onClick={() => {
            setStageFilter("rejected");
            setPage(1);
          }}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            stageFilter === "rejected"
              ? "bg-red-100 text-red-800 border-2 border-red-500"
              : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
          }`}
        >
          <XCircle className="w-4 h-4 inline mr-1" />
          Rejected
        </button>
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading {activeTab === "mentors" ? "mentor" : "mentee"} registrations...</p>
        </div>
      ) : registrations.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-600">
            No {activeTab === "mentors" ? "mentor" : "mentee"} registrations found
            {stageFilter !== "all" && ` with status "${stageFilter}"`}
            {selectedProgram && ` for the selected program`}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {registrations.map((registration) => (
              <RegistrationReviewCard
                key={registration._id}
                registration={registration}
                type={activeTab === "mentors" ? "mentor" : "mentee"}
                onApprove={canApproveDisapprove ? () => handleApprove(registration) : undefined}
                onReject={canApproveDisapprove ? () => handleReject(registration) : undefined}
                onReconsider={
                  canApproveDisapprove && registration.status === "rejected"
                    ? () => handleReconsider(registration)
                    : undefined
                }
                onDisapprove={
                  canApproveDisapprove && registration.status === "approved"
                    ? () => handleDisapprove(registration)
                    : undefined
                }
                onFillOnBehalf={() => handleFillOnBehalf(registration)}
                canApprove={canApproveDisapprove && registration.status === "submitted"}
                canReject={canApproveDisapprove && (registration.status === "submitted" || registration.status === "approved")}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Reject Registration</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Please provide a detailed reason for rejection (minimum 10 characters)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                disabled={processing || rejectionReason.trim().length < 10}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disapprove Modal */}
      {showDisapproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">Disapprove Registration</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              placeholder="Please provide a detailed reason for disapproval (minimum 10 characters)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowDisapproveModal(false);
                  setRejectionReason("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisapprove}
                disabled={processing || rejectionReason.trim().length < 10}
                className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? "Processing..." : "Disapprove"}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  );
};

